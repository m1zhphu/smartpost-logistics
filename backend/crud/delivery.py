from sqlalchemy.orm import Session
from datetime import datetime
import models
from core.state_machine import WaybillStatus

# --- CÁC HÀM TRUY VẤN MỚI CHUYỂN TỪ API SANG ---

def get_pending_waybills_for_hub(db: Session, hub_id: int = None):
    """Lấy danh sách đơn chờ phân công giao hàng"""
    query = db.query(models.Waybills).filter(models.Waybills.status.in_(["ARRIVED", "IN_HUB"]))
    if hub_id is not None:
        query = query.filter(models.Waybills.dest_hub_id == hub_id)
    return query.all()

def get_active_shipper(db: Session, shipper_id: int):
    """Lấy thông tin Shipper"""
    return db.query(models.Users).filter(
        models.Users.user_id == shipper_id,
        models.Users.role_id == 4
    ).first()

def get_tasks_for_shipper(db: Session, shipper_id: int):
    """Lấy danh sách đơn hàng đang đi giao của 1 shipper"""
    return db.query(models.Waybills).join(models.DeliveryResults).filter(
        models.Waybills.status == WaybillStatus.DELIVERING,
        models.DeliveryResults.shipper_id == shipper_id
    ).order_by(models.DeliveryResults.delivery_id.desc()).all()

def get_latest_delivery_record(db: Session, waybill_id: int):
    """Lấy bản ghi giao hàng mới nhất của 1 vận đơn"""
    return db.query(models.DeliveryResults).filter(
        models.DeliveryResults.waybill_id == waybill_id
    ).order_by(models.DeliveryResults.delivery_id.desc()).first()

def scan_overdue_waybills(db: Session):
    """Tìm và gắn cờ cảnh báo cho các đơn giao quá 24h (Chuyển từ API sang)"""
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

# --- CÁC HÀM CŨ ĐÃ CÓ (GIỮ NGUYÊN) ---

def get_waybill_by_code(db: Session, code: str):
    return db.query(models.Waybills).filter(models.Waybills.waybill_code == code).first()

def assign_shipper_to_waybill(db: Session, waybill: models.Waybills, shipper_id: int, user_id: int, hub_id: int):
    """Thực hiện phân công shipper với Optimistic Locking"""
    current_version = waybill.version
    
    affected_rows = db.query(models.Waybills).filter(
        models.Waybills.waybill_id == waybill.waybill_id,
        models.Waybills.version == current_version
    ).update({
        "status": WaybillStatus.DELIVERING,
        "version": current_version + 1
    })

    if affected_rows > 0:
        db.add(models.DeliveryResults(
            waybill_id=waybill.waybill_id,
            shipper_id=shipper_id,
            status=WaybillStatus.DELIVERING,
            delivery_time=datetime.utcnow()
        ))

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

    delivery_record = db.query(models.DeliveryResults).filter(
        models.DeliveryResults.waybill_id == waybill.waybill_id
    ).order_by(models.DeliveryResults.delivery_id.desc()).first()
    
    if delivery_record:
        delivery_record.actual_cod_collected = actual_cod
        delivery_record.pod_image_url = pod_url
        delivery_record.status = WaybillStatus.DELIVERED
        delivery_record.delivery_time = datetime.utcnow()
        delivery_record.note = f"Giao thành công bởi Shipper ID {delivery_record.shipper_id}"
        
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
    """Cập nhật trạng thái giao thất bại và ghi log lý do"""
    current_version = waybill.version
    
    affected = db.query(models.Waybills).filter(
        models.Waybills.waybill_id == waybill.waybill_id,
        models.Waybills.version == current_version
    ).update({
        "status": "DELIVERY_FAILED",
        "version": current_version + 1
    })

    if affected > 0:
        db.add(models.TrackingLogs(
            waybill_id=waybill.waybill_id,
            status_id="DELIVERY_FAILED",
            user_id=user_id,
            system_time=datetime.utcnow(),
            note=f"Giao thất bại. Lý do: {reason_code}. Ghi chú: {note}"
        ))
    return affected