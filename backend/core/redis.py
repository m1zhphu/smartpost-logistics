# File: core/redis.py
import redis
import os

# Cấu hình lấy từ biến môi trường hoặc mặc định localhost
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

# Kết nối tới Redis (sử dụng db=0 cho Idempotency)
redis_client = redis.Redis(
    host=REDIS_HOST, 
    port=REDIS_PORT, 
    db=0, 
    decode_responses=True
)

def get_redis():
    return redis_client