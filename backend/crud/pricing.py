from sqlalchemy.orm import Session
import models

# ==========================================
# PHẦN 1: QUẢN LÝ BẢNG GIÁ CHÍNH (RULES)
# ==========================================

def create_rule(db: Session, data: dict):
    mapped_data = data.copy()
    mapped_data['from_province_id'] = data.get('origin_hub_id')
    mapped_data['to_province_id'] = data.get('dest_hub_id')
    
    mapped_data.pop('origin_hub_id', None)
    mapped_data.pop('dest_hub_id', None)

    existing = db.query(models.PricingRules).filter(
        models.PricingRules.from_province_id == mapped_data['from_province_id'],
        models.PricingRules.to_province_id == mapped_data['to_province_id'],
        models.PricingRules.service_type == mapped_data['service_type'],
        models.PricingRules.min_weight == mapped_data['min_weight'],
        models.PricingRules.max_weight == mapped_data['max_weight']
    ).first()
    
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

def format_rule_with_hub(db: Session, rule: models.PricingRules):
    origin_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == rule.from_province_id).first()
    dest_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == rule.to_province_id).first()
    
    rule_dict = {
        "rule_id": rule.rule_id,
        "origin_hub_id": rule.from_province_id,
        "dest_hub_id": rule.to_province_id,
        "service_type": rule.service_type,
        "min_weight": rule.min_weight,
        "max_weight": rule.max_weight,
        "price": rule.price,
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
    if 'origin_hub_id' in mapped_data:
        mapped_data['from_province_id'] = mapped_data.pop('origin_hub_id')
    if 'dest_hub_id' in mapped_data:
        mapped_data['to_province_id'] = mapped_data.pop('dest_hub_id')

    conflict = db.query(models.PricingRules).filter(
        models.PricingRules.from_province_id == mapped_data.get('from_province_id', rule.from_province_id),
        models.PricingRules.to_province_id == mapped_data.get('to_province_id', rule.to_province_id),
        models.PricingRules.service_type == mapped_data.get('service_type', rule.service_type),
        models.PricingRules.min_weight == mapped_data.get('min_weight', rule.min_weight),
        models.PricingRules.max_weight == mapped_data.get('max_weight', rule.max_weight),
        models.PricingRules.rule_id != rule_id
    ).first()

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

def get_pricing_rule_exact(db: Session, origin_id: int, dest_id: int, service_type: str, weight: float):
    """Tìm bảng giá khớp chính xác với ID bưu cục"""
    return db.query(models.PricingRules).filter(
        models.PricingRules.from_province_id == origin_id,
        models.PricingRules.to_province_id == dest_id,
        models.PricingRules.service_type == service_type,
        models.PricingRules.min_weight <= weight,
        models.PricingRules.max_weight >= weight,
        models.PricingRules.is_active == True
    ).first()

def get_pricing_rule_fallback(db: Session, origin_prov: int, dest_prov: int, service_type: str):
    """Tìm bảng giá thay thế dựa trên cụm Tỉnh/Thành phố"""
    return db.query(models.PricingRules).filter(
        models.PricingRules.from_province_id == origin_prov,
        models.PricingRules.to_province_id == dest_prov,
        models.PricingRules.service_type == service_type,
        models.PricingRules.is_active == True
    ).order_by(models.PricingRules.max_weight.desc()).first()

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