from sqlalchemy.orm import Session, joinedload
from datetime import datetime, date
import secrets
import string
import models
from core.state_machine import WaybillStatus
from typing import Optional, List
from schemas.waybills import WaybillFilter
from sqlalchemy import func
from sqlalchemy.orm import Session


def generate_waybill_code(db: Session) -> str:
    alphabet = string.ascii_uppercase + string.digits
    for _ in range(20):
        time_part = datetime.utcnow().strftime("%y%m%d%H%M%S%f")[:-3]
        random_part = "".join(secrets.choice(alphabet) for _ in range(5))
        code = f"SP{time_part}{random_part}"
        exists = db.query(models.Waybills).filter(models.Waybills.waybill_code == code).first()
        if not exists:
            return code
    raise ValueError("Khong the tao ma van don duy nhat")

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
        'service_type', 'product_name', 'note', 'payment_method',
        'sender_name', 'sender_phone', 'sender_address', 'length', 'width', 'height'
    }
    filtered = {k: v for k, v in data.items() if k in ALLOWED_FIELDS}
    
    # Cơ chế Autofill thông minh người gửi từ bảng Customers nếu trống
    if data.get('customer_id'):
        cust = db.query(models.Customers).filter(models.Customers.customer_id == data.get('customer_id')).first()
        if cust:
            if not filtered.get('sender_name'):
                filtered['sender_name'] = cust.representative_name or cust.company_name or cust.customer_code
            if not filtered.get('sender_phone'):
                filtered['sender_phone'] = cust.phone_number
            if not filtered.get('sender_address'):
                filtered['sender_address'] = cust.address_detail
    
    total_collect = float(data.get('cod_amount', 0))
    if data.get('payment_method') == 'RECEIVER_PAY':
        total_collect += float(fee)

    # Tính SLA deadline dựa trên dịch vụ
    service = str(data.get('service_type', 'STANDARD')).upper()
    hours = 24  # Mặc định STANDARD
    if service in ('HT', 'FAST', 'EXPRESS'):
        hours = 4
    elif service in ('CPN', 'EXPRESS_STANDARD'):
        hours = 12
    elif service in ('TK', 'ECONOMY'):
        hours = 48
        
    from datetime import timedelta
    sla_dt = datetime.utcnow() + timedelta(hours=hours)

    # Tính toán khối lượng quy đổi từ kích thước nếu có
    l = data.get('length')
    w = data.get('width')
    h = data.get('height')
    conv_w = (float(l) * float(w) * float(h)) / 5000 if l and w and h else 0.0

    new_waybill = models.Waybills(
        waybill_code=generate_waybill_code(db),
        **filtered,
        shipping_fee=fee,
        total_amount_to_collect=total_collect, 
        status=WaybillStatus.CREATED,
        version=1,
        converted_weight=conv_w,
        sla_deadline=sla_dt,
        holding_hub_id=data.get('origin_hub_id')
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


def create_customer_pickup_waybill(
    db: Session,
    customer: models.Customers,
    data,
    origin_hub_id: int | None,
    dest_hub_id: int | None,
    creator_id: int,
    shipping_fee: float,
    extra_services_fee: float,
    vat_amount: float,
    source: str = "PORTAL",
    target_hub_id: int | None = None,
    initial_status: str | None = None,
    log_action: str | None = None,
) -> tuple[models.BookingRequests, models.Waybills]:
    sender = data.sender
    receiver = data.receiver
    items = data.items or []
    documents = data.documents or []
    service_type = (data.service_type or "STANDARD").upper()
    total_weight = sum(float(item.weight) * int(item.quantity or 1) for item in items)
    first_item = items[0]
    total_to_collect = float(data.cod_amount or 0)
    if data.payment_method == "RECEIVER_PAY":
        total_to_collect += float(shipping_fee or 0) + float(extra_services_fee or 0) + float(vat_amount or 0)
    estimated_total = float(shipping_fee or 0) + float(extra_services_fee or 0) + float(vat_amount or 0)

    request_code = generate_waybill_code(db)
    booking_status = initial_status or ("DRAFT" if data.save_as_draft else "PENDING_CONFIRMATION")
    assigned_origin_hub_id = target_hub_id if booking_status == "RECEIVED" else None
    booking = models.BookingRequests(
        request_code=request_code,
        source=source,
        shop_order_code=data.shop_order_code,
        customer_id=customer.customer_id,
        sender_phone=sender.phone or customer.phone_number,
        pickup_address=sender.address or customer.address_detail,
        target_hub_id=target_hub_id if booking_status == "RECEIVED" else None,
        product_type=first_item.product_group,
        est_weight=total_weight,
        est_quantity=sum(int(item.quantity or 1) for item in items),
        is_vehicle_required=False,
        status=booking_status,
        requested_pickup_time=data.pickup_time,
        pickup_method=data.pickup_method,
        priority="NORMAL",
        sla_deadline=None,
        notes=data.note,
    )
    if booking_status == "RECEIVED":
        booking.confirmed_by_user_id = creator_id
        booking.confirmed_at = datetime.utcnow()
    db.add(booking)
    db.flush()

    waybill_code = generate_waybill_code(db)
    waybill = models.Waybills(
        waybill_code=waybill_code,
        request_id=booking.request_id,
        customer_id=customer.customer_id,
        receiver_name=receiver.name,
        receiver_phone=receiver.phone,
        receiver_address=receiver.address,
        origin_hub_id=assigned_origin_hub_id,
        dest_hub_id=dest_hub_id or origin_hub_id,
        service_type=service_type,
        delivery_type=data.order_type,
        actual_weight=total_weight,
        converted_weight=0,
        payment_method=data.payment_method,
        cod_amount=data.cod_amount,
        shipping_fee=shipping_fee,
        extra_services_fee=extra_services_fee,
        vat_amount=vat_amount,
        total_amount_to_collect=total_to_collect,
        estimated_weight=total_weight,
        estimated_converted_weight=0,
        estimated_shipping_fee=shipping_fee,
        estimated_extra_services_fee=extra_services_fee,
        estimated_vat_amount=vat_amount,
        estimated_total_amount=estimated_total,
        price_status="ESTIMATED",
        status="DRAFT" if data.save_as_draft else WaybillStatus.CREATED,
        product_name=first_item.product_name or first_item.product_group,
        note=data.note,
        version=1,
        sender_name=sender.name or customer.representative_name or customer.company_name,
        sender_phone=sender.phone or customer.phone_number,
        sender_address=sender.address or customer.address_detail,
        sender_province_id=sender.province_id or customer.province_id,
        sender_district_id=sender.district_id or customer.district_id,
        sender_ward_id=sender.ward_id or customer.ward_id,
        sender_province_name=sender.province_name or customer.province_name,
        sender_district_name=sender.district_name,
        sender_ward_name=sender.ward_name or customer.ward_name,
        receiver_province_id=receiver.province_id,
        receiver_district_id=receiver.district_id,
        receiver_ward_id=receiver.ward_id,
        receiver_province_name=receiver.province_name,
        receiver_district_name=receiver.district_name,
        receiver_ward_name=receiver.ward_name,
        shop_order_code=data.shop_order_code,
        order_type=data.order_type,
        delivery_note_option=data.delivery_note_option,
        cod_receiver_pays_fee=data.cod_receiver_pays_fee,
        cod_fee_payment_method=data.cod_fee_payment_method,
        pickup_method=data.pickup_method,
        delivery_method=data.delivery_method,
        requested_pickup_time=data.pickup_time,
        length=first_item.length,
        width=first_item.width,
        height=first_item.height,
        holding_hub_id=assigned_origin_hub_id,
    )
    db.add(waybill)
    db.flush()

    for index, item in enumerate(items, start=1):
        converted_weight = 0
        if item.length and item.width and item.height:
            converted_weight = (float(item.length) * float(item.width) * float(item.height)) / 5000
        db.add(models.WaybillItems(
            parcel_code=f"{waybill_code}-{index:03d}",
            waybill_id=waybill.waybill_id,
            product_group=item.product_group,
            product_name=item.product_name,
            description=item.description,
            declared_value=item.declared_value or 0,
            actual_weight=item.weight,
            converted_weight=converted_weight,
            length=item.length,
            width=item.width,
            height=item.height,
            quantity=item.quantity,
        ))

    for service in data.extra_services or []:
        db.add(models.WaybillExtraServices(
            waybill_id=waybill.waybill_id,
            service_name=service.service_name or service.service_code,
            service_fee=service.service_fee or 0,
        ))

    for document in documents:
        db.add(models.WaybillDocuments(
            waybill_id=waybill.waybill_id,
            document_code=document.document_code,
            document_name=document.document_name,
            quantity=document.quantity,
            note=document.note,
        ))

    db.add(models.BookingRequestLogs(
        request_id=booking.request_id,
        user_id=creator_id,
        action=log_action or ("Tao yeu cau lay hang tu portal" if source == "PORTAL" else "Nhan vien tao yeu cau lay hang thay khach"),
        note=f"Van don {waybill_code}",
    ))
    create_initial_log(db, waybill.waybill_id, assigned_origin_hub_id or origin_hub_id, creator_id)
    return booking, waybill


def customer_pickup_payload(request: models.BookingRequests, waybill: models.Waybills) -> dict:
    hub = request.target_hub
    shipper = request.assigned_shipper
    created_at = None
    if request.logs:
        created_at = min((log.created_at for log in request.logs if log.created_at), default=None)
    return {
        "request_id": request.request_id,
        "request_code": request.request_code,
        "waybill_id": waybill.waybill_id,
        "waybill_code": waybill.waybill_code,
        "bill_code": waybill.waybill_code,
        "pickup_status": request.status,
        "waybill_status": waybill.status,
        "office_status": hub.hub_name if hub else "Chưa xác nhận văn phòng",
        "hub_id": request.target_hub_id,
        "hub_name": hub.hub_name if hub else None,
        "assigned_shipper_id": request.assigned_shipper_id,
        "assigned_shipper_name": shipper.full_name if shipper else None,
        "price_status": waybill.price_status or "ESTIMATED",
        "estimated_shipping_fee": float(waybill.estimated_shipping_fee or waybill.shipping_fee or 0),
        "estimated_total_amount": float(waybill.estimated_total_amount or 0),
        "final_shipping_fee": float(waybill.final_shipping_fee) if waybill.final_shipping_fee is not None else None,
        "final_total_amount": float(waybill.final_total_amount) if waybill.final_total_amount is not None else None,
        "created_at": created_at,
    }


def get_customer_pickup_waybills(db: Session, customer_id: int):
    rows = (
        db.query(models.BookingRequests, models.Waybills)
        .join(models.Waybills, models.Waybills.request_id == models.BookingRequests.request_id)
        .filter(
            models.BookingRequests.customer_id == customer_id,
            models.BookingRequests.source.in_(["PORTAL", "HOTLINE", "CSKH", "ADMIN"]),
            models.Waybills.is_deleted == False,
        )
        .order_by(models.BookingRequests.request_id.desc())
        .all()
    )
    return [customer_pickup_payload(req, wb) for req, wb in rows]


def get_customer_pickup_waybill_by_code(db: Session, customer_id: int, waybill_code: str):
    row = (
        db.query(models.BookingRequests, models.Waybills)
        .join(models.Waybills, models.Waybills.request_id == models.BookingRequests.request_id)
        .filter(
            models.BookingRequests.customer_id == customer_id,
            models.BookingRequests.source.in_(["PORTAL", "HOTLINE", "CSKH", "ADMIN"]),
            models.Waybills.waybill_code == waybill_code,
            models.Waybills.is_deleted == False,
        )
        .first()
    )
    if not row:
        return None
    return customer_pickup_payload(row[0], row[1])


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
        waybill.status = WaybillStatus.CANCELLED
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
        joinedload(models.Waybills.holding_hub),
        joinedload(models.Waybills.holding_shipper),
    ).filter(models.Waybills.is_deleted == False)

    # Tìm kiếm theo keyword / search_term đa năng (Mã đơn, Tên/SĐT nhận, Mã KH/Tên shop gửi, Người gửi)
    search_keyword = None
    if hasattr(filters, 'keyword') and filters.keyword:
        search_keyword = filters.keyword
    elif hasattr(filters, 'search_term') and filters.search_term:
        search_keyword = filters.search_term

    if search_keyword:
        kw = f"%{search_keyword}%"
        query = query.join(models.Customers, models.Waybills.customer_id == models.Customers.customer_id, isouter=True).filter(
            (models.Waybills.waybill_code.ilike(kw)) |
            (models.Waybills.receiver_name.ilike(kw)) |
            (models.Waybills.receiver_phone.ilike(kw)) |
            (models.Waybills.sender_name.ilike(kw)) |
            (models.Customers.customer_code.ilike(kw)) |
            (models.Customers.company_name.ilike(kw)) |
            (models.Customers.transaction_name.ilike(kw))
        )

    # Lọc theo Khách hàng (Quan trọng cho Accounting)
    if hasattr(filters, 'customer_id') and filters.customer_id:
        query = query.filter(models.Waybills.customer_id == filters.customer_id)
        
    # Logic "Bỏ qua đơn đã lập bảng kê" (Theo yêu cầu Sếp)
    # Nếu đang tìm kiếm đơn để lập bảng kê (thường lọc theo status DELIVERED/RETURNED)
    if filters.status in [WaybillStatus.DELIVERED, WaybillStatus.RETURNED, WaybillStatus.SETTLED]:
        # Subquery lấy danh sách waybill_id đã có trong bảng kê
        listed_waybill_ids = db.query(models.StatementDetails.waybill_id).filter(models.StatementDetails.waybill_id.isnot(None))
        query = query.filter(~models.Waybills.waybill_id.in_(listed_waybill_ids))

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
        if filters.status == WaybillStatus.PICKED_PENDING_VERIFY:
            query = query.filter(models.Waybills.status.in_([
                WaybillStatus.PICKED_PENDING_VERIFY,
                WaybillStatus.VERIFY_ERROR
            ]))
        else:
            query = query.filter(models.Waybills.status == filters.status)
    if filters.waybill_code:
        query = query.filter(models.Waybills.waybill_code.ilike(f"%{filters.waybill_code}%"))

    # Lọc theo loại Dịch vụ
    if hasattr(filters, 'service_type') and filters.service_type:
        query = query.filter(models.Waybills.service_type == filters.service_type)

    # Lọc theo Đơn vị giữ
    if hasattr(filters, 'holding_hub_id') and filters.holding_hub_id:
        query = query.filter(models.Waybills.holding_hub_id == filters.holding_hub_id)
    if hasattr(filters, 'holding_shipper_id') and filters.holding_shipper_id:
        query = query.filter(models.Waybills.holding_shipper_id == filters.holding_shipper_id)

    # Lọc theo SLA
    if hasattr(filters, 'sla_status') and filters.sla_status:
        now = datetime.utcnow()
        from datetime import timedelta
        if filters.sla_status == 'ON_TIME':
            query = query.filter(
                (models.Waybills.sla_deadline >= now) | 
                (models.Waybills.status.in_([WaybillStatus.DELIVERED, WaybillStatus.SETTLED]))
            )
        elif filters.sla_status == 'WARNING':
            query = query.filter(
                models.Waybills.sla_deadline >= now,
                models.Waybills.sla_deadline <= now + timedelta(hours=4),
                ~models.Waybills.status.in_([WaybillStatus.DELIVERED, WaybillStatus.SETTLED, WaybillStatus.CANCELLED])
            )
        elif filters.sla_status == 'OVERDUE':
            query = query.filter(
                models.Waybills.sla_deadline < now,
                ~models.Waybills.status.in_([WaybillStatus.DELIVERED, WaybillStatus.SETTLED, WaybillStatus.CANCELLED])
            )

    # Lọc theo trạng thái COD
    if hasattr(filters, 'cod_status') and filters.cod_status:
        if filters.cod_status == 'PAID':
            query = query.filter(
                models.Waybills.cod_amount > 0,
                models.Waybills.status.in_([WaybillStatus.DELIVERED, WaybillStatus.SETTLED])
            )
        elif filters.cod_status == 'UNPAID':
            query = query.filter(
                models.Waybills.cod_amount > 0,
                ~models.Waybills.status.in_([WaybillStatus.DELIVERED, WaybillStatus.SETTLED, WaybillStatus.CANCELLED])
            )

    total = query.count()
    items = query.order_by(models.Waybills.waybill_id.desc())\
                 .offset((filters.page - 1) * filters.size).limit(filters.size).all()

    return items, total


def get_overdue_waybills(db: Session, page: int = 1, size: int = 20):
    query = db.query(models.Waybills).join(models.TrackingLogs).filter(
        models.Waybills.is_deleted == False,
        models.TrackingLogs.status_id == WaybillStatus.OVERDUE_WARNING
    ).distinct() 

    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    return items, total

def count_overdue_summary(db: Session):
    return db.query(models.Waybills).join(models.TrackingLogs).filter(
        models.Waybills.is_deleted == False,
        models.TrackingLogs.status_id == WaybillStatus.OVERDUE_WARNING
    ).distinct().count()

# ==========================================
# CÁC HÀM TRUY VẤN MỚI CHUYỂN TỪ API SANG (ĐÃ SỬA LỖI TỪ 1.TXT)
# ==========================================

def count_today_in_hub_scans(db: Session, hub_id: int, today: date):
    return db.query(models.TrackingLogs).filter(
        models.TrackingLogs.hub_id == hub_id,
        models.TrackingLogs.status_id == WaybillStatus.IN_HUB,
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
        note=f"Cân lại {new_weight}kg. Cập nhật giá mới {new_fee:,.0f} VNĐ",
        system_time=datetime.utcnow()
    )
    db.add(new_log)
    db.flush()

def mark_waybill_as_delivered(db: Session, waybill: models.Waybills, hub_id: int, user_id: int):
    result = db.query(models.Waybills).filter(
        models.Waybills.waybill_id == waybill.waybill_id,
        models.Waybills.version == waybill.version
    ).update({
        "status": WaybillStatus.DELIVERED,
        "version": models.Waybills.version + 1
    })
    
    if result:
        new_log = models.TrackingLogs(
            waybill_id=waybill.waybill_id,
            status_id=WaybillStatus.DELIVERED,
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

# --- NEW VERIFY & OCR CRUD FUNCTIONS (ĐÃ SỬA LỖI TỪ 1.TXT) ---

def update_waybill_images_and_trigger_ocr(db: Session, code: str, bill_url: str, pickup_url: Optional[str], user_id: int, hub_id: int):
    waybill = get_waybill_by_code(db, code)
    if not waybill:
        return None
    
    waybill.bill_image_url = bill_url
    if pickup_url:
        waybill.pickup_image_url = pickup_url
    
    # 1. Chuẩn bị dữ liệu đầu vào cho OCR
    waybill_data = {
        "receiver_phone": waybill.receiver_phone,
        "cod_amount": float(waybill.cod_amount or 0),
        "receiver_name": waybill.receiver_name,
        "actual_weight": float(waybill.actual_weight or 0)
    }
    
    # 2. Gọi OCR Service (sử dụng đường dẫn tương đối hoặc tuyệt đối)
    from services.ocr_service import extract_waybill_info_from_image
    import os
    
    # Chuyển đổi URL ảnh thành đường dẫn file thật để OCR đọc (nếu có Tesseract)
    image_path = bill_url.lstrip("/")
    ocr_result = extract_waybill_info_from_image(image_path, waybill_data)
    
    # 3. Tiến hành tự động so khớp (Auto-Match)
    errors = []
    
    # Kiểm tra SĐT
    ocr_phone = ocr_result.get("receiver_phone") or ""
    sys_phone = waybill_data["receiver_phone"] or ""
    # Chuẩn hóa để so sánh
    if ocr_phone.replace("+84", "0") != sys_phone.replace("+84", "0"):
        errors.append(f"SĐT không khớp: Hệ thống ({sys_phone}) vs OCR ({ocr_phone})")
        
    # Kiểm tra COD
    ocr_cod = float(ocr_result.get("cod_amount") or 0)
    sys_cod = waybill_data["cod_amount"]
    if abs(ocr_cod - sys_cod) > 0.01:
        errors.append(f"COD không khớp: Hệ thống ({sys_cod:,.0f}đ) vs OCR ({ocr_cod:,.0f}đ)")
        
    # Kiểm tra tên người nhận
    ocr_name = (ocr_result.get("receiver_name") or "").strip().lower()
    sys_name = (waybill_data["receiver_name"] or "").strip().lower()
    if ocr_name != sys_name:
        errors.append(f"Người nhận không khớp: Hệ thống ({waybill.receiver_name}) vs OCR ({ocr_result.get('receiver_name')})")

    # 4. Cập nhật trạng thái dựa trên kết quả so khớp
    waybill.ocr_status = "SUCCESS"
    
    if not errors:
        # Khớp 100% -> Auto Verified
        waybill.verify_status = "VERIFIED"
        waybill.status = WaybillStatus.READY_WAREHOUSE
        waybill.verify_error_msg = None
        note = "Đã tự động xác thực OCR thành công (Khớp 100%). Sẵn sàng nhập kho."
    else:
        # Lệch thông tin -> Chuyển trạng thái lỗi
        waybill.verify_status = "MISMATCH"
        waybill.status = WaybillStatus.VERIFY_ERROR
        waybill.verify_error_msg = "; ".join(errors)
        note = f"Tự động xác thực OCR thất bại: {waybill.verify_error_msg}"
        
    new_log = models.TrackingLogs(
        waybill_id=waybill.waybill_id,
        status_id=waybill.status,
        hub_id=hub_id,
        user_id=user_id,
        note=note,
        system_time=datetime.utcnow()
    )
    db.add(new_log)
    db.flush()
    return waybill

def verify_waybill_status(db: Session, code: str, action: str, error_msg: Optional[str], user_id: int, hub_id: int):
    waybill = get_waybill_by_code(db, code)
    if not waybill:
        return None
    
    # Chuẩn hóa action để tránh lỗi do khoảng trắng hoặc chữ thường
    action = action.strip().upper()
    
    if action == "VERIFIED":
        waybill.verify_status = "VERIFIED"
        waybill.status = WaybillStatus.READY_WAREHOUSE
        waybill.verify_error_msg = None
        note = "Đã xác thực ảnh bill khớp với dữ liệu hệ thống"
    elif action == "MISMATCH":
        waybill.verify_status = "MISMATCH"
        waybill.status = WaybillStatus.VERIFY_ERROR
        waybill.verify_error_msg = error_msg
        note = f"Xác thực thất bại: {error_msg}"
    else:
        # Nếu truyền sai action, mặc định là lỗi để an toàn
        waybill.verify_status = "MISMATCH"
        waybill.status = WaybillStatus.VERIFY_ERROR
        waybill.verify_error_msg = f"Action không hợp lệ: {action}"
        note = f"Action không hợp lệ: {action}"
    
    new_log = models.TrackingLogs(
        waybill_id=waybill.waybill_id,
        status_id=waybill.status,
        hub_id=hub_id,
        user_id=user_id,
        note=note,
        system_time=datetime.utcnow()
    )
    db.add(new_log)
    db.flush()
    return waybill

def log_activity(db: Session, waybill_id: int, user_id: int, action: str, ip_address: Optional[str] = None, device_info: Optional[str] = None):
    new_log = models.ActivityLogs(
        waybill_id=waybill_id,
        user_id=user_id,
        action=action,
        ip_address=ip_address,
        device_info=device_info,
        created_at=datetime.utcnow()
    )
    db.add(new_log)
    db.flush()
    return new_log

def transfer_waybill_crud(db: Session, code: str, target_type: str, target_id: int, reason: str, note: Optional[str], user_id: int, hub_id: Optional[int], ip_address: Optional[str] = None, device_info: Optional[str] = None):
    waybill = get_waybill_by_code(db, code)
    if not waybill:
        return None
    
    target_type = target_type.strip().upper()
    old_holder = "Kho " + waybill.holding_hub.hub_name if waybill.holding_hub else ("Bưu tá " + waybill.holding_shipper.full_name if waybill.holding_shipper else "Chưa có")
    
    if target_type == 'HUB':
        waybill.holding_hub_id = target_id
        waybill.holding_shipper_id = None
        db.flush()
        # Query target hub directly to avoid cached relationship issues
        target_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == target_id).first()
        new_holder = "Kho " + (target_hub.hub_name if target_hub else f"ID {target_id}")
    elif target_type == 'SHIPPER':
        waybill.holding_shipper_id = target_id
        waybill.holding_hub_id = None
        db.flush()
        # Query target shipper directly to avoid cached relationship issues
        target_shipper = db.query(models.Users).filter(models.Users.user_id == target_id).first()
        new_holder = "Bưu tá " + (target_shipper.full_name if target_shipper else f"ID {target_id}")
    else:
        return None

    # Ghi log hoạt động nội bộ
    action_desc = f"Điều chuyển quyền giữ thư từ '{old_holder}' sang '{new_holder}'. Lý do: {reason}."
    if note:
        action_desc += f" Ghi chú: {note}"
        
    log_activity(db, waybill.waybill_id, user_id, action_desc, ip_address, device_info)
    
    # Ghi hành trình tracking log cho KH xem
    new_log = models.TrackingLogs(
        waybill_id=waybill.waybill_id,
        status_id=waybill.status,
        hub_id=hub_id or waybill.holding_hub_id or waybill.origin_hub_id,
        user_id=user_id,
        note=f"Đơn hàng được điều chuyển sang {new_holder}",
        system_time=datetime.utcnow()
    )
    db.add(new_log)
    db.flush()
    return waybill
