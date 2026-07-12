from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import models
from fastapi import HTTPException
from typing import Optional, Tuple

import crud.pricing as crud_pricing

SERVICE_TYPE_ALIASES = {
    "STANDARD": "TK",
    "ECONOMY": "TK",
    "SAVING": "TK",
    "FAST": "CPN",
    "EXPRESS_STANDARD": "CPN",
    "EXPRESS": "HT",
    "URGENT": "HT",
}

def normalize_service_type(service_type: str | None) -> str:
    service = str(service_type or "TK").upper().strip()
    return SERVICE_TYPE_ALIASES.get(service, service)

def _resolve_policy_id(db: Session, customer_id: int = None) -> int:
    if customer_id:
        return crud_pricing.get_customer_policy_id(db, customer_id)
    return 1


def _find_pricing_rule(db: Session, origin_province_id: int, dest_province_id: int, weight: float, service_type: str, policy_id: int = 1):
    rule = crud_pricing.get_pricing_rule_exact(
        db, origin_province_id, dest_province_id, service_type, weight, policy_id
    )
    if not rule:
        rule = crud_pricing.get_pricing_rule_fallback(
            db, origin_province_id, dest_province_id, service_type, policy_id
        )
    return rule


def calculate_shipping_fee_detail(
    db: Session,
    *,
    origin_hub_id: int | None = None,
    dest_hub_id: int | None = None,
    origin_province_id: int | None = None,
    dest_province_id: int | None = None,
    weight: float,
    service_type: str,
    customer_id: int = None,
    extra_service_codes: list[str] | None = None,
    cod_amount: float = 0,
    declared_value: float = 0,
    quantity: int = 1,
    packing_type: str | None = None,
    dest_district_id: int | None = None,
    dest_ward_id: int | None = None,
) -> dict:
    if origin_hub_id:
        origin_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == origin_hub_id).first()
        if not origin_hub:
            raise HTTPException(status_code=400, detail="Khong xac dinh duoc buu cuc gui de tinh gia.")
        origin_province_id = origin_hub.province_id or origin_province_id
    if dest_hub_id:
        dest_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == dest_hub_id).first()
        if not dest_hub:
            raise HTTPException(status_code=400, detail="Khong xac dinh duoc buu cuc nhan de tinh gia.")
        dest_province_id = dest_hub.province_id or dest_province_id

    if not origin_province_id or not dest_province_id:
        raise HTTPException(status_code=400, detail="Khong xac dinh duoc tinh/thanh gui hoac nhan de tinh gia.")

    charge_weight = max(float(weight or 0), 0.01)
    policy_id = _resolve_policy_id(db, customer_id)
    normalized_service_type = normalize_service_type(service_type)
    rule = _find_pricing_rule(db, origin_province_id, dest_province_id, charge_weight, normalized_service_type, policy_id)

    if not rule:
        base_fee = 20000.0
        main_fee = base_fee if charge_weight <= 1.0 else base_fee + (charge_weight - 1.0) * 5000.0
        fuel_surcharge = 0.0
        vat_percent = 8.0
        rule_id = None
        pricing_method = "FALLBACK"
    else:
        fee_detail = crud_pricing.calculate_rule_shipping_fee(rule, charge_weight)
        main_fee = float(fee_detail["main_fee"])
        fuel_surcharge = float(fee_detail["fuel_surcharge"])
        vat_percent = float(rule.vat_percent or 0)
        rule_id = rule.rule_id
        pricing_method = rule.pricing_method

    extra_fee = 0.0
    service_codes = [str(code).upper() for code in (extra_service_codes or []) if code]
    if service_codes:
        service_map = {s.service_code.upper(): s for s in crud_pricing.get_active_service_configs(db)}
        for code in service_codes:
            config = service_map.get(code)
            if config:
                extra_fee += crud_pricing.calculate_extra_service_fee(
                    config,
                    cod_amount=float(cod_amount or 0),
                    declared_value=float(declared_value or 0),
                    main_fee=main_fee,
                    quantity=quantity,
                )

    packing_fee = 0.0
    added_weight = 0.0
    if packing_type:
        packing_rule = crud_pricing.get_packing_rule_for_weight(db, packing_type, charge_weight)
        if packing_rule:
            packing_fee = float(packing_rule.packing_fee or 0)
            added_weight = float(packing_rule.added_weight or 0)

    remote_fee = 0.0
    if dest_province_id and dest_district_id and dest_ward_id:
        remote_fee = crud_pricing.get_remote_area_fee(db, dest_province_id, dest_district_id, dest_ward_id)

    taxable_amount = main_fee + fuel_surcharge + extra_fee + packing_fee + remote_fee
    vat_amount = round(taxable_amount * (vat_percent / 100), 0)
    total_amount = taxable_amount + vat_amount

    return {
        "main_fee": main_fee,
        "shipping_fee": main_fee,
        "fuel_surcharge": fuel_surcharge,
        "extra_services_fee": extra_fee,
        "packing_fee": packing_fee,
        "added_weight": added_weight,
        "remote_fee": remote_fee,
        "vat_amount": vat_amount,
        "total_amount": total_amount,
        "chargeable_weight": charge_weight,
        "rule_id": rule_id,
        "pricing_method": pricing_method,
        "service_type": normalized_service_type,
        "price_status": "ESTIMATED",
    }


def calculate_shipping_fee(db: Session, origin_hub_id: int, dest_hub_id: int, weight: float, service_type: str, customer_id: int = None):
    """
    Tra cứu bảng giá dựa trên Tỉnh đi -> Tỉnh đến và Nấc khối lượng theo chuẩn 3 lớp (Exact -> Zone -> Fallback)
    """
    # 1. Lấy thông tin Tỉnh của Hub đi và Hub đến
    origin_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == origin_hub_id).first()
    dest_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == dest_hub_id).first()

    if not origin_hub or not dest_hub:
        raise HTTPException(status_code=400, detail="Không xác định được bưu cục gửi hoặc nhận để tính giá.")

    policy_id = _resolve_policy_id(db, customer_id)

    # 2. Tìm quy tắc giá khớp với ma trận Tỉnh, Dịch vụ và Khối lượng (Lớp 1 & Lớp 2)
    normalized_service_type = normalize_service_type(service_type)
    rule = crud_pricing.get_pricing_rule_exact(
        db, origin_hub.province_id, dest_hub.province_id, normalized_service_type, weight, policy_id
    )

    if not rule:
        # Lớp 3: Tìm quy tắc thay thế (Fallback) lấy nấc lớn nhất của tuyến đó
        rule = crud_pricing.get_pricing_rule_fallback(
            db, origin_hub.province_id, dest_hub.province_id, normalized_service_type, policy_id
        )

    # 3. Logic xử lý kết quả
    if not rule:
        # Fail-safe cuối cùng: Nếu hoàn toàn không có cấu hình nào cho tuyến này
        base_fee = 20000.0
        if weight <= 1.0:
            return base_fee
        return base_fee + (weight - 1.0) * 5000.0

    return crud_pricing.calculate_rule_shipping_fee(rule, weight)["main_fee"]


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

    # Ngưỡng cảnh báo sắp trễ linh hoạt theo dịch vụ
    service = str(getattr(waybill, 'service_type', 'STANDARD') or 'STANDARD').upper()
    warning_threshold = 4.0  # Mặc định 4 tiếng
    if service in ('HT', 'FAST', 'EXPRESS'):
        warning_threshold = 1.0  # Hỏa tốc chỉ cảnh báo khi còn <= 1 tiếng
    elif service in ('CPN', 'EXPRESS_STANDARD'):
        warning_threshold = 3.0  # CPN cảnh báo khi còn <= 3 tiếng

    if remaining_hours <= warning_threshold:
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
