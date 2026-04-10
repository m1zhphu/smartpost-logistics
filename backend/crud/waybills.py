# File: crud/waybills.py
from sqlalchemy.orm import Session, joinedload
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
    """Khởi tạo bản ghi vận đơn với Optimistic Locking và Dịch vụ tiện ích"""
    
    # 1. Mở khóa thêm trường payment_method để lưu xuống DB
    ALLOWED_FIELDS = {
        'customer_id', 'receiver_name', 'receiver_phone', 'receiver_address',
        'origin_hub_id', 'dest_hub_id', 'actual_weight', 'cod_amount',
        'service_type', 'product_name', 'note', 'payment_method'
    }
    filtered = {k: v for k, v in data.items() if k in ALLOWED_FIELDS}
    
    # 2. Tính toán tổng tiền phải thu (Server-side calculation)
    # Nếu người nhận trả ship -> Thu = COD + Ship. Nếu người gửi trả -> Thu = COD
    total_collect = float(data.get('cod_amount', 0))
    if data.get('payment_method') == 'RECEIVER_PAY':
        total_collect += float(fee)

    new_waybill = models.Waybills(
        waybill_code=f"SP{int(datetime.utcnow().timestamp())}",
        **filtered,
        shipping_fee=fee,
        total_amount_to_collect=total_collect, # Tự Backend tính và lưu
        status=WaybillStatus.CREATED,
        version=1,
        converted_weight=data.get('actual_weight', 0)
    )
    db.add(new_waybill)
    db.flush() # Ép sinh ra waybill_id để dùng cho bảng phụ
    
    # 3. Xử lý lưu Dịch vụ tiện ích (Extra Services) vào bảng phụ
    extra_services = data.get('extra_services', [])
    if extra_services and isinstance(extra_services, list):
        for service_item in extra_services:
            extra_srv = models.WaybillExtraServices(
                waybill_id=new_waybill.waybill_id,
                service_name=service_item,
                service_fee=0 # Tạm thời MVP để phí tiện ích = 0, sau này có bảng giá riêng thì map vào đây
            )
            db.add(extra_srv)
            
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

def soft_delete_waybill(db: Session, code: str):
    """Thực hiện xóa mềm vận đơn bằng cách cập nhật flag"""
    waybill = db.query(models.Waybills).filter(models.Waybills.waybill_code == code, models.Waybills.is_deleted == False).first()
    if waybill:
        waybill.status = "CANCELLED"
        waybill.is_deleted = True
        waybill.deleted_at = datetime.utcnow()
        db.commit()
    return waybill

def update_waybill(db: Session, code: str, update_data: dict):
    waybill = get_waybill_by_code(db, code)
    if not waybill:
        return None
    
    ALLOWED_FIELDS = {
        'receiver_name', 'receiver_phone', 'receiver_address', 'cod_amount'
    }
    
    for key, value in update_data.items():
        if key in ALLOWED_FIELDS and value is not None:
            setattr(waybill, key, value)
            
    db.commit()
    return waybill

def get_waybills_with_filters(db: Session, filters: WaybillFilter, current_hub_id: Optional[int] = None):
    query = db.query(models.Waybills).options(
        joinedload(models.Waybills.origin_hub),
        joinedload(models.Waybills.dest_hub),
    ).filter(models.Waybills.is_deleted == False)

    # --- ĐÃ VÁ LỖI: CHIA LUỒNG DỮ LIỆU ---
    # 1. Nếu Frontend chỉ định rõ origin_hub_id (Dành cho màn hình Nhập kho/Đóng túi)
    if filters.origin_hub_id:
        query = query.filter(models.Waybills.origin_hub_id == filters.origin_hub_id)
    
    # 2. Nếu Frontend chỉ định rõ dest_hub_id (Dành cho màn hình Giao hàng)
    elif filters.dest_hub_id:
        query = query.filter(models.Waybills.dest_hub_id == filters.dest_hub_id)
        
    # 3. Nếu là tìm kiếm chung (Tra cứu) và người dùng bị giới hạn Hub
    elif current_hub_id:
        query = query.filter(
            (models.Waybills.origin_hub_id == current_hub_id) | 
            (models.Waybills.dest_hub_id == current_hub_id)
        )

    # 4. Lọc theo trạng thái và mã đơn
    if filters.status:
        query = query.filter(models.Waybills.status == filters.status)
    if filters.waybill_code:
        query = query.filter(models.Waybills.waybill_code.ilike(f"%{filters.waybill_code}%"))

    total = query.count()
    items = query.order_by(models.Waybills.waybill_id.desc())\
                 .offset((filters.page - 1) * filters.size).limit(filters.size).all()

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