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

router = APIRouter(prefix="/api/delivery", tags=["Delivery Operations"])

# --- HÀM GÁC CỔNG PHÂN QUYỀN ---
def verify_manager_access(user: dict):
    if user.get("role_id") not in [1, 2]: # Super Admin, Hub Manager
        raise HTTPException(status_code=403, detail="Chỉ Quản lý bưu cục mới được phân công giao hàng.")

def verify_shipper_access(user: dict):
    if user.get("role_id") not in [1, 4]: # Super Admin, Shipper
        raise HTTPException(status_code=403, detail="Chỉ Shipper mới được báo cáo kết quả giao hàng.")
# -------------------------------

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
            current_user['user_id'], current_user.get('primary_hub_id'), data.note
        )
        db.commit()
        res = {"status": "DELIVERED", "cod": data.actual_cod_collected, "waybill_code": data.waybill_code}
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
        
    crud_delivery.assign_shipper_to_pickup(db, db_req, data.shipper_id, current_user["user_id"])
    db.commit()
    
    if shipper.push_token:
        title = "🔔 Yêu cầu lấy hàng mới"
        body = f"Bạn vừa được gán yêu cầu lấy hàng {code} tại {db_req.pickup_address}."
        print(f">>>>> [PUSH ALERT] Gửi thông báo lấy hàng tới token: {shipper.push_token}")
        background_tasks.add_task(send_expo_push_notification, shipper.push_token, title, body, {"request_code": code})
        
    return {"status": "ASSIGNED_PICKUP", "request_code": code, "assigned_shipper_id": data.shipper_id}


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
