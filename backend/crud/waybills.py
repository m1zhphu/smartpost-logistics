from sqlalchemy.orm import Session, joinedload
from datetime import datetime, date
import models
from core.state_machine import WaybillStatus
from typing import Optional
from schemas.waybills import WaybillFilter
from sqlalchemy import func

def get_waybill_by_code(db: Session, code: str):
    return db.query(models.Waybills).filter(
        models.Waybills.waybill_code == code,
        models.Waybills.is_deleted == False 
    ).first()

def get_tracking_logs(db: Session, waybill_id: int):
    return db.query(models.TrackingLogs).filter(
        models.TrackingLogs.waybill_id == waybill_id
    ).order_by(models.TrackingLogs.system_time.desc()).all()

def create_waybill_record(db: Session, data: dict, fee: float):
    ALLOWED_FIELDS = {
        'customer_id', 'receiver_name', 'receiver_phone', 'receiver_address',
        'origin_hub_id', 'dest_hub_id', 'actual_weight', 'cod_amount',
        'service_type', 'product_name', 'note', 'payment_method'
    }
    filtered = {k: v for k, v in data.items() if k in ALLOWED_FIELDS}
    
    total_collect = float(data.get('cod_amount', 0))
    if data.get('payment_method') == 'RECEIVER_PAY':
        total_collect += float(fee)

    new_waybill = models.Waybills(
        waybill_code=f"SP{int(datetime.utcnow().timestamp())}",
        **filtered,
        shipping_fee=fee,
        total_amount_to_collect=total_collect, 
        status=WaybillStatus.CREATED,
        version=1,
        converted_weight=data.get('actual_weight', 0)
    )
    db.add(new_waybill)
    db.flush() 
    
    extra_services = data.get('extra_services', [])
    if extra_services and isinstance(extra_services, list):
        for service_item in extra_services:
            extra_srv = models.WaybillExtraServices(
                waybill_id=new_waybill.waybill_id,
                service_name=service_item,
                service_fee=0 
            )
            db.add(extra_srv)
            
    return new_waybill

def create_initial_log(db: Session, waybill_id: int, hub_id: int, user_id: int):
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
    return db.query(models.Waybills).filter(
        models.Waybills.waybill_code == code,
        models.Waybills.is_deleted == False
    ).first()

def soft_delete_waybill(db: Session, code: str):
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
            
    db.flush()
    return waybill

def get_waybills_with_filters(db: Session, filters: WaybillFilter, current_hub_id: Optional[int] = None):
    query = db.query(models.Waybills).options(
        joinedload(models.Waybills.origin_hub),
        joinedload(models.Waybills.dest_hub),
    ).filter(models.Waybills.is_deleted == False)

    if filters.origin_hub_id:
        query = query.filter(models.Waybills.origin_hub_id == filters.origin_hub_id)
    elif filters.dest_hub_id:
        query = query.filter(models.Waybills.dest_hub_id == filters.dest_hub_id)
    elif current_hub_id:
        query = query.filter(
            (models.Waybills.origin_hub_id == current_hub_id) | 
            (models.Waybills.dest_hub_id == current_hub_id)
        )

    if filters.status:
        query = query.filter(models.Waybills.status == filters.status)
    if filters.waybill_code:
        query = query.filter(models.Waybills.waybill_code.ilike(f"%{filters.waybill_code}%"))

    total = query.count()
    items = query.order_by(models.Waybills.waybill_id.desc())\
                 .offset((filters.page - 1) * filters.size).limit(filters.size).all()

    return items, total

def get_overdue_waybills(db: Session, page: int = 1, size: int = 20):
    query = db.query(models.Waybills).join(models.TrackingLogs).filter(
        models.Waybills.is_deleted == False,
        models.TrackingLogs.status_id == "OVERDUE_WARNING"
    ).distinct() 

    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    return items, total

def count_overdue_summary(db: Session):
    return db.query(models.Waybills).join(models.TrackingLogs).filter(
        models.Waybills.is_deleted == False,
        models.TrackingLogs.status_id == "OVERDUE_WARNING"
    ).distinct().count()

# ==========================================
# CÁC HÀM TRUY VẤN MỚI CHUYỂN TỪ API SANG
# ==========================================

def count_today_in_hub_scans(db: Session, hub_id: int, today: date):
    return db.query(models.TrackingLogs).filter(
        models.TrackingLogs.hub_id == hub_id,
        models.TrackingLogs.status_id == "IN_HUB",
        func.date(models.TrackingLogs.system_time) == today
    ).count()

def update_waybill_weight_record(db: Session, waybill: models.Waybills, new_weight: float):
    result = db.query(models.Waybills).filter(
        models.Waybills.waybill_id == waybill.waybill_id,
        models.Waybills.version == waybill.version
    ).update({
        "actual_weight": new_weight,
        "version": models.Waybills.version + 1
    })
    if result:
        db.flush()
        return waybill
    return None

def update_waybill_fee_and_log(db: Session, waybill: models.Waybills, new_fee: float, new_weight: float, hub_id: int, user_id: int):
    db.query(models.Waybills).filter(models.Waybills.waybill_id == waybill.waybill_id).update({"shipping_fee": new_fee})
    
    new_log = models.TrackingLogs(
        waybill_id=waybill.waybill_id,
        status_id=waybill.status,
        hub_id=hub_id,
        user_id=user_id,
        note=f"Cân lại: {new_weight}kg. Cập nhật giá mới: {new_fee:,.0f} VNĐ",
        system_time=datetime.utcnow()
    )
    db.add(new_log)
    db.flush()

def mark_waybill_as_delivered(db: Session, waybill: models.Waybills, hub_id: int, user_id: int):
    result = db.query(models.Waybills).filter(
        models.Waybills.waybill_id == waybill.waybill_id,
        models.Waybills.version == waybill.version
    ).update({
        "status": "DELIVERED",
        "version": models.Waybills.version + 1
    })
    
    if result:
        new_log = models.TrackingLogs(
            waybill_id=waybill.waybill_id,
            status_id="DELIVERED",
            hub_id=hub_id,
            user_id=user_id,
            note="Giao hàng thành công - Shipper đã thu tiền mặt",
            system_time=datetime.utcnow()
        )
        db.add(new_log)
        db.flush()
        return waybill
    return None

def log_waybill_edit(db: Session, waybill_id: int, current_status: str, current_user: dict):
    new_log = models.TrackingLogs(
        waybill_id=waybill_id,
        status_id=current_status, 
        hub_id=current_user.get("primary_hub_id"),
        user_id=current_user.get("user_id"),
        note=f"Nhân viên {current_user.get('username')} đã hiệu chỉnh thông tin vận đơn",
        system_time=datetime.utcnow()
    )
    db.add(new_log)
    db.flush()