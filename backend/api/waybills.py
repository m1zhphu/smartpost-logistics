from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from datetime import date, datetime
from typing import List, Optional
import pandas as pd
import logging
from io import BytesIO
from fastapi.responses import StreamingResponse
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from sqlalchemy import and_, or_
from decimal import Decimal
import json

from core.database import get_db
from core.security import get_current_user
from core.pricing import calculate_shipping_fee, calculate_shipping_fee_detail, calculate_sla_status, get_waybill_current_holder, get_waybill_action_by, normalize_service_type
from core.realtime import realtime_manager
from core.product_types import get_product_type_catalog, get_product_type_definition, normalize_product_type
import schemas.waybills as schema_wb
import crud.waybills as crud_wb
import crud.delivery as crud_delivery
import models

router = APIRouter(prefix="/api/waybills", tags=["Waybill Management"])
logger = logging.getLogger(__name__)


def _read_image_urls(stored_urls: str | None, primary_url: str | None = None) -> list[str]:
    urls = []
    if stored_urls:
        try:
            parsed = json.loads(stored_urls)
            if isinstance(parsed, list):
                urls.extend(url for url in parsed if url)
        except Exception:
            urls.extend(url.strip() for url in stored_urls.split(",") if url.strip())
    if primary_url and primary_url not in urls:
        urls.insert(0, primary_url)
    return urls[:5]


def _require_ocr_admin_role(current_user: dict):
    if current_user.get("role_id") not in [1, 2, 3, 7]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xử lý vận đơn OCR")


@router.get("/product-types")
def list_product_types():
    """Danh mục loại hàng chuẩn dùng chung cho các màn hình tạo vận đơn."""
    return {"items": get_product_type_catalog()}

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
        hub_id = current_user.get("primary_hub_id") if (role_id != 1 and role_id != 7) else None
        cskh_id = current_user.get("user_id") if role_id == 7 else None
        items, _ = crud_wb.get_waybills_with_filters(db, filters, current_hub_id=hub_id, cskh_id=cskh_id)

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
    cskh_filter_id = None
    
    if user_role == 7:
        cskh_filter_id = current_user.get("user_id")
    elif user_role != 1:
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
        items, total = crud_wb.get_waybills_with_filters(db, filters, current_hub_id=hub_filter, cskh_id=cskh_filter_id)

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
                "customer_code": w.customer.customer_code if w.customer else None,
                "customer_name": w.customer.company_name or w.customer.transaction_name or w.customer.customer_code if w.customer else None,
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
                "pickup_image_urls": _read_image_urls(w.pickup_image_urls, w.pickup_image_url),
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
@router.get("/ocr-reviewed")
def list_ocr_reviewed_waybills(
    q: Optional[str] = None,
    ocr_status: Optional[str] = None,
    customer_id: Optional[int] = None,
    hub_id: Optional[int] = None,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_ocr_admin_role(current_user)
    statuses = [ocr_status] if ocr_status else ["REVIEW", "INCOMPLETE"]
    page = max(1, page)
    size = min(max(1, size), 100)

    ocr_filter = models.Waybills.ocr_status.in_(statuses)
    if not ocr_status:
        # Tuong thich cac don da OCR bang endpoint cu: status da PICKED_UP
        # nhung ocr_status van bi de PENDING.
        ocr_filter = or_(
            ocr_filter,
            and_(
                models.Waybills.status.in_(["PICKED_UP", "PICKED_PENDING_VERIFY"]),
                or_(
                    models.Waybills.ocr_status.is_(None),
                    models.Waybills.ocr_status == "PENDING",
                ),
                or_(
                    models.Waybills.verify_status.is_(None),
                    models.Waybills.verify_status != "VERIFIED",
                ),
            ),
        )

    query = (
        db.query(models.Waybills)
        .outerjoin(models.Customers, models.Customers.customer_id == models.Waybills.customer_id)
        .filter(
            models.Waybills.is_deleted == False,
            ocr_filter,
        )
    )
    query = _apply_hub_scope_for_ocr(query, current_user, hub_id)

    if customer_id:
        query = query.filter(models.Waybills.customer_id == customer_id)
    if q:
        keyword = f"%{q.strip()}%"
        query = query.filter(or_(
            models.Waybills.waybill_code.ilike(keyword),
            models.Waybills.receiver_name.ilike(keyword),
            models.Waybills.receiver_phone.ilike(keyword),
            models.Waybills.receiver_address.ilike(keyword),
            models.Customers.customer_code.ilike(keyword),
            models.Customers.company_name.ilike(keyword),
            models.Customers.transaction_name.ilike(keyword),
        ))

    try:
        total = query.count()
        rows = (
            query
            .order_by(models.Waybills.waybill_id.desc())
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )
        logger.info(
            "OCR queue loaded user_id=%s role_id=%s hub_id=%s total=%s page=%s",
            current_user.get("user_id"),
            current_user.get("role_id"),
            current_user.get("primary_hub_id"),
            total,
            page,
        )
        return {"items": [_waybill_ocr_payload(row) for row in rows], "total": total, "page": page, "size": size}
    except Exception:
        logger.exception(
            "Không thể tải danh sách OCR user_id=%s hub_id=%s",
            current_user.get("user_id"),
            current_user.get("primary_hub_id"),
        )
        raise HTTPException(status_code=500, detail="Không thể tải danh sách vận đơn OCR")


@router.get("/ocr-reviewed/{waybill_code}")
def get_ocr_reviewed_waybill(
    waybill_code: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_ocr_admin_role(current_user)
    waybill = db.query(models.Waybills).filter(
        models.Waybills.waybill_code == waybill_code,
        models.Waybills.is_deleted == False,
    ).first()
    if not waybill:
        raise HTTPException(status_code=404, detail="Khong tim thay van don OCR")
    if not _can_access_waybill_ocr(current_user, waybill):
        raise HTTPException(status_code=403, detail="Khong co quyen xem van don OCR nay")
    return _waybill_ocr_payload(waybill)


@router.post("/{waybill_code}/finalize-from-ocr")
def finalize_waybill_from_ocr(
    waybill_code: str,
    data: schema_wb.OcrFinalizeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_ocr_admin_role(current_user)
    waybill = db.query(models.Waybills).filter(
        models.Waybills.waybill_code == waybill_code,
        models.Waybills.is_deleted == False,
    ).first()
    if not waybill:
        raise HTTPException(status_code=404, detail="Khong tim thay van don OCR")
    if not _can_access_waybill_ocr(current_user, waybill):
        raise HTTPException(status_code=403, detail="Khong co quyen hoan thien van don OCR nay")
    effective_ocr_status = _effective_ocr_status(waybill)
    if effective_ocr_status not in ["REVIEW", "INCOMPLETE"]:
        raise HTTPException(status_code=400, detail="Van don khong con nam trong hang cho OCR")

    try:
        payload = data.model_dump(exclude_unset=True)
        for field in [
            "customer_id", "origin_hub_id", "dest_hub_id",
            "sender_name", "sender_phone", "sender_address",
            "receiver_name", "receiver_phone", "receiver_address",
            "service_type", "product_name", "payment_method", "note",
        ]:
            if field in payload:
                setattr(waybill, field, payload[field])

        def decimal_value(value) -> Decimal:
            return Decimal(str(value or 0))

        weight = decimal_value(data.actual_weight)
        waybill.actual_weight = weight
        waybill.estimated_weight = weight
        waybill.final_weight = weight
        waybill.length = decimal_value(data.length)
        waybill.width = decimal_value(data.width)
        waybill.height = decimal_value(data.height)
        waybill.cod_amount = decimal_value(data.cod_amount)

        fee = decimal_value(data.shipping_fee)
        extra_fee = decimal_value(waybill.extra_services_fee)
        vat_amount = decimal_value(waybill.vat_amount)
        waybill.estimated_shipping_fee = fee
        waybill.final_shipping_fee = fee
        waybill.shipping_fee = fee
        waybill.total_amount_to_collect = fee + extra_fee + vat_amount + waybill.cod_amount

        item = waybill.waybill_items[0] if waybill.waybill_items else None
        if not item:
            item = models.WaybillItems(
                waybill_id=waybill.waybill_id,
                parcel_code=f"{waybill.waybill_code}-1",
                quantity=1,
            )
            db.add(item)
        item.product_name = data.product_name or waybill.product_name or item.product_name
        item.product_group = normalize_product_type(data.product_group or item.product_group or "PARCEL")
        item.actual_weight = weight
        item.length = decimal_value(data.length)
        item.width = decimal_value(data.width)
        item.height = decimal_value(data.height)
        item.declared_value = decimal_value(data.declared_value)

        waybill.status = "CREATED"
        waybill.ocr_status = "CONVERTED"
        waybill.verify_status = "VERIFIED"
        waybill.version = (waybill.version or 1) + 1
        db.add(models.TrackingLogs(
            waybill_id=waybill.waybill_id,
            status_id=waybill.status,
            hub_id=waybill.origin_hub_id or current_user.get("primary_hub_id"),
            user_id=current_user["user_id"],
            system_time=datetime.utcnow(),
            note="Admin hoan thien van don tu OCR",
        ))
        db.commit()
        db.refresh(waybill)
        return _waybill_ocr_payload(waybill)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        logger.exception("Khong the hoan thien van don OCR waybill_code=%s", waybill_code)
        raise HTTPException(status_code=500, detail="Khong the luu van don da OCR")


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
        is_owner = bool(
            current_user.get("customer_id")
            and waybill.customer_id == current_user.get("customer_id")
        )
        user_hub_id = current_user.get("primary_hub_id")
        is_hub_operator = bool(
            user_hub_id
            and user_hub_id in [waybill.origin_hub_id, waybill.dest_hub_id, waybill.holding_hub_id]
        )
        if not is_owner and not is_hub_operator:
            raise HTTPException(status_code=403, detail="Bạn không có quyền xem vận đơn này")
    
    # Lấy tracking logs sắp xếp theo thời gian
    tracking_logs = db.query(models.TrackingLogs).filter(
        models.TrackingLogs.waybill_id == waybill.waybill_id
    ).order_by(models.TrackingLogs.system_time.asc()).all()
    latest_delivery = db.query(models.DeliveryResults).filter(
        models.DeliveryResults.waybill_id == waybill.waybill_id,
        models.DeliveryResults.pod_image_url.isnot(None),
    ).order_by(models.DeliveryResults.delivery_id.desc()).first()
    
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
        timeline=timeline_items,
        bill_image_url=waybill.bill_image_url,
        pickup_image_url=waybill.pickup_image_url,
        pickup_image_urls=_read_image_urls(waybill.pickup_image_urls, waybill.pickup_image_url),
        pod_image_url=latest_delivery.pod_image_url if latest_delivery else None,
        pod_image_urls=_read_image_urls(
            latest_delivery.pod_image_urls if latest_delivery else None,
            latest_delivery.pod_image_url if latest_delivery else None,
        ),
    )


# --- 3. TẠO MỚI VẬN ĐƠN ---
@router.post("", response_model=dict)
async def create_waybill(
    data: schema_wb.WaybillCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Tạo vận đơn mới và ghi log khởi tạo"""
    # Bỏ qua kiểm tra cước đối với thư nội bộ (có thể cước = 0)
    if not data.is_internal and data.shipping_fee <= 0:
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
        
        # Log khởi tạo ban đầu (CREATED)
        crud_wb.create_initial_log(db, new_waybill.waybill_id, origin_id, current_user['user_id'])
        
        # Nếu là thư nội bộ -> Thêm tiếp log nhập kho (IN_HUB) để bốc xe đi luôn
        if data.is_internal:
            db.add(models.TrackingLogs(
                waybill_id=new_waybill.waybill_id,
                status_id="IN_HUB",
                hub_id=origin_id,
                user_id=current_user['user_id'],
                system_time=datetime.utcnow(),
                action_time=datetime.utcnow(),
                note="Nhập kho tự động (Thư nội bộ)"
            ))

        if not data.is_internal and (data.shipping_fee or 0) > 0 and data.payment_method == "SENDER_PAY":
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

@router.post("/ocr-pickup", response_model=dict)
async def ocr_pickup_waybill(
    data: schema_wb.WaybillCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    logger.info(
        "Bắt đầu xác nhận OCR pickup waybill_code=%s user_id=%s hub_id=%s receiver=%s weight=%s",
        data.waybill_code,
        current_user.get("user_id"),
        current_user.get("primary_hub_id"),
        data.receiver_name,
        data.actual_weight,
    )
    """
    API dành riêng cho Shipper dùng OCR:
    - Nếu mã vận đơn tồn tại: Cập nhật thông tin (trọng lượng, cước phí...) và chuyển trạng thái PICKED_UP.
    - Nếu mã vận đơn chưa có: Tạo mới và chuyển trạng thái PICKED_UP.
    """
    if data.shipping_fee <= 0:
        raise HTTPException(status_code=400, detail="Vui lòng nhập Phí vận chuyển (VNĐ) > 0")

    origin_id = current_user.get("primary_hub_id") if current_user.get("role_id") != 1 else (data.origin_hub_id or current_user.get("primary_hub_id"))
    dest_id = data.dest_hub_id or origin_id

    try:
        save_data = data.model_dump()
        save_data["origin_hub_id"] = origin_id
        save_data["dest_hub_id"] = dest_id

        waybill = crud_wb.upsert_waybill_from_ocr(db, save_data, data.shipping_fee, origin_id, current_user['user_id'])
        
        db.commit()
        db.refresh(waybill)
        result = _waybill_ocr_payload(waybill)
        logger.info(
            "Xác nhận OCR pickup thành công waybill_code=%s status=%s ocr_status=%s missing_fields=%s",
            waybill.waybill_code,
            waybill.status,
            result["ocr_status"],
            result["missing_fields"],
        )
        return result
    except Exception as e:
        db.rollback()
        logger.exception(
            "Xác nhận OCR pickup thất bại waybill_code=%s user_id=%s",
            data.waybill_code,
            current_user.get("user_id"),
        )
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


def _bulk_waybill_item(waybill: models.Waybills, sequence_no: int | None = None, customer_reference_code: str | None = None):
    return {
        "waybill_id": waybill.waybill_id,
        "waybill_code": waybill.waybill_code,
        "sequence_no": sequence_no,
        "customer_reference_code": customer_reference_code,
        "receiver_name": waybill.receiver_name,
        "receiver_phone": waybill.receiver_phone,
        "receiver_address": waybill.receiver_address,
        "status": waybill.status,
        "ocr_status": waybill.ocr_status,
        "verify_status": waybill.verify_status,
        "actual_weight": float(waybill.actual_weight or 0),
        "length": float(waybill.length or 0),
        "width": float(waybill.width or 0),
        "height": float(waybill.height or 0),
        "cod_amount": float(waybill.cod_amount or 0),
        "service_type": waybill.service_type,
        "product_name": waybill.product_name,
        "bill_image_url": waybill.bill_image_url,
    }


def _ocr_missing_fields(waybill: models.Waybills) -> list[str]:
    missing = []
    if not (waybill.receiver_name or "").strip():
        missing.append("receiver_name")
    if not (waybill.receiver_phone or "").strip():
        missing.append("receiver_phone")
    if not (waybill.receiver_address or "").strip():
        missing.append("receiver_address")
    if float(waybill.actual_weight or 0) <= 0:
        missing.append("actual_weight")
    return missing


def _effective_ocr_status(waybill: models.Waybills) -> str | None:
    """Normalize legacy OCR records that were picked up before OCR status was persisted."""
    if waybill.ocr_status in ["REVIEW", "INCOMPLETE"]:
        return waybill.ocr_status
    if (
        waybill.status in ["PICKED_UP", "PICKED_PENDING_VERIFY"]
        and waybill.ocr_status in [None, "PENDING"]
    ):
        return "REVIEW" if not _ocr_missing_fields(waybill) else "INCOMPLETE"
    return waybill.ocr_status


def _waybill_ocr_payload(waybill: models.Waybills) -> dict:
    request = waybill.request
    bag = None
    if waybill.bag_items:
        bag = waybill.bag_items[0].bag
    item = waybill.waybill_items[0] if waybill.waybill_items else None
    customer = waybill.customer
    missing_fields = _ocr_missing_fields(waybill)
    event_time = None
    if request:
        event_time = (
            request.pickup_assigned_at
            or request.confirmed_at
            or request.requested_pickup_time
            or request.dispatched_at
        )
    effective_ocr_status = _effective_ocr_status(waybill)
    return {
        "waybill_id": waybill.waybill_id,
        "waybill_code": waybill.waybill_code,
        "request_id": request.request_id if request else None,
        "request_code": request.request_code if request else None,
        "bag_id": bag.bag_id if bag else None,
        "bag_code": bag.bag_code if bag else None,
        "customer_id": waybill.customer_id,
        "customer_code": customer.customer_code if customer else None,
        "customer_name": (customer.company_name or customer.transaction_name or customer.customer_code) if customer else None,
        "sender_name": waybill.sender_name,
        "sender_phone": waybill.sender_phone,
        "sender_address": waybill.sender_address,
        "receiver_name": waybill.receiver_name,
        "receiver_phone": waybill.receiver_phone,
        "receiver_address": waybill.receiver_address,
        "receiver_province_id": waybill.receiver_province_id,
        "receiver_district_id": waybill.receiver_district_id,
        "receiver_ward_id": waybill.receiver_ward_id,
        "receiver_province_name": waybill.receiver_province_name,
        "receiver_district_name": waybill.receiver_district_name,
        "receiver_ward_name": waybill.receiver_ward_name,
        "origin_hub_id": waybill.origin_hub_id,
        "dest_hub_id": waybill.dest_hub_id,
        "holding_hub_id": waybill.holding_hub_id,
        "status": waybill.status,
        "ocr_status": effective_ocr_status,
        "verify_status": waybill.verify_status,
        "missing_fields": missing_fields,
        "is_complete_for_review": len(missing_fields) == 0,
        "can_finalize_from_ocr": effective_ocr_status in ["REVIEW", "INCOMPLETE"],
        "actual_weight": float(waybill.actual_weight or 0),
        "length": float(waybill.length or 0),
        "width": float(waybill.width or 0),
        "height": float(waybill.height or 0),
        "cod_amount": float(waybill.cod_amount or 0),
        "service_type": waybill.service_type,
        "payment_method": waybill.payment_method,
        "product_name": waybill.product_name or (item.product_name if item else None),
        "product_group": item.product_group if item else None,
        "declared_value": float(item.declared_value or 0) if item else 0,
        "bill_image_url": waybill.bill_image_url,
        "pickup_image_url": waybill.pickup_image_url,
        "pickup_image_urls": _read_image_urls(waybill.pickup_image_urls, waybill.pickup_image_url),
        "note": waybill.note,
        "updated_at": event_time,
        "created_at": event_time,
    }


def _can_access_waybill_ocr(current_user: dict, waybill: models.Waybills) -> bool:
    if current_user.get("role_id") == 1:
        return True
    hub_id = current_user.get("primary_hub_id")
    if not hub_id:
        return False
    return hub_id in [waybill.origin_hub_id, waybill.dest_hub_id, waybill.holding_hub_id]


def _apply_hub_scope_for_ocr(query, current_user: dict, hub_id: int | None = None):
    role_id = current_user.get("role_id")
    if role_id == 1:
        if hub_id:
            return query.filter(or_(
                models.Waybills.origin_hub_id == hub_id,
                models.Waybills.dest_hub_id == hub_id,
                models.Waybills.holding_hub_id == hub_id,
            ))
        return query

    user_hub_id = current_user.get("primary_hub_id")
    if not user_hub_id:
        raise HTTPException(status_code=403, detail="Tai khoan chua gan buu cuc")
    return query.filter(or_(
        models.Waybills.origin_hub_id == user_hub_id,
        models.Waybills.dest_hub_id == user_hub_id,
        models.Waybills.holding_hub_id == user_hub_id,
    ))


def _get_bag_waybills(db: Session, bag_id: int | None):
    if not bag_id:
        return []
    rows = (
        db.query(models.Waybills, models.BulkMailDraftItems.sequence_no, models.BulkMailDraftItems.customer_reference_code)
        .join(models.BagItems, models.BagItems.waybill_id == models.Waybills.waybill_id)
        .outerjoin(models.BulkMailDraftItems, models.BulkMailDraftItems.waybill_id == models.Waybills.waybill_id)
        .filter(models.BagItems.bag_id == bag_id, models.Waybills.is_deleted == False)
        .order_by(models.BulkMailDraftItems.sequence_no.asc().nullslast(), models.Waybills.waybill_id.asc())
        .all()
    )
    return [_bulk_waybill_item(waybill, sequence_no, customer_reference_code) for waybill, sequence_no, customer_reference_code in rows]


def _mobile_ocr_hub_id(current_user: dict, requested_hub_id: int | None = None) -> int:
    role_id = current_user.get("role_id")
    if role_id == 1 and requested_hub_id:
        return requested_hub_id
    hub_id = current_user.get("primary_hub_id")
    if not hub_id:
        raise HTTPException(status_code=403, detail="Tai khoan chua gan buu cuc de thao tac OCR")
    if requested_hub_id and requested_hub_id != hub_id and role_id != 1:
        raise HTTPException(status_code=403, detail="Khong co quyen thao tac OCR tai buu cuc nay")
    if role_id not in [1, 2, 3, 4, 7]:
        raise HTTPException(status_code=403, detail="Khong co quyen su dung API OCR mobile")
    return hub_id


def _customer_brief(customer: models.Customers | None):
    if not customer:
        return None
    return {
        "customer_id": customer.customer_id,
        "customer_code": customer.customer_code,
        "customer_name": customer.company_name or customer.transaction_name or customer.customer_code,
        "phone_number": customer.phone_number,
    }


def _bag_payload(db: Session, bag: models.Bags):
    request = bag.booking_request
    waybill_items = _get_bag_waybills(db, bag.bag_id)
    return {
        "bag_id": bag.bag_id,
        "bag_code": bag.bag_code,
        "request_id": request.request_id if request else None,
        "request_code": request.request_code if request else None,
        "customer_id": bag.customer_id,
        "customer_code": bag.customer.customer_code if bag.customer else None,
        "customer_name": bag.customer_name,
        "product_type": bag.product_type,
        "product_type_label": get_product_type_definition(bag.product_type or "DOCUMENT")["label"],
        "expected_quantity": bag.est_quantity or 0,
        "actual_quantity": bag.actual_quantity or 0,
        "waybill_count": len(waybill_items),
        "status": bag.status,
        "materialization_status": bag.materialization_status,
        "pickup_status": request.status if request else None,
        "assigned_shipper_id": request.assigned_shipper_id if request else None,
        "target_hub_id": request.target_hub_id if request else bag.dest_hub_id,
        "pickup_time": bag.pickup_time,
        "waybills": waybill_items,
    }


def _waybill_hub_scoped_query(db: Session, hub_id: int):
    return (
        db.query(models.Waybills)
        .outerjoin(models.BookingRequests, models.BookingRequests.request_id == models.Waybills.request_id)
        .filter(
            models.Waybills.is_deleted == False,
            (
                (models.BookingRequests.target_hub_id == hub_id)
                | (models.Waybills.origin_hub_id == hub_id)
                | (models.Waybills.holding_hub_id == hub_id)
            ),
        )
    )


def _create_pending_ocr_waybill_for_bag(
    db: Session,
    bag: models.Bags,
    sequence_no: int,
    user_id: int,
    note: str | None = None,
):
    request = bag.booking_request
    customer = bag.customer or (request.customer if request else None)
    if not request or not customer:
        raise HTTPException(status_code=400, detail="Tui thu chua lien ket yeu cau pickup hoac khach hang")

    label = get_product_type_definition(bag.product_type or request.product_type or "DOCUMENT")["label"]
    waybill = models.Waybills(
        waybill_code=crud_wb.generate_waybill_code(db),
        request_id=request.request_id,
        customer_id=customer.customer_id,
        receiver_name=None,
        receiver_phone=None,
        receiver_address=None,
        origin_hub_id=bag.dest_hub_id or request.target_hub_id,
        dest_hub_id=None,
        holding_hub_id=bag.dest_hub_id or request.target_hub_id,
        service_type="STANDARD",
        delivery_type="NORMAL",
        actual_weight=0,
        converted_weight=0,
        payment_method="SENDER_DEBT",
        cod_amount=0,
        shipping_fee=0,
        extra_services_fee=0,
        vat_amount=0,
        total_amount_to_collect=0,
        status="PENDING_OCR",
        product_name=f"{label} {sequence_no}",
        note=note,
        sender_name=customer.company_name or customer.transaction_name,
        sender_phone=request.sender_phone or customer.phone_number,
        sender_address=request.pickup_address or customer.address_detail or customer.street_address,
        sender_province_id=customer.province_id,
        sender_district_id=customer.district_id,
        sender_ward_id=customer.ward_id,
        sender_province_name=customer.province_name,
        sender_district_name=None,
        sender_ward_name=customer.ward_name,
        pickup_method=request.pickup_method,
        requested_pickup_time=request.requested_pickup_time,
        estimated_weight=0,
        estimated_shipping_fee=0,
        estimated_extra_services_fee=0,
        estimated_vat_amount=0,
        estimated_total_amount=0,
        final_shipping_fee=0,
        final_extra_services_fee=0,
        final_vat_amount=0,
        final_total_amount=0,
        ocr_status="PENDING",
        verify_status="PENDING",
        version=1,
    )
    db.add(waybill)
    db.flush()
    db.add(models.WaybillItems(
        parcel_code=f"{waybill.waybill_code}-1",
        waybill_id=waybill.waybill_id,
        product_group=bag.product_type or request.product_type or "DOCUMENT",
        product_name=waybill.product_name,
        description=note,
        declared_value=0,
        actual_weight=0,
        converted_weight=0,
        quantity=1,
    ))
    db.add(models.BagItems(bag_id=bag.bag_id, waybill_id=waybill.waybill_id))
    db.add(models.BulkMailDraftItems(
        request_id=request.request_id,
        bag_id=bag.bag_id,
        waybill_id=waybill.waybill_id,
        sequence_no=sequence_no,
        note=note,
        status="PENDING_OCR",
    ))
    db.add(models.TrackingLogs(
        waybill_id=waybill.waybill_id,
        status_id="PENDING_OCR",
        hub_id=bag.dest_hub_id or request.target_hub_id,
        user_id=user_id,
        system_time=datetime.utcnow(),
        note=note or "Tao van don phat sinh trong tui thu",
    ))
    return waybill


def _build_pickup_create_response(booking: models.BookingRequests, waybill: models.Waybills):
    product_type = normalize_product_type(booking.product_type)
    return {
        "waybill_id": waybill.waybill_id,
        "waybill_code": waybill.waybill_code,
        "bill_code": waybill.waybill_code,
        "request_id": booking.request_id,
        "request_code": booking.request_code,
        "status": waybill.status,
        "pickup_status": booking.status,
        "office_status": "CHUA_XAC_NHAN_VAN_PHONG" if not booking.target_hub_id else booking.target_hub.hub_name,
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
        "product_type": product_type,
        "product_type_label": get_product_type_definition(product_type)["label"],
        "customer_department_id": booking.customer_department_id,
        "customer_department_name": booking.customer_department.name if booking.customer_department else None,
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
        origin_province_id=data.sender.province_id,
        dest_province_id=data.receiver.province_id,
        weight=charge_weight,
        service_type=normalize_service_type(data.service_type),
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
    background_tasks: BackgroundTasks,
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
    if not dest_hub and any([data.receiver.name, data.receiver.phone, data.receiver.address, data.receiver.province_id]):
        raise HTTPException(status_code=400, detail="Khong xac dinh duoc buu cuc phat hang theo tinh/thanh nguoi nhan")
    if not dest_hub:
        dest_hub = origin_hub

    data.service_type = normalize_service_type(data.service_type)
    shipping_fee, extra_services_fee, vat_amount = _calculate_pickup_estimated_price(db, customer, data, origin_hub, dest_hub)

    try:
        booking, waybill, pickup_bag = crud_wb.create_customer_pickup_waybill(
            db,
            customer=customer,
            data=data,
            origin_hub_id=origin_hub.hub_id,
            dest_hub_id=dest_hub.hub_id,
            creator_id=current_user["user_id"],
            shipping_fee=shipping_fee,
            extra_services_fee=extra_services_fee,
            vat_amount=vat_amount,
            target_hub_id=origin_hub.hub_id,
        )
        db.commit()
        db.refresh(booking)
        db.refresh(waybill)
        realtime_manager.publish(["admin", f"customer:{customer.customer_id}", f"hub:{origin_hub.hub_id}"], "pickup.created", {
            "request_id": booking.request_id,
            "request_code": booking.request_code,
            "waybill_code": waybill.waybill_code,
            "bag_code": pickup_bag.bag_code if pickup_bag else None,
            "customer_id": customer.customer_id,
            "pickup_status": booking.status,
        })
        
        # Gửi push notification cho tất cả shipper thuộc hub này
        shippers = db.query(models.Users).filter(
            models.Users.primary_hub_id == origin_hub.hub_id,
            models.Users.role_id == 4,
            models.Users.push_token.isnot(None)
        ).all()
        for shipper in shippers:
            background_tasks.add_task(
                send_expo_push_notification,
                shipper.push_token,
                "Có đơn yêu cầu lấy hàng mới!",
                f"Mã đơn: {booking.request_code}",
                {"request_code": booking.request_code}
            )
        response = _build_pickup_create_response(booking, waybill)
        response["bag_code"] = pickup_bag.bag_code if pickup_bag else None
        return response
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/customer/bulk-mail-pickups", response_model=schema_wb.BulkMailPickupResponse)
def create_customer_bulk_mail_pickup(
    data: schema_wb.BulkMailPickupCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Tạo một yêu cầu và một túi cha cho nhiều thư/bưu phẩm chưa có đủ dữ liệu vận đơn."""
    _require_customer_account(current_user)
    customer = db.query(models.Customers).filter(
        models.Customers.customer_id == current_user.get("customer_id"),
        models.Customers.status == "ACTIVE",
    ).first()
    if not customer:
        raise HTTPException(status_code=403, detail="Hồ sơ khách hàng không còn hoạt động")

    target_hub = None
    if data.target_hub_id:
        target_hub = db.query(models.Hubs).filter(
            models.Hubs.hub_id == data.target_hub_id,
            models.Hubs.status == True,
        ).first()
    if not target_hub:
        target_hub = _find_hub_for_province(
            db,
            data.sender.province_id or customer.province_id,
            data.sender.province_name or customer.province_name,
        )
    if not target_hub:
        target_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == current_user.get("primary_hub_id")).first()
    if not target_hub:
        raise HTTPException(status_code=400, detail="Không xác định được bưu cục lấy hàng")

    try:
        request, bag, waybill = crud_wb.create_bulk_mail_pickup(
            db, customer, data, current_user["user_id"], target_hub.hub_id
        )
        db.commit()
        db.refresh(request)
        if bag:
            db.refresh(bag)
        if waybill:
            db.refresh(waybill)
        waybill_items = _get_bag_waybills(db, bag.bag_id) if bag else ([_bulk_waybill_item(waybill, 1)] if waybill else [])
        definition = get_product_type_definition(data.product_type)
        realtime_manager.publish(["admin", f"hub:{target_hub.hub_id}", f"customer:{customer.customer_id}"], "pickup.bulk_mail_created", {
            "request_code": request.request_code,
            "bag_code": bag.bag_code if bag else None,
            "waybill_code": waybill.waybill_code if waybill else None,
            "waybill_codes": [item["waybill_code"] for item in waybill_items],
            "customer_id": customer.customer_id,
            "estimated_quantity": data.estimated_quantity,
            "product_type": data.product_type,
        })
        
        # Gửi push notification cho các shipper thuộc hub này
        shippers = db.query(models.Users).filter(
            models.Users.primary_hub_id == target_hub.hub_id,
            models.Users.role_id == 4,
            models.Users.push_token.isnot(None)
        ).all()
        for shipper in shippers:
            background_tasks.add_task(
                send_expo_push_notification,
                shipper.push_token,
                "Có túi thư lấy hàng mới!",
                f"Mã yêu cầu: {request.request_code}",
                {"request_code": request.request_code}
            )

        return {
            "request_id": request.request_id,
            "request_code": request.request_code,
            "bag_id": bag.bag_id if bag else None,
            "bag_code": bag.bag_code if bag else None,
            "waybill_id": waybill.waybill_id if waybill else None,
            "waybill_code": waybill.waybill_code if waybill else None,
            "customer_id": customer.customer_id,
            "customer_code": customer.customer_code,
            "product_type": data.product_type,
            "product_type_label": definition["label"],
            "service_type": data.service_type,
            "estimated_quantity": data.estimated_quantity,
            "actual_quantity": bag.actual_quantity or 0 if bag else request.actual_quantity or 0,
            "pickup_status": request.status,
            "bag_status": bag.status if bag else None,
            "materialization_status": bag.materialization_status if bag else request.materialization_status,
            "created_at": bag.pickup_time if bag else data.pickup_time,
            "waybills": waybill_items,
            "customer_department_id": request.customer_department_id,
            "customer_department_name": request.customer_department.name if request.customer_department else None,
        }
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/customer/bulk-mail-pickups", response_model=List[schema_wb.BulkMailPickupResponse])
def list_customer_bulk_mail_pickups(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_customer_account(current_user)
    rows = (
        db.query(models.BookingRequests, models.Bags, models.Customers)
        .options(joinedload(models.BookingRequests.customer_department))
        .outerjoin(models.Bags, models.Bags.booking_request_id == models.BookingRequests.request_id)
        .join(models.Customers, models.Customers.customer_id == models.BookingRequests.customer_id)
        .filter(
            models.BookingRequests.customer_id == current_user.get("customer_id"),
            models.BookingRequests.pickup_mode == "BULK_MAIL",
        )
        .order_by(models.BookingRequests.request_id.desc())
        .all()
    )
    response = []
    for request, bag, customer in rows:
        waybill_items = _get_bag_waybills(db, bag.bag_id) if bag else [
            _bulk_waybill_item(waybill, idx)
            for idx, waybill in enumerate(request.waybills or [], start=1)
            if not waybill.is_deleted
        ]
        first_waybill = request.waybills[0] if request.waybills else None
        response.append({
            "request_id": request.request_id,
            "request_code": request.request_code,
            "bag_id": bag.bag_id if bag else None,
            "bag_code": bag.bag_code if bag else None,
            "waybill_id": first_waybill.waybill_id if first_waybill else None,
            "waybill_code": first_waybill.waybill_code if first_waybill else None,
            "customer_id": customer.customer_id,
            "customer_code": customer.customer_code,
            "product_type": request.product_type,
            "product_type_label": get_product_type_definition(request.product_type)["label"],
            "service_type": first_waybill.service_type if first_waybill else None,
            "estimated_quantity": request.est_quantity or 0,
            "actual_quantity": bag.actual_quantity or 0 if bag else request.actual_quantity or 0,
            "pickup_status": request.status,
            "bag_status": bag.status if bag else None,
            "materialization_status": bag.materialization_status if bag else request.materialization_status,
            "created_at": bag.pickup_time if bag else first_waybill.requested_pickup_time if first_waybill else None,
            "waybills": waybill_items,
            "customer_department_id": request.customer_department_id,
            "customer_department_name": request.customer_department.name if request.customer_department else None,
        })
    return response


@router.get("/mobile/ocr/customers")
def list_mobile_ocr_customers(
    q: Optional[str] = None,
    hub_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Mobile OCR: lay khach hang co pickup/tui thu thuoc buu cuc, khong gioi han theo buu ta hien tai."""
    scoped_hub_id = _mobile_ocr_hub_id(current_user, hub_id)
    query = (
        db.query(models.Customers)
        .join(models.BookingRequests, models.BookingRequests.customer_id == models.Customers.customer_id)
        .filter(
            models.BookingRequests.target_hub_id == scoped_hub_id,
            models.BookingRequests.source.in_(["PORTAL", "HOTLINE", "CSKH", "ADMIN"]),
            models.BookingRequests.status.in_(["ASSIGNED_PICKUP", "PICKED", "RECEIVED", "PENDING_CONFIRMATION"]),
        )
    )
    if q:
        keyword = f"%{q.strip()}%"
        query = query.filter(
            (models.Customers.customer_code.ilike(keyword))
            | (models.Customers.company_name.ilike(keyword))
            | (models.Customers.transaction_name.ilike(keyword))
            | (models.Customers.phone_number.ilike(keyword))
        )

    customers = query.distinct(models.Customers.customer_id).order_by(models.Customers.customer_id.desc()).limit(limit).all()
    items = []
    for customer in customers:
        pickups = db.query(models.BookingRequests).filter(
            models.BookingRequests.customer_id == customer.customer_id,
            models.BookingRequests.target_hub_id == scoped_hub_id,
            models.BookingRequests.source.in_(["PORTAL", "HOTLINE", "CSKH", "ADMIN"]),
            models.BookingRequests.status.in_(["ASSIGNED_PICKUP", "PICKED", "RECEIVED", "PENDING_CONFIRMATION"]),
        ).all()
        request_ids = [row.request_id for row in pickups]
        bag_count = db.query(models.Bags).filter(models.Bags.booking_request_id.in_(request_ids)).count() if request_ids else 0
        waybill_query = db.query(models.Waybills).filter(
            models.Waybills.request_id.in_(request_ids),
            models.Waybills.is_deleted == False,
        ) if request_ids else None
        waybill_count = waybill_query.count() if waybill_query else 0
        pending_ocr_count = waybill_query.filter(models.Waybills.ocr_status.in_(["PENDING", "INCOMPLETE"])).count() if waybill_query else 0
        items.append({
            **_customer_brief(customer),
            "active_pickup_count": len(pickups),
            "bag_count": bag_count,
            "waybill_count": waybill_count,
            "pending_ocr_count": pending_ocr_count,
        })
    return {"hub_id": scoped_hub_id, "items": items}


@router.get("/mobile/ocr/customers/{customer_id}/pickups")
def list_mobile_ocr_customer_pickups(
    customer_id: int,
    hub_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    scoped_hub_id = _mobile_ocr_hub_id(current_user, hub_id)
    customer = db.query(models.Customers).filter(models.Customers.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Khong tim thay khach hang")

    requests = db.query(models.BookingRequests).filter(
        models.BookingRequests.customer_id == customer_id,
        models.BookingRequests.target_hub_id == scoped_hub_id,
        models.BookingRequests.source.in_(["PORTAL", "HOTLINE", "CSKH", "ADMIN"]),
        models.BookingRequests.status.in_(["ASSIGNED_PICKUP", "PICKED", "RECEIVED", "PENDING_CONFIRMATION"]),
    ).order_by(models.BookingRequests.request_id.desc()).all()

    bags = []
    single_waybills = []
    for request in requests:
        if request.pickup_bag:
            bags.append(_bag_payload(db, request.pickup_bag))
            continue
        for waybill in request.waybills:
            if not waybill.is_deleted:
                single_waybills.append({
                    **_bulk_waybill_item(waybill, 1),
                    "request_id": request.request_id,
                    "request_code": request.request_code,
                    "pickup_status": request.status,
                    "target_hub_id": request.target_hub_id,
                })

    return {
        "hub_id": scoped_hub_id,
        "customer": _customer_brief(customer),
        "bags": bags,
        "single_waybills": single_waybills,
    }


@router.get("/mobile/ocr/bags/{bag_code}/waybills")
def get_mobile_ocr_bag_waybills(
    bag_code: str,
    hub_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    scoped_hub_id = _mobile_ocr_hub_id(current_user, hub_id)
    bag = db.query(models.Bags).join(models.BookingRequests, models.BookingRequests.request_id == models.Bags.booking_request_id).filter(
        models.Bags.bag_code == bag_code,
        models.BookingRequests.target_hub_id == scoped_hub_id,
    ).first()
    if not bag:
        raise HTTPException(status_code=404, detail="Khong tim thay tui thu tai buu cuc hien tai")
    return _bag_payload(db, bag)


@router.patch("/mobile/ocr/waybills/{waybill_code}")
def update_mobile_ocr_waybill(
    waybill_code: str,
    data: schema_wb.MobileOcrWaybillUpdate,
    hub_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    scoped_hub_id = _mobile_ocr_hub_id(current_user, hub_id)
    logger.info(
        "Bắt đầu lưu OCR waybill_code=%s user_id=%s hub_id=%s fields=%s",
        waybill_code,
        current_user.get("user_id"),
        scoped_hub_id,
        sorted(data.model_dump(exclude_unset=True).keys()),
    )
    waybill = _waybill_hub_scoped_query(db, scoped_hub_id).filter(models.Waybills.waybill_code == waybill_code).first()
    if not waybill:
        logger.warning(
            "Không tìm thấy vận đơn OCR waybill_code=%s user_id=%s hub_id=%s",
            waybill_code,
            current_user.get("user_id"),
            scoped_hub_id,
        )
        raise HTTPException(status_code=404, detail="Khong tim thay van don trong pham vi buu cuc OCR")

    update_data = data.model_dump(exclude_unset=True)
    for field in [
        "receiver_name", "receiver_phone", "receiver_address",
        "receiver_province_id", "receiver_district_id", "receiver_ward_id",
        "receiver_province_name", "receiver_district_name", "receiver_ward_name",
        "actual_weight", "length", "width", "height", "cod_amount",
        "service_type", "product_name", "bill_image_url", "note",
    ]:
        if field in update_data:
            setattr(waybill, field, update_data[field])

    if "actual_weight" in update_data:
        waybill.estimated_weight = update_data["actual_weight"]
        waybill.final_weight = update_data["actual_weight"]
    if "product_group" in update_data or "declared_value" in update_data or "product_name" in update_data:
        item = waybill.waybill_items[0] if waybill.waybill_items else None
        if not item:
            item = models.WaybillItems(parcel_code=f"{waybill.waybill_code}-1", waybill_id=waybill.waybill_id, quantity=1)
            db.add(item)
        if "product_group" in update_data:
            item.product_group = normalize_product_type(update_data["product_group"])
        if "declared_value" in update_data:
            item.declared_value = update_data["declared_value"]
        if "product_name" in update_data:
            item.product_name = update_data["product_name"]
    if "ocr_raw_text" in update_data:
        current_note = waybill.note or ""
        waybill.note = (current_note + "\nOCR: " + update_data["ocr_raw_text"]).strip()[:255]

    missing_fields = _ocr_missing_fields(waybill)
    complete_for_review = len(missing_fields) == 0
    waybill.ocr_status = "REVIEW" if complete_for_review else "INCOMPLETE"
    waybill.verify_status = "PENDING"
    if waybill.status == "PENDING_OCR":
        waybill.status = "PICKED_PENDING_VERIFY" if complete_for_review else "PENDING_OCR"
    waybill.version = (waybill.version or 1) + 1
    db.add(models.TrackingLogs(
        waybill_id=waybill.waybill_id,
        status_id=waybill.status,
        hub_id=scoped_hub_id,
        user_id=current_user["user_id"],
        system_time=datetime.utcnow(),
        note="Mobile OCR cap nhat thong tin van don",
    ))
    try:
        db.commit()
        db.refresh(waybill)
        response = _waybill_ocr_payload(waybill)
        logger.info(
            "Lưu OCR thành công waybill_code=%s ocr_status=%s missing_fields=%s",
            waybill_code,
            waybill.ocr_status,
            response["missing_fields"],
        )
        return response
    except Exception:
        db.rollback()
        logger.exception(
            "Lỗi khi lưu OCR waybill_code=%s user_id=%s hub_id=%s",
            waybill_code,
            current_user.get("user_id"),
            scoped_hub_id,
        )
        raise HTTPException(status_code=500, detail="Không thể lưu thông tin OCR. Vui lòng kiểm tra log backend")


@router.post("/mobile/ocr/bags/{bag_code}/extra-waybills")
def create_mobile_ocr_extra_waybills(
    bag_code: str,
    data: schema_wb.MobileOcrExtraWaybillCreate,
    hub_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    scoped_hub_id = _mobile_ocr_hub_id(current_user, hub_id)
    bag = db.query(models.Bags).join(models.BookingRequests, models.BookingRequests.request_id == models.Bags.booking_request_id).filter(
        models.Bags.bag_code == bag_code,
        models.BookingRequests.target_hub_id == scoped_hub_id,
    ).first()
    if not bag:
        raise HTTPException(status_code=404, detail="Khong tim thay tui thu tai buu cuc hien tai")

    max_item = (
        db.query(models.BulkMailDraftItems)
        .filter(models.BulkMailDraftItems.bag_id == bag.bag_id)
        .order_by(models.BulkMailDraftItems.sequence_no.desc())
        .first()
    )
    start_sequence = (max_item.sequence_no if max_item else 0) + 1
    created = []
    try:
        for offset in range(data.count):
            sequence_no = start_sequence + offset
            waybill = _create_pending_ocr_waybill_for_bag(
                db,
                bag,
                sequence_no,
                current_user["user_id"],
                data.note or "Van don phat sinh khi nhan tui thu",
            )
            created.append(waybill)
        db.flush()
        total_waybills = db.query(models.BagItems).filter(models.BagItems.bag_id == bag.bag_id).count()
        bag.actual_quantity = total_waybills
        if bag.booking_request:
            bag.booking_request.actual_quantity = total_waybills
        db.commit()
        for waybill in created:
            db.refresh(waybill)
        db.refresh(bag)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))

    return {
        "bag_code": bag.bag_code,
        "expected_quantity": bag.est_quantity or 0,
        "actual_quantity": bag.actual_quantity or 0,
        "created_count": len(created),
        "created_waybills": [_bulk_waybill_item(waybill) for waybill in created],
        "waybills": _get_bag_waybills(db, bag.bag_id),
    }


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

    data.service_type = normalize_service_type(data.service_type)
    shipping_fee, extra_services_fee, vat_amount = _calculate_pickup_estimated_price(db, customer, data, origin_hub, dest_hub)
    initial_status = "RECEIVED"
    source = (data.source or "HOTLINE").upper()
    if source not in ["PORTAL", "HOTLINE", "CSKH", "ADMIN"]:
        source = "HOTLINE"

    try:
        booking, waybill, pickup_bag = crud_wb.create_customer_pickup_waybill(
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
        if data.assigned_shipper_id:
            shipper = crud_delivery.get_active_shipper(db, data.assigned_shipper_id)
            if not shipper or shipper.primary_hub_id != target_hub.hub_id:
                raise ValueError("Buu ta khong thuoc van phong tiep nhan")
            crud_delivery.assign_shipper_to_online_pickup(
                db, booking, data.assigned_shipper_id, current_user["user_id"], "Gan buu ta khi tao yeu cau"
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
            "bag_code": pickup_bag.bag_code if pickup_bag else None,
            "customer_id": customer.customer_id,
            "pickup_status": booking.status,
            "target_hub_id": target_hub.hub_id if target_hub else None,
        })
        response = _build_pickup_create_response(booking, waybill)
        response["bag_code"] = pickup_bag.bag_code if pickup_bag else None
        return response
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/bulk-mail-pickups", response_model=schema_wb.BulkMailPickupResponse)
def create_admin_bulk_mail_pickup(
    data: schema_wb.BulkMailPickupCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_pickup_operator(current_user)
    if not data.customer_id or not data.target_hub_id:
        raise HTTPException(status_code=400, detail="Thieu khach hang hoac van phong tiep nhan")
    customer = db.query(models.Customers).filter(models.Customers.customer_id == data.customer_id, models.Customers.status == "ACTIVE").first()
    if not customer:
        raise HTTPException(status_code=404, detail="Khong tim thay khach hang dang hoat dong")
    target_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == data.target_hub_id, models.Hubs.status == True).first()
    if not target_hub or not _can_operate_hub(current_user, data.target_hub_id):
        raise HTTPException(status_code=403, detail="Khong co quyen tao pickup tai van phong nay")
    source = (data.source or "HOTLINE").upper()
    if source not in ["PORTAL", "HOTLINE", "CSKH", "ADMIN"]:
        raise HTTPException(status_code=400, detail="Nguon tiep nhan khong hop le")
    data.source = source
    try:
        request, bag, waybill = crud_wb.create_bulk_mail_pickup(db, customer, data, current_user["user_id"], target_hub.hub_id)
        if data.assigned_shipper_id:
            shipper = crud_delivery.get_active_shipper(db, data.assigned_shipper_id)
            if not shipper or shipper.primary_hub_id != target_hub.hub_id:
                raise ValueError("Buu ta khong thuoc van phong tiep nhan")
            crud_delivery.assign_shipper_to_online_pickup(db, request, data.assigned_shipper_id, current_user["user_id"], "Gan buu ta khi tao tui thu")
        db.commit()
        db.refresh(request)
        waybill_items = _get_bag_waybills(db, bag.bag_id) if bag else ([_bulk_waybill_item(waybill, 1)] if waybill else [])
        return {
            "request_id": request.request_id, "request_code": request.request_code,
            "bag_id": bag.bag_id if bag else None, "bag_code": bag.bag_code if bag else None,
            "waybill_id": waybill.waybill_id if waybill else None, "waybill_code": waybill.waybill_code if waybill else None,
            "customer_id": customer.customer_id, "customer_code": customer.customer_code,
            "product_type": data.product_type, "product_type_label": get_product_type_definition(data.product_type)["label"],
            "service_type": data.service_type,
            "estimated_quantity": data.estimated_quantity, "actual_quantity": request.actual_quantity or 0,
            "pickup_status": request.status, "bag_status": bag.status if bag else None,
            "materialization_status": request.materialization_status, "created_at": request.created_at,
            "waybills": waybill_items,
        }
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


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
    latest_delivery = db.query(models.DeliveryResults).filter(
        models.DeliveryResults.waybill_id == waybill.waybill_id,
        models.DeliveryResults.pod_image_url.isnot(None),
    ).order_by(models.DeliveryResults.delivery_id.desc()).first()
    pod_image_url = latest_delivery.pod_image_url if latest_delivery else None
    pod_image_urls = _read_image_urls(
        latest_delivery.pod_image_urls if latest_delivery else None,
        pod_image_url,
    )
    pickup_image_urls = _read_image_urls(waybill.pickup_image_urls, waybill.pickup_image_url)
    pickup_statuses = {"PICKED", "PICKED_PENDING_VERIFY"}
    return {
        "waybill_id": waybill.waybill_id,
        "history": [
            {
                "status_id": log.status_id,
                "note": log.note,
                "time": log.system_time,
                "pickup_image_url": (
                    waybill.pickup_image_url
                    if log.status_id in pickup_statuses
                    else None
                ),
                "pickup_image_urls": (
                    pickup_image_urls
                    if log.status_id in pickup_statuses
                    else []
                ),
                "pod_image_url": pod_image_url if log.status_id == "DELIVERED" else None,
                "pod_image_urls": pod_image_urls if log.status_id == "DELIVERED" else [],
            }
            for log in logs
        ],
        "bill_image_url": waybill.bill_image_url,
        "pickup_image_url": waybill.pickup_image_url,
        "pickup_image_urls": pickup_image_urls,
        "pod_image_url": pod_image_url,
        "pod_image_urls": pod_image_urls,
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
        query = db.query(models.Waybills).filter(models.Waybills.is_deleted == False)
        role_id = current_user.get("role_id")
        if role_id == 7:
            query = query.join(models.Customers).filter(models.Customers.staff_in_charge_id == current_user.get("user_id"))
        all_w = query.all()
        
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
        if hasattr(df, 'map'):
            df = df.map(lambda s: s.strip() if isinstance(s, str) else s)
        else:
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


@router.post("/export-selected")
def export_selected_waybills_excel(
    data: schema_wb.WaybillExportSelectedRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Xuất Excel cho các vận đơn được chọn"""
    try:
        from sqlalchemy.orm import joinedload
        query = (
            db.query(models.Waybills)
            .options(
                joinedload(models.Waybills.customer),
                joinedload(models.Waybills.dest_hub)
            )
            .filter(
                models.Waybills.waybill_code.in_(data.waybill_codes),
                models.Waybills.is_deleted == False
            )
        )
        
        if current_user.get("role_id") == 7:
            query = query.join(models.Customers).filter(models.Customers.staff_in_charge_id == current_user.get("user_id"))
            
        waybills = query.all()
        
        rows = []
        for w in waybills:
            rows.append({
                "Mã Vận Đơn": w.waybill_code,
                "Họ tên": w.receiver_name or "",
                "Số điện thoại": w.receiver_phone or "",
                "Địa chỉ nhận hàng": w.receiver_address or "",
                "Khối lượng (kg)": float(w.actual_weight or 0),
                "COD": float(w.cod_amount or 0),
                "Dịch vụ": w.service_type or "STANDARD",
                "Tên hàng": w.product_name or "",
                "Ghi chú": w.note or "",
                "Dài": float(w.length or 0),
                "Rộng": float(w.width or 0),
                "Cao": float(w.height or 0),
                "Mã Khách Hàng": w.customer.customer_code if w.customer else "",
                "Mã bưu cục nhận": w.dest_hub.hub_code if w.dest_hub else ""
            })
            
        import io
        from fastapi.responses import StreamingResponse
        
        cols = [
            "Mã Vận Đơn", "Họ tên", "Số điện thoại", "Địa chỉ nhận hàng", 
            "Khối lượng (kg)", "COD", "Dịch vụ", "Tên hàng", "Ghi chú", 
            "Dài", "Rộng", "Cao", "Mã Khách Hàng", "Mã bưu cục nhận"
        ]
        
        if not rows:
            df = pd.DataFrame(columns=cols)
        else:
            df = pd.DataFrame(rows)[cols]
            
        stream = io.BytesIO()
        df.to_excel(stream, index=False)
        stream.seek(0)
        
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=SelectedWaybills.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi xuất excel: {str(e)}")


@router.post("/update-excel")
async def update_waybills_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Cập nhật thông tin hàng loạt cho vận đơn qua Excel"""
    try:
        def safe_float(val, default=None):
            if val is None or pd.isna(val):
                return default
            try:
                val_str = str(val).strip()
                if not val_str:
                    return default
                return float(val_str)
            except:
                return default

        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        
        if hasattr(df, 'map'):
            df = df.map(lambda s: s.strip() if isinstance(s, str) else s)
        else:
            df = df.applymap(lambda s: s.strip() if isinstance(s, str) else s)
        
        columns_mapping = {}
        for col in df.columns:
            col_lower = str(col).lower().strip()
            if any(k in col_lower for k in ["mã vận đơn", "ma van don", "waybill code", "waybill_code", "mã đơn", "ma don"]):
                columns_mapping["waybill_code"] = col
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
            elif any(k in col_lower for k in ["bưu cục nhận", "buu cuc nhan", "dest hub", "mã kho nhận", "ma kho nhan", "kho nhan"]):
                columns_mapping["dest_hub_code"] = col

        if "waybill_code" not in columns_mapping:
            raise HTTPException(
                status_code=400,
                detail="Thiếu cột 'Mã Vận Đơn' trong file Excel để xác định các đơn cần cập nhật."
            )
            
        success_count = 0
        error_rows = []
        updated_codes = []
        
        user_id = current_user.get("user_id")
        hub_id = current_user.get("primary_hub_id")
        
        for index, row in df.iterrows():
            row_num = index + 2
            try:
                code_val = row[columns_mapping["waybill_code"]]
                if pd.isna(code_val):
                    continue
                code = str(code_val).strip()
                if not code:
                    continue
                
                waybill = db.query(models.Waybills).filter(
                    models.Waybills.waybill_code == code,
                    models.Waybills.is_deleted == False
                ).first()
                
                if not waybill:
                    raise Exception(f"Không tìm thấy vận đơn mang mã {code} trên hệ thống.")
                    
                if current_user.get("role_id") == 7:
                    cust = db.query(models.Customers).filter(
                        models.Customers.customer_id == waybill.customer_id,
                        models.Customers.staff_in_charge_id == current_user.get("user_id")
                    ).first()
                    if not cust:
                        raise Exception(f"Vận đơn {code} không thuộc quyền quản lý của bạn.")
                        
                if waybill.status in ["DELIVERED", "CANCELLED"]:
                    raise Exception(f"Không thể chỉnh sửa vận đơn đang ở trạng thái {waybill.status}")

                weight = waybill.actual_weight
                if "actual_weight" in columns_mapping:
                    weight = safe_float(row[columns_mapping["actual_weight"]], default=waybill.actual_weight)
                            
                cod_amount = waybill.cod_amount
                if "cod_amount" in columns_mapping:
                    cod_amount = safe_float(row[columns_mapping["cod_amount"]], default=waybill.cod_amount)
                            
                srv_type = waybill.service_type
                if "service_type" in columns_mapping:
                    srv_val = row[columns_mapping["service_type"]]
                    if not pd.isna(srv_val):
                        srv_type = str(srv_val).upper().strip()
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
                            
                product_name = waybill.product_name
                if "product_name" in columns_mapping:
                    p_val = row[columns_mapping["product_name"]]
                    if not pd.isna(p_val):
                        product_name = str(p_val)
                        
                note = waybill.note
                if "note" in columns_mapping:
                    n_val = row[columns_mapping["note"]]
                    if not pd.isna(n_val):
                        note = str(n_val)
                        
                length = waybill.length
                if "length" in columns_mapping:
                    length = safe_float(row[columns_mapping["length"]], default=waybill.length)
                width = waybill.width
                if "width" in columns_mapping:
                    width = safe_float(row[columns_mapping["width"]], default=waybill.width)
                height = waybill.height
                if "height" in columns_mapping:
                    height = safe_float(row[columns_mapping["height"]], default=waybill.height)

                dest_hub_id = waybill.dest_hub_id
                if "dest_hub_code" in columns_mapping:
                    dest_code = row[columns_mapping["dest_hub_code"]]
                    if not pd.isna(dest_code) and str(dest_code).strip():
                        hub = db.query(models.Hubs).filter(models.Hubs.hub_code == str(dest_code).strip()).first()
                        if not hub:
                            hub = db.query(models.Hubs).filter(models.Hubs.hub_name.ilike(f"%{dest_code}%")).first()
                        if hub:
                            dest_hub_id = hub.hub_id

                try:
                    new_fee = calculate_shipping_fee(
                        db, 
                        origin_hub_id=waybill.origin_hub_id or hub_id or 1, 
                        dest_hub_id=dest_hub_id, 
                        weight=weight or 0.0, 
                        service_type=srv_type or "TK", 
                        customer_id=waybill.customer_id
                    )
                except Exception:
                    new_fee = waybill.shipping_fee or 0.0
                
                waybill.actual_weight = weight
                waybill.cod_amount = cod_amount
                waybill.service_type = srv_type
                waybill.product_name = product_name
                waybill.note = note
                waybill.length = length
                waybill.width = width
                waybill.height = height
                waybill.dest_hub_id = dest_hub_id
                
                waybill.shipping_fee = new_fee
                waybill.estimated_weight = weight
                waybill.final_weight = weight
                waybill.estimated_shipping_fee = new_fee
                waybill.final_shipping_fee = new_fee
                
                total_collect = float(cod_amount or 0)
                if waybill.payment_method == 'RECEIVER_PAY':
                    total_collect += float(new_fee)
                waybill.total_amount_to_collect = total_collect
                
                waybill.version += 1
                
                waybill_item = db.query(models.WaybillItems).filter(models.WaybillItems.waybill_id == waybill.waybill_id).first()
                if waybill_item:
                    waybill_item.actual_weight = weight
                    waybill_item.length = length
                    waybill_item.width = width
                    waybill_item.height = height
                    waybill_item.product_name = product_name
                else:
                    db.add(models.WaybillItems(
                        parcel_code=f"{waybill.waybill_code}-001",
                        waybill_id=waybill.waybill_id,
                        product_group="PARCEL",
                        product_name=product_name or "Hàng hóa",
                        actual_weight=weight,
                        length=length,
                        width=width,
                        height=height,
                        quantity=1
                    ))
                
                db.add(models.TrackingLogs(
                    waybill_id=waybill.waybill_id,
                    status_id=waybill.status,
                    hub_id=hub_id or waybill.origin_hub_id or 1,
                    user_id=user_id,
                    note=f"Cân lại và cập nhật Excel hàng loạt: Khối lượng {weight}kg, cước mới {new_fee:,.0f} VNĐ",
                    system_time=datetime.utcnow()
                ))
                
                updated_codes.append(waybill.waybill_code)
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
            "updated_codes": updated_codes
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật Excel: {str(e)}")

