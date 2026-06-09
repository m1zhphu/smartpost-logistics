from sqlalchemy.orm import Session
import math
import models

# ==========================================
# PHẦN 1: QUẢN LÝ BẢNG GIÁ CHÍNH (RULES)
# ==========================================

def create_rule(db: Session, data: dict):
    mapped_data = data.copy()
    mapped_data.pop('origin_hub_id', None)
    mapped_data.pop('dest_hub_id', None)

    if not mapped_data.get('zone_name') and (
        not mapped_data.get('from_province_id') or not mapped_data.get('to_province_id')
    ):
        return None

    existing_query = db.query(models.PricingRules).filter(
        models.PricingRules.service_type == mapped_data['service_type'],
        models.PricingRules.min_weight == mapped_data['min_weight'],
        models.PricingRules.max_weight == mapped_data['max_weight'],
        models.PricingRules.policy_id == mapped_data.get('policy_id', 1)
    )
    if mapped_data.get('zone_name'):
        existing_query = existing_query.filter(models.PricingRules.zone_name == mapped_data['zone_name'])
    else:
        existing_query = existing_query.filter(
            models.PricingRules.from_province_id == mapped_data['from_province_id'],
            models.PricingRules.to_province_id == mapped_data['to_province_id'],
        )
    existing = existing_query.first()
    
    if existing:
        return None 
        
    new_rule = models.PricingRules(**mapped_data)
    db.add(new_rule)
    db.flush()
    db.refresh(new_rule)
    return format_rule_with_hub(db, new_rule)

def get_all_rules(db: Session):
    rules = db.query(models.PricingRules).all()
    return [format_rule_with_hub(db, r) for r in rules]

def get_all_policies(db: Session, active_only: bool = True):
    query = db.query(models.PricingPolicies)
    if active_only:
        query = query.filter(models.PricingPolicies.is_active == True)
    return query.order_by(models.PricingPolicies.policy_id.asc()).all()

def get_policy_by_id(db: Session, policy_id: int):
    return db.query(models.PricingPolicies).filter(
        models.PricingPolicies.policy_id == policy_id
    ).first()

def get_policy_by_code(db: Session, policy_code: str):
    return db.query(models.PricingPolicies).filter(
        models.PricingPolicies.policy_code == policy_code
    ).first()

def create_policy(db: Session, data: dict):
    existing = get_policy_by_code(db, data["policy_code"])
    if existing:
        return None

    policy = models.PricingPolicies(**data)
    db.add(policy)
    db.flush()
    db.refresh(policy)
    return policy

def update_policy(db: Session, policy_id: int, data: dict):
    policy = get_policy_by_id(db, policy_id)
    if not policy:
        return None

    duplicate = db.query(models.PricingPolicies).filter(
        models.PricingPolicies.policy_code == data["policy_code"],
        models.PricingPolicies.policy_id != policy_id
    ).first()
    if duplicate:
        return None

    for key, value in data.items():
        setattr(policy, key, value)

    db.flush()
    db.refresh(policy)
    return policy

def format_rule_with_hub(db: Session, rule: models.PricingRules):
    # Tìm bưu cục đại diện (hoặc bưu cục đầu tiên trong tỉnh) để hiển thị
    origin_hub = db.query(models.Hubs).filter(models.Hubs.province_id == rule.from_province_id).first()
    dest_hub = db.query(models.Hubs).filter(models.Hubs.province_id == rule.to_province_id).first()
    
    rule_dict = {
        "rule_id": rule.rule_id,
        "origin_hub_id": origin_hub.hub_id if origin_hub else 0, # Schema yêu cầu
        "dest_hub_id": dest_hub.hub_id if dest_hub else 0,       # Schema yêu cầu
        "from_province_id": rule.from_province_id,
        "to_province_id": rule.to_province_id,
        "zone_name": rule.zone_name,
        "service_type": rule.service_type,
        "min_weight": rule.min_weight,
        "max_weight": rule.max_weight,
        "price": rule.price,
        "pricing_method": rule.pricing_method,
        "base_weight": rule.base_weight,
        "increment_weight": rule.increment_weight,
        "increment_price": rule.increment_price,
        "fuel_surcharge_percent": rule.fuel_surcharge_percent,
        "vat_percent": rule.vat_percent,
        "is_active": rule.is_active,
        "policy_id": rule.policy_id,
        "origin_hub": {
            "hub_id": origin_hub.hub_id,
            "hub_code": origin_hub.hub_code,
            "hub_name": origin_hub.hub_name
        } if origin_hub else None,
        "dest_hub": {
            "hub_id": dest_hub.hub_id,
            "hub_code": dest_hub.hub_code,
            "hub_name": dest_hub.hub_name
        } if dest_hub else None
    }
    return rule_dict

def update_rule(db: Session, rule_id: int, data: dict):
    rule = db.query(models.PricingRules).filter(models.PricingRules.rule_id == rule_id).first()
    if not rule:
        return None

    mapped_data = data.copy()
    mapped_data.pop('origin_hub_id', None)
    mapped_data.pop('dest_hub_id', None)

    conflict_query = db.query(models.PricingRules).filter(
        models.PricingRules.service_type == mapped_data.get('service_type', rule.service_type),
        models.PricingRules.min_weight == mapped_data.get('min_weight', rule.min_weight),
        models.PricingRules.max_weight == mapped_data.get('max_weight', rule.max_weight),
        models.PricingRules.policy_id == mapped_data.get('policy_id', rule.policy_id),
        models.PricingRules.rule_id != rule_id
    )
    if mapped_data.get('zone_name'):
        conflict_query = conflict_query.filter(models.PricingRules.zone_name == mapped_data['zone_name'])
    else:
        conflict_query = conflict_query.filter(
            models.PricingRules.from_province_id == mapped_data.get('from_province_id', rule.from_province_id),
            models.PricingRules.to_province_id == mapped_data.get('to_province_id', rule.to_province_id),
        )
    conflict = conflict_query.first()

    if conflict:
        return None

    for key, value in mapped_data.items():
        setattr(rule, key, value)
    
    db.flush()
    db.refresh(rule)
    return format_rule_with_hub(db, rule)

def delete_rule(db: Session, rule_id: int):
    rule = db.query(models.PricingRules).filter(models.PricingRules.rule_id == rule_id).first()
    if not rule:
        return False
    db.delete(rule)
    db.flush()
    return True

# ==========================================
# PHẦN 2: TÍNH CƯỚC VÀ DỊCH VỤ TIỆN ÍCH
# (CÁC HÀM MỚI CHUYỂN TỪ API SANG)
# ==========================================

def get_hub_by_id(db: Session, hub_id: int):
    """Tìm thông tin bưu cục để tính toán tuyến đường"""
    return db.query(models.Hubs).filter(models.Hubs.hub_id == hub_id).first()

def get_customer_policy_id(db: Session, customer_id: int) -> int:
    """Lấy policy_id áp dụng cho khách hàng. Mặc định là 1 nếu không có."""
    mapping = db.query(models.CustomerPriceMapping).filter(
        models.CustomerPriceMapping.customer_id == customer_id
    ).first()
    return mapping.policy_id if mapping else 1

def set_customer_policy(db: Session, customer_id: int, policy_id: int):
    mapping = db.query(models.CustomerPriceMapping).filter(
        models.CustomerPriceMapping.customer_id == customer_id
    ).first()
    if mapping:
        mapping.policy_id = policy_id
    else:
        mapping = models.CustomerPriceMapping(customer_id=customer_id, policy_id=policy_id)
        db.add(mapping)
    db.flush()
    return mapping

def clear_customer_policy(db: Session, customer_id: int):
    db.query(models.CustomerPriceMapping).filter(
        models.CustomerPriceMapping.customer_id == customer_id
    ).delete()
    db.flush()

def get_province_zone(db: Session, origin_prov_id: int, dest_prov_id: int) -> str:
    """Lấy Zone mapping cho cặp Tỉnh đi - Tỉnh đến (Mục 6 Đặc tả)"""
    mapping = db.query(models.ProvinceZones).filter(
        models.ProvinceZones.origin_province_id == origin_prov_id,
        models.ProvinceZones.destination_province_id == dest_prov_id
    ).first()
    return mapping.zone_name if mapping else None

def get_pricing_rule_by_zone(db: Session, zone_name: str, service_type: str, weight: float, policy_id: int = 1):
    """Tìm bảng giá theo Zone (Mục 5 Đặc tả)"""
    return db.query(models.PricingRules).filter(
        models.PricingRules.zone_name == zone_name,
        models.PricingRules.service_type == service_type,
        models.PricingRules.min_weight <= weight,
        models.PricingRules.max_weight >= weight,
        models.PricingRules.policy_id == policy_id,
        models.PricingRules.is_active == True
    ).first()

def get_pricing_rule_exact(db: Session, origin_id: int, dest_id: int, service_type: str, weight: float, policy_id: int = 1):
    """Tìm bảng giá với logic 3 lớp: Exact -> Zone -> Fallback"""
    # Lớp 1: Khớp chính xác tỉnh
    rule = db.query(models.PricingRules).filter(
        models.PricingRules.from_province_id == origin_id,
        models.PricingRules.to_province_id == dest_id,
        models.PricingRules.service_type == service_type,
        models.PricingRules.min_weight <= weight,
        models.PricingRules.max_weight >= weight,
        models.PricingRules.policy_id == policy_id,
        models.PricingRules.is_active == True
    ).first()
    
    if rule: return rule
    
    # Lớp 2: Tìm theo Zone mapping (Mục 5 & 6)
    zone_name = get_province_zone(db, origin_id, dest_id)
    if zone_name:
        rule = get_pricing_rule_by_zone(db, zone_name, service_type, weight, policy_id)
        if rule: return rule
        
    return None

def get_pricing_rule_fallback(db: Session, origin_prov: int, dest_prov: int, service_type: str, policy_id: int = 1):
    """Tìm bảng giá thay thế (Lớp 3)"""
    # Thử tìm theo tỉnh trước
    rule = db.query(models.PricingRules).filter(
        models.PricingRules.from_province_id == origin_prov,
        models.PricingRules.to_province_id == dest_prov,
        models.PricingRules.service_type == service_type,
        models.PricingRules.policy_id == policy_id,
        models.PricingRules.is_active == True
    ).order_by(models.PricingRules.max_weight.desc()).first()
    
    if rule: return rule
    
    # Thử tìm theo Zone
    zone_name = get_province_zone(db, origin_prov, dest_prov)
    if zone_name:
        rule = db.query(models.PricingRules).filter(
            models.PricingRules.zone_name == zone_name,
            models.PricingRules.service_type == service_type,
            models.PricingRules.policy_id == policy_id,
            models.PricingRules.is_active == True
        ).order_by(models.PricingRules.max_weight.desc()).first()
        
    return rule

def calculate_rule_shipping_fee(rule: models.PricingRules, charge_weight: float) -> dict:
    base_fee = float(rule.price or 0)
    method = (rule.pricing_method or "FIXED").upper()

    if method == "INCREMENTAL":
        base_weight = float(rule.base_weight or rule.min_weight or 0)
        increment_weight = float(rule.increment_weight or 0)
        increment_price = float(rule.increment_price or 0)

        if charge_weight > base_weight and increment_weight > 0 and increment_price > 0:
            extra_steps = math.ceil((charge_weight - base_weight) / increment_weight)
            base_fee += extra_steps * increment_price

    fuel_surcharge = round(base_fee * (float(rule.fuel_surcharge_percent or 0) / 100), 0)
    taxable_amount = base_fee + fuel_surcharge
    vat = round(taxable_amount * (float(rule.vat_percent or 0) / 100), 0)

    return {
        "main_fee": base_fee,
        "fuel_surcharge": fuel_surcharge,
        "vat": vat,
        "total": taxable_amount + vat,
    }

def get_all_service_configs(db: Session):
    return db.query(models.ServiceConfigs).all()

def get_active_service_configs(db: Session):
    return db.query(models.ServiceConfigs).filter(models.ServiceConfigs.is_active == True).all()

def get_service_config_by_code(db: Session, service_code: str):
    return db.query(models.ServiceConfigs).filter(models.ServiceConfigs.service_code == service_code).first()

def get_service_config_by_id(db: Session, config_id: int):
    return db.query(models.ServiceConfigs).filter(models.ServiceConfigs.id == config_id).first()

def create_service_config(db: Session, data: dict):
    new_config = models.ServiceConfigs(**data)
    db.add(new_config)
    db.flush()
    return new_config

def update_service_config(db: Session, config: models.ServiceConfigs, data: dict):
    for key, value in data.items():
        setattr(config, key, value)
    db.flush()
    return config

def get_all_packing_rules(db: Session):
    return db.query(models.PackingRules).order_by(
        models.PackingRules.packing_type.asc(),
        models.PackingRules.min_weight.asc()
    ).all()

def get_packing_rule_by_id(db: Session, rule_id: int):
    return db.query(models.PackingRules).filter(models.PackingRules.id == rule_id).first()

def create_packing_rule(db: Session, data: dict):
    existing = db.query(models.PackingRules).filter(
        models.PackingRules.packing_type == data["packing_type"],
        models.PackingRules.min_weight == data["min_weight"],
        models.PackingRules.max_weight == data["max_weight"],
    ).first()
    if existing:
        return None

    rule = models.PackingRules(**data)
    db.add(rule)
    db.flush()
    db.refresh(rule)
    return rule

def update_packing_rule(db: Session, rule_id: int, data: dict):
    rule = get_packing_rule_by_id(db, rule_id)
    if not rule:
        return None

    duplicate = db.query(models.PackingRules).filter(
        models.PackingRules.packing_type == data["packing_type"],
        models.PackingRules.min_weight == data["min_weight"],
        models.PackingRules.max_weight == data["max_weight"],
        models.PackingRules.id != rule_id,
    ).first()
    if duplicate:
        return None

    for key, value in data.items():
        setattr(rule, key, value)
    db.flush()
    db.refresh(rule)
    return rule

def delete_packing_rule(db: Session, rule_id: int):
    rule = get_packing_rule_by_id(db, rule_id)
    if not rule:
        return False
    db.delete(rule)
    db.flush()
    return True

def get_packing_rule_for_weight(db: Session, packing_type: str, weight: float):
    return db.query(models.PackingRules).filter(
        models.PackingRules.packing_type == packing_type,
        models.PackingRules.min_weight < weight,
        models.PackingRules.max_weight >= weight,
        models.PackingRules.is_active == True
    ).first()

def calculate_extra_service_fee(config: models.ServiceConfigs, *, cod_amount: float = 0, declared_value: float = 0, main_fee: float = 0, quantity: int = 1) -> float:
    base_map = {
        "FIXED": 1,
        "COD_AMOUNT": cod_amount or 0,
        "DECLARED_VALUE": declared_value or 0,
        "MAIN_FEE": main_fee or 0,
        "QUANTITY": quantity or 1,
    }
    calculation_base = config.calculation_base or ("FIXED" if config.fee_type == "FIXED" else "COD_AMOUNT")
    base_value = float(base_map.get(calculation_base, 0))

    min_value = float(config.min_order_value) if config.min_order_value is not None else None
    max_value = float(config.max_order_value) if config.max_order_value is not None else None
    if min_value is not None and base_value < min_value:
        return 0
    if max_value is not None and base_value >= max_value:
        return 0

    if config.fee_type == "FIXED":
        fee = float(config.fee_value)
    elif config.fee_type == "PERCENT":
        fee = base_value * (float(config.fee_value) / 100)
    elif config.fee_type == "PER_ITEM":
        fee = float(config.fee_value) * max(1, int(quantity or 1))
    else:
        fee = 0

    if config.min_fee is not None and fee > 0:
        fee = max(fee, float(config.min_fee))
    return fee

# ==========================================
# PHẦN 3: VÙNG SÂU VÙNG XA (REMOTE AREAS)
# ==========================================

def get_remote_area_fee(db: Session, province_id: int, district_id: int, ward_id: int) -> float:
    """Lấy phụ phí vùng sâu vùng xa nếu có"""
    area = db.query(models.RemoteAreas).filter(
        models.RemoteAreas.province_id == province_id,
        models.RemoteAreas.district_id == district_id,
        models.RemoteAreas.ward_id == ward_id,
        models.RemoteAreas.is_active == True
    ).first()
    return float(area.fee) if area else 0.0

def get_all_remote_areas(db: Session):
    return db.query(models.RemoteAreas).all()

def create_remote_area(db: Session, data: dict):
    new_area = models.RemoteAreas(**data)
    db.add(new_area)
    db.flush()
    return new_area

# ==========================================
# PHẦN 4: QUẢN LÝ PHÂN VÙNG (PROVINCE ZONES)
# ==========================================

def get_all_province_zones(db: Session):
    return db.query(models.ProvinceZones).all()

def create_province_zone(db: Session, data: dict):
    new_zone = models.ProvinceZones(**data)
    db.add(new_zone)
    db.flush()
    return new_zone

def delete_province_zone(db: Session, zone_id: int):
    zone = db.query(models.ProvinceZones).filter(models.ProvinceZones.id == zone_id).first()
    if zone:
        db.delete(zone)
        db.flush()
        return True
    return False
