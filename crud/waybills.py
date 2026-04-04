# File: crud/waybills.py
from sqlalchemy.orm import Session
from datetime import datetime
import models
from core.state_machine import WaybillStatus
from typing import Optional
from schemas.waybills import WaybillFilter

def get_waybill_by_code(db: Session, code: str):
    """Chỉ lấy những đơn hàng chưa bị xóa mềm"""
    return db.query(models.Waybills).filter(
        models.Waybills.waybill_code == code,
        models.Waybills.is_deleted == False # Thêm filter này
    ).first()

def get_tracking_logs(db: Session, waybill_id: int):
    """Lấy lịch sử hành trình sắp xếp theo thời gian mới nhất"""
    return db.query(models.TrackingLogs).filter(
        models.TrackingLogs.waybill_id == waybill_id
    ).order_by(models.TrackingLogs.system_time.desc()).all()

def create_waybill_record(db: Session, data: dict, fee: float):
    """Khởi tạo bản ghi vận đơn với Optimistic Locking [cite: 15, 32]"""
    new_waybill = models.Waybills(
        waybill_code=f"SP{int(datetime.utcnow().timestamp())}",
        **data,
        shipping_fee=fee,
        status=WaybillStatus.CREATED,
        version=1,
        converted_weight=data['actual_weight']
    )
    db.add(new_waybill)
    db.flush()
    return new_waybill

def create_initial_log(db: Session, waybill_id: int, hub_id: int, user_id: int):
    """Ghi log khởi tạo đơn hàng"""
    new_log = models.TrackingLogs(
        waybill_id=waybill_id,
        status_id=WaybillStatus.CREATED,
        hub_id=hub_id,
        user_id=user_id,
        system_time=datetime.utcnow(),
        action_time=datetime.utcnow(),
        note="Khởi tạo vận đơn thành công"
    )
    db.add(new_log)
    return new_log

def get_public_waybill_info(db: Session, code: str):
    """Lấy thông tin vận đơn kèm Join để lấy tên bưu cục"""
    return db.query(models.Waybills).filter(
        models.Waybills.waybill_code == code,
        models.Waybills.is_deleted == False
    ).first()

def soft_delete_waybill(db: Session, waybill_id: int):
    """Thực hiện xóa mềm vận đơn bằng cách cập nhật flag"""
    waybill = db.query(models.Waybills).filter(models.Waybills.waybill_id == waybill_id).first()
    if waybill:
        waybill.is_deleted = True
        waybill.deleted_at = datetime.utcnow()
        db.commit()
    return waybill

def get_waybills_with_filters(db: Session, filters: WaybillFilter, current_hub_id: Optional[int] = None):
    query = db.query(models.Waybills).filter(models.Waybills.is_deleted == False)

    # 1. Phân quyền: Nếu không phải Admin, chỉ thấy đơn liên quan đến Hub của mình [cite: 44]
    if current_hub_id:
        query = query.filter(
            (models.Waybills.origin_hub_id == current_hub_id) | 
            (models.Waybills.dest_hub_id == current_hub_id)
        )

    # 2. Áp dụng các bộ lọc động
    if filters.waybill_code:
        query = query.filter(models.Waybills.waybill_code.ilike(f"%{filters.waybill_code}%"))
    if filters.status:
        query = query.filter(models.Waybills.status == filters.status)
    if filters.origin_hub_id:
        query = query.filter(models.Waybills.origin_hub_id == filters.origin_hub_id)
    if filters.dest_hub_id:
        query = query.filter(models.Waybills.dest_hub_id == filters.dest_hub_id)
    if filters.customer_id:
        query = query.filter(models.Waybills.customer_id == filters.customer_id)
    
    # 3. Lọc theo thời gian (Dựa trên log CREATED đầu tiên)
    # Lưu ý: Vì table Waybills không có created_at, ta lọc qua TrackingLogs [cite: 75]
    if filters.start_date:
        query = query.join(models.TrackingLogs).filter(
            models.TrackingLogs.status_id == "CREATED",
            models.TrackingLogs.system_time >= filters.start_date
        )

    # 4. Phân trang (Pagination)
    total = query.count()
    items = query.offset((filters.page - 1) * filters.size).limit(filters.size).all()

    return items, total

def get_overdue_waybills(db: Session, page: int = 1, size: int = 20):
    """
    Lấy danh sách các đơn hàng bị gắn cờ cảnh báo quá hạn (SLA Monitoring).
    Đáp ứng yêu cầu giám sát đơn 'ngâm' quá 24h của Admin.
    """
    # Join với TrackingLogs để tìm những đơn có status_id là cảnh báo quá hạn
    query = db.query(models.Waybills).join(models.TrackingLogs).filter(
        models.Waybills.is_deleted == False,
        models.TrackingLogs.status_id == "OVERDUE_WARNING"
    ).distinct() # Một đơn có thể bị cảnh báo nhiều lần, dùng distinct để không bị trùng

    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()

    return items, total

def count_overdue_summary(db: Session):
    """
    Hàm bổ trợ cho Dashboard: Đếm nhanh tổng số đơn đang bị cảnh báo quá hạn.
    """
    return db.query(models.Waybills).join(models.TrackingLogs).filter(
        models.Waybills.is_deleted == False,
        models.TrackingLogs.status_id == "OVERDUE_WARNING"
    ).distinct().count()