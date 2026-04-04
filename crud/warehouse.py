# File: crud/warehouse.py
from sqlalchemy.orm import Session
from datetime import datetime
import models
from core.state_machine import WaybillStatus, validate_state_transition

def get_waybill(db: Session, code: str):
    return db.query(models.Waybills).filter(models.Waybills.waybill_code == code).first()

def create_log(db: Session, wb_id: int, status: str, hub_id: int, user_id: int, note: str):
    """Hàm dùng chung để ghi log hành trình"""
    log = models.TrackingLogs(
        waybill_id=wb_id, status_id=status, hub_id=hub_id,
        user_id=user_id, system_time=datetime.utcnow(), note=note
    )
    db.add(log)

def get_or_create_bag(db: Session, code: str, creator_id: int, dest_id: int):
    bag = db.query(models.Bags).filter(models.Bags.bag_code == code).first()
    if not bag:
        # Đã sửa: Dùng created_by, dest_hub_id và loại bỏ created_at
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
    # Đã sửa: Bỏ created_at
    item = models.BagItems(bag_id=bag_id, waybill_id=waybill_id)
    db.add(item)

def create_manifest(db: Session, data: dict, source_id: int):
    # Đã sửa: Xóa bỏ thuộc tính status="IN_TRANSIT"
    manifest = models.Manifests(
        **data, 
        from_hub_id=source_id, 
        dispatched_at=datetime.utcnow()
    )
    db.add(manifest)
    db.flush()
    return manifest

def get_waybills_in_bag(db: Session, bag_id: int):
    """Tìm tất cả vận đơn thuộc 1 túi hàng"""
    return db.query(models.Waybills).join(models.BagItems).filter(
        models.BagItems.bag_id == bag_id
    ).all()

def get_bag_by_code(db: Session, bag_code: str):
    """Tìm túi hàng theo mã"""
    return db.query(models.Bags).filter(models.Bags.bag_code == bag_code).first()

def get_manifest_by_code(db: Session, manifest_code: str):
    """Tìm chuyến xe theo mã"""
    return db.query(models.Manifests).filter(models.Manifests.manifest_code == manifest_code).first()

# 1. HÀM NÀY VÀO ĐỂ TẠO LIÊN KẾT XE - TÚI:
def link_bag_to_manifest(db: Session, manifest_id: int, bag_id: int):
    """Ghi nhận túi hàng được bốc lên chuyến xe nào"""
    detail = models.ManifestDetails(manifest_id=manifest_id, bag_id=bag_id)
    db.add(detail)

# 2. HÀM NÀY DÙNG JOIN QUA BẢNG TRUNG GIAN:
def get_bags_by_manifest_id(db: Session, manifest_id: int):
    """Lấy danh sách tất cả túi trong một chuyến xe (Qua ManifestDetails)"""
    return db.query(models.Bags).join(models.ManifestDetails).filter(
        models.ManifestDetails.manifest_id == manifest_id
    ).all()

def bulk_update_waybills_to_transit(db: Session, bag_id: int, hub_id: int, user_id: int, vehicle_info: str):
    """Cập nhật hàng loạt trạng thái IN_TRANSIT cho vận đơn trong túi """
    waybills = get_waybills_in_bag(db, bag_id)
    for wb in waybills:
        # Kiểm tra State Machine: BAGGED -> IN_TRANSIT [cite: 55]
        validate_state_transition(wb.status, WaybillStatus.IN_TRANSIT)
        
        # Cập nhật trạng thái và Version (Optimistic Locking) [cite: 92]
        wb.status = WaybillStatus.IN_TRANSIT
        wb.version += 1
        
        # Ghi log hành trình bắt buộc [cite: 75, 90]
        create_log(
            db, wb.waybill_id, WaybillStatus.IN_TRANSIT, 
            hub_id, user_id, f"Xuất kho trung chuyển. Phương tiện: {vehicle_info}"
        )

def bulk_update_waybills_to_arrived(db: Session, bag_id: int, hub_id: int, user_id: int, manifest_code: str):
    """Cập nhật hàng loạt trạng thái ARRIVED cho vận đơn khi xe về bến [cite: 35, 55]"""
    waybills = get_waybills_in_bag(db, bag_id)
    for wb in waybills:
        # Kiểm tra State Machine: IN_TRANSIT -> ARRIVED [cite: 55]
        validate_state_transition(wb.status, WaybillStatus.ARRIVED)
        
        # Cập nhật trạng thái và Version phục vụ Optimistic Locking [cite: 73, 92]
        wb.status = WaybillStatus.ARRIVED
        wb.version += 1
        
        # Ghi log hành trình tại bưu cục đích [cite: 75, 80-82]
        create_log(
            db, wb.waybill_id, WaybillStatus.ARRIVED, 
            hub_id, user_id, f"Hàng đã về bưu cục. Nhập kho từ chuyến xe: {manifest_code}"
        )