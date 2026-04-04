# File: api/pricing.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.permissions import PermissionChecker
# THÊM CÁC IMPORT DƯỚI ĐÂY
from core.idempotency import validate_idempotency, commit_idempotency 
import crud.pricing as crud_pricing
import schemas.pricing as schema_pricing

router = APIRouter(prefix="/api/pricing", tags=["Pricing System"])

@router.post("/rules", 
             response_model=schema_pricing.PricingRuleResponse,
             dependencies=[Depends(PermissionChecker("hub_manage"))])
def add_pricing_rule(
    data: schema_pricing.PricingRuleCreate, 
    db: Session = Depends(get_db),
    idem_key: str = Depends(validate_idempotency) # THÊM DÒNG NÀY 
):
    """API thêm quy tắc giá mới (Bắt buộc Idempotency-Key) """
    
    # Ràng buộc nghiệp vụ: min_weight phải nhỏ hơn max_weight 
    if data.min_weight >= data.max_weight:
        raise HTTPException(status_code=400, detail="Khối lượng tối thiểu phải nhỏ hơn tối đa")

    # Gọi tầng CRUD để xử lý logic lưu trữ
    rule = crud_pricing.create_rule(db, data.model_dump())
    db.commit()
    db.refresh(rule)

    # Ghi nhận kết quả vào Redis/DB Idempotency 
    result = schema_pricing.PricingRuleResponse.model_validate(rule).model_dump()
    commit_idempotency(idem_key, result)
    
    return rule

@router.get("/rules", response_model=List[schema_pricing.PricingRuleResponse])
def list_pricing_rules(db: Session = Depends(get_db)):
    """Xem danh sách toàn bộ bảng giá hiện có [cite: 140]"""
    return crud_pricing.get_all_rules(db)