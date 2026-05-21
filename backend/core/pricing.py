from sqlalchemy.orm import Session
import models
from fastapi import HTTPException

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