# File: core/idempotency.py
from fastapi import Header, HTTPException, Request
from core.redis import redis_client
import json

# Thời gian lưu trữ key (Ví dụ 24h để đảm bảo trong một ngày không bị trùng)
EXPIRATION_TIME = 86400 

async def validate_idempotency(
    request: Request, 
    idempotency_key: str = Header(None, alias="Idempotency-Key")
):
    # Theo đặc tả MVP: Tất cả API POST đều BẮT BUỘC phải có Idempotency-Key
    if request.method == "POST":
        if not idempotency_key:
            raise HTTPException(
                status_code=400, 
                detail="Thiếu Header Idempotency-Key. Thao tác quét mã/tạo đơn cần khóa này để chống trùng lặp."
            )

        # Kiểm tra xem Key này đã tồn tại trong Redis chưa
        existing_request = redis_client.get(idempotency_key)
        
        if existing_request:
            # Nếu tồn tại, trả về lỗi 409 Conflict hoặc kết quả đã lưu tùy nghiệp vụ
            raise HTTPException(
                status_code=409, 
                detail=f"Yêu cầu trùng lặp. Khóa {idempotency_key} đã được xử lý trước đó."
            )
    
    return idempotency_key

def commit_idempotency(key: str, response_data: dict):
    """
    Hàm này gọi sau khi xử lý Database thành công để ghi nhận Key đã dùng.
    """
    if key:
        redis_client.setex(key, EXPIRATION_TIME, json.dumps(response_data))