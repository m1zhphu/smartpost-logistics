from sqlalchemy.orm import Session
import models
from fastapi import HTTPException

def calculate_shipping_fee(db: Session, origin_hub_id: int, dest_hub_id: int, weight: float, service_type: str):
    """
    Tra cứu bảng giá dựa trên Tỉnh đi -> Tỉnh đến và Nấc khối lượng (Mục 4.1)
    """
    # 1. Lấy thông tin Tỉnh của Hub đi và Hub đến
    origin_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == origin_hub_id).first()
    dest_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == dest_hub_id).first()

    if not origin_hub or not dest_hub:
        raise HTTPException(status_code=400, detail="Không xác định được bưu cục gửi hoặc nhận để tính giá.")

    # 2. Tìm quy tắc giá khớp với ma trận Tỉnh, Dịch vụ và Khối lượng
    # Lưu ý: Bạn BẮT BUỘC phải thêm class PricingRules vào models.py vì trong file bạn gửi chưa có
    rule = db.query(models.PricingRules).filter(
        models.PricingRules.from_province_id == origin_hub.province_id,
        models.PricingRules.to_province_id == dest_hub.province_id,
        models.PricingRules.service_type == service_type,
        models.PricingRules.min_weight <= weight,
        models.PricingRules.max_weight >= weight,
        models.PricingRules.is_active == True
    ).first()

    # 3. Logic xử lý kết quả
    if not rule:
        # Fail-safe: Nếu không tìm thấy quy tắc, áp dụng giá sàn để đơn hàng vẫn được tạo (Mục 5.2)
        # Giá sàn mặc định: 20k cho 1kg đầu, mỗi kg sau cộng 5k
        base_fee = 20000.0
        if weight <= 1.0:
            return base_fee
        return base_fee + (weight - 1.0) * 5000.0

    return float(rule.price)