# File: api/warehouse.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, cast, Date
from core.database import get_db
from core.idempotency import validate_idempotency, commit_idempotency
from core.security import get_current_user
from core.state_machine import WaybillStatus, validate_state_transition
import crud.warehouse as crud_wh
import schemas.warehouse as schema_wh
from core.permissions import PermissionChecker
from datetime import datetime, date
import models

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
    
    # 1. Lấy Hub ID của User an toàn
    user_hub_id = current_user.get("primary_hub_id")
    if user_hub_id is None and current_user.get("role_id") != 1:
        raise HTTPException(
            status_code=400, 
            detail="Tài khoản của bạn chưa được gán vào bưu cục nào. Vui lòng liên hệ Admin."
        )

    waybill = crud_wh.get_waybill(db, data.waybill_code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không thấy vận đơn")

    # 2. So sánh an toàn
    if current_user.get("role_id") != 1:
        waybill_hub_id = waybill.origin_hub_id
        # Chuyển cả 2 về int để so sánh, nhưng phải đảm bảo không None
        if waybill_hub_id is None or int(waybill_hub_id) != int(user_hub_id):
            raise HTTPException(
                status_code=403, 
                detail=f"Đơn hàng thuộc bưu cục {waybill.origin_hub.hub_name if waybill.origin_hub else 'N/A'}. Bạn không thể nhập kho tại đây."
            )

    validate_state_transition(waybill.status, WaybillStatus.IN_HUB)
    
    waybill.status = WaybillStatus.IN_HUB
    waybill.version += 1
    # Ghi nhận bưu cục thực tế đang quét (Dữ liệu cách ly)
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

    from datetime import datetime
    db.add(models.TrackingLogs(
        waybill_id=waybill.waybill_id,
        status_id=waybill.status,
        hub_id=current_user.get("primary_hub_id"),
        user_id=current_user["user_id"],
        system_time=datetime.utcnow(),
        note=f"Cân thực tế: {data.actual_weight}kg (khai báo: {waybill.converted_weight}kg). {data.note or ''}"
    ))

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
        
        # 1. Tự động sinh mã túi nếu Frontend để trống
        final_bag_code = data.bag_code.strip() if data.bag_code else ""
        if not final_bag_code:
            from datetime import datetime
            time_str = datetime.now().strftime("%y%m%d%H%M%S")
            safe_hub = hub_id if hub_id else 0 # Nếu Admin tạo túi, dùng mã 0
            final_bag_code = f"BG-{safe_hub}-{time_str}"
        
        bag = crud_wh.get_or_create_bag(db, final_bag_code, user_id, data.destination_hub_id)

        for code in data.waybill_codes:
            wb = crud_wh.get_waybill(db, code)
            if not wb: continue
            
            last_log = db.query(models.TrackingLogs).filter(
                models.TrackingLogs.waybill_id == wb.waybill_id
            ).order_by(models.TrackingLogs.id.desc()).first()
            
            if not last_log or wb.status != WaybillStatus.IN_HUB:
                raise HTTPException(status_code=400, detail=f"Đơn hàng {code} chưa được Nhập kho, không thể đóng túi!")

            # --- SỬA LỖI Ở ĐÂY: Cứu hộ dữ liệu khi Admin quét làm mất Hub ID ---
            # Nếu Hub ID bị None, hệ thống tự động lấy origin_hub_id của đơn làm vị trí hiện tại
            package_location = last_log.hub_id if last_log.hub_id else wb.origin_hub_id

            # Bỏ qua check vật lý nếu người đang đóng túi là Super Admin (Role 1)
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
        
        manifest = db.query(models.Manifests).filter(models.Manifests.manifest_code == data.manifest_code).first()

        if not manifest:
            manifest = crud_wh.create_manifest(db, data.model_dump(exclude={'bag_codes'}), hub_id)
        else:
            # Chặn nếu Manifest này không xuất phát từ Hub của người dùng (Trừ Admin)
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

            exists_in_manifest = db.query(models.ManifestDetails).filter(
                models.ManifestDetails.manifest_id == manifest.manifest_id,
                models.ManifestDetails.bag_id == bag.bag_id
            ).first()
            
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

    # Phân quyền: Xe phải đi đến bưu cục của người đang quét (Trừ Admin)
    hub_id = current_user.get('primary_hub_id')
    if current_user.get("role_id") != 1 and manifest.to_hub_id != hub_id:
         raise HTTPException(status_code=403, detail="Chuyến xe này không có đích đến là bưu cục của bạn!")

    try:
        user_id = current_user.get('user_id')
        
        for b_code in data.bag_codes:
            bag = crud_wh.get_bag_by_code(db, b_code)
            if not bag: continue 

            link = db.query(models.ManifestDetails).filter(
                models.ManifestDetails.manifest_id == manifest.manifest_id,
                models.ManifestDetails.bag_id == bag.bag_id
            ).first()
            if not link: continue 

            if bag.status != "ARRIVED":
                bag.status = "ARRIVED"
                crud_wh.bulk_update_waybills_to_arrived(db, bag.bag_id, hub_id, user_id, data.manifest_code)

        #manifest.received_at = datetime.utcnow()
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
            # Dùng getattr an toàn: Nếu không có trường created_at thì trả về None
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
    current_user: dict = Depends(get_current_user) # Thêm Dòng Này
):
    verify_warehouse_access(current_user)
    
    try:
        query = db.query(models.Bags)
        
        # --- LỌC CÁCH LY THEO BƯU CỤC ---
        if current_user.get("role_id") != 1:
            user_hub = current_user.get("primary_hub_id")
            # Nhân viên bưu cục chỉ thấy túi do bưu cục mình tạo, hoặc đang được gửi đến bưu cục mình
            query = query.join(models.Users, models.Bags.created_by == models.Users.user_id)\
                         .filter((models.Users.primary_hub_id == user_hub) | (models.Bags.dest_hub_id == user_hub))
        # --------------------------------
        
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
        bag = db.query(models.Bags).filter(models.Bags.bag_code == bag_code).first()
        if not bag:
            raise HTTPException(status_code=404, detail="Không tìm thấy túi hàng")

        items = db.query(models.Waybills).join(
            models.BagItems, 
            models.Waybills.waybill_id == models.BagItems.waybill_id
        ).filter(models.BagItems.bag_id == bag.bag_id).all()

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

        return {"items": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi truy vấn: {str(e)}")
    
@router.get("/manifests/incoming")
def get_incoming_manifests(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API lấy danh sách các chuyến xe ĐANG ĐI TỚI bưu cục (Dựa vào trạng thái túi)"""
    verify_warehouse_access(current_user)
    
    try:
        hub_id = current_user.get("primary_hub_id")
        if current_user.get("role_id") != 1 and not hub_id:
            return {"items": []}

        # --- CHỮA CHÁY: Tìm xe thông qua các túi đang có trạng thái IN_TRANSIT ---
        query = db.query(models.Manifests).join(
            models.ManifestDetails, models.Manifests.manifest_id == models.ManifestDetails.manifest_id
        ).join(
            models.Bags, models.ManifestDetails.bag_id == models.Bags.bag_id
        ).filter(
            models.Bags.status == "IN_TRANSIT"
        )

        # Lọc xe đến đúng bưu cục của người dùng
        if current_user.get("role_id") != 1:
            query = query.filter(models.Manifests.to_hub_id == hub_id)

        # Gom nhóm (Group by) để tránh 1 chuyến xe bị lặp lại nhiều lần nếu chở nhiều túi
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
    """Lấy danh sách các túi hàng thuộc về một chuyến xe (Dùng để kiểm đếm khi dỡ hàng)"""
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