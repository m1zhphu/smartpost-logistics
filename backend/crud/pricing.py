from sqlalchemy.orm import Session
from sqlalchemy import or_
import models

def create_rule(db: Session, data: dict):
    # Mapping request fields to actual DB columns
    mapped_data = data.copy()
    mapped_data['from_province_id'] = data.get('origin_hub_id')
    mapped_data['to_province_id'] = data.get('dest_hub_id')
    
    # Bỏ các trường ảo/không có trong DB
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
    # Fetch hubs manually because DB doesn't have Foreign Keys directly setup from providence_id to hub_id ideally
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

    # Check for conflicts
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
