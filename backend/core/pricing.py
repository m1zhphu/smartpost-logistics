from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import models
from fastapi import HTTPException
from typing import Optional, Tuple

import crud.pricing as crud_pricing

def calculate_shipping_fee(db: Session, origin_hub_id: int, dest_hub_id: int, weight: float, service_type: str, customer_id: int = None):
    """
    Tra cứu bảng giá dựa trên Tỉnh đi -> Tỉnh đến và Nấc khối lượng theo chuẩn 3 lớp (Exact -> Zone -> Fallback)
    """
    # 1. Lấy thông tin Tỉnh của Hub đi và Hub đến
    origin_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == origin_hub_id).first()
    dest_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == dest_hub_id).first()

    if not origin_hub or not dest_hub:
        raise HTTPException(status_code=400, detail="Không xác định được bưu cục gửi hoặc nhận để tính giá.")

    policy_id = 1
    if customer_id:
        policy_id = crud_pricing.get_customer_policy_id(db, customer_id)

    # 2. Tìm quy tắc giá khớp với ma trận Tỉnh, Dịch vụ và Khối lượng (Lớp 1 & Lớp 2)
    rule = crud_pricing.get_pricing_rule_exact(
        db, origin_hub.province_id, dest_hub.province_id, service_type, weight, policy_id
    )

    if not rule:
        # Lớp 3: Tìm quy tắc thay thế (Fallback) lấy nấc lớn nhất của tuyến đó
        rule = crud_pricing.get_pricing_rule_fallback(
            db, origin_hub.province_id, dest_hub.province_id, service_type, policy_id
        )

    # 3. Logic xử lý kết quả
    if not rule:
        # Fail-safe cuối cùng: Nếu hoàn toàn không có cấu hình nào cho tuyến này
        base_fee = 20000.0
        if weight <= 1.0:
            return base_fee
        return base_fee + (weight - 1.0) * 5000.0

    return float(rule.price)


# ======== SLA CALCULATION HELPERS ========

def calculate_sla_status(waybill: models.Waybills) -> Tuple[str, Optional[float]]:
    """
    Tính toán SLA status và số giờ còn lại
    
    Returns: (sla_status, remaining_hours)
    - sla_status: 'ON_TIME', 'WARNING', 'OVERDUE'
    - remaining_hours: Số giờ còn lại (None nếu đã hoàn thành hoặc không thể xác định)
    """
    now = datetime.utcnow()

    # Nếu đơn đã giao hoặc đã settle, xem như hoàn thành đúng hạn
    if waybill.status in ["DELIVERED", "SETTLED", "RETURNED", "CANCELLED"]:
        return "ON_TIME", None

    sla_deadline = waybill.sla_deadline
    if not sla_deadline and getattr(waybill, 'created_at', None):
        service = str(getattr(waybill, 'service_type', 'STANDARD') or 'STANDARD').upper()
        hours = 24
        if service in ('HT', 'FAST', 'EXPRESS'):
            hours = 4
        elif service in ('CPN', 'EXPRESS_STANDARD'):
            hours = 12
        elif service in ('TK', 'ECONOMY'):
            hours = 48
        sla_deadline = waybill.created_at + timedelta(hours=hours)

    if not sla_deadline:
        return "ON_TIME", None

    time_diff = (sla_deadline - now).total_seconds()
    remaining_hours = max(0.0, time_diff / 3600)

    if time_diff < 0:
        return "OVERDUE", 0.0
    if remaining_hours <= 4:
        return "WARNING", remaining_hours
    return "ON_TIME", remaining_hours


def get_waybill_current_holder(waybill: models.Waybills) -> Optional[str]:
    """
    Xác định đơn vị/người đang giữ vận đơn
    """
    if waybill.holding_shipper_id and waybill.holding_shipper:
        return waybill.holding_shipper.full_name
    elif waybill.holding_hub_id and waybill.holding_hub:
        return waybill.holding_hub.hub_name
    elif waybill.dest_hub:
        return waybill.dest_hub.hub_name
    elif waybill.origin_hub:
        return waybill.origin_hub.hub_name
    return "Hệ thống"


def get_waybill_action_by(db: Session, waybill: models.Waybills) -> Optional[str]:
    """
    Lấy tên người/đơn vị thực hiện hành động cuối cùng trên vận đơn
    """
    try:
        latest_log = db.query(models.TrackingLogs).filter(
            models.TrackingLogs.waybill_id == waybill.waybill_id
        ).order_by(models.TrackingLogs.system_time.desc()).first()
        
        if latest_log:
            if latest_log.user_id:
                user = db.query(models.Users).filter(models.Users.user_id == latest_log.user_id).first()
                if user:
                    return user.full_name
            if latest_log.hub_id:
                hub = db.query(models.Hubs).filter(models.Hubs.hub_id == latest_log.hub_id).first()
                if hub:
                    return hub.hub_name
    except:
        pass
    
    return None