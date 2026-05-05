from sqlalchemy.orm import Session
from datetime import datetime
import models
from core.state_machine import WaybillStatus, validate_state_transition
from sqlalchemy import func, cast, Date

def get_waybill(db: Session, code: str):
    return db.query(models.Waybills).filter(models.Waybills.waybill_code == code).first()

def create_log(db: Session, wb_id: int, status: str, hub_id: int, user_id: int, note: str):
    log = models.TrackingLogs(
        waybill_id=wb_id, status_id=status, hub_id=hub_id,
        user_id=user_id, system_time=datetime.utcnow(), note=note
    )
    db.add(log)

def get_last_tracking_log(db: Session, waybill_id: int):
    """Lấy bản ghi log hành trình mới nhất của 1 đơn hàng"""
    return db.query(models.TrackingLogs).filter(
        models.TrackingLogs.waybill_id == waybill_id
    ).order_by(models.TrackingLogs.id.desc()).first()

def get_or_create_bag(db: Session, code: str, creator_id: int, dest_id: int):
    bag = db.query(models.Bags).filter(models.Bags.bag_code == code).first()
    if not bag:
        bag = models.Bags(
            bag_code=code, 
            created_by=creator_id, 
            dest_hub_id=dest_id, 
            status="OPENED"
        )
        db.add(bag)
        db.flush()
    return bag

def add_item_to_bag(db: Session, bag_id: int, waybill_id: int):
    item = models.BagItems(bag_id=bag_id, waybill_id=waybill_id)
    db.add(item)

def create_manifest(db: Session, data: dict, source_id: int):
    manifest = models.Manifests(
        **data, 
        from_hub_id=source_id, 
        dispatched_at=datetime.utcnow()
    )
    db.add(manifest)
    db.flush()
    return manifest

def get_waybills_in_bag(db: Session, bag_id: int):
    return db.query(models.Waybills).join(models.BagItems).filter(
        models.BagItems.bag_id == bag_id
    ).all()

def get_bag_by_code(db: Session, bag_code: str):
    return db.query(models.Bags).filter(models.Bags.bag_code == bag_code).first()

def get_manifest_by_code(db: Session, manifest_code: str):
    return db.query(models.Manifests).filter(models.Manifests.manifest_code == manifest_code).first()

def check_bag_in_manifest(db: Session, manifest_id: int, bag_id: int):
    """Kiểm tra túi đã có trong chuyến xe chưa"""
    return db.query(models.ManifestDetails).filter(
        models.ManifestDetails.manifest_id == manifest_id,
        models.ManifestDetails.bag_id == bag_id
    ).first()

def link_bag_to_manifest(db: Session, manifest_id: int, bag_id: int):
    detail = models.ManifestDetails(manifest_id=manifest_id, bag_id=bag_id)
    db.add(detail)

def get_bags_by_manifest_id(db: Session, manifest_id: int):
    return db.query(models.Bags).join(models.ManifestDetails).filter(
        models.ManifestDetails.manifest_id == manifest_id
    ).all()

def bulk_update_waybills_to_transit(db: Session, bag_id: int, hub_id: int, user_id: int, vehicle_info: str):
    waybills = get_waybills_in_bag(db, bag_id)
    for wb in waybills:
        validate_state_transition(wb.status, WaybillStatus.IN_TRANSIT)
        wb.status = WaybillStatus.IN_TRANSIT
        wb.version += 1
        create_log(
            db, wb.waybill_id, WaybillStatus.IN_TRANSIT, 
            hub_id, user_id, f"Xuất kho trung chuyển. Phương tiện: {vehicle_info}"
        )

def bulk_update_waybills_to_arrived(db: Session, bag_id: int, hub_id: int, user_id: int, manifest_code: str):
    waybills = get_waybills_in_bag(db, bag_id)
    for wb in waybills:
        validate_state_transition(wb.status, WaybillStatus.ARRIVED)
        wb.status = WaybillStatus.ARRIVED
        wb.version += 1
        create_log(
            db, wb.waybill_id, WaybillStatus.ARRIVED, 
            hub_id, user_id, f"Hàng đã về bưu cục. Nhập kho từ chuyến xe: {manifest_code}"
        )

def get_pending_bags(db: Session, current_hub_id: int = None):
    query = db.query(
        models.Bags.bag_id,
        models.Bags.bag_code,
        models.Bags.status,
        models.Hubs.hub_name.label("dest_hub_name"),
        func.count(models.BagItems.waybill_id).label("total_waybills")
    ).outerjoin(
        models.Users, models.Bags.created_by == models.Users.user_id
    ).outerjoin(
        models.Hubs, models.Bags.dest_hub_id == models.Hubs.hub_id
    ).outerjoin(
        models.BagItems, models.Bags.bag_id == models.BagItems.bag_id
    ).filter(
        models.Bags.status.in_(["OPENED", "BAGGED"]) 
    )
    
    if current_hub_id is not None:
         query = query.filter(
             (models.Users.primary_hub_id == current_hub_id) | 
             (models.Users.role_id == 1) |
             (models.Users.primary_hub_id.is_(None))
         )

    return query.group_by(
        models.Bags.bag_id, models.Bags.bag_code, models.Bags.status, models.Hubs.hub_name
    ).order_by(models.Bags.bag_id.desc()).all()

# ==========================================
# CÁC HÀM TRUY VẤN MỚI CHUYỂN TỪ API SANG
# ==========================================

def get_scan_history_logs(db: Session, target_date, target_hub, page, size):
    """Lấy lịch sử quét kho IN_HUB trong ngày"""
    subquery = db.query(
        models.TrackingLogs.waybill_id,
        func.max(models.TrackingLogs.id).label("max_id")
    ).filter(
        models.TrackingLogs.status_id == WaybillStatus.IN_HUB,
        cast(models.TrackingLogs.system_time, Date) == target_date
    )
    if target_hub:
        subquery = subquery.filter(models.TrackingLogs.hub_id == target_hub)
    subquery = subquery.group_by(models.TrackingLogs.waybill_id).subquery()

    query = db.query(models.TrackingLogs).join(
        subquery, models.TrackingLogs.id == subquery.c.max_id
    )

    total = query.count()
    logs = query.order_by(models.TrackingLogs.system_time.desc()).offset((page - 1) * size).limit(size).all()

    result = []
    for log in logs:
        waybill = db.query(models.Waybills).filter(models.Waybills.waybill_id == log.waybill_id).first()
        user = db.query(models.Users).filter(models.Users.user_id == log.user_id).first()
        user_name = user.full_name if (user and user.full_name) else (user.username if user else f"NV #{log.user_id}")

        result.append({
            "log_id": log.id,
            "waybill_code": waybill.waybill_code if waybill else f"ID:{log.waybill_id}",
            "receiver_name": waybill.receiver_name if waybill else "N/A",
            "receiver_phone": waybill.receiver_phone if waybill else "",
            "status": log.status_id,
            "hub_id": log.hub_id,
            "user_id": log.user_id,
            "user_name": user_name,
            "scan_time": log.system_time.isoformat() if log.system_time else None,
            "note": log.note,
            "actual_weight": float(waybill.actual_weight) if waybill and waybill.actual_weight else None,
            "declared_weight": float(waybill.converted_weight) if waybill and waybill.converted_weight else (float(waybill.actual_weight) if waybill and waybill.actual_weight else None),
            "shipping_fee": float(waybill.shipping_fee) if waybill and waybill.shipping_fee else 0,
        })
    return total, result

def get_paginated_bags(db: Session, role_id: int, user_hub: int, page: int, size: int, bag_code: str, status: str, dest_hub_id: int):
    """Lấy danh sách các túi hàng có phân trang và điều kiện tìm kiếm"""
    query = db.query(models.Bags)
    
    if role_id != 1:
        query = query.join(models.Users, models.Bags.created_by == models.Users.user_id)\
                     .filter((models.Users.primary_hub_id == user_hub) | (models.Bags.dest_hub_id == user_hub))
                     
    if bag_code:
        query = query.filter(models.Bags.bag_code.contains(bag_code))
    if status:
        query = query.filter(models.Bags.status == status)
    if dest_hub_id:
        query = query.filter(models.Bags.dest_hub_id == dest_hub_id) 
        
    total = query.count()
    bags = query.order_by(models.Bags.bag_id.desc()).offset((page - 1) * size).limit(size).all()
    
    result = []
    for b in bags:
        hub = db.query(models.Hubs).filter(models.Hubs.hub_id == b.dest_hub_id).first()
        waybill_count = db.query(models.BagItems).filter(models.BagItems.bag_id == b.bag_id).count()
        
        result.append({
            "bag_code": b.bag_code,
            "dest_hub_name": hub.hub_name if hub else f"Hub #{b.dest_hub_id}",
            "total_waybills": waybill_count,
            "status": b.status,
            "created_at": None 
        })
    return total, result

def get_bag_items_with_logs(db: Session, bag_id: int):
    """Lấy danh sách mã đơn hàng nằm trong túi kèm thời gian đóng túi"""
    items = db.query(models.Waybills).join(
        models.BagItems, 
        models.Waybills.waybill_id == models.BagItems.waybill_id
    ).filter(models.BagItems.bag_id == bag_id).all()

    result = []
    for item in items:
        log = db.query(models.TrackingLogs).filter(
            models.TrackingLogs.waybill_id == item.waybill_id,
            models.TrackingLogs.status_id == WaybillStatus.BAGGED
        ).order_by(models.TrackingLogs.id.desc()).first()

        result.append({
            "waybill_code": item.waybill_code,
            "scanned_at": log.system_time.isoformat() if log else None
        })
    return result

def get_incoming_manifests_data(db: Session, role_id: int, hub_id: int):
    """Lấy danh sách chuyến xe đang đến bưu cục"""
    query = db.query(models.Manifests).join(
        models.ManifestDetails, models.Manifests.manifest_id == models.ManifestDetails.manifest_id
    ).join(
        models.Bags, models.ManifestDetails.bag_id == models.Bags.bag_id
    ).filter(
        models.Bags.status == "IN_TRANSIT"
    )

    if role_id != 1:
        query = query.filter(models.Manifests.to_hub_id == hub_id)

    manifests = query.group_by(models.Manifests.manifest_id).order_by(models.Manifests.manifest_id.desc()).all()

    result = []
    for m in manifests:
        from_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == m.from_hub_id).first()
        dispatched_time = getattr(m, "dispatched_at", None)
        
        result.append({
            "manifest_code": m.manifest_code,
            "vehicle_number": getattr(m, "vehicle_number", "N/A"),
            "from_hub_name": from_hub.hub_name if from_hub else f"Hub #{m.from_hub_id}",
            "dispatched_at": dispatched_time.isoformat() if dispatched_time else None
        })
    return result