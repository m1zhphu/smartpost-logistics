# File: api/delivery.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.idempotency import validate_idempotency, commit_idempotency
from core.security import get_current_user
from core.state_machine import WaybillStatus, validate_state_transition
import crud.delivery as crud_delivery
import schemas.delivery as schema_delivery
import crud.waybills as crud_wb
from datetime import datetime, timedelta
import models 

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
    
    query = db.query(models.Waybills)

    # DATA ISOLATION: Quản lý chỉ thấy đơn hàng có ĐÍCH ĐẾN là bưu cục của mình
    if current_user.get("role_id") != 1:
        query = query.filter(models.Waybills.dest_hub_id == current_user.get("primary_hub_id"))

    # Lọc đơn đang chờ ở kho
    query = query.filter(models.Waybills.status.in_(["ARRIVED", "IN_HUB"]))
    return query.all()

@router.post("/assign-shipper")
async def assign_shipper(
    data: schema_delivery.AssignShipperRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    idem_key: str = Depends(validate_idempotency)
):
    """Quản lý phân công đơn hàng cho Shipper"""
    verify_manager_access(current_user)
    
    try:
        success_codes = []
        user_hub = current_user.get('primary_hub_id')
        
        # Kiểm tra xem Shipper có tồn tại và thuộc bưu cục này không
        shipper = db.query(models.Users).filter(
            models.Users.user_id == data.shipper_id,
            models.Users.role_id == 4
        ).first()
        
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
        res = {"status": "ASSIGNED", "count": len(success_codes), "codes": success_codes}
        commit_idempotency(idem_key, res)
        return res
    except Exception as e:
        db.rollback()
        raise e

@router.get("/my-tasks")
def get_shipper_tasks(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách đơn hàng đang được giao bởi Shipper hiện tại"""
    verify_shipper_access(current_user)

    # Chỉ lấy những đơn đang ở trạng thái DELIVERING và gán cho user này
    tasks = db.query(models.Waybills).join(models.DeliveryResults).filter(
        models.Waybills.status == WaybillStatus.DELIVERING,
        models.DeliveryResults.shipper_id == current_user["user_id"]
    ).order_by(models.DeliveryResults.delivery_id.desc()).all()
    
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
        delivery_record = db.query(models.DeliveryResults).filter(
            models.DeliveryResults.waybill_id == waybill.waybill_id
        ).order_by(models.DeliveryResults.delivery_id.desc()).first()
        
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
        delivery_record = db.query(models.DeliveryResults).filter(
            models.DeliveryResults.waybill_id == waybill.waybill_id
        ).order_by(models.DeliveryResults.delivery_id.desc()).first()
        
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

def scan_overdue_waybills(db: Session):
    """Tìm và gắn cờ cảnh báo cho các đơn giao quá 24h"""
    from datetime import datetime, timedelta
    deadline = datetime.utcnow() - timedelta(hours=24)
    
    overdue_waybills = db.query(models.Waybills).join(
        models.TrackingLogs, 
        models.Waybills.waybill_id == models.TrackingLogs.waybill_id
    ).filter(
        models.Waybills.status == WaybillStatus.DELIVERING,
        models.TrackingLogs.status_id == WaybillStatus.DELIVERING,
        models.TrackingLogs.system_time <= deadline
    ).all()

    updated_count = 0
    for wb in overdue_waybills:
        existing_warning = db.query(models.TrackingLogs).filter(
            models.TrackingLogs.waybill_id == wb.waybill_id,
            models.TrackingLogs.status_id == "OVERDUE_WARNING",
            models.TrackingLogs.system_time > deadline
        ).first()

        if not existing_warning:
            db.add(models.TrackingLogs(
                waybill_id=wb.waybill_id,
                status_id="OVERDUE_WARNING",
                note="CẢNH BÁO: Đơn hàng giao quá 24 giờ chưa có cập nhật!",
                system_time=datetime.utcnow()
            ))
            updated_count += 1
            
    db.commit()
    return updated_count