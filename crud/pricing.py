from sqlalchemy.orm import Session
import models

def create_rule(db: Session, data: dict):
    # Kiểm tra xem đã tồn tại quy tắc cho bộ (tỉnh đi, tỉnh đến, loại dịch vụ, nấc cân) chưa [cite: 66, 68]
    existing = db.query(models.PricingRules).filter(
        models.PricingRules.from_province_id == data['from_province_id'],
        models.PricingRules.to_province_id == data['to_province_id'],
        models.PricingRules.service_type == data['service_type'],
        models.PricingRules.min_weight == data['min_weight'],
        models.PricingRules.max_weight == data['max_weight']
    ).first()
    
    if existing:
        return None # Sẽ raise lỗi 400 tại API
        
    new_rule = models.PricingRules(**data)
    db.add(new_rule)
    db.flush()
    return new_rule

def get_all_rules(db: Session):
    return db.query(models.PricingRules).all()
