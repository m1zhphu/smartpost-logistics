from sqlalchemy.orm import Session
from datetime import datetime
import models
from core.state_machine import WaybillStatus

# --- CÁC HÀM TRUY VẤN MỚI CHUYỂN TỪ API SANG ---

def get_pending_waybills_for_hub(db: Session, hub_id: int = None):
    """Lấy danh sách đơn chờ phân công giao hàng"""
    query = db.query(models.Waybills).filter(models.Waybills.status.in_(["ARRIVED", "IN_HUB"]))
    if hub_id is not None:
        query = query.filter(models.Waybills.dest_hub_id == hub_id)
    return query.all()

def get_active_shipper(db: Session, shipper_id: int):
    """Lấy thông tin Shipper"""
    return db.query(models.Users).filter(
        models.Users.user_id == shipper_id,
        models.Users.role_id == 4
    ).first()

def get_tasks_for_shipper(db: Session, shipper_id: int):
    """Lấy danh sách đơn hàng đang đi giao của 1 shipper"""
    return db.query(models.Waybills).join(models.DeliveryResults).filter(
        models.Waybills.status == WaybillStatus.DELIVERING,
        models.DeliveryResults.shipper_id == shipper_id
    ).order_by(models.DeliveryResults.delivery_id.desc()).all()

def get_latest_delivery_record(db: Session, waybill_id: int):
    """Lấy bản ghi giao hàng mới nhất của 1 vận đơn"""
    return db.query(models.DeliveryResults).filter(
        models.DeliveryResults.waybill_id == waybill_id
    ).order_by(models.DeliveryResults.delivery_id.desc()).first()

def scan_overdue_waybills(db: Session):
    """Tìm và gắn cờ cảnh báo cho các đơn giao quá 24h (Chuyển từ API sang)"""
    from datetime import datetime, timedelta
    deadline = datetime.utcnow() - timedelta(hours=24)
    
    overdue_waybills = db.query(models.Waybills).join(
        models.TrackingLogs, 
        models.Waybills.waybill_id == models.TrackingLogs.waybill_id
    ).filter(
        models.Waybills.status == WaybillStatus.DELIVERING,
        models.TrackingLogs.status_id == WaybillStatus.DELIVERING,
        models.TrackingLogs.system_time <= deadline
    ).all()

    updated_count = 0
    for wb in overdue_waybills:
        existing_warning = db.query(models.TrackingLogs).filter(
            models.TrackingLogs.waybill_id == wb.waybill_id,
            models.TrackingLogs.status_id == "OVERDUE_WARNING",
            models.TrackingLogs.system_time > deadline
        ).first()

        if not existing_warning:
            db.add(models.TrackingLogs(
                waybill_id=wb.waybill_id,
                status_id="OVERDUE_WARNING",
                note="CẢNH BÁO: Đơn hàng giao quá 24 giờ chưa có cập nhật!",
                system_time=datetime.utcnow()
            ))
            updated_count += 1
            
    db.commit()
    return updated_count

# --- CÁC HÀM CŨ ĐÃ CÓ (GIỮ NGUYÊN) ---

def get_waybill_by_code(db: Session, code: str):
    return db.query(models.Waybills).filter(models.Waybills.waybill_code == code).first()

def assign_shipper_to_waybill(db: Session, waybill: models.Waybills, shipper_id: int, user_id: int, hub_id: int):
    """Thực hiện phân công shipper với Optimistic Locking"""
    current_version = waybill.version
    
    affected_rows = db.query(models.Waybills).filter(
        models.Waybills.waybill_id == waybill.waybill_id,
        models.Waybills.version == current_version
    ).update({
        "status": WaybillStatus.DELIVERING,
        "version": current_version + 1,
        "holding_shipper_id": shipper_id,
        "holding_hub_id": None
    })

    if affected_rows > 0:
        db.add(models.DeliveryResults(
            waybill_id=waybill.waybill_id,
            shipper_id=shipper_id,
            status=WaybillStatus.DELIVERING,
            delivery_time=datetime.utcnow()
        ))

        db.add(models.TrackingLogs(
            waybill_id=waybill.waybill_id,
            status_id=WaybillStatus.DELIVERING,
            hub_id=hub_id,
            user_id=user_id,
            system_time=datetime.utcnow(),
            note=f"Đã phân công cho Shipper ID: {shipper_id}"
        ))
    return affected_rows


def reassign_waybill(db: Session, waybill: models.Waybills, new_hub_id: int = None, new_shipper_id: int = None, reason: str = None, note: str = None, user_id: int = None):
    """Điều chuyển vận đơn giữa hub hoặc shipper và ghi log hành động"""
    if not waybill:
        return None

    if new_hub_id is None and new_shipper_id is None:
        return None

    if new_hub_id is not None:
        waybill.holding_hub_id = new_hub_id
        waybill.holding_shipper_id = None
    if new_shipper_id is not None:
        waybill.holding_shipper_id = new_shipper_id
        waybill.holding_hub_id = None

    db.add(models.TrackingLogs(
        waybill_id=waybill.waybill_id,
        status_id="REASSIGNED",
        hub_id=new_hub_id,
        user_id=user_id,
        system_time=datetime.utcnow(),
        note=f"Điều chuyển: {reason or 'Không rõ lý do'}. {note or ''}".strip()
    ))
    db.flush()
    return waybill


def save_shipper_location(db: Session, shipper_id: int, latitude: float, longitude: float, timestamp: datetime, accuracy: float = None, note: str = None):
    """Lưu vị trí GPS của shipper. Hiện tại lưu mock vào TrackingLogs"""
    db.add(models.TrackingLogs(
        waybill_id=None,
        status_id="GPS_LOCATION",
        user_id=shipper_id,
        system_time=datetime.utcnow(),
        action_time=timestamp,
        note=f"GPS: {latitude},{longitude} acc={accuracy}. {note or ''}".strip()
    ))
    db.flush()
    return {
        "shipper_id": shipper_id,
        "latitude": latitude,
        "longitude": longitude,
        "timestamp": timestamp,
        "accuracy": accuracy,
        "note": note
    }

def confirm_delivery_record(db: Session, waybill: models.Waybills, actual_cod: float, pod_url: str, user_id: int, hub_id: int, note: str):
    """Cập nhật trạng thái giao thành công và thực thu COD"""
    waybill.status = WaybillStatus.DELIVERED
    waybill.version += 1

    delivery_record = db.query(models.DeliveryResults).filter(
        models.DeliveryResults.waybill_id == waybill.waybill_id
    ).order_by(models.DeliveryResults.delivery_id.desc()).first()
    
    if delivery_record:
        delivery_record.actual_cod_collected = actual_cod
        delivery_record.pod_image_url = pod_url
        delivery_record.status = WaybillStatus.DELIVERED
        delivery_record.delivery_time = datetime.utcnow()
        delivery_record.note = f"Giao thành công bởi Shipper ID {delivery_record.shipper_id}"
        
    db.add(models.TrackingLogs(
        waybill_id=waybill.waybill_id,
        status_id=WaybillStatus.DELIVERED,
        hub_id=hub_id,
        user_id=user_id,
        system_time=datetime.utcnow(),
        note=note
    ))
    return waybill

def report_delivery_failure(db: Session, waybill: models.Waybills, reason_code: str, user_id: int, note: str):
    """Cập nhật trạng thái giao thất bại và ghi log lý do"""
    current_version = waybill.version
    
    affected = db.query(models.Waybills).filter(
        models.Waybills.waybill_id == waybill.waybill_id,
        models.Waybills.version == current_version
    ).update({
        "status": "DELIVERY_FAILED",
        "version": current_version + 1
    })

    if affected > 0:
        db.add(models.TrackingLogs(
            waybill_id=waybill.waybill_id,
            status_id="DELIVERY_FAILED",
            user_id=user_id,
            system_time=datetime.utcnow(),
            note=f"Giao thất bại. Lý do: {reason_code}. Ghi chú: {note}"
        ))
    return affected

# --- PICKUP REQUEST (BOOKING REQUEST) CRUD OPERATIONS ---
import schemas.delivery as schema_delivery

def create_booking_request(db: Session, data: schema_delivery.BookingRequestCreate, creator_id: int) -> models.BookingRequests:
    import random
    from datetime import datetime
    today = datetime.utcnow().strftime("%Y%m%d")
    rand_seq = random.randint(1000, 9999)
    req_code = f"PKR-{today}-{rand_seq}"
    
    sender_phone = data.sender_phone
    pickup_address = data.pickup_address
    target_hub_id = data.target_hub_id
    
    if data.customer_id:
        cust = db.query(models.Customers).filter(models.Customers.customer_id == data.customer_id).first()
        if cust:
            if not sender_phone:
                sender_phone = cust.phone_number
            if not pickup_address:
                addr_parts = []
                if cust.address_detail: addr_parts.append(cust.address_detail)
                pickup_address = cust.address_detail or ""
                
    db_req = models.BookingRequests(
        request_code=req_code,
        source=data.source,
        shop_order_code=data.shop_order_code,
        customer_id=data.customer_id,
        sender_phone=sender_phone,
        pickup_address=pickup_address,
        target_hub_id=target_hub_id,
        product_type=data.product_type,
        est_weight=data.est_weight,
        is_vehicle_required=data.is_vehicle_required,
        status="WAIT_PICKUP",
        est_quantity=data.est_quantity,
        priority=data.priority,
        sla_deadline=data.sla_deadline,
        notes=data.notes
    )
    db.add(db_req)
    db.flush()
    
    db.add(models.BookingRequestLogs(
        request_id=db_req.request_id,
        user_id=creator_id,
        action="Tạo yêu cầu lấy hàng",
        note=f"Khởi tạo từ nguồn {data.source}"
    ))
    
    return db_req

def get_booking_request_by_code(db: Session, code: str) -> models.BookingRequests:
    return db.query(models.BookingRequests).filter(models.BookingRequests.request_code == code).first()

def get_booking_requests(db: Session, status: str = None, assigned_shipper_id: int = None, hub_id: int = None) -> list[models.BookingRequests]:
    query = db.query(models.BookingRequests)
    if status:
        query = query.filter(models.BookingRequests.status == status)
    if assigned_shipper_id:
        query = query.filter(models.BookingRequests.assigned_shipper_id == assigned_shipper_id)
    if hub_id:
        query = query.filter(models.BookingRequests.target_hub_id == hub_id)
    return query.all()


def get_online_pickup_requests(db: Session, status: str = None, hub_id: int = None) -> list[models.BookingRequests]:
    query = db.query(models.BookingRequests).filter(models.BookingRequests.source == "PORTAL")
    if status:
        query = query.filter(models.BookingRequests.status == status)
    if hub_id:
        query = query.filter(models.BookingRequests.target_hub_id == hub_id)
    return query.order_by(models.BookingRequests.request_id.desc()).all()


def mobile_pickup_task_payload(db_req: models.BookingRequests) -> dict:
    waybill = db_req.waybills[0] if db_req.waybills else None
    hub = db_req.target_hub
    shipper = db_req.assigned_shipper
    customer = db_req.customer
    created_at = None
    if db_req.logs:
        created_at = min((log.created_at for log in db_req.logs if log.created_at), default=None)

    return {
        "request_id": db_req.request_id,
        "request_code": db_req.request_code,
        "waybill_id": waybill.waybill_id if waybill else None,
        "waybill_code": waybill.waybill_code if waybill else None,
        "bill_code": waybill.waybill_code if waybill else None,
        "pickup_status": db_req.status,
        "waybill_status": waybill.status if waybill else None,
        "shop_order_code": db_req.shop_order_code,
        "customer_id": db_req.customer_id,
        "customer_code": customer.customer_code if customer else None,
        "customer_name": (customer.company_name or customer.transaction_name) if customer else None,
        "sender_name": waybill.sender_name if waybill else None,
        "sender_phone": db_req.sender_phone or (waybill.sender_phone if waybill else None),
        "pickup_address": db_req.pickup_address or (waybill.sender_address if waybill else None),
        "receiver_name": waybill.receiver_name if waybill else None,
        "receiver_phone": waybill.receiver_phone if waybill else None,
        "receiver_address": waybill.receiver_address if waybill else None,
        "target_hub_id": db_req.target_hub_id,
        "target_hub_name": hub.hub_name if hub else None,
        "assigned_shipper_id": db_req.assigned_shipper_id,
        "assigned_shipper_name": shipper.full_name if shipper else None,
        "product_type": db_req.product_type,
        "product_name": waybill.product_name if waybill else db_req.product_type,
        "est_weight": float(db_req.est_weight) if db_req.est_weight is not None else None,
        "est_quantity": db_req.est_quantity,
        "cod_amount": float(waybill.cod_amount or 0) if waybill else 0,
        "payment_method": waybill.payment_method if waybill else None,
        "service_type": waybill.service_type if waybill else None,
        "note": db_req.notes or (waybill.note if waybill else None),
        "pickup_image_url": waybill.pickup_image_url if waybill else None,
        "price_status": waybill.price_status if waybill else None,
        "estimated_shipping_fee": float((waybill.estimated_shipping_fee or waybill.shipping_fee or 0) if waybill else 0),
        "estimated_total_amount": float((waybill.estimated_total_amount or 0) if waybill else 0),
        "final_shipping_fee": float(waybill.final_shipping_fee) if waybill and waybill.final_shipping_fee is not None else None,
        "final_total_amount": float(waybill.final_total_amount) if waybill and waybill.final_total_amount is not None else None,
        "requested_pickup_time": db_req.requested_pickup_time,
        "pickup_assigned_at": db_req.pickup_assigned_at,
        "created_at": created_at,
    }


def get_mobile_pickup_tasks_for_shipper(db: Session, shipper_id: int, status: str = None) -> list[dict]:
    query = db.query(models.BookingRequests).filter(
        models.BookingRequests.source == "PORTAL",
        models.BookingRequests.assigned_shipper_id == shipper_id,
    )
    if status:
        query = query.filter(models.BookingRequests.status == status)
    else:
        query = query.filter(models.BookingRequests.status.in_(["ASSIGNED_PICKUP", "PICKED"]))
    rows = query.order_by(models.BookingRequests.pickup_assigned_at.desc().nullslast(), models.BookingRequests.request_id.desc()).all()
    return [mobile_pickup_task_payload(row) for row in rows]


def get_mobile_pickup_task_for_shipper(db: Session, shipper_id: int, code: str):
    db_req = db.query(models.BookingRequests).filter(
        models.BookingRequests.source == "PORTAL",
        models.BookingRequests.request_code == code,
        models.BookingRequests.assigned_shipper_id == shipper_id,
    ).first()
    if not db_req:
        return None
    return mobile_pickup_task_payload(db_req)


def get_request_waybill(db: Session, request_id: int):
    return db.query(models.Waybills).filter(
        models.Waybills.request_id == request_id,
        models.Waybills.is_deleted == False,
    ).first()


def confirm_online_pickup_hub(db: Session, db_req: models.BookingRequests, hub_id: int, user_id: int, note: str = None):
    waybill = get_request_waybill(db, db_req.request_id)
    now = datetime.utcnow()
    db_req.status = "RECEIVED"
    db_req.target_hub_id = hub_id
    db_req.confirmed_by_user_id = user_id
    db_req.confirmed_at = now

    if waybill:
        waybill.origin_hub_id = hub_id
        waybill.holding_hub_id = hub_id
        waybill.holding_shipper_id = None
        waybill.status = WaybillStatus.CREATED
        waybill.version = (waybill.version or 1) + 1
        db.add(models.TrackingLogs(
            waybill_id=waybill.waybill_id,
            status_id=waybill.status,
            hub_id=hub_id,
            user_id=user_id,
            system_time=now,
            note=note or "Quan tri vien da xac nhan van phong nhan hang",
        ))

    db.add(models.BookingRequestLogs(
        request_id=db_req.request_id,
        user_id=user_id,
        action="Xac nhan van phong nhan hang",
        note=note or f"Van phong nhan ID: {hub_id}",
    ))
    return db_req, waybill

def assign_shipper_to_pickup(db: Session, db_req: models.BookingRequests, shipper_id: int, user_id: int) -> models.BookingRequests:
    db_req.status = "ASSIGNED_PICKUP"
    db_req.assigned_shipper_id = shipper_id
    
    db.add(models.BookingRequestLogs(
        request_id=db_req.request_id,
        user_id=user_id,
        action="Gán bưu tá lấy hàng",
        note=f"Giao cho Bưu tá ID: {shipper_id}"
    ))
    return db_req


def assign_shipper_to_online_pickup(db: Session, db_req: models.BookingRequests, shipper_id: int, user_id: int, note: str = None):
    now = datetime.utcnow()
    waybill = get_request_waybill(db, db_req.request_id)
    db_req.status = "ASSIGNED_PICKUP"
    db_req.assigned_shipper_id = shipper_id
    db_req.pickup_assigned_by_user_id = user_id
    db_req.pickup_assigned_at = now

    if waybill:
        waybill.holding_shipper_id = shipper_id
        waybill.status = WaybillStatus.CREATED
        waybill.version = (waybill.version or 1) + 1
        db.add(models.TrackingLogs(
            waybill_id=waybill.waybill_id,
            status_id=waybill.status,
            hub_id=db_req.target_hub_id,
            user_id=user_id,
            system_time=now,
            note=note or f"Da gan buu ta ID {shipper_id} di lay hang",
        ))

    db.add(models.BookingRequestLogs(
        request_id=db_req.request_id,
        user_id=user_id,
        action="Gan buu ta di lay hang",
        note=note or f"Buu ta ID: {shipper_id}",
    ))
    return db_req, waybill


def mark_online_pickup_picked(db: Session, db_req: models.BookingRequests, user_id: int, pickup_image_url: str = None, note: str = None):
    now = datetime.utcnow()
    waybill = get_request_waybill(db, db_req.request_id)
    db_req.status = "PICKED"

    if waybill:
        waybill.status = WaybillStatus.PICKED_PENDING_VERIFY
        waybill.pickup_image_url = pickup_image_url or waybill.pickup_image_url
        waybill.version = (waybill.version or 1) + 1
        db.add(models.TrackingLogs(
            waybill_id=waybill.waybill_id,
            status_id=WaybillStatus.PICKED_PENDING_VERIFY,
            hub_id=db_req.target_hub_id,
            user_id=user_id,
            system_time=now,
            note=note or "Buu ta da lay hang, cho xac thuc tai buu cuc",
        ))

    db.add(models.BookingRequestLogs(
        request_id=db_req.request_id,
        user_id=user_id,
        action="Da lay hang",
        note=note or "Buu ta xac nhan da lay hang",
    ))
    return db_req, waybill


# --- NEW: REASSIGN & LOCATION OPERATIONS ---

def reassign_waybill(db: Session, waybill: models.Waybills, new_hub_id: int = None, new_shipper_id: int = None, user_id: int = None, reason: str = "", note: str = ""):
    """Điều chuyển vận đơn sang hub/shipper khác"""
    old_holder = None
    new_holder = None
    
    # Lưu holder cũ để log
    if waybill.holding_shipper_id and waybill.holding_shipper:
        old_holder = waybill.holding_shipper.full_name
    elif waybill.holding_hub_id and waybill.holding_hub:
        old_holder = waybill.holding_hub.hub_name
    
    # Cập nhật holder mới
    if new_shipper_id:
        waybill.holding_shipper_id = new_shipper_id
        waybill.holding_hub_id = None
        shipper = db.query(models.Users).filter(models.Users.user_id == new_shipper_id).first()
        new_holder = shipper.full_name if shipper else f"Shipper {new_shipper_id}"
    elif new_hub_id:
        waybill.holding_hub_id = new_hub_id
        waybill.holding_shipper_id = None
        hub = db.query(models.Hubs).filter(models.Hubs.hub_id == new_hub_id).first()
        new_holder = hub.hub_name if hub else f"Hub {new_hub_id}"
    
    waybill.version += 1
    
    # Ghi log
    log_note = f"Điều chuyển từ {old_holder} sang {new_holder}. Lý do: {reason}"
    if note:
        log_note += f". Ghi chú: {note}"
    
    db.add(models.TrackingLogs(
        waybill_id=waybill.waybill_id,
        status_id=waybill.status,
        hub_id=waybill.holding_hub_id,
        user_id=user_id,
        system_time=datetime.utcnow(),
        note=log_note
    ))
    
    return waybill, new_holder


def save_shipper_location(db: Session, shipper_id: int, latitude: float, longitude: float, accuracy: float = None, note: str = ""):
    """Lưu vị trí GPS của Shipper"""
    # Kiểm tra xem Shipper có tồn tại không
    shipper = db.query(models.Users).filter(
        models.Users.user_id == shipper_id,
        models.Users.role_id == 4
    ).first()
    
    if not shipper:
        return False, "Không tìm thấy Shipper"
    
    # Lưu vị trí vào log hoặc bảng tracking (tùy yêu cầu)
    # Tạm sử dụng TrackingLogs để lưu vị trí
    location_data = {
        "latitude": latitude,
        "longitude": longitude,
        "accuracy": accuracy,
        "note": note
    }
    
    # Tìm các đơn hàng đang giao của shipper để liên kết
    active_waybills = db.query(models.Waybills).join(models.DeliveryResults).filter(
        models.DeliveryResults.shipper_id == shipper_id,
        models.Waybills.status == WaybillStatus.DELIVERING
    ).all()
    
    # Ghi log vị trí cho các đơn hàng đang giao
    logged_count = 0
    for wb in active_waybills:
        db.add(models.TrackingLogs(
            waybill_id=wb.waybill_id,
            status_id=wb.status,
            hub_id=None,  # Shipper không có hub
            user_id=shipper_id,
            system_time=datetime.utcnow(),
            note=f"[GPS] Vị trí: ({latitude}, {longitude}). Độ chính xác: {accuracy}m. {note if note else ''}"
        ))
        logged_count += 1
    
    return True, f"Đã lưu vị trí cho {logged_count} đơn hàng"
