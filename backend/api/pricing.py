from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.permissions import PermissionChecker
from core.idempotency import validate_idempotency, commit_idempotency 
from core.security import get_current_user # Bổ sung import để lấy user hiện tại
import crud.pricing as crud_pricing
import schemas.pricing as schema_pricing
import models

router = APIRouter(prefix="/api/pricing", tags=["Pricing System"])

# --- HÀM GÁC CỔNG DÀNH RIÊNG CHO CHÍNH SÁCH GIÁ ---
def verify_pricing_edit_access(user: dict):
    if user.get("role_id") not in [1, 5]: # Chỉ Admin và Kế toán
        raise HTTPException(status_code=403, detail="Chỉ Admin và Kế toán mới có quyền thiết lập Bảng giá.")
# --------------------------------------------------

@router.post("/rules", 
             response_model=schema_pricing.PricingRuleResponse,
             dependencies=[Depends(PermissionChecker("hub_manage"))])
def add_pricing_rule(
    data: schema_pricing.PricingRuleCreate, 
    db: Session = Depends(get_db),
    idem_key: str = Depends(validate_idempotency),
    current_user: dict = Depends(get_current_user)
):
    """API thêm quy tắc giá mới"""
    verify_pricing_edit_access(current_user) # Chốt chặn

    if data.min_weight >= data.max_weight:
        raise HTTPException(status_code=400, detail="Khối lượng tối thiểu phải nhỏ hơn tối đa")

    rule = crud_pricing.create_rule(db, data.model_dump())
    db.commit()

    if not rule:
        raise HTTPException(status_code=400, detail="Quy tắc giá này đã tồn tại")

    result = schema_pricing.PricingRuleResponse.model_validate(rule).model_dump()
    commit_idempotency(idem_key, result)
    return rule

@router.get("/rules", response_model=List[schema_pricing.PricingRuleResponse])
def list_pricing_rules(db: Session = Depends(get_db)):
    """Xem danh sách toàn bộ bảng giá hiện có (Mở cho mọi người cùng xem)"""
    return crud_pricing.get_all_rules(db)

@router.put("/rules/{rule_id}", response_model=schema_pricing.PricingRuleResponse)
def update_pricing_rule(
    rule_id: int, 
    data: schema_pricing.PricingRuleCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API sửa quy tắc giá"""
    verify_pricing_edit_access(current_user) # Chốt chặn

    if data.min_weight >= data.max_weight:
        raise HTTPException(status_code=400, detail="Khối lượng tối thiểu phải nhỏ hơn tối đa")
        
    rule = crud_pricing.update_rule(db, rule_id, data.model_dump())
    if not rule:
        raise HTTPException(status_code=404, detail="Không tìm thấy quy tắc hoặc đã bị trùng")
        
    db.commit()
    return rule

@router.delete("/rules/{rule_id}")
def delete_pricing_rule(
    rule_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API xóa quy tắc giá"""
    verify_pricing_edit_access(current_user) # Chốt chặn

    success = crud_pricing.delete_rule(db, rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy quy tắc")
    db.commit()
    return {"message": "Đã xóa quy tắc thành công"}

@router.post("/calculate")
def calculate_shipping_fee(
    data: schema_pricing.FeeCalculateRequest,
    db: Session = Depends(get_db)
):
    """Tính cước phí vận chuyển BAO GỒM CẢ DỊCH VỤ TIỆN ÍCH (Mở rộng cho luồng tạo đơn)"""
    
    origin_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == data.origin_hub_id).first()
    dest_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == data.dest_hub_id).first()

    if not origin_hub or not dest_hub:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin bưu cục.")

    # Tìm quy tắc giá chính
    rule = db.query(models.PricingRules).filter(
        models.PricingRules.from_province_id == data.origin_hub_id,
        models.PricingRules.to_province_id == data.dest_hub_id,
        models.PricingRules.service_type == data.service_type,
        models.PricingRules.min_weight <= data.weight,
        models.PricingRules.max_weight >= data.weight,
        models.PricingRules.is_active == True
    ).first()

    if not rule:
        rule = db.query(models.PricingRules).filter(
            models.PricingRules.from_province_id == origin_hub.province_id,
            models.PricingRules.to_province_id == dest_hub.province_id,
            models.PricingRules.service_type == data.service_type,
            models.PricingRules.is_active == True
        ).order_by(models.PricingRules.max_weight.desc()).first()

    if not rule:
        raise HTTPException(
            status_code=404,
            detail=f"Chưa có bảng giá cho tuyến {origin_hub.province_id}→{dest_hub.province_id} ({data.service_type})."
        )

    main_fee = float(rule.price)
    extra_fee = 0

    if data.extra_services:
        active_services = db.query(models.ServiceConfigs).filter(models.ServiceConfigs.is_active == True).all()
        service_map = {s.service_code: s for s in active_services}
        
        for srv_code in data.extra_services:
            if srv_code in service_map:
                config = service_map[srv_code]
                if config.fee_type == "FIXED":
                    extra_fee += float(config.fee_value)
                elif config.fee_type == "PERCENT":
                    if data.cod_amount and data.cod_amount > 0:
                        calculated_val = float(data.cod_amount) * (float(config.fee_value) / 100)
                        extra_fee += max(10000.0, calculated_val)

    total_service = main_fee + extra_fee
    fuel_fee = round(total_service * 0.05, 0)
    vat = round((total_service + fuel_fee) * 0.10, 0)
    total = total_service + fuel_fee + vat

    return {
        "main_fee": main_fee,
        "extra_fee": extra_fee,
        "fuel_fee": fuel_fee,
        "vat": vat,
        "total": total,
        "rule_id": rule.rule_id,
        "matched_rule": f"{rule.min_weight}-{rule.max_weight}kg @ {rule.price:,.0f}đ"
    }

@router.get("/extra-services", response_model=List[schema_pricing.ServiceConfigResponse])
def get_extra_services_config(db: Session = Depends(get_db)):
    """Lấy danh sách cấu hình giá dịch vụ tiện ích"""
    return db.query(models.ServiceConfigs).all()

@router.post("/extra-services", response_model=schema_pricing.ServiceConfigResponse)
def create_extra_service_config(
    data: schema_pricing.ServiceConfigCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Tạo cấu hình giá dịch vụ mới"""
    verify_pricing_edit_access(current_user) # Chốt chặn

    existing = db.query(models.ServiceConfigs).filter(models.ServiceConfigs.service_code == data.service_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mã dịch vụ này đã tồn tại!")
        
    new_config = models.ServiceConfigs(**data.model_dump())
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    return new_config

@router.put("/extra-services/{config_id}", response_model=schema_pricing.ServiceConfigResponse)
def update_extra_service_config(
    config_id: int, 
    data: schema_pricing.ServiceConfigCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Cập nhật giá dịch vụ tiện ích"""
    verify_pricing_edit_access(current_user) # Chốt chặn

    config = db.query(models.ServiceConfigs).filter(models.ServiceConfigs.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Không tìm thấy cấu hình này")
        
    for key, value in data.model_dump().items():
        setattr(config, key, value)
        
    db.commit()
    db.refresh(config)
    return config