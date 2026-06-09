from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.permissions import PermissionChecker
from core.idempotency import validate_idempotency, commit_idempotency 
from core.security import get_current_user
from core.pricing import calculate_shipping_fee_detail
import crud.pricing as crud_pricing
import schemas.pricing as schema_pricing

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

    if data.pricing_method == "INCREMENTAL" and (
        not data.base_weight or not data.increment_weight or not data.increment_price
    ):
        raise HTTPException(status_code=400, detail="Quy tắc giá cộng thêm phải có mốc cân gốc, bước cân và giá cộng thêm")

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

@router.get("/policies", response_model=List[schema_pricing.PricingPolicyResponse])
def list_pricing_policies(active_only: bool = True, db: Session = Depends(get_db)):
    """Láº¥y danh sÃ¡ch chÃ­nh sÃ¡ch/báº£ng giÃ¡ Ä‘á»ƒ gÃ¡n cho khÃ¡ch hÃ ng."""
    return crud_pricing.get_all_policies(db, active_only=active_only)

@router.post("/policies", response_model=schema_pricing.PricingPolicyResponse)
def add_pricing_policy(
    data: schema_pricing.PricingPolicyCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    verify_pricing_edit_access(current_user)
    policy = crud_pricing.create_policy(db, data.model_dump())
    if not policy:
        raise HTTPException(status_code=400, detail="Mã bảng giá đã tồn tại")
    db.commit()
    return policy

@router.put("/policies/{policy_id}", response_model=schema_pricing.PricingPolicyResponse)
def update_pricing_policy(
    policy_id: int,
    data: schema_pricing.PricingPolicyCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    verify_pricing_edit_access(current_user)
    policy = crud_pricing.update_policy(db, policy_id, data.model_dump())
    if not policy:
        raise HTTPException(status_code=404, detail="Không tìm thấy bảng giá hoặc mã bảng giá đã tồn tại")
    db.commit()
    return policy

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
        
    if data.pricing_method == "INCREMENTAL" and (
        not data.base_weight or not data.increment_weight or not data.increment_price
    ):
        raise HTTPException(status_code=400, detail="Quy tắc giá cộng thêm phải có mốc cân gốc, bước cân và giá cộng thêm")

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
    """Tính cước phí vận chuyển BAO GỒM CẢ DỊCH VỤ TIỆN ÍCH"""
    
    # 1. Gọi CRUD lấy thông tin bưu cục
    origin_hub = crud_pricing.get_hub_by_id(db, data.origin_hub_id)
    dest_hub = crud_pricing.get_hub_by_id(db, data.dest_hub_id)

    if not origin_hub or not dest_hub:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin bưu cục.")

    # 2. Xử lý logic nghiệp vụ mới (Volumetric Weight & Customer Policy)
    # Khối lượng quy đổi = (L * W * H) / 5000
    volumetric_weight = (data.length * data.width * data.height) / 5000 if data.length and data.width and data.height else 0
    charge_weight = max(data.weight, volumetric_weight)
    fee_detail = calculate_shipping_fee_detail(
        db,
        origin_hub_id=data.origin_hub_id,
        dest_hub_id=data.dest_hub_id,
        weight=charge_weight,
        service_type=data.service_type,
        customer_id=data.customer_id,
        extra_service_codes=data.extra_services or [],
        cod_amount=float(data.cod_amount or 0),
        declared_value=float(data.declared_value or data.cod_amount or 0),
        quantity=int(data.quantity or 1),
        packing_type=data.packing_type,
        dest_district_id=data.dest_district_id,
        dest_ward_id=data.dest_ward_id,
    )
    return {
        "main_fee": fee_detail["main_fee"],
        "fuel_surcharge": fee_detail["fuel_surcharge"],
        "extra_fee": fee_detail["extra_services_fee"],
        "packing_fee": fee_detail["packing_fee"],
        "remote_fee": fee_detail["remote_fee"],
        "vat": fee_detail["vat_amount"],
        "total": fee_detail["total_amount"],
        "rule_id": fee_detail["rule_id"],
        "charge_weight": fee_detail["chargeable_weight"],
        "pricing_method": fee_detail["pricing_method"],
        "matched_rule": f"{fee_detail['chargeable_weight']}kg @ {fee_detail['main_fee']:,.0f}d"
    }

    # Lấy policy_id dựa trên customer_id (nếu có)
    policy_id = 1
    if data.customer_id:
        policy_id = crud_pricing.get_customer_policy_id(db, data.customer_id)

    # 3. Gọi CRUD tìm quy tắc giá chính theo Tuyến Tỉnh
    rule = crud_pricing.get_pricing_rule_exact(
        db, origin_hub.province_id, dest_hub.province_id, data.service_type, charge_weight, policy_id
    )

    if not rule:
        # Gọi CRUD tìm quy tắc theo cụm Tỉnh/Thành phố nếu không có tuyến chính xác
        rule = crud_pricing.get_pricing_rule_fallback(
            db, origin_hub.province_id, dest_hub.province_id, data.service_type, policy_id
        )

    if not rule:
        raise HTTPException(
            status_code=404,
            detail=f"Chưa có bảng giá cho tuyến {origin_hub.province_id}→{dest_hub.province_id} ({data.service_type})."
        )

    # 4. Tính toán tiền
    fee_detail = crud_pricing.calculate_rule_shipping_fee(rule, charge_weight)
    main_fee = fee_detail["main_fee"]
    extra_fee = 0
    remote_fee = 0

    # Phụ phí vùng sâu vùng xa
    if data.dest_district_id and data.dest_ward_id:
        remote_fee = crud_pricing.get_remote_area_fee(
            db, dest_hub.province_id, data.dest_district_id, data.dest_ward_id
        )

    # Dịch vụ tiện ích (Extra Services)
    if data.extra_services:
        # Gọi CRUD lấy danh sách dịch vụ cấu hình
        active_services = crud_pricing.get_active_service_configs(db)
        service_map = {s.service_code: s for s in active_services}
        
        for srv_code in data.extra_services:
            if srv_code in service_map:
                extra_fee += crud_pricing.calculate_extra_service_fee(
                    service_map[srv_code],
                    cod_amount=float(data.cod_amount or 0),
                    declared_value=float(data.cod_amount or 0),
                    main_fee=main_fee,
                    quantity=1,
                )

    fuel_surcharge = fee_detail["fuel_surcharge"]
    total_service = main_fee + fuel_surcharge + extra_fee + remote_fee
    vat = round(total_service * (float(rule.vat_percent or 0) / 100), 0)
    total = total_service + vat

    return {
        "main_fee": main_fee,
        "fuel_surcharge": fuel_surcharge,
        "extra_fee": extra_fee,
        "remote_fee": remote_fee,
        "vat": vat,
        "total": total,
        "rule_id": rule.rule_id,
        "charge_weight": charge_weight,
        "pricing_method": rule.pricing_method,
        "matched_rule": f"{rule.min_weight}-{rule.max_weight}kg @ {main_fee:,.0f}đ"
    }

@router.get("/extra-services", response_model=List[schema_pricing.ServiceConfigResponse])
def get_extra_services_config(db: Session = Depends(get_db)):
    """Lấy danh sách cấu hình giá dịch vụ tiện ích"""
    return crud_pricing.get_all_service_configs(db)

@router.post("/extra-services", response_model=schema_pricing.ServiceConfigResponse)
def create_extra_service_config(
    data: schema_pricing.ServiceConfigCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Tạo cấu hình giá dịch vụ mới"""
    verify_pricing_edit_access(current_user) # Chốt chặn

    existing = crud_pricing.get_service_config_by_code(db, data.service_code)
    if existing:
        raise HTTPException(status_code=400, detail="Mã dịch vụ này đã tồn tại!")
        
    new_config = crud_pricing.create_service_config(db, data.model_dump())
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

    config = crud_pricing.get_service_config_by_id(db, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Không tìm thấy cấu hình này")
        
    updated_config = crud_pricing.update_service_config(db, config, data.model_dump())
    db.commit()
    db.refresh(updated_config)
    return updated_config

@router.get("/packing-rules", response_model=List[schema_pricing.PackingRuleResponse])
def list_packing_rules(db: Session = Depends(get_db)):
    """Lấy danh sách cấu hình phí đóng kiện theo mốc cân."""
    return crud_pricing.get_all_packing_rules(db)

@router.post("/packing-rules", response_model=schema_pricing.PackingRuleResponse)
def create_packing_rule(
    data: schema_pricing.PackingRuleCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    verify_pricing_edit_access(current_user)
    if data.min_weight >= data.max_weight:
        raise HTTPException(status_code=400, detail="Khối lượng tối thiểu phải nhỏ hơn tối đa")
    rule = crud_pricing.create_packing_rule(db, data.model_dump())
    if not rule:
        raise HTTPException(status_code=400, detail="Quy tắc đóng kiện này đã tồn tại")
    db.commit()
    db.refresh(rule)
    return rule

@router.put("/packing-rules/{rule_id}", response_model=schema_pricing.PackingRuleResponse)
def update_packing_rule(
    rule_id: int,
    data: schema_pricing.PackingRuleCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    verify_pricing_edit_access(current_user)
    if data.min_weight >= data.max_weight:
        raise HTTPException(status_code=400, detail="Khối lượng tối thiểu phải nhỏ hơn tối đa")
    rule = crud_pricing.update_packing_rule(db, rule_id, data.model_dump())
    if not rule:
        raise HTTPException(status_code=404, detail="Không tìm thấy quy tắc đóng kiện hoặc đã bị trùng")
    db.commit()
    return rule

@router.delete("/packing-rules/{rule_id}")
def remove_packing_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    verify_pricing_edit_access(current_user)
    success = crud_pricing.delete_packing_rule(db, rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy quy tắc đóng kiện")
    db.commit()
    return {"message": "Đã xóa quy tắc đóng kiện"}

@router.post("/simulate")
def simulate_pricing(
    data: schema_pricing.PricingSimulatorRequest,
    db: Session = Depends(get_db)
):
    """Bộ mô phỏng giá dành cho CSKH tra cứu nhanh (Mục 20 Đặc tả)"""
    
    # 1. Tính khối lượng quy đổi
    volumetric_weight = (data.length * data.width * data.height) / 5000 if data.length and data.width and data.height else 0
    charge_weight = max(data.weight, volumetric_weight)
    fee_detail = calculate_shipping_fee_detail(
        db,
        origin_province_id=data.origin_province_id,
        dest_province_id=data.dest_province_id,
        weight=charge_weight,
        service_type=data.service_type,
        extra_service_codes=data.extra_services or [],
        cod_amount=float(data.cod_amount or 0),
        declared_value=float(data.declared_value or data.cod_amount or 0),
        quantity=int(data.quantity or 1),
        packing_type=data.packing_type,
    )
    return {
        "status": "SUCCESS",
        "charge_weight": fee_detail["chargeable_weight"],
        "main_fee": fee_detail["main_fee"],
        "fuel_surcharge": fee_detail["fuel_surcharge"],
        "extra_fee": fee_detail["extra_services_fee"],
        "packing_fee": fee_detail["packing_fee"],
        "vat": fee_detail["vat_amount"],
        "grand_total": fee_detail["total_amount"],
        "pricing_method": fee_detail["pricing_method"],
        "note": f"Ap dung bang gia rule_id={fee_detail['rule_id']}"
    }

    # 2. Tra cứu giá (Simulator dùng policy_id = 1 mặc định)
    rule = crud_pricing.get_pricing_rule_exact(
        db, data.origin_province_id, data.dest_province_id, data.service_type, charge_weight, 1
    )

    if not rule:
        # Thử tìm fallback
        rule = crud_pricing.get_pricing_rule_fallback(
            db, data.origin_province_id, data.dest_province_id, data.service_type, 1
        )

    if not rule:
        raise HTTPException(
            status_code=404,
            detail=f"Chưa có bảng giá cho tuyến tỉnh {data.origin_province_id}→{data.dest_province_id}."
        )

    # 3. Tính toán tiền
    fee_detail = crud_pricing.calculate_rule_shipping_fee(rule, charge_weight)
    main_fee = fee_detail["main_fee"]
    extra_fee = 0
    
    # Dịch vụ tiện ích (Simulator)
    if data.extra_services:
        active_services = crud_pricing.get_active_service_configs(db)
        service_map = {s.service_code: s for s in active_services}
        
        for srv_code in data.extra_services:
            if srv_code in service_map:
                extra_fee += crud_pricing.calculate_extra_service_fee(
                    service_map[srv_code],
                    cod_amount=float(data.cod_amount or 0),
                    declared_value=float(data.cod_amount or 0),
                    main_fee=main_fee,
                    quantity=1,
                )

    fuel_surcharge = fee_detail["fuel_surcharge"]
    total_service = main_fee + fuel_surcharge + extra_fee
    vat = round(total_service * (float(rule.vat_percent or 0) / 100), 0)
    total = total_service + vat

    return {
        "status": "SUCCESS",
        "charge_weight": charge_weight,
        "main_fee": main_fee,
        "fuel_surcharge": fuel_surcharge,
        "extra_fee": extra_fee,
        "vat": vat,
        "grand_total": total,
        "pricing_method": rule.pricing_method,
        "note": f"Áp dụng bảng giá: {rule.min_weight}-{rule.max_weight}kg"
    }

# ==========================================
# PHẦN 4: QUẢN LÝ PHÂN VÙNG (PROVINCE ZONES)
# ==========================================

@router.get("/zones", response_model=List[schema_pricing.ProvinceZoneResponse])
def list_province_zones(db: Session = Depends(get_db)):
    """Lấy danh sách mapping vùng miền (Mục 6 Đặc tả)"""
    return crud_pricing.get_all_province_zones(db)

@router.post("/zones", response_model=schema_pricing.ProvinceZoneResponse)
def add_province_zone(
    data: schema_pricing.ProvinceZoneCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Thiết lập mapping vùng miền mới"""
    verify_pricing_edit_access(current_user)
    new_zone = crud_pricing.create_province_zone(db, data.model_dump())
    db.commit()
    db.refresh(new_zone)
    return new_zone

@router.delete("/zones/{zone_id}")
def remove_province_zone(
    zone_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Xóa mapping vùng miền"""
    verify_pricing_edit_access(current_user)
    success = crud_pricing.delete_province_zone(db, zone_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi phân vùng")
    db.commit()
    return {"message": "Đã xóa phân vùng thành công"}
