from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from core.database import get_db
from core.idempotency import validate_idempotency, commit_idempotency
from core.security import get_current_user
from core.state_machine import WaybillStatus, validate_state_transition
from core.pricing import calculate_shipping_fee, calculate_shipping_fee_detail
from core.realtime import realtime_manager
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

    if data.actual_weight <= 0:
        raise HTTPException(status_code=400, detail="Khối lượng thực tế phải lớn hơn 0 kg")

    if not waybill.converted_weight or waybill.converted_weight == 0:
        waybill.converted_weight = waybill.actual_weight

    waybill.actual_weight = data.actual_weight
    final_converted_weight = float(waybill.converted_weight or data.actual_weight or 0)
    charge_weight = max(float(data.actual_weight), final_converted_weight)
    extra_service_codes = [srv.service_name for srv in getattr(waybill, "waybill_extra_services", []) or [] if srv.service_name]
    fee_detail = calculate_shipping_fee_detail(
        db,
        origin_hub_id=waybill.origin_hub_id,
        dest_hub_id=waybill.dest_hub_id,
        origin_province_id=waybill.sender_province_id,
        dest_province_id=waybill.receiver_province_id,
        weight=charge_weight,
        service_type=waybill.service_type or "STANDARD",
        customer_id=waybill.customer_id,
        extra_service_codes=extra_service_codes,
        cod_amount=float(waybill.cod_amount or 0),
        declared_value=0,
        quantity=1,
        dest_district_id=waybill.receiver_district_id,
        dest_ward_id=waybill.receiver_ward_id,
    )
    final_shipping_fee = float(fee_detail["main_fee"] or 0)
    final_extra_fee = float(fee_detail["extra_services_fee"] or 0) + float(fee_detail["fuel_surcharge"] or 0) + float(fee_detail["packing_fee"] or 0) + float(fee_detail["remote_fee"] or 0)
    final_vat = float(fee_detail["vat_amount"] or 0)
    final_total = float(fee_detail["total_amount"] or 0)
    estimated_total = float(waybill.estimated_total_amount or 0)
    waybill.final_weight = data.actual_weight
    waybill.final_converted_weight = final_converted_weight
    waybill.final_shipping_fee = final_shipping_fee
    waybill.final_extra_services_fee = final_extra_fee
    waybill.final_vat_amount = final_vat
    waybill.final_total_amount = final_total
    waybill.shipping_fee = final_shipping_fee
    waybill.vat_amount = final_vat
    if waybill.payment_method == "RECEIVER_PAY":
        waybill.total_amount_to_collect = float(waybill.cod_amount or 0) + final_total
    else:
        waybill.total_amount_to_collect = float(waybill.cod_amount or 0)
    waybill.version += 1

    # Dùng CRUD thay vì models
    crud_wh.create_log(
        db, waybill.waybill_id, waybill.status, current_user.get("primary_hub_id"), current_user["user_id"],
        f"Cân thực tế: {data.actual_weight}kg (khai báo: {waybill.converted_weight}kg). {data.note or ''}"
    )

    db.commit()
    realtime_manager.publish([f"hub:{current_user.get('primary_hub_id')}", f"customer:{waybill.customer_id}", "admin"], "pickup.price_finalized", {
        "waybill_code": waybill_code,
        "price_status": "FINALIZED",
        "estimated_total_amount": float(waybill.estimated_total_amount or 0),
        "final_total_amount": float(waybill.final_total_amount or 0),
    })
    return {
        "waybill_code": waybill_code,
        "declared_weight": float(waybill.converted_weight),
        "actual_weight": data.actual_weight,
        "price_status": "FINALIZED",
        "estimated_shipping_fee": float(waybill.estimated_shipping_fee or waybill.shipping_fee or 0),
        "final_shipping_fee": float(waybill.final_shipping_fee or 0),
        "estimated_total_amount": float(waybill.estimated_total_amount or 0),
        "final_total_amount": float(waybill.final_total_amount or 0),
    }

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
        
        # Kiểm tra bưu cục đích có tồn tại không trước khi tạo túi
        dest_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == data.destination_hub_id).first()
        if not dest_hub:
            raise HTTPException(status_code=400, detail=f"Bưu cục đích (ID: {data.destination_hub_id}) không tồn tại trên hệ thống!")

        bag = crud_wh.get_or_create_bag(db, final_bag_code, user_id, data.destination_hub_id)

        for code in data.waybill_codes:
            wb = crud_wh.get_waybill(db, code)
            if not wb: continue
            
            # Thay thế bằng CRUD
            last_log = crud_wh.get_last_tracking_log(db, wb.waybill_id)
            
            # Cho phép đóng túi nếu đơn đang ở IN_HUB (đã nhập kho)
            # hoặc CREATED với ocr_status=CONVERTED (Admin đã duyệt OCR, bỏ bước nhập kho thủ công)
            can_bag = (wb.status == WaybillStatus.IN_HUB) or \
                      (wb.status == WaybillStatus.CREATED and wb.ocr_status == "CONVERTED")
            
            if not last_log and not can_bag:
                raise HTTPException(status_code=400, detail=f"Đơn hàng {code} chưa được xử lý, không thể đóng túi!")
            
            if not can_bag:
                raise HTTPException(status_code=400, detail=f"Đơn hàng {code} chưa sẵn sàng để đóng túi (Trạng thái: {wb.status})!")

            # Với đơn CREATED (bỏ bước nhập kho), last_log có thể None → dùng origin_hub_id
            if last_log and last_log.hub_id:
                package_location = last_log.hub_id
            else:
                package_location = wb.origin_hub_id or hub_id

            if user_role != 1 and package_location and package_location != hub_id:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Lỗi: Đơn hàng {code} thuộc Bưu cục khác (Hub ID: {package_location}). Bạn không thể đóng túi hàng không có mặt ở đây!"
                )

            # --- KIỂM SOÁT VẬN ĐƠN TRƯỚC KHI XUẤT KHO ---
            # 1. Chưa có ảnh bill
            if not wb.bill_image_url and not wb.pickup_image_url:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Đơn hàng {code} chưa có ảnh chụp bill/hàng hóa. Bưu tá phải chụp ảnh khi lấy hàng trước khi xuất kho!"
                )
            
            # 2. Chưa quét OCR
            # CONVERTED = Admin đã duyệt OCR và lập phiếu gửi hàng
            # SUCCESS/SCANNED = OCR thành công hoặc đã quét nhập kho
            if not wb.ocr_status or wb.ocr_status not in ["SUCCESS", "SCANNED", "CONVERTED"]:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Đơn hàng {code} chưa được chạy kiểm tra OCR. Không thể xuất kho!"
                )
                
            # 3. Chưa xác thực (Chờ duyệt)
            if wb.verify_status == "PENDING" or not wb.verify_status:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Đơn hàng {code} đang chờ CSKH kiểm duyệt hình ảnh và thông tin. Không thể xuất kho!"
                )
                
            # 4. Lệch dữ liệu OCR (Mismatch)
            if wb.verify_status == "MISMATCH" or wb.status == WaybillStatus.VERIFY_ERROR:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Đơn hàng {code} bị lệch dữ liệu so với ảnh bill (MISMATCH). Lý do: {wb.verify_error_msg or 'Chưa duyệt lại'}. Không thể xuất kho!"
                )
                
            # 5. Thiếu thông tin COD
            if wb.cod_amount is None:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Đơn hàng {code} bị lỗi thông tin COD (Trống dữ liệu COD). Vui lòng cập nhật trước khi xuất kho!"
                )
                
            # 6. Thiếu địa chỉ nhận
            if not wb.receiver_address or wb.receiver_address.strip() == "":
                raise HTTPException(
                    status_code=400, 
                    detail=f"Đơn hàng {code} thiếu địa chỉ nhận hàng. Không thể xuất kho!"
                )

            if wb.status == WaybillStatus.BAGGED:
                raise HTTPException(status_code=400, detail=f"Đơn hàng {code} đã nằm trong túi hàng khác.")
            
            # Nếu đơn đang ở CREATED (đã qua OCR CONVERTED, bỏ bước nhập kho thủ công)
            # → Tự động chuyển CREATED → IN_HUB trước khi đóng túi
            if wb.status == WaybillStatus.CREATED:
                validate_state_transition(wb.status, WaybillStatus.IN_HUB)
                wb.status = WaybillStatus.IN_HUB
                wb.version += 1
                effective_hub_id = hub_id or wb.origin_hub_id
                crud_wh.create_log(
                    db, wb.waybill_id, WaybillStatus.IN_HUB, 
                    effective_hub_id, user_id, "Tự động nhập kho qua quy trình OCR (bỏ quét nhập kho thủ công)"
                )
            
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
        
        from sqlalchemy import func
        from_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == manifest.from_hub_id).first()
        from_hub_name = from_hub.hub_name if from_hub else f"Hub #{manifest.from_hub_id}"
        vehicle_number = getattr(manifest, "vehicle_number", "N/A")

        result = []
        for b in bags:
            dest_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == b.dest_hub_id).first()
            dest_hub_name = dest_hub.hub_name if dest_hub else "Không rõ"
            
            total_waybills = db.query(func.count(models.BagItems.waybill_id)).filter(models.BagItems.bag_id == b.bag_id).scalar()
            
            result.append({
                "bag_code": b.bag_code,
                "status": b.status,
                "dest_hub_name": dest_hub_name,
                "total_waybills": total_waybills,
                "from_hub_name": from_hub_name,
                "vehicle_number": vehicle_number
            })
            
        return {"items": result}
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# PICKUP BAGGING ENDPOINTS (PHẦN 2)
# ==========================================

@router.post("/pickup-bags", response_model=schema_wh.PickupBagResponse)
def create_pickup_bag(
    data: schema_wh.PickupBagCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """CSKH hoặc Bưu tá tạo túi lấy hàng (PICKUP Bag)"""
    if current_user.get("role_id") not in [1, 2, 3, 4, 6, 7]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền tạo túi lấy hàng")
    
    customer = db.query(models.Customers).filter(models.Customers.customer_id == data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")

    if current_user.get("role_id") == 6 and current_user.get("customer_id") != data.customer_id:
        raise HTTPException(status_code=403, detail="Bạn chỉ được tạo túi cho chính tài khoản của mình")

    selected_codes = [code.strip() for code in (data.waybill_codes or []) if code and code.strip()]
    selected_waybills = []
    if selected_codes:
        seen_codes = set()
        for code in selected_codes:
            if code in seen_codes:
                continue
            seen_codes.add(code)
            wb = crud_wh.get_waybill(db, code)
            if not wb:
                raise HTTPException(status_code=404, detail=f"Không tìm thấy bill {code}")
            if wb.customer_id != customer.customer_id:
                raise HTTPException(status_code=400, detail=f"Bill {code} không thuộc khách hàng này")
            if wb.status not in ["CREATED", "WAIT_PICKUP"]:
                raise HTTPException(status_code=400, detail=f"Bill {code} không còn ở trạng thái nháp/chờ lấy hàng")
            selected_waybills.append(wb)

    est_quantity = data.est_quantity or len(selected_waybills)
    
    # Xác định bưu tá phụ trách lấy túi hàng (created_by)
    creator_id = current_user["user_id"]
    if data.shipper_id:
        creator_id = data.shipper_id
    elif current_user.get("role_id") in [1, 2, 3, 7] and customer.staff_in_charge_id:
        creator_id = customer.staff_in_charge_id

    bag = crud_wh.create_pickup_bag(
        db=db,
        customer_id=data.customer_id,
        creator_id=creator_id,
        est_quantity=est_quantity,
        bag_code=data.bag_code,
        note=data.note
    )
    if selected_waybills:
        for wb in selected_waybills:
            crud_wh.add_item_to_bag(db, bag.bag_id, wb.waybill_id)
            wb.status = WaybillStatus.BAGGED
            wb.holding_shipper_id = creator_id
            crud_wh.create_log(
                db,
                wb.waybill_id,
                WaybillStatus.BAGGED,
                current_user.get("primary_hub_id"),
                current_user["user_id"],
                f"Đưa bill vào túi pickup {bag.bag_code}"
            )
        bag.est_quantity = len(selected_waybills)
        bag.actual_quantity = len(selected_waybills)
        bag.missing_quantity = 0
        bag.status = "CLOSED" if data.seal_bag else "CREATED"
        bag.pickup_time = datetime.utcnow()
        realtime_manager.publish(
            [f"customer:{customer.customer_id}", "admin"],
            "pickup.bag.created",
            {
                "bag_code": bag.bag_code,
                "customer_id": customer.customer_id,
                "items_count": len(selected_waybills),
                "status": bag.status,
            },
        )
    db.commit()
    db.refresh(bag)
    bag.actual_quantity = len(selected_waybills) if selected_waybills else 0
    bag.missing_quantity = 0 if selected_waybills else (est_quantity or 0)
    return bag

@router.post("/pickup-bags/{bag_code}/assign-shipper")
def assign_pickup_bag_shipper(
    bag_code: str,
    data: schema_wh.PickupBagAssignShipper,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Gán bưu tá đi lấy túi hàng"""
    if current_user.get("role_id") not in [1, 2, 3, 7]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền gán bưu tá cho túi hàng")
    
    bag = db.query(models.Bags).filter(models.Bags.bag_code == bag_code, models.Bags.bag_type == "PICKUP").first()
    if not bag:
        raise HTTPException(status_code=404, detail="Không tìm thấy túi lấy hàng")
        
    shipper = db.query(models.Users).filter(models.Users.user_id == data.shipper_id, models.Users.role_id == 4).first()
    if not shipper:
        raise HTTPException(status_code=404, detail="Không tìm thấy bưu tá phù hợp")
        
    bag.created_by = data.shipper_id
    db.commit()
    return {"status": "SUCCESS", "shipper_name": shipper.full_name}

@router.get("/pickup-bags", response_model=list[schema_wh.PickupBagResponse])
def list_pickup_bags(
    status: str = Query(None),
    customer_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách các túi lấy hàng kèm số lượng chênh lệch thực tế"""
    role_id = current_user.get("role_id")
    user_id = current_user.get("user_id")
    hub_id = current_user.get("primary_hub_id")
    
    query = db.query(models.Bags).filter(models.Bags.bag_type == "PICKUP")
    
    if status:
        query = query.filter(models.Bags.status == status)
    if customer_id:
        query = query.filter(models.Bags.customer_id == customer_id)
        
    # Phân quyền lọc dữ liệu
    if role_id == 4: # Bưu tá: chỉ xem túi của mình
        query = query.filter(models.Bags.created_by == user_id)
    elif role_id in [2, 3]: # Manager / Kho: xem các túi trong Hub
        query = query.join(models.Users, models.Bags.created_by == models.Users.user_id)\
                     .filter(models.Users.primary_hub_id == hub_id)
                     
    bags = query.order_by(models.Bags.bag_id.desc()).all()
    
    result = []
    for b in bags:
        disc = crud_wh.get_pickup_bag_discrepancy(db, b)
        b.actual_quantity = disc["actual_quantity"]
        b.missing_quantity = disc["missing_quantity"]
        result.append(b)
    return result

@router.get("/pickup-bags/{bag_code}", response_model=schema_wh.PickupBagDetailResponse)
def get_pickup_bag_detail(
    bag_code: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy chi tiết túi lấy hàng kèm chênh lệch và danh sách bill"""
    bag = db.query(models.Bags).filter(models.Bags.bag_code == bag_code, models.Bags.bag_type == "PICKUP").first()
    if not bag:
        raise HTTPException(status_code=404, detail="Không tìm thấy túi lấy hàng")
        
    disc = crud_wh.get_pickup_bag_discrepancy(db, bag)
    bag.actual_quantity = disc["actual_quantity"]
    bag.missing_quantity = disc["missing_quantity"]
    
    # Xây dựng Chain of Custody động
    chain = []
    creator = db.query(models.Users).filter(models.Users.user_id == bag.created_by).first()
    creator_name = creator.full_name if (creator and creator.full_name) else (creator.username if creator else f"Bưu tá #{bag.created_by}")
    time_base = bag.pickup_time if bag.pickup_time else datetime.utcnow()
    
    chain.append({
        "time": time_base.isoformat(),
        "handler": creator_name,
        "action": "Khởi tạo túi gom lấy hàng (CREATED)"
    })
    
    if bag.status in ["PICKED", "INBOUND", "OPENED", "PROCESSING", "VERIFIED", "CLOSED"]:
        chain.append({
            "time": time_base.isoformat(),
            "handler": creator_name,
            "action": "Bưu tá gom hàng thành công (PICKED)"
        })
        
    if bag.status in ["INBOUND", "OPENED", "PROCESSING", "VERIFIED", "CLOSED"]:
        dest_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == bag.dest_hub_id).first()
        dest_hub_name = dest_hub.hub_name if dest_hub else f"Kho #{bag.dest_hub_id}"
        chain.append({
            "time": time_base.isoformat(),
            "handler": dest_hub_name,
            "action": "Nhập kho bưu cục nhận (INBOUND)"
        })
        
    if bag.status in ["OPENED", "PROCESSING", "VERIFIED", "CLOSED"]:
        dest_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == bag.dest_hub_id).first()
        dest_hub_name = dest_hub.hub_name if dest_hub else f"Kho #{bag.dest_hub_id}"
        chain.append({
            "time": time_base.isoformat(),
            "handler": dest_hub_name,
            "action": f"Mở túi niêm phong và đối soát ({bag.status})"
        })
        
    bag.discrepancy = disc
    bag.chain_of_custody = chain
    return bag

@router.post("/pickup-bags/{bag_code}/pick")
def pick_pickup_bag(
    bag_code: str,
    data: schema_wh.PickupBagVerifyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Bưu tá quét chốt các bill tại điểm lấy hàng và chuyển trạng thái túi sang PICKED"""
    if current_user.get("role_id") not in [1, 2, 4]:
        raise HTTPException(status_code=403, detail="Chỉ bưu tá hoặc admin mới được xác nhận lấy hàng")
        
    bag = db.query(models.Bags).filter(models.Bags.bag_code == bag_code, models.Bags.bag_type == "PICKUP").first()
    if not bag:
        raise HTTPException(status_code=404, detail="Không tìm thấy túi lấy hàng")
        
    user_id = current_user.get("user_id")
    hub_id = current_user.get("primary_hub_id")
    
    bag.status = "PICKED"
    bag.pickup_time = datetime.utcnow()
    
    # Xóa các liên kết cũ nếu có để cập nhật mới
    db.query(models.BagItems).filter(models.BagItems.bag_id == bag.bag_id).delete()
    
    for code in data.waybill_codes:
        wb = crud_wh.get_waybill(db, code)
        if not wb:
            continue
            
        crud_wh.add_item_to_bag(db, bag.bag_id, wb.waybill_id)
        
        # Chuyển đổi trạng thái đơn hàng sang PICKED_PENDING_VERIFY (chờ xác thực tại kho)
        try:
            validate_state_transition(wb.status, WaybillStatus.PICKED_PENDING_VERIFY)
            wb.status = WaybillStatus.PICKED_PENDING_VERIFY
            wb.holding_shipper_id = user_id
            wb.holding_hub_id = None
            wb.version += 1
            
            crud_wh.create_log(
                db, wb.waybill_id, WaybillStatus.PICKED_PENDING_VERIFY,
                hub_id, user_id, f"Bưu tá quét lấy hàng vào túi lấy hàng {bag_code}"
            )
        except Exception:
            # Cho phép bỏ qua nếu đơn đã ở trạng thái tiếp theo hoặc không đổi được
            pass
            
    db.commit()
    return {"message": "Xác nhận lấy hàng thành công", "bag_code": bag_code, "status": bag.status}

@router.post("/pickup-bags/{bag_code}/inbound")
def inbound_pickup_bag(
    bag_code: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Kho quét xác nhận túi lấy hàng về đến kho (Trạng thái INBOUND)"""
    verify_warehouse_access(current_user)
    
    bag = db.query(models.Bags).filter(models.Bags.bag_code == bag_code, models.Bags.bag_type == "PICKUP").first()
    if not bag:
        raise HTTPException(status_code=404, detail="Không tìm thấy túi lấy hàng")
        
    bag.status = "INBOUND"
    db.commit()
    return {"message": "Túi đã về đến kho", "bag_code": bag_code, "status": bag.status}

@router.post("/pickup-bags/{bag_code}/open")
def open_pickup_bag(
    bag_code: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Kho mở túi lấy hàng (Trạng thái OPENED)"""
    verify_warehouse_access(current_user)
    
    bag = db.query(models.Bags).filter(models.Bags.bag_code == bag_code, models.Bags.bag_type == "PICKUP").first()
    if not bag:
        raise HTTPException(status_code=404, detail="Không tìm thấy túi lấy hàng")
        
    bag.status = "OPENED"
    db.commit()
    return {"message": "Đã mở túi hàng thành công", "bag_code": bag_code, "status": bag.status}

@router.post("/pickup-bags/{bag_code}/verify")
def verify_pickup_bag(
    bag_code: str,
    data: schema_wh.PickupBagVerifyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Kho quét từng bill trong túi để đối soát khớp số lượng và kiểm tra các lỗi"""
    verify_warehouse_access(current_user)
    
    bag = db.query(models.Bags).filter(models.Bags.bag_code == bag_code, models.Bags.bag_type == "PICKUP").first()
    if not bag:
        raise HTTPException(status_code=404, detail="Không tìm thấy túi lấy hàng")
        
    user_id = current_user.get("user_id")
    hub_id = current_user.get("primary_hub_id")
    
    bag.status = "PROCESSING"
    db.flush()
    
    # Cập nhật danh sách quét thực tế vào túi
    db.query(models.BagItems).filter(models.BagItems.bag_id == bag.bag_id).delete()
    
    for code in data.waybill_codes:
        wb = crud_wh.get_waybill(db, code)
        if not wb:
            continue
            
        crud_wh.add_item_to_bag(db, bag.bag_id, wb.waybill_id)
        
        # Khi kho quét và xác nhận thủ công, nếu đơn hàng hợp lệ:
        # 1. Chuyển verify_status thành VERIFIED
        # 2. Chuyển trạng thái đơn hàng sang IN_HUB (Nhập kho thành công)
        wb.verify_status = "VERIFIED"
        wb.verify_error_msg = None
        wb.holding_hub_id = hub_id
        wb.holding_shipper_id = None
        
        try:
            # Đi qua READY_WAREHOUSE và IN_HUB
            if wb.status == WaybillStatus.PICKED_PENDING_VERIFY:
                wb.status = WaybillStatus.READY_WAREHOUSE
                db.flush()
            validate_state_transition(wb.status, WaybillStatus.IN_HUB)
            wb.status = WaybillStatus.IN_HUB
            wb.version += 1
            
            crud_wh.create_log(
                db, wb.waybill_id, WaybillStatus.IN_HUB,
                hub_id, user_id, f"Quét xác nhận nhập kho thành công từ túi lấy hàng {bag_code}"
            )
        except Exception:
            # Fallback nếu trạng thái không cho phép transition
            wb.status = WaybillStatus.IN_HUB
            wb.version += 1
            crud_wh.create_log(
                db, wb.waybill_id, WaybillStatus.IN_HUB,
                hub_id, user_id, f"Quét nhập kho trực tiếp từ túi lấy hàng {bag_code}"
            )
            
    db.commit()
    
    # Kiểm nghiệm sai lệch
    disc = crud_wh.get_pickup_bag_discrepancy(db, bag)
    
    # Nếu không có bất kỳ lỗi nào, tự động nâng trạng thái túi lên VERIFIED
    if not disc["errors"] and disc["missing_quantity"] == 0 and disc["extra_quantity"] == 0:
        bag.status = "VERIFIED"
    else:
        bag.status = "PROCESSING"
        
    db.commit()
    
    return {
        "bag_code": bag.bag_code,
        "status": bag.status,
        "discrepancy": disc
    }

@router.post("/pickup-bags/{bag_code}/close")
def close_pickup_bag(
    bag_code: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Kho đóng/hoàn tất xử lý túi lấy hàng (Trạng thái CLOSED)"""
    bag = db.query(models.Bags).filter(models.Bags.bag_code == bag_code, models.Bags.bag_type == "PICKUP").first()
    if not bag:
        raise HTTPException(status_code=404, detail="Không tìm thấy túi lấy hàng")

    if current_user.get("role_id") not in [1, 2, 3, 6]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền chốt túi lấy hàng")
    if current_user.get("role_id") == 6 and bag.customer_id != current_user.get("customer_id"):
        raise HTTPException(status_code=403, detail="Bạn chỉ được chốt túi của chính mình")
    if current_user.get("role_id") not in [1, 6]:
        verify_warehouse_access(current_user)
        
    # Phải verify xong hoặc thủ kho chốt chấp nhận sai lệch mới cho đóng túi
    disc = crud_wh.get_pickup_bag_discrepancy(db, bag)
    if bag.status != "VERIFIED" and (disc["errors"] or disc["missing_quantity"] > 0):
        # Có cảnh báo chênh lệch nhưng thủ kho vẫn được chốt đóng túi thủ công
        bag.status = "CLOSED"
    else:
        bag.status = "CLOSED"
        
    db.commit()
    return {"message": "Đã chốt hoàn tất túi lấy hàng thành công", "bag_code": bag_code, "status": bag.status}
