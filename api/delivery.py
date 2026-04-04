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
import crud.delivery as crud_delivery
from datetime import datetime, timedelta # Cần timedelta cho logic 24h
import models # Để sử dụng models.Waybills, models.TrackingLogs

router = APIRouter(prefix="/api/delivery", tags=["Delivery Operations"])

@router.post("/assign-shipper")
async def assign_shipper(
    data: schema_delivery.AssignShipperRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    idem_key: str = Depends(validate_idempotency)
):
    try:
        success_codes = []
        for code in data.waybill_codes:
            waybill = crud_delivery.get_waybill_by_code(db, code)
            if not waybill:
                continue

            # Kiểm tra tính hợp lệ của luồng trạng thái
            validate_state_transition(waybill.status, WaybillStatus.DELIVERING)

            # Gọi CRUD thực hiện update an toàn
            affected = crud_delivery.assign_shipper_to_waybill(
                db, waybill, data.shipper_id, current_user['user_id'], current_user.get('primary_hub_id')
            )
            
            if affected == 0:
                raise HTTPException(status_code=409, detail=f"Đơn {code} đang bị thao tác bởi người khác")
            success_codes.append(code)

        db.commit()
        res = {"status": "ASSIGNED", "count": len(success_codes)}
        commit_idempotency(idem_key, res)
        return res
    except Exception as e:
        db.rollback()
        raise e

@router.post("/confirm-success")
async def confirm_delivery_success(
    data: schema_delivery.DeliverySuccessRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    idem_key: str = Depends(validate_idempotency)
):
    waybill = crud_delivery.get_waybill_by_code(db, data.waybill_code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")

    # Chỉ đơn đang đi giao mới được báo thành công
    validate_state_transition(waybill.status, WaybillStatus.DELIVERED)

    try:
        crud_delivery.confirm_delivery_record(
            db, waybill, data.actual_cod_collected, data.pod_image_url, 
            current_user['user_id'], current_user.get('primary_hub_id'), data.note
        )
        db.commit()
        res = {"status": "DELIVERED", "cod": data.actual_cod_collected}
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
    # Chỉ Shipper hoặc Admin mới có quyền báo thất bại [cite: 47]
    waybill = crud_wb.get_waybill_by_code(db, data.waybill_code)
    
    if not waybill or waybill.status != "DELIVERING":
        raise HTTPException(status_code=400, detail="Trạng thái đơn hàng không hợp lệ để báo thất bại")

    success = crud_delivery.report_delivery_failure(
        db, waybill, data.reason_code, current_user['user_id'], data.note
    )
    
    if not success:
        raise HTTPException(status_code=409, detail="Dữ liệu đã bị thay đổi bởi người khác, vui lòng thử lại")
        
    db.commit()
    res = {"status": "success", "message": "Đã ghi nhận giao hàng thất bại"}
    commit_idempotency(idem_key, res) # Ghi nhận kết quả
    return res

def scan_overdue_waybills(db: Session):
    """Tìm và gắn cờ cảnh báo cho các đơn giao quá 24h"""
    from datetime import datetime, timedelta
    deadline = datetime.utcnow() - timedelta(hours=24)
    
    # SỬA LỖI: Thêm điều kiện Join rõ ràng (Waybills.waybill_id == TrackingLogs.waybill_id)
    # Điều này giúp SQLAlchemy không còn bị nhầm lẫn (ambiguity)
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
        # Kiểm tra xem đã có cảnh báo OVERDUE_WARNING nào gần đây chưa để tránh ghi log trùng
        existing_warning = db.query(models.TrackingLogs).filter(
            models.TrackingLogs.waybill_id == wb.waybill_id,
            models.TrackingLogs.status_id == "OVERDUE_WARNING",
            models.TrackingLogs.system_time > deadline
        ).first()

        if not existing_warning:
            # Ghi một log cảnh báo OVERDUE vào hệ thống
            db.add(models.TrackingLogs(
                waybill_id=wb.waybill_id,
                status_id="OVERDUE_WARNING",
                note="CẢNH BÁO: Đơn hàng giao quá 24 giờ chưa có cập nhật!",
                system_time=datetime.utcnow()
            ))
            updated_count += 1
    
    return updated_count