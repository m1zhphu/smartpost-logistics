# File: crud/warehouse.py
from sqlalchemy.orm import Session
from datetime import datetime
import models
from core.state_machine import WaybillStatus, validate_state_transition
from sqlalchemy import func

def get_waybill(db: Session, code: str):
    return db.query(models.Waybills).filter(models.Waybills.waybill_code == code).first()

def create_log(db: Session, wb_id: int, status: str, hub_id: int, user_id: int, note: str):
    log = models.TrackingLogs(
        waybill_id=wb_id, status_id=status, hub_id=hub_id,
        user_id=user_id, system_time=datetime.utcnow(), note=note
    )
    db.add(log)

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
        # Đã xóa models.Bags.created_at ở đây để dứt điểm lỗi 500
        models.Hubs.hub_name.label("dest_hub_name"),
        func.count(models.BagItems.waybill_id).label("total_waybills")
    ).outerjoin(
        models.Users, models.Bags.created_by == models.Users.user_id
    ).outerjoin(
        models.Hubs, models.Bags.dest_hub_id == models.Hubs.hub_id
    ).outerjoin(
        models.BagItems, models.Bags.bag_id == models.BagItems.bag_id
    ).filter(
        # Lấy cả túi đang mở (OPENED) và túi đã đóng xong (BAGGED) chờ lên xe
        models.Bags.status.in_(["OPENED", "BAGGED"]) 
    )
    
    # --- FIX LỖI TÚI TÀNG HÌNH ---
    if current_hub_id is not None:
         query = query.filter(
             # 1. Túi do nhân viên bưu cục mình tạo
             (models.Users.primary_hub_id == current_hub_id) | 
             # 2. HOẶC Túi do Super Admin (role_id = 1) tạo
             (models.Users.role_id == 1) |
             (models.Users.primary_hub_id.is_(None))
         )

    return query.group_by(
        models.Bags.bag_id, models.Bags.bag_code, models.Bags.status, models.Hubs.hub_name
    ).order_by(models.Bags.bag_id.desc()).all()