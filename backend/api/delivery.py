from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
from core.database import get_db
from core.idempotency import validate_idempotency, commit_idempotency
from core.security import get_current_user
from core.state_machine import WaybillStatus, validate_state_transition
import crud.delivery as crud_delivery
import schemas.delivery as schema_delivery
import crud.waybills as crud_wb
import models
from core.push import send_expo_push_notification
from core.realtime import realtime_manager
from sqlalchemy import or_
import json

router = APIRouter(prefix="/api/delivery", tags=["Delivery Operations"])

# --- HÀM GÁC CỔNG PHÂN QUYỀN ---
def verify_manager_access(user: dict):
    if user.get("role_id") not in [1, 2]: # Super Admin, Hub Manager
        raise HTTPException(status_code=403, detail="Chỉ Quản lý bưu cục mới được phân công giao hàng.")

def verify_shipper_access(user: dict):
    if user.get("role_id") not in [1, 4]: # Super Admin, Shipper
        raise HTTPException(status_code=403, detail="Chỉ Shipper mới được báo cáo kết quả giao hàng.")
# -------------------------------

def _can_operate_hub(current_user: dict, hub_id: int | None) -> bool:
    if current_user.get("role_id") == 1:
        return True
    return bool(hub_id and current_user.get("primary_hub_id") == hub_id)


def _require_pickup_operator(current_user: dict):
    if current_user.get("role_id") not in [1, 2, 3, 7]:
        raise HTTPException(status_code=403, detail="Khong co quyen thao tac yeu cau pickup")


def _require_delivery_simulation_operator(current_user: dict):
    if current_user.get("role_id") not in [1, 2, 7]:
        raise HTTPException(status_code=403, detail="Khong co quyen gia lap chuan bi giao hang")


def _merge_image_urls(primary_url: str | None = None, image_urls: list[str] | None = None) -> list[str]:
    urls = []
    for url in image_urls or []:
        if url and url not in urls:
            urls.append(url)
    if primary_url and primary_url not in urls:
        urls.insert(0, primary_url)
    return urls[:5]


def _read_image_urls(stored_urls: str | None, primary_url: str | None = None) -> list[str]:
    image_urls = []
    if stored_urls:
        try:
            parsed = json.loads(stored_urls)
            if isinstance(parsed, list):
                image_urls = parsed
        except Exception:
            image_urls = [url.strip() for url in stored_urls.split(",") if url.strip()]
    return _merge_image_urls(primary_url, image_urls)


@router.get("/development/ocr-ready")
def list_ocr_ready_for_delivery(
    q: str = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_delivery_simulation_operator(current_user)
    query = db.query(models.Waybills).filter(
        models.Waybills.is_deleted == False,
        models.Waybills.status == WaybillStatus.CREATED,
        models.Waybills.ocr_status == "CONVERTED",
        models.Waybills.verify_status == "VERIFIED",
    )
    if current_user.get("role_id") != 1:
        hub_id = current_user.get("primary_hub_id")
        query = query.filter(or_(
            models.Waybills.dest_hub_id == hub_id,
            models.Waybills.origin_hub_id == hub_id,
            models.Waybills.holding_hub_id == hub_id,
        ))
    if q:
        keyword = f"%{q.strip()}%"
        query = query.filter(or_(
            models.Waybills.waybill_code.ilike(keyword),
            models.Waybills.receiver_name.ilike(keyword),
            models.Waybills.receiver_phone.ilike(keyword),
        ))
    rows = query.order_by(models.Waybills.waybill_id.desc()).limit(500).all()
    return [{
        "waybill_id": row.waybill_id,
        "waybill_code": row.waybill_code,
        "receiver_name": row.receiver_name,
        "receiver_phone": row.receiver_phone,
        "receiver_address": row.receiver_address,
        "service_type": row.service_type,
        "payment_method": row.payment_method,
        "cod_amount": float(row.cod_amount or 0),
        "shipping_fee": float(row.shipping_fee or 0),
        "total_amount_to_collect": float(row.total_amount_to_collect or 0),
        "origin_hub_id": row.origin_hub_id,
        "dest_hub_id": row.dest_hub_id,
        "holding_hub_id": row.holding_hub_id,
        "ocr_status": row.ocr_status,
        "verify_status": row.verify_status,
        "status": row.status,
        "bill_image_url": row.bill_image_url,
        "pickup_image_url": row.pickup_image_url,
        "pickup_image_urls": _read_image_urls(row.pickup_image_urls, row.pickup_image_url),
    } for row in rows]


@router.post("/development/prepare-delivery")
def prepare_ocr_waybills_for_delivery(
    data: schema_delivery.DevelopmentPrepareDeliveryRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_delivery_simulation_operator(current_user)
    prepared = []
    try:
        for code in data.waybill_codes:
            waybill = crud_delivery.get_waybill_by_code(db, code)
            if not waybill:
                raise HTTPException(status_code=404, detail=f"Khong tim thay van don {code}")
            if waybill.ocr_status != "CONVERTED" or waybill.verify_status != "VERIFIED":
                raise HTTPException(status_code=400, detail=f"Van don {code} chua hoan tat OCR/xac thuc")
            validate_state_transition(waybill.status, WaybillStatus.IN_HUB)
            destination_hub_id = waybill.dest_hub_id or waybill.origin_hub_id or waybill.holding_hub_id
            if not destination_hub_id:
                raise HTTPException(status_code=400, detail=f"Van don {code} chua co buu cuc giao")
            if current_user.get("role_id") != 1 and destination_hub_id != current_user.get("primary_hub_id"):
                raise HTTPException(status_code=403, detail=f"Van don {code} khong thuoc buu cuc cua ban")
            waybill.status = WaybillStatus.IN_HUB
            waybill.dest_hub_id = destination_hub_id
            waybill.holding_hub_id = destination_hub_id
            waybill.holding_shipper_id = None
            waybill.version = (waybill.version or 1) + 1
            db.add(models.TrackingLogs(
                waybill_id=waybill.waybill_id,
                status_id=WaybillStatus.IN_HUB,
                hub_id=destination_hub_id,
                user_id=current_user["user_id"],
                system_time=datetime.utcnow(),
                note="Gia lap giai doan phat trien: bo qua quan ly kho, don san sang phan cong giao hang",
            ))
            prepared.append(code)
        db.commit()
        realtime_manager.publish(["admin"], "delivery.development_prepared", {"waybill_codes": prepared})
        return {"status": "READY_FOR_ASSIGNMENT", "count": len(prepared), "waybill_codes": prepared}
    except Exception:
        db.rollback()
        raise

@router.get("/pending-assign")
def get_pending_assign_waybills(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách đơn hàng đã về bưu cục đích, chờ phân công Shipper"""
    verify_manager_access(current_user)
    
    # DATA ISOLATION: Quản lý chỉ thấy đơn hàng có ĐÍCH ĐẾN là bưu cục của mình
    hub_id = None if current_user.get("role_id") == 1 else current_user.get("primary_hub_id")
    
    # Nhờ CRUD lấy dữ liệu
    return crud_delivery.get_pending_waybills_for_hub(db, hub_id)

@router.post("/assign-shipper")
async def assign_shipper(
    data: schema_delivery.AssignShipperRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    idem_key: str = Depends(validate_idempotency),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Quản lý phân công đơn hàng cho Shipper"""
    verify_manager_access(current_user)
    
    try:
        success_codes = []
        user_hub = current_user.get('primary_hub_id')
        
        # 1. Kiểm tra Shipper qua CRUD
        shipper = crud_delivery.get_active_shipper(db, data.shipper_id)
        
        if not shipper:
            raise HTTPException(status_code=404, detail="Không tìm thấy Shipper hợp lệ.")
            
        if shipper.is_online is False:
            raise HTTPException(status_code=400, detail="Buu ta dang offline, khong the gan don")

        if current_user.get("role_id") != 1 and shipper.primary_hub_id != user_hub:
            raise HTTPException(status_code=403, detail="Không thể phân công cho Shipper của bưu cục khác!")

        for code in data.waybill_codes:
            waybill = crud_delivery.get_waybill_by_code(db, code)
            if not waybill: continue

            # DATA ISOLATION: Đơn hàng phải thuộc bưu cục hiện tại
            if current_user.get("role_id") != 1 and waybill.dest_hub_id != user_hub:
                raise HTTPException(status_code=403, detail=f"Đơn {code} không thuộc bưu cục này!")

            validate_state_transition(waybill.status, WaybillStatus.DELIVERING)

            affected = crud_delivery.assign_shipper_to_waybill(
                db, waybill, data.shipper_id, current_user['user_id'], user_hub
            )
            
            if affected > 0:
                success_codes.append(code)

        db.commit()
        
        # Trigger push notification if shipper has a valid token
        if len(success_codes) > 0 and shipper.push_token:
            title = "Phân công mới"
            body = f"Bạn vừa được phân công giao {len(success_codes)} đơn hàng mới."
            print(f">>>>> [PUSH ALERT] Đang đưa vào hàng đợi gửi thông báo tới Token: {shipper.push_token}")
            background_tasks.add_task(send_expo_push_notification, shipper.push_token, title, body, {"codes": success_codes})
        else:
            print(f">>>>> [PUSH ALERT] KHÔNG GỬI được. Số đơn: {len(success_codes)}, Token: {shipper.push_token}")
            
        res = {"status": "ASSIGNED", "count": len(success_codes), "codes": success_codes}
        commit_idempotency(idem_key, res)
        return res
    except Exception as e:
        db.rollback()
        raise e

@router.post("/reassign", response_model=schema_delivery.ReassignWaybillResponse)
def reassign_waybill(
    data: schema_delivery.ReassignWaybillRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Điều chuyển đơn hàng giữa hub hoặc shipper"""
    verify_manager_access(current_user)

    if not data.new_hub_id and not data.new_shipper_id:
        raise HTTPException(status_code=400, detail="Phải cung cấp new_hub_id hoặc new_shipper_id để điều chuyển.")
    if data.new_hub_id and data.new_shipper_id:
        raise HTTPException(status_code=400, detail="Chỉ được điều chuyển sang hub hoặc shipper, không được đồng thời.")

    waybill = crud_wb.get_waybill_by_code(db, data.waybill_id)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")

    if current_user.get("role_id") != 1 and waybill.dest_hub_id != current_user.get("primary_hub_id"):
        raise HTTPException(status_code=403, detail="Bạn không có quyền điều chuyển vận đơn này")

    if data.new_hub_id:
        target_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == data.new_hub_id).first()
        if not target_hub:
            raise HTTPException(status_code=404, detail="Không tìm thấy bưu cục đích mới")
    else:
        target_hub = None

    if data.new_shipper_id:
        target_shipper = db.query(models.Users).filter(models.Users.user_id == data.new_shipper_id, models.Users.role_id == 4).first()
        if not target_shipper:
            raise HTTPException(status_code=404, detail="Không tìm thấy Shipper mới")
    else:
        target_shipper = None

    updated_waybill = crud_delivery.reassign_waybill(
        db,
        waybill,
        new_hub_id=data.new_hub_id,
        new_shipper_id=data.new_shipper_id,
        reason=data.reason,
        note=data.note,
        user_id=current_user.get("user_id")
    )

    if not updated_waybill:
        raise HTTPException(status_code=500, detail="Không thể điều chuyển vận đơn")

    db.commit()
    new_holder = None
    if target_shipper:
        new_holder = target_shipper.full_name
    elif target_hub:
        new_holder = target_hub.hub_name

    return {
        "status": "SUCCESS",
        "waybill_code": waybill.waybill_code,
        "message": "Điều chuyển vận đơn thành công.",
        "new_holder": new_holder
    }

@router.post("/locations", response_model=schema_delivery.ShipperLocationResponse)
def record_shipper_location(
    data: schema_delivery.ShipperLocationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lưu tọa độ GPS của shipper"""
    if current_user.get("role_id") not in [1, 4] and current_user.get("user_id") != data.shipper_id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền gửi vị trí GPS cho shipper này.")

    shipper = db.query(models.Users).filter(models.Users.user_id == data.shipper_id, models.Users.role_id == 4).first()
    if not shipper:
        raise HTTPException(status_code=404, detail="Không tìm thấy Shipper")

    saved = crud_delivery.save_shipper_location(
        db,
        shipper_id=data.shipper_id,
        latitude=data.latitude,
        longitude=data.longitude,
        timestamp=data.timestamp,
        accuracy=data.accuracy,
        note=data.note
    )
    db.commit()

    return {
        "status": "SUCCESS",
        "shipper_id": data.shipper_id,
        "message": "Vị trí GPS đã được ghi nhận.",
        "timestamp": saved["timestamp"]
    }

@router.get("/my-tasks")
def get_shipper_tasks(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách đơn hàng đang được giao bởi Shipper hiện tại"""
    verify_shipper_access(current_user)

    # Lấy dữ liệu qua CRUD
    tasks = crud_delivery.get_tasks_for_shipper(db, current_user["user_id"])
    
    return {"items": tasks}

@router.post("/confirm-success")
async def confirm_delivery_success(
    data: schema_delivery.DeliverySuccessRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    idem_key: str = Depends(validate_idempotency)
):
    """Shipper xác nhận giao hàng thành công và thu tiền"""
    verify_shipper_access(current_user)
    
    waybill = crud_delivery.get_waybill_by_code(db, data.waybill_code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")

    validate_state_transition(waybill.status, WaybillStatus.DELIVERED)

    # SECURITY: Chặn Shipper xác nhận giùm đơn của người khác
    if current_user.get("role_id") != 1:
        delivery_record = crud_delivery.get_latest_delivery_record(db, waybill.waybill_id)
        
        if not delivery_record or delivery_record.shipper_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Bạn không được phân công giao đơn hàng này!")

    try:
        crud_delivery.confirm_delivery_record(
            db, waybill, data.actual_cod_collected, data.pod_image_url, 
            current_user['user_id'], current_user.get('primary_hub_id'), data.note,
            pod_urls=data.pod_image_urls,
        )
        db.commit()
        pod_images = _merge_image_urls(data.pod_image_url, data.pod_image_urls)
        res = {
            "status": "DELIVERED",
            "cod": data.actual_cod_collected,
            "waybill_code": data.waybill_code,
            "pod_image_url": pod_images[0] if pod_images else data.pod_image_url,
            "pod_image_urls": pod_images[:5],
        }
        commit_idempotency(idem_key, res)
        return res
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/report-failure")
async def report_failure(
    data: schema_delivery.DeliveryFailureRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    idem_key: str = Depends(validate_idempotency)
):
    """Shipper báo cáo giao hàng thất bại"""
    verify_shipper_access(current_user)
    
    waybill = crud_wb.get_waybill_by_code(db, data.waybill_code)
    if not waybill or waybill.status != WaybillStatus.DELIVERING:
        raise HTTPException(status_code=400, detail="Trạng thái đơn hàng không hợp lệ để báo thất bại")

    # SECURITY: Chặn Shipper báo cáo giùm đơn của người khác
    if current_user.get("role_id") != 1:
        delivery_record = crud_delivery.get_latest_delivery_record(db, waybill.waybill_id)
        
        if not delivery_record or delivery_record.shipper_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Bạn không được phân công giao đơn hàng này!")

    success = crud_delivery.report_delivery_failure(
        db, waybill, data.reason_code, current_user['user_id'], data.note
    )
    
    if not success:
        raise HTTPException(status_code=409, detail="Dữ liệu đã bị thay đổi bởi người khác, vui lòng thử lại")
        
    db.commit()
    res = {"status": "DELIVERY_FAILED", "waybill_code": data.waybill_code}
    commit_idempotency(idem_key, res) 
    return res

# --- PICKUP REQUEST (BOOKING REQUEST) ENDPOINTS ---
from typing import Optional

@router.post("/pickup-requests", response_model=schema_delivery.BookingRequestResponse)
def create_pickup_request(
    data: schema_delivery.BookingRequestCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """CSKH hoặc Khách hàng tạo yêu cầu lấy hàng"""
    if current_user.get("role_id") not in [1, 2, 3, 6, 7]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền tạo yêu cầu lấy hàng.")
        
    if current_user.get("role_id") == 6:
        data.customer_id = current_user.get("customer_id")

    db_req = crud_delivery.create_booking_request(db, data, current_user["user_id"])
    db.commit()
    db.refresh(db_req)
    return db_req

@router.get("/pickup-requests", response_model=list[schema_delivery.BookingRequestResponse])
def list_pickup_requests(
    status: Optional[str] = None,
    assigned_shipper_id: Optional[int] = None,
    hub_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách yêu cầu lấy hàng"""
    if current_user.get("role_id") not in [1, 2, 3, 4, 6, 7]:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập.")
        
    if current_user.get("role_id") == 2 and not hub_id:
        hub_id = current_user.get("primary_hub_id")
    if current_user.get("role_id") == 4:
        assigned_shipper_id = current_user["user_id"]
        
    if current_user.get("role_id") == 6:
        customer_id = current_user.get("customer_id")
        requests = crud_delivery.get_booking_requests(db, status, assigned_shipper_id, hub_id)
        return [req for req in requests if req.customer_id == customer_id]

    return crud_delivery.get_booking_requests(db, status, assigned_shipper_id, hub_id)


@router.get("/online-pickup-requests", response_model=list[schema_delivery.BookingRequestResponse])
def list_online_pickup_requests(
    status: Optional[str] = "PENDING_CONFIRMATION",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    _require_pickup_operator(current_user)
    return crud_delivery.get_online_pickup_requests(db, status=status)


@router.post("/online-pickup-requests/dispatch-hub")
def dispatch_online_pickup_hub(
    data: schema_delivery.OnlinePickupDispatchHubRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    _require_pickup_operator(current_user)
    hub = db.query(models.Hubs).filter(models.Hubs.hub_id == data.hub_id, models.Hubs.status == True).first()
    if not hub:
        raise HTTPException(status_code=404, detail="Khong tim thay van phong nhan hop le")

    requests = db.query(models.BookingRequests).filter(
        models.BookingRequests.request_id.in_(data.request_ids),
        models.BookingRequests.source.in_(["PORTAL", "HOTLINE", "CSKH", "ADMIN"]),
    ).all()
    found_ids = {req.request_id for req in requests}
    missing_ids = [req_id for req_id in data.request_ids if req_id not in found_ids]
    if missing_ids:
        raise HTTPException(status_code=404, detail=f"Khong tim thay yeu cau: {missing_ids}")

    dispatched_ids = []
    try:
        for req in requests:
            if req.status not in ["PENDING_CONFIRMATION", "HUB_REJECTED"]:
                raise HTTPException(status_code=400, detail=f"Yeu cau {req.request_id} khong o trang thai cho dieu phoi")
            crud_delivery.dispatch_online_pickup_hub(db, req, data.hub_id, current_user["user_id"], data.note)
            dispatched_ids.append(req.request_id)
        db.commit()
        payload = {"hub_id": data.hub_id, "request_ids": dispatched_ids, "note": data.note}
        realtime_manager.publish(["admin", f"hub:{data.hub_id}"], "pickup.dispatched_to_hub", payload)
        return {"status": "SUCCESS", "dispatched_count": len(dispatched_ids), "hub_id": data.hub_id, "request_ids": dispatched_ids}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/online-pickup-requests/confirm-hub")
def confirm_online_pickup_hub(
    data: schema_delivery.OnlinePickupConfirmHubRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    _require_pickup_operator(current_user)
    hub = db.query(models.Hubs).filter(models.Hubs.hub_id == data.hub_id, models.Hubs.status == True).first()
    if not hub:
        raise HTTPException(status_code=404, detail="Khong tim thay van phong nhan hop le")
    if not _can_operate_hub(current_user, data.hub_id):
        raise HTTPException(status_code=403, detail="Khong co quyen xac nhan van phong nay")

    requests = db.query(models.BookingRequests).filter(
        models.BookingRequests.request_id.in_(data.request_ids),
        models.BookingRequests.source.in_(["PORTAL", "HOTLINE", "CSKH", "ADMIN"]),
    ).all()
    found_ids = {req.request_id for req in requests}
    missing_ids = [req_id for req_id in data.request_ids if req_id not in found_ids]
    if missing_ids:
        raise HTTPException(status_code=404, detail=f"Khong tim thay yeu cau: {missing_ids}")

    confirmed_ids = []
    try:
        for req in requests:
            if req.status != "PENDING_CONFIRMATION":
                raise HTTPException(status_code=400, detail=f"Yeu cau {req.request_id} khong o trang thai cho xac nhan")
            crud_delivery.confirm_online_pickup_hub(db, req, data.hub_id, current_user["user_id"], data.note)
            confirmed_ids.append(req.request_id)
        db.commit()
        return {
            "status": "SUCCESS",
            "confirmed_count": len(confirmed_ids),
            "hub_id": data.hub_id,
            "request_ids": confirmed_ids,
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hub-pickup-requests", response_model=list[schema_delivery.BookingRequestResponse])
def list_hub_pickup_requests(
    status: Optional[str] = "RECEIVED",
    hub_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    _require_pickup_operator(current_user)
    target_hub_id = hub_id if current_user.get("role_id") == 1 else current_user.get("primary_hub_id")
    if not target_hub_id:
        raise HTTPException(status_code=400, detail="Khong xac dinh duoc van phong")
    return crud_delivery.get_online_pickup_requests(db, status=status, hub_id=target_hub_id)


@router.get("/hub-dispatch-requests", response_model=list[schema_delivery.BookingRequestResponse])
def list_hub_dispatch_requests(
    status: Optional[str] = "DISPATCHED_TO_HUB",
    hub_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    _require_pickup_operator(current_user)
    if current_user.get("role_id") == 1 and not hub_id:
        return crud_delivery.get_online_pickup_requests(db, status=status)
    target_hub_id = hub_id if current_user.get("role_id") == 1 else current_user.get("primary_hub_id")
    if not target_hub_id:
        raise HTTPException(status_code=400, detail="Khong xac dinh duoc van phong")
    return crud_delivery.get_online_pickup_requests(db, status=status, hub_id=target_hub_id)


@router.post("/hub-dispatch-requests/{code}/accept")
def accept_hub_dispatch(
    code: str,
    data: schema_delivery.HubDispatchDecisionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    _require_pickup_operator(current_user)
    db_req = crud_delivery.get_booking_request_by_code(db, code)
    if not db_req or db_req.source not in ["PORTAL", "HOTLINE", "CSKH", "ADMIN"]:
        raise HTTPException(status_code=404, detail="Khong tim thay yeu cau pickup")
    if db_req.status != "DISPATCHED_TO_HUB":
        raise HTTPException(status_code=400, detail="Yeu cau pickup khong o trang thai cho van phong xac nhan")
    if not _can_operate_hub(current_user, db_req.target_hub_id):
        raise HTTPException(status_code=403, detail="Khong co quyen xac nhan yeu cau cua van phong nay")
    try:
        _, waybill = crud_delivery.accept_hub_dispatch(db, db_req, current_user["user_id"], data.note)
        db.commit()
        payload = {"request_code": code, "waybill_code": waybill.waybill_code if waybill else None, "hub_id": db_req.target_hub_id}
        realtime_manager.publish(["admin", f"hub:{db_req.target_hub_id}", f"customer:{db_req.customer_id}"], "pickup.hub_accepted", payload)
        return {"status": "RECEIVED", **payload}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hub-dispatch-requests/{code}/reject")
def reject_hub_dispatch(
    code: str,
    data: schema_delivery.HubDispatchRejectRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    _require_pickup_operator(current_user)
    db_req = crud_delivery.get_booking_request_by_code(db, code)
    if not db_req or db_req.source not in ["PORTAL", "HOTLINE", "CSKH", "ADMIN"]:
        raise HTTPException(status_code=404, detail="Khong tim thay yeu cau pickup")
    if db_req.status != "DISPATCHED_TO_HUB":
        raise HTTPException(status_code=400, detail="Yeu cau pickup khong o trang thai cho van phong xac nhan")
    rejected_hub_id = db_req.target_hub_id
    if not _can_operate_hub(current_user, rejected_hub_id):
        raise HTTPException(status_code=403, detail="Khong co quyen tu choi yeu cau cua van phong nay")
    try:
        _, waybill = crud_delivery.reject_hub_dispatch(db, db_req, current_user["user_id"], data.note)
        db.commit()
        payload = {"request_code": code, "waybill_code": waybill.waybill_code if waybill else None, "rejected_hub_id": rejected_hub_id, "note": data.note}
        realtime_manager.publish(["admin", f"hub:{rejected_hub_id}", f"customer:{db_req.customer_id}"], "pickup.hub_rejected", payload)
        return {"status": "HUB_REJECTED", **payload}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mobile/shipper/pickup-requests", response_model=list[schema_delivery.MobilePickupTaskResponse])
def list_mobile_shipper_pickup_requests(
    status: Optional[str] = "ASSIGNED_PICKUP",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mobile bưu tá: lấy danh sách yêu cầu pickup được gán cho chính bưu tá đang đăng nhập."""
    if current_user.get("role_id") != 4:
        raise HTTPException(status_code=403, detail="Chỉ bưu tá mới được xem danh sách pickup trên mobile")
    return crud_delivery.get_mobile_pickup_tasks_for_shipper(db, current_user["user_id"], status=status)


@router.get("/mobile/shipper/pickup-requests/{code}", response_model=schema_delivery.MobilePickupTaskResponse)
def get_mobile_shipper_pickup_request_detail(
    code: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mobile bưu tá: xem chi tiết một yêu cầu pickup được gán."""
    if current_user.get("role_id") != 4:
        raise HTTPException(status_code=403, detail="Chỉ bưu tá mới được xem chi tiết pickup trên mobile")
    task = crud_delivery.get_mobile_pickup_task_for_shipper(db, current_user["user_id"], code)
    if not task:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu pickup được gán cho bạn")
    return task


@router.get("/mobile/shipper/availability", response_model=schema_delivery.ShipperAvailabilityResponse)
def get_mobile_shipper_availability(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role_id") != 4:
        raise HTTPException(status_code=403, detail="Chi buu ta moi duoc xem trang thai online")
    shipper = db.query(models.Users).filter(
        models.Users.user_id == current_user["user_id"],
        models.Users.role_id == 4,
        models.Users.is_active == True,
        models.Users.is_deleted == False,
    ).first()
    if not shipper:
        raise HTTPException(status_code=404, detail="Khong tim thay buu ta hoat dong")
    
    return schema_delivery.ShipperAvailabilityResponse(
        success=True,
        is_online=bool(shipper.is_online),
        message="Thanh cong"
    )


@router.post("/mobile/shipper/availability", response_model=schema_delivery.ShipperAvailabilityResponse)
def update_mobile_shipper_availability(
    data: schema_delivery.ShipperAvailabilityRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role_id") != 4:
        raise HTTPException(status_code=403, detail="Chi buu ta moi duoc cap nhat trang thai online")
    shipper = db.query(models.Users).filter(
        models.Users.user_id == current_user["user_id"],
        models.Users.role_id == 4,
        models.Users.is_active == True,
        models.Users.is_deleted == False,
    ).first()
    if not shipper:
        raise HTTPException(status_code=404, detail="Khong tim thay buu ta hoat dong")
    now = datetime.utcnow()
    shipper.is_online = data.is_online
    shipper.online_status_updated_at = now
    shipper.last_seen_at = now
    db.add(models.TrackingLogs(
        waybill_id=None,
        status_id="SHIPPER_ONLINE" if data.is_online else "SHIPPER_OFFLINE",
        user_id=shipper.user_id,
        hub_id=shipper.primary_hub_id,
        system_time=now,
        note=data.note or ("Buu ta bat trang thai online" if data.is_online else "Buu ta tat trang thai online"),
    ))
    db.commit()
    realtime_manager.publish([f"hub:{shipper.primary_hub_id}", "admin"], "shipper.availability_changed", {
        "shipper_id": shipper.user_id,
        "is_online": shipper.is_online,
        "hub_id": shipper.primary_hub_id,
    })
    return {
        "status": "SUCCESS",
        "shipper_id": shipper.user_id,
        "is_online": shipper.is_online,
        "online_status_updated_at": shipper.online_status_updated_at,
        "last_seen_at": shipper.last_seen_at,
    }


@router.post("/mobile/shipper/location", response_model=schema_delivery.ShipperLocationResponse)
def save_mobile_shipper_location(
    data: schema_delivery.MobileShipperLocationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mobile bưu tá: gửi vị trí GPS của chính bưu tá đang đăng nhập."""
    if current_user.get("role_id") != 4:
        raise HTTPException(status_code=403, detail="Chỉ bưu tá mới được cập nhật vị trí trên mobile")
    success, message = crud_delivery.save_shipper_location(
        db,
        shipper_id=current_user["user_id"],
        latitude=data.latitude,
        longitude=data.longitude,
        accuracy=data.accuracy,
        note=data.note,
    )
    if not success:
        raise HTTPException(status_code=400, detail=message)
    shipper = db.query(models.Users).filter(models.Users.user_id == current_user["user_id"]).first()
    if shipper:
        shipper.last_seen_at = datetime.utcnow()
    db.commit()
    return {
        "status": "SUCCESS",
        "shipper_id": current_user["user_id"],
        "message": message,
        "timestamp": data.timestamp or datetime.utcnow(),
    }


@router.get("/pickup-requests/{code}", response_model=schema_delivery.BookingRequestResponse)
def get_pickup_request_detail(
    code: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy chi tiết yêu cầu lấy hàng theo mã"""
    db_req = crud_delivery.get_booking_request_by_code(db, code)
    if not db_req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu lấy hàng.")
        
    if current_user.get("role_id") == 4 and db_req.assigned_shipper_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Không có quyền xem yêu cầu này.")
        
    if current_user.get("role_id") == 6 and db_req.customer_id != current_user.get("customer_id"):
        raise HTTPException(status_code=403, detail="KhÃ´ng cÃ³ quyá»n xem yÃªu cáº§u nÃ y.")

    return db_req

@router.post("/pickup-requests/{code}/assign")
async def assign_shipper_pickup(
    code: str,
    data: schema_delivery.BookingRequestAssignRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Điều phối phân công bưu tá đi lấy hàng"""
    if current_user.get("role_id") not in [1, 2, 3, 7]:
        raise HTTPException(status_code=403, detail="Chỉ điều phối/CSKH mới được phân công lấy hàng.")
        
    db_req = crud_delivery.get_booking_request_by_code(db, code)
    if not db_req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu lấy hàng.")
        
    shipper = crud_delivery.get_active_shipper(db, data.shipper_id)
    if not shipper:
        raise HTTPException(status_code=404, detail="Không tìm thấy Shipper hoạt động.")
        
    if shipper.is_online is False:
        raise HTTPException(status_code=400, detail="Buu ta dang offline, khong the gan pickup")

    crud_delivery.assign_shipper_to_pickup(db, db_req, data.shipper_id, current_user["user_id"])
    db.commit()
    
    if shipper.push_token:
        title = "🔔 Yêu cầu lấy hàng mới"
        body = f"Bạn vừa được gán yêu cầu lấy hàng {code} tại {db_req.pickup_address}."
        print(f">>>>> [PUSH ALERT] Gửi thông báo lấy hàng tới token: {shipper.push_token}")
        background_tasks.add_task(send_expo_push_notification, shipper.push_token, title, body, {"request_code": code})
        
    return {"status": "ASSIGNED_PICKUP", "request_code": code, "assigned_shipper_id": data.shipper_id}


@router.post("/pickup-requests/{code}/assign-shipper")
async def assign_shipper_online_pickup(
    code: str,
    data: schema_delivery.BookingRequestAssignRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    _require_pickup_operator(current_user)
    db_req = crud_delivery.get_booking_request_by_code(db, code)
    if not db_req or db_req.source not in ["PORTAL", "HOTLINE", "CSKH", "ADMIN"]:
        raise HTTPException(status_code=404, detail="Khong tim thay yeu cau pickup online")
    if db_req.status != "RECEIVED":
        raise HTTPException(status_code=400, detail="Yeu cau pickup chua o trang thai vua tiep nhan")
    if not db_req.target_hub_id:
        raise HTTPException(status_code=400, detail="Yeu cau pickup chua duoc xac nhan van phong")
    if not _can_operate_hub(current_user, db_req.target_hub_id):
        raise HTTPException(status_code=403, detail="Khong co quyen gan buu ta cho van phong nay")

    shipper = crud_delivery.get_active_shipper(db, data.shipper_id)
    if not shipper or not shipper.is_active:
        raise HTTPException(status_code=404, detail="Khong tim thay buu ta hoat dong")
    if shipper.is_online is False:
        db.add(models.BookingRequestLogs(
            request_id=db_req.request_id,
            user_id=current_user["user_id"],
            action="Gan buu ta that bai",
            note=f"Buu ta ID {data.shipper_id} dang offline",
        ))
        db.commit()
        raise HTTPException(status_code=400, detail="Buu ta dang offline, khong the gan pickup")
    if shipper.primary_hub_id != db_req.target_hub_id:
        raise HTTPException(status_code=400, detail="Buu ta khong thuoc van phong nhan hang")

    try:
        crud_delivery.assign_shipper_to_online_pickup(db, db_req, data.shipper_id, current_user["user_id"], data.note)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    if shipper.push_token:
        title = "Yeu cau lay hang moi"
        body = f"Ban vua duoc gan yeu cau lay hang {code} tai {db_req.pickup_address}."
        background_tasks.add_task(send_expo_push_notification, shipper.push_token, title, body, {"request_code": code})
    realtime_manager.publish([f"shipper:{shipper.user_id}", f"hub:{db_req.target_hub_id}", f"customer:{db_req.customer_id}", "admin"], "pickup.assigned_shipper", {
        "request_code": code,
        "assigned_shipper_id": shipper.user_id,
        "target_hub_id": db_req.target_hub_id,
    })

    return {"status": "ASSIGNED_PICKUP", "request_code": code, "assigned_shipper_id": data.shipper_id}


@router.post("/pickup-requests/{code}/picked")
def mark_pickup_request_picked(
    code: str,
    data: schema_delivery.PickupPickedRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_req = crud_delivery.get_booking_request_by_code(db, code)
    if not db_req or db_req.source not in ["PORTAL", "HOTLINE", "CSKH", "ADMIN"]:
        raise HTTPException(status_code=404, detail="Khong tim thay yeu cau pickup online")
    if db_req.status != "ASSIGNED_PICKUP":
        raise HTTPException(status_code=400, detail="Yeu cau pickup chua duoc gan buu ta")

    user_role = current_user.get("role_id")
    is_assigned_shipper = user_role == 4 and db_req.assigned_shipper_id == current_user.get("user_id")
    is_operator = user_role in [1, 2, 3, 7] and _can_operate_hub(current_user, db_req.target_hub_id)
    if not (is_assigned_shipper or is_operator):
        raise HTTPException(status_code=403, detail="Khong co quyen xac nhan da lay hang")

    try:
        _, waybill = crud_delivery.mark_online_pickup_picked(
            db,
            db_req,
            current_user["user_id"],
            pickup_image_url=data.pickup_image_url,
            pickup_image_urls=data.pickup_image_urls,
            note=data.note,
            actual_quantity=data.actual_quantity,
        )
        db.commit()
        realtime_manager.publish([f"hub:{db_req.target_hub_id}", f"customer:{db_req.customer_id}", "admin"], "pickup.picked", {
            "request_code": code,
            "waybill_code": waybill.waybill_code if waybill else None,
            "target_hub_id": db_req.target_hub_id,
        })
        return {
            "status": "PICKED",
            "request_code": code,
            "waybill_code": waybill.waybill_code if waybill else None,
            "waybill_status": waybill.status if waybill else None,
            "pickup_image_url": waybill.pickup_image_url if waybill else data.pickup_image_url,
            "pickup_image_urls": _merge_image_urls(data.pickup_image_url, data.pickup_image_urls),
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# --- NEW: REASSIGN & LOCATION ENDPOINTS ---

@router.post("/reassign", response_model=schema_delivery.ReassignWaybillResponse)
def reassign_waybill(
    data: schema_delivery.ReassignWaybillRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API điều chuyển vận đơn sang hub/shipper khác"""
    verify_manager_access(current_user)
    
    # Kiểm tra vận đơn tồn tại
    waybill = db.query(models.Waybills).filter(models.Waybills.waybill_id == data.waybill_id).first()
    if not waybill:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")
    
    # Data isolation: Chỉ manager của hub có thể điều chuyển đơn
    if current_user.get("role_id") != 1:
        user_hub = current_user.get("primary_hub_id")
        if waybill.holding_hub_id != user_hub and waybill.dest_hub_id != user_hub:
            raise HTTPException(status_code=403, detail="Bạn không có quyền điều chuyển đơn này")
    
    try:
        # Kiểm tra tham số đầu vào
        if not data.new_hub_id and not data.new_shipper_id:
            raise HTTPException(status_code=400, detail="Phải chỉ định hub hoặc shipper mới")
        
        # Thực hiện điều chuyển
        updated_waybill, new_holder = crud_delivery.reassign_waybill(
            db, waybill, 
            new_hub_id=data.new_hub_id,
            new_shipper_id=data.new_shipper_id,
            user_id=current_user["user_id"],
            reason=data.reason,
            note=data.note or ""
        )
        
        db.commit()
        
        return schema_delivery.ReassignWaybillResponse(
            status="SUCCESS",
            waybill_code=waybill.waybill_code,
            message=f"Đã điều chuyển vận đơn thành công",
            new_holder=new_holder
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi điều chuyển: {str(e)}")


@router.post("/locations", response_model=schema_delivery.ShipperLocationResponse)
def save_shipper_location(
    data: schema_delivery.ShipperLocationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API lưu vị trí GPS của Shipper"""
    # Chỉ Shipper hoặc Super Admin có thể lưu vị trí
    if current_user.get("role_id") not in [1, 4]:
        raise HTTPException(status_code=403, detail="Chỉ Shipper mới được cập nhật vị trí")
    
    # Shipper thường chỉ có thể lưu vị trí của chính mình
    if current_user.get("role_id") == 4 and data.shipper_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Bạn chỉ được cập nhật vị trí của chính mình")
    
    try:
        success, message = crud_delivery.save_shipper_location(
            db, 
            shipper_id=data.shipper_id,
            latitude=data.latitude,
            longitude=data.longitude,
            accuracy=data.accuracy,
            note=data.note or ""
        )
        
        if not success:
            raise HTTPException(status_code=400, detail=message)
        
        db.commit()
        
        return schema_delivery.ShipperLocationResponse(
            status="SUCCESS",
            shipper_id=data.shipper_id,
            message=message,
            timestamp=data.timestamp or datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu vị trí: {str(e)}")
