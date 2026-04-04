# File: crud/delivery.py
from sqlalchemy.orm import Session
from datetime import datetime
import models
from core.state_machine import WaybillStatus

def get_waybill_by_code(db: Session, code: str):
    return db.query(models.Waybills).filter(models.Waybills.waybill_code == code).first()

def assign_shipper_to_waybill(db: Session, waybill: models.Waybills, shipper_id: int, user_id: int, hub_id: int):
    """Thực hiện phân công shipper với Optimistic Locking"""
    current_version = waybill.version
    
    # SỬA LỖI: Loại bỏ "updated_at" và "shipper_id" vì không có trong model Waybills
    affected_rows = db.query(models.Waybills).filter(
        models.Waybills.waybill_id == waybill.waybill_id,
        models.Waybills.version == current_version
    ).update({
        "status": WaybillStatus.DELIVERING,
        "version": current_version + 1
    })

    if affected_rows > 0:
        # Ghi nhận kết quả giao hàng vào bảng delivery_results (nơi có shipper_id)
        db.add(models.DeliveryResults(
            waybill_id=waybill.waybill_id,
            shipper_id=shipper_id,
            status=WaybillStatus.DELIVERING,
            delivery_time=datetime.utcnow()
        ))

        # Ghi log hành trình
        db.add(models.TrackingLogs(
            waybill_id=waybill.waybill_id,
            status_id=WaybillStatus.DELIVERING,
            hub_id=hub_id,
            user_id=user_id,
            system_time=datetime.utcnow(),
            note=f"Đã phân công cho Shipper ID: {shipper_id}"
        ))
    return affected_rows

def confirm_delivery_record(db: Session, waybill: models.Waybills, actual_cod: float, pod_url: str, user_id: int, hub_id: int, note: str):
    """Cập nhật trạng thái giao thành công và thực thu COD"""
    waybill.status = WaybillStatus.DELIVERED
    waybill.version += 1
    # SỬA LỖI: Loại bỏ waybill.updated_at vì model không có cột này

    # Cập nhật thông tin thực thu vào bảng delivery_results
    delivery_record = db.query(models.DeliveryResults).filter(
        models.DeliveryResults.waybill_id == waybill.waybill_id
    ).order_by(models.DeliveryResults.delivery_id.desc()).first()
    
    if delivery_record:
        delivery_record.actual_cod_collected = actual_cod
        delivery_record.pod_image_url = pod_url
        delivery_record.status = WaybillStatus.DELIVERED
        delivery_record.delivery_time = datetime.utcnow()
        delivery_record.note = f"Giao thành công bởi Shipper ID {delivery_record.shipper_id}"
        
    # Log thành công
    db.add(models.TrackingLogs(
        waybill_id=waybill.waybill_id,
        status_id=WaybillStatus.DELIVERED,
        hub_id=hub_id,
        user_id=user_id,
        system_time=datetime.utcnow(),
        note=note
    ))
    return waybill

def report_delivery_failure(db: Session, waybill: models.Waybills, reason_code: str, user_id: int, note: str):
    """Cập nhật trạng thái giao thất bại và ghi log lý do [cite: 57, 117]"""
    current_version = waybill.version
    
    # Sử dụng Optimistic Locking để tránh tranh chấp dữ liệu 
    affected = db.query(models.Waybills).filter(
        models.Waybills.waybill_id == waybill.waybill_id,
        models.Waybills.version == current_version
    ).update({
        "status": "DELIVERY_FAILED",
        "version": current_version + 1
    })

    if affected > 0:
        # Ghi log hành trình bắt buộc kèm mã lý do [cite: 75, 84]
        db.add(models.TrackingLogs(
            waybill_id=waybill.waybill_id,
            status_id="DELIVERY_FAILED",
            user_id=user_id,
            system_time=datetime.utcnow(),
            note=f"Giao thất bại. Lý do: {reason_code}. Ghi chú: {note}"
        ))
    return affected