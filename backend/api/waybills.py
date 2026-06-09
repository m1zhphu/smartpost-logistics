from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List, Optional
import pandas as pd
from io import BytesIO
from fastapi.responses import StreamingResponse
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side

from core.database import get_db
from core.security import get_current_user
from core.pricing import calculate_shipping_fee, calculate_shipping_fee_detail, calculate_sla_status, get_waybill_current_holder, get_waybill_action_by
from core.realtime import realtime_manager
import schemas.waybills as schema_wb
import crud.waybills as crud_wb
from core.permissions import PermissionChecker
import models

router = APIRouter(prefix="/api/waybills", tags=["Waybill Management"])

@router.get("/recipient-history")
def get_recipient_history(phone: str, db: Session = Depends(get_db)):
    """API gợi ý tự động Họ tên và Địa chỉ nhận từ lịch sử kiện hàng gần nhất (autofill)"""
    if not phone or len(phone) < 8:
        raise HTTPException(status_code=400, detail="Số điện thoại không hợp lệ")
    
    # Truy vấn đơn hàng cũ gần nhất của số điện thoại này
    last_order = db.query(models.Waybills).filter(
        models.Waybills.receiver_phone == phone,
        models.Waybills.is_deleted == False
    ).order_by(models.Waybills.waybill_id.desc()).first()
    
    if not last_order:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch sử người nhận với số điện thoại này")
        
    return {
        "receiver_name": last_order.receiver_name,
        "receiver_address": last_order.receiver_address
    }

@router.post("/export")
def export_waybills_excel(
    filters: schema_wb.WaybillFilter,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Xuất danh sách vận đơn ra file Excel theo bộ lọc"""
    try:
        # 1. Lấy dữ liệu theo bộ lọc
        filters.page = 1
        filters.size = 10000 
        
        role_id = current_user.get("role_id")
        hub_id = current_user.get("primary_hub_id") if role_id != 1 else None
        items, _ = crud_wb.get_waybills_with_filters(db, filters, current_hub_id=hub_id)

        # 2. Chuyển đổi dữ liệu sang dạng bảng
        data = []
        for w in items:
            data.append({
                "Mã Vận Đơn": w.waybill_code,
                "Trạng Thái": w.status,
                "Người Nhận": w.receiver_name,
                "SĐT Nhận": w.receiver_phone,
                "Địa Chỉ": w.receiver_address,
                "COD (VNĐ)": float(w.cod_amount or 0),
                "Cước (VNĐ)": float(w.shipping_fee or 0),
                "Khối lượng (kg)": float(w.actual_weight or 0),
                "Dịch vụ": w.service_type,
                "Bưu cục Nguồn": w.origin_hub.hub_name if w.origin_hub else "",
                "Bưu cục Đích": w.dest_hub.hub_name if w.dest_hub else "",
            })

        if not data:
            raise HTTPException(status_code=404, detail="Không có dữ liệu để xuất")

        df = pd.DataFrame(data)
        output = BytesIO()
        
        # 3. Tạo file Excel
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Danh_Sach_Van_Don')
            worksheet = writer.sheets['Danh_Sach_Van_Don']

            header_fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
            header_font = Font(color="FFFFFF", bold=True)
            border = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))

            for cell in worksheet[1]:
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center")
                cell.border = border

            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if cell.value:
                            max_length = max(max_length, len(str(cell.value)))
                    except: pass
                worksheet.column_dimensions[column_letter].width = max_length + 2

        output.seek(0)
        filename = f"Danh_sach_Van_don_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Access-Control-Expose-Headers': 'Content-Disposition'
        }
        return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 1. THỐNG KÊ QUÉT TRONG NGÀY ---
@router.get("/stats/today-count")
def get_today_scan_count(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy số lượng đơn đã quét nhập kho trong ngày tại bưu cục hiện tại"""
    today = date.today()
    hub_id = current_user.get("primary_hub_id")
    
    # Giao việc cho CRUD
    count = crud_wb.count_today_in_hub_scans(db, hub_id, today)
    return {"total": count}

# --- 2. TÌM KIẾM VẬN ĐƠN ---
@router.get("/search")
def search_waybills_query(
    search_term: Optional[str] = None,
    service_type: Optional[str] = None,
    sla_status: Optional[str] = None,
    cod_status: Optional[str] = None,
    status: Optional[str] = None,
    origin_hub_id: Optional[int] = None,
    dest_hub_id: Optional[int] = None,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Tìm kiếm vận đơn với query parameters"""
    filters = schema_wb.WaybillFilter(
        search_term=search_term,
        service_type=service_type,
        sla_status=sla_status,
        cod_status=cod_status,
        status=status,
        origin_hub_id=origin_hub_id,
        dest_hub_id=dest_hub_id,
        page=page,
        size=size
    )
    return search_waybills(filters=filters, db=db, current_user=current_user)


@router.post("/search")
def search_waybills(
    filters: schema_wb.WaybillFilter,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Tìm kiếm vận đơn với bộ lọc nâng cao"""
    user_role = current_user.get("role_id")
    user_hub_id = current_user.get("primary_hub_id")

    # Nếu có search_term, mapping nó vào keyword
    if hasattr(filters, 'search_term') and filters.search_term and not filters.keyword:
        filters.keyword = filters.search_term

    hub_filter = None
    if user_role != 1:
        # --- CHỐT CHẶN NGHIỆP VỤ ---
        if filters.status == "CREATED":
            filters.origin_hub_id = user_hub_id
            filters.dest_hub_id = None
            hub_filter = None 
        elif filters.status == "ARRIVED":
            filters.dest_hub_id = user_hub_id
            filters.origin_hub_id = None
            hub_filter = None
        else:
            hub_filter = user_hub_id

    try:
        items, total = crud_wb.get_waybills_with_filters(db, filters, current_hub_id=hub_filter)

        result = []
        for w in items:
            # Sử dụng helper function để tính SLA status và remaining hours
            sla_status, remaining_hours = calculate_sla_status(w)
            current_holder = get_waybill_current_holder(w)
            action_by = get_waybill_action_by(db, w)

            result.append({
                "waybill_id": w.waybill_id,
                "waybill_code": w.waybill_code,
                "status": w.status,
                "receiver_name": w.receiver_name,
                "receiver_phone": w.receiver_phone,
                "receiver_address": w.receiver_address,
                "cod_amount": float(w.cod_amount or 0),
                "shipping_fee": float(w.shipping_fee or 0),
                "actual_weight": float(w.actual_weight or 0),
                "service_type": w.service_type,
                "product_name": w.product_name,
                "note": w.note,
                "customer_id": w.customer_id,
                "origin_hub_id": w.origin_hub_id,
                "dest_hub_id": w.dest_hub_id,
                "origin_hub": {"hub_id": w.origin_hub.hub_id, "hub_name": w.origin_hub.hub_name} if w.origin_hub else None,
                "dest_hub": {"hub_id": w.dest_hub.hub_id, "hub_name": w.dest_hub.hub_name} if w.dest_hub else None,
                "holding_hub_id": w.holding_hub_id,
                "holding_shipper_id": w.holding_shipper_id,
                "holding_hub": {"hub_id": w.holding_hub.hub_id, "hub_name": w.holding_hub.hub_name} if w.holding_hub else None,
                "holding_shipper": {"user_id": w.holding_shipper.user_id, "full_name": w.holding_shipper.full_name} if w.holding_shipper else None,
                "sla_deadline": w.sla_deadline.isoformat() if w.sla_deadline else None,
                "sla_status": sla_status,
                "sla_remaining_hours": remaining_hours,
                "current_holder": current_holder,
                "action_by": action_by,
                "bill_image_url": w.bill_image_url,
                "pickup_image_url": w.pickup_image_url,
                "ocr_status": w.ocr_status,
                "verify_status": w.verify_status,
                "verify_error_msg": w.verify_error_msg
            })

        return {"items": result, "total": total, "page": filters.page, "size": filters.size}


    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Lỗi hệ thống khi tìm kiếm: {str(e)}"
        )


# --- 2.1. TIMELINE VẬN ĐƠN ---
@router.get("/{waybill_ref}/timeline", response_model=schema_wb.WaybillTimelineResponse)
def get_waybill_timeline(
    waybill_ref: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy lịch sử các sự kiện của vận đơn (Timeline)"""
    waybill = None
    if waybill_ref.isdigit():
        waybill = db.query(models.Waybills).filter(
            models.Waybills.waybill_id == int(waybill_ref),
            models.Waybills.is_deleted == False
        ).first()

    if not waybill:
        waybill = db.query(models.Waybills).filter(
            models.Waybills.waybill_code == waybill_ref,
            models.Waybills.is_deleted == False
        ).first()

    if not waybill:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")
    
    # Data isolation: Kiểm tra quyền truy cập
    user_role = current_user.get("role_id")
    if user_role != 1:  # Không phải super admin
        user_hub_id = current_user.get("primary_hub_id")
        if waybill.origin_hub_id != user_hub_id and waybill.dest_hub_id != user_hub_id:
            raise HTTPException(status_code=403, detail="Bạn không có quyền xem vận đơn này")
    
    # Lấy tracking logs sắp xếp theo thời gian
    tracking_logs = db.query(models.TrackingLogs).filter(
        models.TrackingLogs.waybill_id == waybill.waybill_id
    ).order_by(models.TrackingLogs.system_time.asc()).all()
    
    # Chuyển đổi thành timeline items
    timeline_items = []
    status_descriptions = {
        "CREATED": "Tạo đơn",
        "IN_HUB": "Nhập kho",
        "DELIVERING": "Phân công giao",
        "DELIVERED": "Giao hàng thành công",
        "DELIVERY_FAILED": "Giao hàng thất bại",
        "RETURNED": "Trả về",
        "CANCELLED": "Hủy đơn",
        "ARRIVED": "Đã đến bưu cục đích",
        "VERIFIED": "Xác thực thành công",
        "VERIFY_ERROR": "Lỗi xác thực",
        "PICKED_PENDING_VERIFY": "Chụp ảnh chờ xác thực",
    }
    
    for log in tracking_logs:
        # Xác định actor (người/đơn vị thực hiện)
        actor = "Hệ thống"
        if log.user_id:
            user = db.query(models.Users).filter(models.Users.user_id == log.user_id).first()
            if user:
                actor = user.full_name
        elif log.hub_id:
            hub = db.query(models.Hubs).filter(models.Hubs.hub_id == log.hub_id).first()
            if hub:
                actor = hub.hub_name
        
        # Xác định location
        location = "Hệ thống"
        if log.hub_id:
            hub = db.query(models.Hubs).filter(models.Hubs.hub_id == log.hub_id).first()
            if hub:
                location = hub.hub_name
        
        # Format time
        action_time = log.action_time or log.system_time
        time_str = action_time.strftime("%H:%M %d/%m") if action_time else ""
        
        # Get action description
        action = status_descriptions.get(log.status_id, log.status_id)
        
        timeline_item = schema_wb.WaybillTimelineItem(
            time=time_str,
            action=action,
            actor=actor,
            location=location,
            note=log.note
        )
        timeline_items.append(timeline_item)
    
    return schema_wb.WaybillTimelineResponse(
        waybill_code=waybill.waybill_code,
        status=waybill.status,
        created_at=waybill.created_at if hasattr(waybill, 'created_at') else datetime.utcnow(),
        timeline=timeline_items
    )


# --- 3. TẠO MỚI VẬN ĐƠN ---
@router.post("", response_model=dict)
async def create_waybill(
    data: schema_wb.WaybillCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Tạo vận đơn mới và ghi log khởi tạo"""
    if data.shipping_fee <= 0:
        raise HTTPException(
            status_code=400, 
            detail="Tuyến đường này chưa được cấu hình giá cước (Cước = 0đ). Không thể tạo vận đơn."
        )

    origin_id = current_user.get("primary_hub_id") if current_user.get("role_id") != 1 else (data.origin_hub_id or current_user.get("primary_hub_id"))
    dest_id = data.dest_hub_id or origin_id

    try:
        save_data = data.model_dump()
        save_data["origin_hub_id"] = origin_id
        save_data["dest_hub_id"] = dest_id

        from crud.accounting import create_ledger_entry
        
        new_waybill = crud_wb.create_waybill_record(db, save_data, fee=data.shipping_fee)
        crud_wb.create_initial_log(db, new_waybill.waybill_id, origin_id, current_user['user_id'])

        if (data.shipping_fee or 0) > 0 and data.payment_method == "SENDER_PAY":
            create_ledger_entry(
                db, new_waybill.waybill_id, new_waybill.customer_id, 
                "DEBIT", float(data.shipping_fee), "FEE"
            )

        db.commit()
        return {"waybill_code": new_waybill.waybill_code, "status": new_waybill.status}
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# --- 4. CẬP NHẬT CÂN NẶNG THỰC TẾ ---
def _require_customer_account(current_user: dict):
    if current_user.get("role_id") != 6 or not current_user.get("customer_id"):
        raise HTTPException(status_code=403, detail="Chi tai khoan khach hang moi duoc tao pickup tu trang thanh vien")


def _require_pickup_operator(current_user: dict):
    if current_user.get("role_id") not in [1, 2, 3, 7]:
        raise HTTPException(status_code=403, detail="Khong co quyen tao pickup thay khach hang")


def _can_operate_hub(current_user: dict, hub_id: int | None) -> bool:
    if current_user.get("role_id") == 1:
        return True
    return bool(hub_id and current_user.get("primary_hub_id") == hub_id)


def _normalize_location_name(value: str | None) -> str:
    if not value:
        return ""
    normalized = value.strip().lower()
    for prefix in ("thành phố ", "tỉnh ", "tp. ", "tp "):
        normalized = normalized.replace(prefix, "")
    return normalized


def _find_hub_for_province(db: Session, province_id: int | None, province_name: str | None = None):
    if province_id:
        hub = db.query(models.Hubs).filter(
            models.Hubs.province_id == province_id,
            models.Hubs.status == True,
        ).first()
        if hub:
            return hub

    normalized_name = _normalize_location_name(province_name)
    if not normalized_name:
        return None

    hubs = db.query(models.Hubs).filter(models.Hubs.status == True).all()
    for hub in hubs:
        hub_text = _normalize_location_name(f"{hub.hub_name or ''} {hub.address_detail or ''}")
        if normalized_name in hub_text or hub_text in normalized_name:
            return hub
    return None


def _build_pickup_create_response(booking: models.BookingRequests, waybill: models.Waybills):
    return {
        "waybill_id": waybill.waybill_id,
        "waybill_code": waybill.waybill_code,
        "bill_code": waybill.waybill_code,
        "request_id": booking.request_id,
        "request_code": booking.request_code,
        "status": waybill.status,
        "pickup_status": booking.status,
        "office_status": "CHUA_XAC_NHAN_VAN_PHONG" if not booking.target_hub_id else booking.target_hub.hub_name,
        "price_status": waybill.price_status or "ESTIMATED",
        "shipping_fee": float(waybill.shipping_fee or 0),
        "extra_services_fee": float(waybill.extra_services_fee or 0),
        "vat_amount": float(waybill.vat_amount or 0),
        "total_amount_to_collect": float(waybill.total_amount_to_collect or 0),
        "estimated_shipping_fee": float(waybill.estimated_shipping_fee or waybill.shipping_fee or 0),
        "estimated_fuel_surcharge": max(0.0, float(waybill.estimated_total_amount or 0) - float(waybill.estimated_shipping_fee or 0) - float(waybill.estimated_extra_services_fee or 0) - float(waybill.estimated_vat_amount or 0)),
        "estimated_extra_services_fee": float(waybill.estimated_extra_services_fee or 0),
        "estimated_packing_fee": 0,
        "estimated_vat_amount": float(waybill.estimated_vat_amount or waybill.vat_amount or 0),
        "estimated_total_amount": float(waybill.estimated_total_amount or 0),
    }


def _calculate_pickup_estimated_price(db: Session, customer: models.Customers, data, origin_hub, dest_hub):
    actual_weight = sum(float(item.weight) * int(item.quantity or 1) for item in data.items)
    converted_weight = max(
        [
            ((float(item.length) * float(item.width) * float(item.height)) / 5000) * int(item.quantity or 1)
            for item in data.items
            if item.length and item.width and item.height
        ] or [0]
    )
    charge_weight = max(actual_weight, converted_weight)
    extra_service_codes = [service.service_code for service in data.extra_services or []]
    declared_value = sum(float(item.declared_value or 0) * int(item.quantity or 1) for item in data.items)
    quantity = sum(int(item.quantity or 1) for item in data.items)
    fee_detail = calculate_shipping_fee_detail(
        db,
        origin_hub_id=origin_hub.hub_id,
        dest_hub_id=dest_hub.hub_id,
        weight=charge_weight,
        service_type=data.service_type or "STANDARD",
        customer_id=customer.customer_id,
        extra_service_codes=extra_service_codes,
        cod_amount=float(data.cod_amount or 0),
        declared_value=declared_value,
        quantity=quantity,
        packing_type=getattr(data, "packing_type", None),
        dest_district_id=data.receiver.district_id,
        dest_ward_id=data.receiver.ward_id,
    )
    extra_services_fee = float(fee_detail["extra_services_fee"] or 0) + float(fee_detail["fuel_surcharge"] or 0) + float(fee_detail["packing_fee"] or 0) + float(fee_detail["remote_fee"] or 0)
    return float(fee_detail["main_fee"] or 0), extra_services_fee, float(fee_detail["vat_amount"] or 0)


@router.post("/customer/pickups", response_model=schema_wb.CustomerPickupCreateResponse)
def create_customer_pickup_waybill(
    data: schema_wb.CustomerPickupCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Khach hang tu tao pickup/van don tren trang thanh vien."""
    _require_customer_account(current_user)

    customer = db.query(models.Customers).filter(
        models.Customers.customer_id == current_user.get("customer_id"),
        models.Customers.status == "ACTIVE",
    ).first()
    if not customer:
        raise HTTPException(status_code=403, detail="Ho so khach hang khong con hoat dong")

    sender_province_id = data.sender.province_id or customer.province_id
    origin_hub = _find_hub_for_province(
        db,
        sender_province_id,
        data.sender.province_name or customer.province_name,
    )
    if not origin_hub:
        origin_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == current_user.get("primary_hub_id")).first()
    if not origin_hub:
        raise HTTPException(status_code=400, detail="Khong xac dinh duoc buu cuc lay hang")

    dest_hub = _find_hub_for_province(db, data.receiver.province_id, data.receiver.province_name)
    if not dest_hub:
        raise HTTPException(status_code=400, detail="Khong xac dinh duoc buu cuc phat hang theo tinh/thanh nguoi nhan")

    shipping_fee, extra_services_fee, vat_amount = _calculate_pickup_estimated_price(db, customer, data, origin_hub, dest_hub)

    try:
        booking, waybill = crud_wb.create_customer_pickup_waybill(
            db,
            customer=customer,
            data=data,
            origin_hub_id=origin_hub.hub_id,
            dest_hub_id=dest_hub.hub_id,
            creator_id=current_user["user_id"],
            shipping_fee=shipping_fee,
            extra_services_fee=extra_services_fee,
            vat_amount=vat_amount,
        )
        db.commit()
        db.refresh(booking)
        db.refresh(waybill)
        realtime_manager.publish(["admin", f"customer:{customer.customer_id}"], "pickup.created", {
            "request_id": booking.request_id,
            "request_code": booking.request_code,
            "waybill_code": waybill.waybill_code,
            "customer_id": customer.customer_id,
            "pickup_status": booking.status,
        })
        return _build_pickup_create_response(booking, waybill)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/pickups", response_model=schema_wb.CustomerPickupCreateResponse)
def create_admin_pickup_waybill(
    data: schema_wb.AdminPickupCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Nhan vien/QTV tao pickup thay khach hang khi khach goi tong dai."""
    _require_pickup_operator(current_user)

    customer = db.query(models.Customers).filter(
        models.Customers.customer_id == data.customer_id,
        models.Customers.status == "ACTIVE",
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Khong tim thay khach hang dang hoat dong")

    target_hub = None
    if data.target_hub_id:
        target_hub = db.query(models.Hubs).filter(
            models.Hubs.hub_id == data.target_hub_id,
            models.Hubs.status == True,
        ).first()
        if not target_hub:
            raise HTTPException(status_code=404, detail="Khong tim thay van phong nhan hop le")
        if not _can_operate_hub(current_user, data.target_hub_id):
            raise HTTPException(status_code=403, detail="Khong co quyen tao pickup cho van phong nay")

    sender_province_id = data.sender.province_id or customer.province_id
    origin_hub = target_hub or _find_hub_for_province(
        db,
        sender_province_id,
        data.sender.province_name or customer.province_name,
    )
    if not origin_hub:
        origin_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == current_user.get("primary_hub_id")).first()
    if not origin_hub:
        raise HTTPException(status_code=400, detail="Khong xac dinh duoc buu cuc lay hang")

    dest_hub = _find_hub_for_province(db, data.receiver.province_id, data.receiver.province_name)
    if not dest_hub:
        raise HTTPException(status_code=400, detail="Khong xac dinh duoc buu cuc phat hang theo tinh/thanh nguoi nhan")

    shipping_fee, extra_services_fee, vat_amount = _calculate_pickup_estimated_price(db, customer, data, origin_hub, dest_hub)
    initial_status = "RECEIVED" if target_hub else "PENDING_CONFIRMATION"
    source = (data.source or "HOTLINE").upper()
    if source not in ["HOTLINE", "CSKH", "ADMIN"]:
        source = "HOTLINE"

    try:
        booking, waybill = crud_wb.create_customer_pickup_waybill(
            db,
            customer=customer,
            data=data,
            origin_hub_id=origin_hub.hub_id,
            dest_hub_id=dest_hub.hub_id,
            creator_id=current_user["user_id"],
            shipping_fee=shipping_fee,
            extra_services_fee=extra_services_fee,
            vat_amount=vat_amount,
            source=source,
            target_hub_id=target_hub.hub_id if target_hub else None,
            initial_status=initial_status,
            log_action="Nhan vien tao pickup thay khach hang",
        )
        db.commit()
        db.refresh(booking)
        db.refresh(waybill)
        channels = ["admin", f"customer:{customer.customer_id}"]
        if target_hub:
            channels.append(f"hub:{target_hub.hub_id}")
        realtime_manager.publish(channels, "pickup.created_by_admin", {
            "request_id": booking.request_id,
            "request_code": booking.request_code,
            "waybill_code": waybill.waybill_code,
            "customer_id": customer.customer_id,
            "pickup_status": booking.status,
            "target_hub_id": target_hub.hub_id if target_hub else None,
        })
        return _build_pickup_create_response(booking, waybill)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/customer/pickups", response_model=List[schema_wb.CustomerPickupSummary])
def list_customer_pickups(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    _require_customer_account(current_user)
    return crud_wb.get_customer_pickup_waybills(db, current_user["customer_id"])


@router.get("/customer/pickups/{waybill_code}", response_model=schema_wb.CustomerPickupSummary)
def get_customer_pickup_detail(
    waybill_code: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    _require_customer_account(current_user)
    result = crud_wb.get_customer_pickup_waybill_by_code(db, current_user["customer_id"], waybill_code)
    if not result:
        raise HTTPException(status_code=404, detail="Khong tim thay don pickup")
    return result


@router.patch("/{code}/weight")
def update_waybill_weight(
    code: str,
    update_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API Cập nhật cân nặng khi nhân viên kho cân lại hàng"""
    waybill = crud_wb.get_waybill_by_code(db, code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")

    new_weight = update_data.get("actual_weight")
    if new_weight is None:
        raise HTTPException(status_code=400, detail="Thiếu thông tin khối lượng thực tế")

    # Nhờ CRUD thực hiện update
    updated_waybill = crud_wb.update_waybill_weight_record(db, waybill, float(new_weight))
    
    if not updated_waybill:
        db.rollback()
        raise HTTPException(status_code=409, detail="Dữ liệu đã bị thay đổi, vui lòng thử lại.")
    
    # Tính lại giá và nhờ CRUD ghi log
    try:
        new_fee = calculate_shipping_fee(
            db, updated_waybill.origin_hub_id, updated_waybill.dest_hub_id, 
            float(new_weight), updated_waybill.service_type or 'STANDARD',
            customer_id=updated_waybill.customer_id
        )
        crud_wb.update_waybill_fee_and_log(
            db, updated_waybill, new_fee, new_weight, 
            current_user.get("primary_hub_id"), current_user['user_id']
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi tính giá: {str(e)}")

    try:
        db.commit()
        return {"message": "Cập nhật khối lượng thành công", "actual_weight": updated_waybill.actual_weight}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Lỗi khi lưu cân nặng")

# --- 5. CẬP NHẬT GIAO THÀNH CÔNG ---
@router.patch("/{code}/delivered")
def update_status_delivered(
    code: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API Chốt đơn giao thành công để đẩy sang màn hình đối soát"""
    from crud.accounting import create_ledger_entry

    waybill = crud_wb.get_waybill_by_code(db, code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")

    # Gọi CRUD để update status
    updated_waybill = crud_wb.mark_waybill_as_delivered(db, waybill, current_user.get("primary_hub_id"), current_user['user_id'])
    
    if not updated_waybill:
        db.rollback()
        raise HTTPException(status_code=409, detail="Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại.")

    if (updated_waybill.cod_amount or 0) > 0:
        create_ledger_entry(
            db, updated_waybill.waybill_id, current_user['user_id'], 
            "DEBIT", float(updated_waybill.cod_amount), "COD"
        )

    try:
        db.commit()
        return {"message": "Đã cập nhật Giao hàng thành công", "waybill_code": code}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Lỗi hệ thống")

# --- 5.1 CẬP NHẬT ẢNH BILL & TRIGGER OCR ---
@router.patch("/{code}/bill-images")
def update_bill_images(
    code: str,
    data: schema_wb.WaybillBillImagesUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API lưu URL ảnh bill gốc/pickup và cập nhật trạng thái chuẩn bị verify"""
    updated_wb = crud_wb.update_waybill_images_and_trigger_ocr(
        db, 
        code, 
        data.bill_image_url, 
        data.pickup_image_url,
        current_user.get("user_id"),
        current_user.get("primary_hub_id")
    )
    
    if not updated_wb:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")
    
    db.commit()
    return {"message": "Cập nhật ảnh thành công, đã trigger OCR", "ocr_status": updated_wb.ocr_status}

# --- 5.2 XÁC THỰC BILL (VERIFY) ---
@router.patch("/{code}/verify")
def verify_bill(
    code: str,
    data: schema_wb.WaybillVerifyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API dùng cho bộ phận CSKH/Kho xác thực bill"""
    updated_wb = crud_wb.verify_waybill_status(
        db, 
        code, 
        data.action, 
        data.error_msg,
        current_user.get("user_id"),
        current_user.get("primary_hub_id")
    )
    
    if not updated_wb:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")

    db.commit()
    return {"message": f"Xác thực {data.action} thành công", "verify_status": updated_wb.verify_status}

# --- 5.5 CẬP NHẬT THÔNG TIN VẬN ĐƠN (SỬA ĐƠN) ---
@router.put("/{code}")
def edit_waybill_info(
    code: str,
    update_data: dict, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API cho phép chỉnh sửa thông tin người nhận và COD của vận đơn"""
    waybill = crud_wb.get_waybill_by_code(db, code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn để chỉnh sửa")

    if waybill.status in ["DELIVERED", "CANCELLED"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Không thể chỉnh sửa vận đơn đang ở trạng thái {waybill.status}"
        )

    try:
        updated_waybill = crud_wb.update_waybill(db, code, update_data)
        if not updated_waybill:
            raise HTTPException(status_code=500, detail="Lỗi khi cập nhật dữ liệu vào Database")

        crud_wb.log_waybill_edit(db, waybill.waybill_id, waybill.status, current_user)
        
        db.commit()
        return {"message": "Cập nhật vận đơn thành công", "waybill_code": code}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống: {str(e)}")
    
# --- 6. CÁC API PHỤ KHÁC ---
@router.get("/{code}/tracking")
def get_waybill_tracking(code: str, db: Session = Depends(get_db)):
    waybill = crud_wb.get_waybill_by_code(db, code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")
    logs = crud_wb.get_tracking_logs(db, waybill.waybill_id)
    return {
        "waybill_id": waybill.waybill_id,
        "history": [{"status_id": l.status_id, "note": l.note, "time": l.system_time} for l in logs],
    }

@router.delete("/{code}")
def delete_waybill(code: str, db: Session = Depends(get_db)):
    crud_wb.soft_delete_waybill(db, code)
    return {"message": "Đã hủy đơn thành công"}

# --- 7. API ĐIỀU CHUYỂN & SLA CONFIGURATION (MỚI BỔ SUNG) ---

def send_expo_push_notification(push_token: str, title: str, body: str, data: dict = None):
    """Gửi thông báo đẩy thời gian thực qua máy chủ Expo sử dụng urllib chuẩn"""
    import urllib.request
    import json
    url = "https://exp.host/--/api/v2/push/send"
    payload = {
        "to": push_token,
        "title": title,
        "body": body,
        "sound": "default"
    }
    if data:
        payload["data"] = data
        
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"Lỗi khi gửi Expo Push Notification: {str(e)}")
        return None

@router.post("/{code}/transfer")
def transfer_waybill(
    code: str,
    target_type: str,
    target_id: int,
    reason: str,
    note: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API Điều chuyển quyền giữ kiện hàng (đến kho hoặc bưu tá khác)"""
    try:
        updated_wb = crud_wb.transfer_waybill_crud(
            db=db,
            code=code,
            target_type=target_type,
            target_id=target_id,
            reason=reason,
            note=note,
            user_id=current_user.get("user_id"),
            hub_id=current_user.get("primary_hub_id")
        )
        if not updated_wb:
            raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn hoặc loại đích đến không hợp lệ")
        
        db.commit()

        # --- BẮN THÔNG BÁO ĐẨY EXPO KHI GÁN CHO BƯU TÁ (SHIPPER) ---
        if target_type.strip().upper() == "SHIPPER":
            try:
                shipper = db.query(models.Users).filter(models.Users.user_id == target_id).first()
                if shipper and shipper.push_token:
                    title = "📦 Bạn có vận đơn mới được gán!"
                    body = f"Đơn hàng {code} đã được điều chuyển sang cho bạn. Lý do: {reason}"
                    payload_data = {"waybill_code": code, "action": "TRANSFER"}
                    send_expo_push_notification(shipper.push_token, title, body, payload_data)
            except Exception as push_err:
                print(f"Lỗi khi gửi thông báo cho bưu tá: {str(push_err)}")
        
        return {"message": "Điều chuyển vận đơn thành công", "waybill_code": code}
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống: {str(e)}")

@router.get("/sla/dashboard")
def get_sla_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API thống kê số lượng SLA realtime phục vụ widget dashboard"""
    try:
        from core.state_machine import WaybillStatus
        # Lấy tất cả đơn chưa xóa
        all_w = db.query(models.Waybills).filter(models.Waybills.is_deleted == False).all()
        
        total = len(all_w)
        on_time = 0
        warning = 0
        overdue = 0
        
        now = datetime.utcnow()
        for w in all_w:
            if w.sla_deadline:
                if w.status in [WaybillStatus.DELIVERED, WaybillStatus.SETTLED]:
                    on_time += 1
                elif w.sla_deadline < now:
                    overdue += 1
                elif (w.sla_deadline - now).total_seconds() <= 14400: # 4 hours
                    warning += 1
                else:
                    on_time += 1
            else:
                on_time += 1
                
        return {
            "total": total,
            "on_time": on_time,
            "warning": warning,
            "overdue": overdue
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi thống kê SLA: {str(e)}")

@router.post("/import-excel")
async def import_waybills_excel(
    file: UploadFile = File(...),
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Import danh sách vận đơn từ file Excel"""
    try:
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        
        # Chuẩn hóa khoảng trắng các ô kiểu chuỗi
        df = df.applymap(lambda s: s.strip() if isinstance(s, str) else s)
        
        # Ánh xạ cột tự động dựa trên từ khóa gợi ý
        columns_mapping = {}
        for col in df.columns:
            col_lower = str(col).lower().strip()
            if any(k in col_lower for k in ["tên người nhận", "họ tên", "tên nhận", "receiver name", "tên", "nguoi nhan"]):
                columns_mapping["receiver_name"] = col
            elif any(k in col_lower for k in ["sđt", "số điện thoại", "phone", "sdt", "dien thoai"]):
                columns_mapping["receiver_phone"] = col
            elif any(k in col_lower for k in ["địa chỉ", "dia chi", "address", "địa chỉ nhận"]):
                columns_mapping["receiver_address"] = col
            elif any(k in col_lower for k in ["khối lượng", "trọng lượng", "cân nặng", "weight", "khoi luong"]):
                columns_mapping["actual_weight"] = col
            elif any(k in col_lower for k in ["cod", "thu hộ", "thu ho"]):
                columns_mapping["cod_amount"] = col
            elif any(k in col_lower for k in ["dịch vụ", "dich vu", "service"]):
                columns_mapping["service_type"] = col
            elif any(k in col_lower for k in ["sản phẩm", "san pham", "tên hàng", "product"]):
                columns_mapping["product_name"] = col
            elif any(k in col_lower for k in ["ghi chú", "ghi chu", "note"]):
                columns_mapping["note"] = col
            elif any(k in col_lower for k in ["dài", "dai", "length"]):
                columns_mapping["length"] = col
            elif any(k in col_lower for k in ["rộng", "rong", "width"]):
                columns_mapping["width"] = col
            elif any(k in col_lower for k in ["cao", "height"]):
                columns_mapping["height"] = col
            elif any(k in col_lower for k in ["khách hàng", "khach hang", "customer", "mã kh", "ma kh"]):
                columns_mapping["customer_code"] = col
            elif any(k in col_lower for k in ["bưu cục nhận", "buu cuc nhan", "dest hub", "mã kho nhận", "ma kho nhan", "kho nhan"]):
                columns_mapping["dest_hub_code"] = col
                
        # Validate cột bắt buộc
        required_cols = ["receiver_name", "receiver_phone", "receiver_address", "actual_weight"]
        missing_cols = [c for c in required_cols if c not in columns_mapping]
        if missing_cols:
            raise HTTPException(
                status_code=400, 
                detail=f"Thiếu các cột bắt buộc trong Excel: {', '.join(missing_cols)}. Vui lòng kiểm tra lại tiêu đề cột."
            )
            
        success_count = 0
        error_rows = []
        created_codes = []
        
        origin_id = current_user.get("primary_hub_id")
        if not origin_id:
            first_hub = db.query(models.Hubs).first()
            origin_id = first_hub.hub_id if first_hub else 1
            
        # Default customer if none selected and none in excel
        if not customer_id:
            default_customer = db.query(models.Customers).first()
            if default_customer:
                customer_id = default_customer.customer_id
                
        for index, row in df.iterrows():
            row_num = index + 2
            try:
                # 1. Trích xuất thông tin
                rec_name = str(row[columns_mapping["receiver_name"]])
                rec_phone = str(row[columns_mapping["receiver_phone"]])
                rec_address = str(row[columns_mapping["receiver_address"]])
                
                # Phone cleanup: convert float format like 987654321.0 to clean string
                if rec_phone.endswith('.0'):
                    rec_phone = rec_phone[:-2]
                rec_phone = rec_phone.strip()
                if not rec_phone.startswith('0') and len(rec_phone) == 9:
                    rec_phone = '0' + rec_phone
                
                weight_val = row[columns_mapping["actual_weight"]]
                try:
                    weight = float(weight_val)
                except:
                    weight = 0.5
                    
                cod_val = row.get(columns_mapping.get("cod_amount"), 0)
                try:
                    cod_amount = float(cod_val) if not pd.isna(cod_val) else 0.0
                except:
                    cod_amount = 0.0
                    
                srv_type = str(row.get(columns_mapping.get("service_type"), "STANDARD")).upper().strip()
                if "TIẾT KIỆM" in srv_type or "TIET KIEM" in srv_type or "TK" in srv_type:
                    srv_type = "TK"
                elif "CPN" in srv_type or "NHANH" in srv_type:
                    srv_type = "CPN"
                elif "HỎA TỐC" in srv_type or "HOA TOC" in srv_type or "HT" in srv_type:
                    srv_type = "HT"
                elif "TRƯỚC 9H" in srv_type or "PT9H" in srv_type:
                    srv_type = "PT9H"
                elif "QUỐC TẾ" in srv_type or "QUOC TE" in srv_type or "QT" in srv_type:
                    srv_type = "QT"
                else:
                    srv_type = "CPN"
                    
                prod_name = str(row.get(columns_mapping.get("product_name"), "Hàng hóa"))
                if pd.isna(row.get(columns_mapping.get("product_name"))):
                    prod_name = "Hàng hóa"
                    
                note_val = str(row.get(columns_mapping.get("note"), ""))
                if pd.isna(row.get(columns_mapping.get("note"))):
                    note_val = ""
                
                length_val = row.get(columns_mapping.get("length"), 0)
                width_val = row.get(columns_mapping.get("width"), 0)
                height_val = row.get(columns_mapping.get("height"), 0)
                
                try:
                    length = float(length_val) if not pd.isna(length_val) else 0
                    width = float(width_val) if not pd.isna(width_val) else 0
                    height = float(height_val) if not pd.isna(height_val) else 0
                except:
                    length, width, height = 0, 0, 0
                
                # Check custom customer code
                row_customer_id = customer_id
                if "customer_code" in columns_mapping:
                    cust_code = str(row[columns_mapping["customer_code"]])
                    if cust_code and not pd.isna(row[columns_mapping["customer_code"]]):
                        cust = db.query(models.Customers).filter(models.Customers.customer_code == cust_code).first()
                        if cust:
                            row_customer_id = cust.customer_id
                            
                if not row_customer_id:
                    raise Exception("Không xác định được ID Khách hàng tương ứng cho dòng này.")
                    
                # Look up dest hub
                dest_id = origin_id
                if "dest_hub_code" in columns_mapping:
                    dest_code = str(row[columns_mapping["dest_hub_code"]])
                    if dest_code and not pd.isna(row[columns_mapping["dest_hub_code"]]):
                        hub = db.query(models.Hubs).filter(models.Hubs.hub_code == dest_code).first()
                        if not hub:
                            hub = db.query(models.Hubs).filter(models.Hubs.hub_name.ilike(f"%{dest_code}%")).first()
                        if hub:
                            dest_id = hub.hub_id
                            
                # 2. Tính cước
                fee = calculate_shipping_fee(db, origin_id, dest_id, weight, srv_type, customer_id=row_customer_id)
                
                # 3. Tạo record payload
                save_data = {
                    "customer_id": row_customer_id,
                    "service_type": srv_type,
                    "sender_name": "",
                    "sender_phone": "",
                    "sender_address": "",
                    "receiver_name": rec_name,
                    "receiver_phone": rec_phone,
                    "receiver_address": rec_address,
                    "actual_weight": weight,
                    "length": length,
                    "width": width,
                    "height": height,
                    "product_name": prod_name,
                    "payment_method": "SENDER_PAY",
                    "cod_amount": cod_amount,
                    "note": note_val,
                    "origin_hub_id": origin_id,
                    "dest_hub_id": dest_id,
                    "extra_services": [],
                    "shipping_fee": fee
                }
                
                # Fill sender info from Customer profile
                cust_details = db.query(models.Customers).filter(models.Customers.customer_id == row_customer_id).first()
                if cust_details:
                    save_data["sender_name"] = cust_details.company_name or cust_details.name or ""
                    save_data["sender_phone"] = cust_details.phone or ""
                    save_data["sender_address"] = cust_details.address or ""
                
                new_waybill = crud_wb.create_waybill_record(db, save_data, fee=fee)
                crud_wb.create_initial_log(db, new_waybill.waybill_id, origin_id, current_user['user_id'])
                
                from crud.accounting import create_ledger_entry
                if fee > 0:
                    create_ledger_entry(
                        db, new_waybill.waybill_id, row_customer_id, 
                        "DEBIT", float(fee), "FEE"
                    )
                    
                created_codes.append(new_waybill.waybill_code)
                success_count += 1
            except Exception as row_err:
                error_rows.append({"row": row_num, "error": str(row_err)})
                
        if success_count > 0:
            db.commit()
            
        return {
            "status": "success",
            "imported_count": success_count,
            "failed_count": len(error_rows),
            "errors": error_rows,
            "created_codes": created_codes
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi import Excel: {str(e)}")
