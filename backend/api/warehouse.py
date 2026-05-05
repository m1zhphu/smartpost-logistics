from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from core.database import get_db
from core.idempotency import validate_idempotency, commit_idempotency
from core.security import get_current_user
from core.state_machine import WaybillStatus, validate_state_transition
import crud.warehouse as crud_wh
import schemas.warehouse as schema_wh
from core.permissions import PermissionChecker
from datetime import datetime, date

router = APIRouter(prefix="/api/scans", tags=["Warehouse Operations"])

# --- HÀM TIỆN ÍCH KIỂM TRA QUYỀN KHO ---
def verify_warehouse_access(user: dict):
    """Chỉ Admin (1), Manager (2) và Kho (3) mới được vào khu vực này"""
    if user.get("role_id") not in [1, 2, 3]:
        raise HTTPException(
            status_code=403, 
            detail="Truy cập bị từ chối. Chỉ Quản lý và Nhân viên Kho mới được thao tác."
        )

@router.get("/history")
def get_scan_history(
    scan_date: str = Query(default=None, description="Ngày cần xem lịch sử, định dạng YYYY-MM-DD"),
    hub_id: int = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    verify_warehouse_access(current_user)
    
    try:
        target_date = datetime.strptime(scan_date, "%Y-%m-%d").date() if scan_date else date.today()
        
        # PHÂN QUYỀN: Ép hub_id nếu không phải Super Admin
        user_role = current_user.get("role_id")
        target_hub = current_user.get("primary_hub_id") if user_role != 1 else (hub_id or current_user.get("primary_hub_id"))

        # Gọi CRUD để lấy dữ liệu đã format sẵn
        total, result = crud_wh.get_scan_history_logs(db, target_date, target_hub, page, size)

        return {"date": str(target_date), "hub_id": target_hub, "total": total, "page": page, "size": size, "items": result}
    except ValueError:
        raise HTTPException(status_code=400, detail="Định dạng ngày không hợp lệ. Dùng YYYY-MM-DD")
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/in-hub")
async def scan_in_hub(
    data: schema_wh.ScanRequest, db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user), idem_key: str = Depends(validate_idempotency)
):
    verify_warehouse_access(current_user)
    
    user_hub_id = current_user.get("primary_hub_id")
    if user_hub_id is None and current_user.get("role_id") != 1:
        raise HTTPException(
            status_code=400, 
            detail="Tài khoản của bạn chưa được gán vào bưu cục nào. Vui lòng liên hệ Admin."
        )

    waybill = crud_wh.get_waybill(db, data.waybill_code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không thấy vận đơn")

    if current_user.get("role_id") != 1:
        waybill_hub_id = waybill.origin_hub_id
        if waybill_hub_id is None or int(waybill_hub_id) != int(user_hub_id):
            # Lưu ý: Vì bỏ models nên ta tạm ẩn waybill.origin_hub.hub_name ở thông báo lỗi nếu không lazy load được, hoặc xử lý an toàn
            raise HTTPException(
                status_code=403, 
                detail="Đơn hàng này không thuộc bưu cục của bạn. Bạn không thể nhập kho tại đây."
            )

    validate_state_transition(waybill.status, WaybillStatus.IN_HUB)
    
    waybill.status = WaybillStatus.IN_HUB
    waybill.version += 1
    crud_wh.create_log(db, waybill.waybill_id, WaybillStatus.IN_HUB, 
                       current_user.get('primary_hub_id'), current_user['user_id'], data.note)
    
    db.commit()
    res = {
        "waybill_code": waybill.waybill_code, 
        "status": waybill.status,
        "receiver_name": waybill.receiver_name,
        "actual_weight": float(waybill.actual_weight) if waybill.actual_weight else 0.1,
        "declared_weight": float(waybill.converted_weight) if waybill.converted_weight else float(waybill.actual_weight or 0.1)
    }
    commit_idempotency(idem_key, res)
    return res

@router.patch("/{waybill_code}/weigh")
async def update_actual_weight(
    waybill_code: str,
    data: schema_wh.WeighRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    verify_warehouse_access(current_user)
    
    waybill = crud_wh.get_waybill(db, waybill_code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")

    if waybill.status == "CREATED":
        raise HTTPException(status_code=400, detail="Đơn chưa nhập kho. Vui lòng quét nhập kho trước khi cân.")

    if not waybill.converted_weight or waybill.converted_weight == 0:
        waybill.converted_weight = waybill.actual_weight

    waybill.actual_weight = data.actual_weight
    waybill.version += 1

    # Dùng CRUD thay vì models
    crud_wh.create_log(
        db, waybill.waybill_id, waybill.status, current_user.get("primary_hub_id"), current_user["user_id"],
        f"Cân thực tế: {data.actual_weight}kg (khai báo: {waybill.converted_weight}kg). {data.note or ''}"
    )

    db.commit()
    return {"waybill_code": waybill_code, "declared_weight": float(waybill.converted_weight), "actual_weight": data.actual_weight}

@router.post("/bagging", dependencies=[Depends(PermissionChecker("warehouse_scan"))])
async def scan_bagging(
    data: schema_wh.BaggingRequest, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user), 
    idem_key: str = Depends(validate_idempotency)
):
    verify_warehouse_access(current_user)
    
    try:
        hub_id = current_user.get('primary_hub_id')
        user_id = current_user.get('user_id')
        user_role = current_user.get('role_id')
        
        final_bag_code = data.bag_code.strip() if data.bag_code else ""
        if not final_bag_code:
            from datetime import datetime
            time_str = datetime.now().strftime("%y%m%d%H%M%S")
            safe_hub = hub_id if hub_id else 0 
            final_bag_code = f"BG-{safe_hub}-{time_str}"
        
        bag = crud_wh.get_or_create_bag(db, final_bag_code, user_id, data.destination_hub_id)

        for code in data.waybill_codes:
            wb = crud_wh.get_waybill(db, code)
            if not wb: continue
            
            # Thay thế bằng CRUD
            last_log = crud_wh.get_last_tracking_log(db, wb.waybill_id)
            
            if not last_log or wb.status != WaybillStatus.IN_HUB:
                raise HTTPException(status_code=400, detail=f"Đơn hàng {code} chưa được Nhập kho, không thể đóng túi!")

            package_location = last_log.hub_id if last_log.hub_id else wb.origin_hub_id

            if user_role != 1 and package_location != hub_id:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Lỗi: Đơn hàng {code} đang ở Bưu cục khác (Hub ID: {package_location}). Bạn không thể đóng túi hàng không có mặt ở đây!"
                )

            if wb.status == WaybillStatus.BAGGED:
                raise HTTPException(status_code=400, detail=f"Đơn hàng {code} đã nằm trong túi hàng khác.")
            
            validate_state_transition(wb.status, WaybillStatus.BAGGED)
            
            wb.status = WaybillStatus.BAGGED
            wb.version += 1
            
            crud_wh.add_item_to_bag(db, bag.bag_id, wb.waybill_id)
            crud_wh.create_log(
                db, wb.waybill_id, WaybillStatus.BAGGED, 
                hub_id, user_id, f"Đã đóng vào túi: {bag.bag_code}. Ghi chú: {data.note}"
            )

        db.commit()
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
    idem_key: str = Depends(validate_idempotency)
):
    verify_warehouse_access(current_user)
    
    try:
        hub_id = current_user.get('primary_hub_id')
        user_id = current_user.get('user_id')
        
        manifest = crud_wh.get_manifest_by_code(db, data.manifest_code)

        if not manifest:
            manifest = crud_wh.create_manifest(db, data.model_dump(exclude={'bag_codes'}), hub_id)
        else:
            if current_user.get("role_id") != 1 and manifest.from_hub_id != hub_id:
                raise HTTPException(status_code=403, detail="Chuyến xe này không xuất phát từ bưu cục của bạn!")
            
            manifest.vehicle_number = data.vehicle_number
            manifest.to_hub_id = data.to_hub_id

        vehicle_info = data.vehicle_number or 'N/A'

        for b_code in data.bag_codes:
            bag = crud_wh.get_bag_by_code(db, b_code) 
            if not bag:
                raise HTTPException(status_code=404, detail=f"Mã túi {b_code} không tồn tại")
            
            if bag.status == "IN_TRANSIT":
                 raise HTTPException(status_code=400, detail=f"Túi {b_code} đã được bốc lên xe và đang vận chuyển!")
            if bag.status == "ARRIVED":
                 raise HTTPException(status_code=400, detail=f"Túi {b_code} đã về bến, không thể bốc lên xe")

            # Gọi CRUD
            exists_in_manifest = crud_wh.check_bag_in_manifest(db, manifest.manifest_id, bag.bag_id)
            if exists_in_manifest: continue 

            crud_wh.link_bag_to_manifest(db, manifest.manifest_id, bag.bag_id)
            bag.status = "IN_TRANSIT"
            crud_wh.bulk_update_waybills_to_transit(db, bag.bag_id, hub_id, user_id, vehicle_info)

        db.commit()
        res = {"manifest_code": manifest.manifest_code, "status": "LOADED_SUCCESS", "bags_count": len(data.bag_codes)}
        commit_idempotency(idem_key, res)
        return res
        
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống: {str(e)}")

@router.post("/manifest-unload")
async def scan_manifest_unload(
    data: schema_wh.ManifestUnloadRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    idem_key: str = Depends(validate_idempotency)
):
    verify_warehouse_access(current_user)
    
    manifest = crud_wh.get_manifest_by_code(db, data.manifest_code)
    if not manifest:
        raise HTTPException(status_code=404, detail="Không tìm thấy chuyến xe trung chuyển")

    hub_id = current_user.get('primary_hub_id')
    if current_user.get("role_id") != 1 and manifest.to_hub_id != hub_id:
         raise HTTPException(status_code=403, detail="Chuyến xe này không có đích đến là bưu cục của bạn!")

    try:
        user_id = current_user.get('user_id')
        
        for b_code in data.bag_codes:
            bag = crud_wh.get_bag_by_code(db, b_code)
            if not bag: continue 

            link = crud_wh.check_bag_in_manifest(db, manifest.manifest_id, bag.bag_id)
            if not link: continue 

            if bag.status != "ARRIVED":
                bag.status = "ARRIVED"
                crud_wh.bulk_update_waybills_to_arrived(db, bag.bag_id, hub_id, user_id, data.manifest_code)

        db.commit()

        result = {"manifest_code": data.manifest_code, "status": "ARRIVED_SUCCESS"}
        commit_idempotency(idem_key, result)
        return result

    except Exception as e:
        db.rollback()
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống khi dỡ hàng: {str(e)}")
    
@router.get("/bags/pending")
def get_pending_bags_list(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    verify_warehouse_access(current_user)
    
    try:
        hub_id = current_user.get("primary_hub_id")
        if current_user.get("role_id") != 1 and not hub_id:
            return {"items": [], "message": "Bạn chưa được phân công bưu cục"}
            
        bags = crud_wh.get_pending_bags(db, hub_id)
        
        result = []
        for b in bags:
            created_at_val = getattr(b, "created_at", None)
            
            result.append({
                "bag_id": b.bag_id,
                "bag_code": b.bag_code,
                "dest_hub_name": b.dest_hub_name or "Không rõ",
                "total_waybills": b.total_waybills,
                "status": b.status,
                "created_at": created_at_val.isoformat() if created_at_val else None
            })
            
        return {"items": result, "total": len(result)}
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Lỗi tải danh sách túi: {str(e)}")
    
@router.get("/bags")
def get_bag_list(
    page: int = 1, 
    size: int = 20, 
    bag_code: str = None, 
    status: str = None,
    dest_hub_id: int = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user) 
):
    verify_warehouse_access(current_user)
    
    try:
        # Nhờ CRUD lo liệu việc truy vấn
        total, result = crud_wh.get_paginated_bags(
            db, current_user.get("role_id"), current_user.get("primary_hub_id"),
            page, size, bag_code, status, dest_hub_id
        )
        return {"total": total, "items": result}
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/bags/{bag_code}/items")
def get_bag_items(
    bag_code: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    verify_warehouse_access(current_user)
    
    try:
        bag = crud_wh.get_bag_by_code(db, bag_code)
        if not bag:
            raise HTTPException(status_code=404, detail="Không tìm thấy túi hàng")

        result = crud_wh.get_bag_items_with_logs(db, bag.bag_id)
        return {"items": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi truy vấn: {str(e)}")
    
@router.get("/manifests/incoming")
def get_incoming_manifests(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API lấy danh sách các chuyến xe ĐANG ĐI TỚI bưu cục"""
    verify_warehouse_access(current_user)
    
    try:
        hub_id = current_user.get("primary_hub_id")
        role_id = current_user.get("role_id")
        if role_id != 1 and not hub_id:
            return {"items": []}

        result = crud_wh.get_incoming_manifests_data(db, role_id, hub_id)
        return {"items": result}
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/manifests/{manifest_code}/bags")
def get_manifest_bags(
    manifest_code: str, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    verify_warehouse_access(current_user)
    try:
        manifest = crud_wh.get_manifest_by_code(db, manifest_code)
        if not manifest:
            raise HTTPException(status_code=404, detail="Không tìm thấy chuyến xe")
            
        bags = crud_wh.get_bags_by_manifest_id(db, manifest.manifest_id)
        
        result = [{"bag_code": b.bag_code, "status": b.status} for b in bags]
        return {"items": result}
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))