# File: api/warehouse.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.idempotency import validate_idempotency, commit_idempotency
from core.security import get_current_user
from core.state_machine import WaybillStatus, validate_state_transition
import crud.warehouse as crud_wh
import schemas.warehouse as schema_wh
from core.permissions import PermissionChecker
from datetime import datetime # SỬA LỖI TẠI ĐÂY: Thêm import datetime

router = APIRouter(prefix="/api/scans", tags=["Warehouse Operations"])

@router.post("/in-hub")
async def scan_in_hub(
    data: schema_wh.ScanRequest, db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user), idem_key: str = Depends(validate_idempotency)
):
    waybill = crud_wh.get_waybill(db, data.waybill_code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không thấy vận đơn")

    validate_state_transition(waybill.status, WaybillStatus.IN_HUB)
    
    waybill.status = WaybillStatus.IN_HUB
    waybill.version += 1
    crud_wh.create_log(db, waybill.waybill_id, WaybillStatus.IN_HUB, 
                       current_user.get('primary_hub_id'), current_user['user_id'], data.note)
    
    db.commit()
    res = {"waybill_code": waybill.waybill_code, "status": waybill.status}
    commit_idempotency(idem_key, res)
    return res

@router.post("/bagging", dependencies=[Depends(PermissionChecker("warehouse_scan"))])
async def scan_bagging(
    data: schema_wh.BaggingRequest, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user), 
    idem_key: str = Depends(validate_idempotency) # Bắt buộc theo mục 5.2 [cite: 130, 145]
):
    try:
        hub_id = current_user.get('primary_hub_id')
        user_id = current_user.get('user_id')
        
        # 1. Tạo hoặc lấy túi hàng hiện có
        bag = crud_wh.get_or_create_bag(db, data.bag_code, user_id, data.destination_hub_id)

        for code in data.waybill_codes:
            wb = crud_wh.get_waybill(db, code)
            if not wb: 
                continue
            
            # CHỐT CHẶN: Kiểm tra nếu đơn đã ở trong túi khác (Mục 4.4) [cite: 114]
            if wb.status == WaybillStatus.BAGGED:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Đơn hàng {code} đã nằm trong túi hàng khác. Không thể đóng túi đúp!"
                )
            
            # 2. Kiểm tra tính hợp lệ của luồng trạng thái (IN_HUB -> BAGGED) [cite: 55]
            validate_state_transition(wb.status, WaybillStatus.BAGGED)
            
            # 3. Cập nhật dữ liệu đồng thời (Optimistic Locking) [cite: 73, 92]
            wb.status = WaybillStatus.BAGGED
            wb.version += 1
            
            # 4. Lưu liên kết và ghi Log hành trình (Mục 4.2) [cite: 75, 112]
            crud_wh.add_item_to_bag(db, bag.bag_id, wb.waybill_id)
            crud_wh.create_log(
                db, wb.waybill_id, WaybillStatus.BAGGED, 
                hub_id, user_id, f"Đã đóng vào túi: {bag.bag_code}. Ghi chú: {data.note}"
            )

        db.commit()
        
        # 5. Phản hồi và ghi nhận Idempotency [cite: 131, 145]
        res = {"bag_code": bag.bag_code, "status": "BAGGED_SUCCESS", "items_count": len(data.waybill_codes)}
        commit_idempotency(idem_key, res)
        return res
        
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống khi đóng túi: {str(e)}")

@router.post("/manifest-load")
async def scan_manifest_load(
    data: schema_wh.ManifestLoadRequest, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user), 
    idem_key: str = Depends(validate_idempotency) # Chống quét trùng mã [cite: 130, 145]
):
    try:
        hub_id = current_user.get('primary_hub_id')
        user_id = current_user.get('user_id')
        
        # 1. Tạo chuyến xe (Manifest) - Mã manifest phải là duy nhất [cite: 113]
        manifest = crud_wh.create_manifest(db, data.model_dump(exclude={'bag_codes'}), hub_id)

        vehicle_info = getattr(data, 'vehicle_number', 'N/A')

        for b_code in data.bag_codes:
            bag = crud_wh.get_bag_by_code(db, b_code) 
            if not bag: 
                continue
            
            # Kiểm tra nếu túi đã lên xe khác rồi (Tránh đóng trùng) [cite: 114]
            if bag.status == "IN_TRANSIT":
                 raise HTTPException(status_code=400, detail=f"Túi {b_code} đã ở trên một chuyến xe khác!")

            # 2. Liên kết Túi vào Xe qua bảng ManifestDetails [cite: 112]
            crud_wh.link_bag_to_manifest(db, manifest.manifest_id, bag.bag_id)
            
            # 3. Cập nhật trạng thái túi hàng
            bag.status = "IN_TRANSIT"
            
            # 4. CẬP NHẬT HÀNG LOẠT: Đổi trạng thái tất cả vận đơn trong túi [cite: 55]
            crud_wh.bulk_update_waybills_to_transit(db, bag.bag_id, hub_id, user_id, vehicle_info)

        db.commit()
        
        # 5. Phản hồi và ghi nhận Idempotency [cite: 131]
        res = {"manifest_code": manifest.manifest_code, "status": "DEPARTED", "bags_count": len(data.bag_codes)}
        commit_idempotency(idem_key, res)
        return res
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi xuất kho: {str(e)}")

@router.post("/manifest-unload")
async def scan_manifest_unload(
    data: schema_wh.ManifestUnloadRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    idem_key: str = Depends(validate_idempotency) # Bắt buộc theo mục 5.2 [cite: 130, 145]
):
    # 1. Tìm chuyến xe theo mã [cite: 113]
    manifest = crud_wh.get_manifest_by_code(db, data.manifest_code)
    if not manifest:
        raise HTTPException(status_code=404, detail="Không tìm thấy chuyến xe trung chuyển")

    try:
        hub_id = current_user.get('primary_hub_id')
        user_id = current_user.get('user_id')
        
        # 2. Lấy danh sách túi hàng thuộc chuyến xe [cite: 112]
        bags = crud_wh.get_bags_by_manifest_id(db, manifest.manifest_id)
        
        for bag in bags:
            # Chặn nếu túi đã được xác nhận đến nơi rồi (Tránh quét trùng)
            if bag.status == "ARRIVED":
                continue

            # 3. Cập nhật trạng thái túi hàng sang ARRIVED
            bag.status = "ARRIVED"
            
            # 4. CẬP NHẬT HÀNG LOẠT: Đổi trạng thái tất cả vận đơn trong túi sang ARRIVED [cite: 55]
            crud_wh.bulk_update_waybills_to_arrived(db, bag.bag_id, hub_id, user_id, data.manifest_code)

        # 5. Đóng trạng thái chuyến xe sau khi đã hạ tải xong
        manifest.received_at = datetime.utcnow()
        # manifest.status = "COMPLETED" (Nếu bạn có trường này)

        db.commit()

        # 6. Ghi nhận Idempotency để chống lỗi quét đúp từ máy quét [cite: 131, 160]
        result = {"manifest_code": data.manifest_code, "status": "ARRIVED_AT_HUB", "bags_received": len(bags)}
        commit_idempotency(idem_key, result)
        return result

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi nhập kho đích: {str(e)}")