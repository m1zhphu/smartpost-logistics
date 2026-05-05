# File: main.py
from fastapi import FastAPI
from api import auth, hubs, waybills, warehouse, delivery, accounting, pricing, users, dashboard, printing, customers
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from crud.delivery import scan_overdue_waybills
from core.database import SessionLocal
from datetime import datetime
from fastapi.staticfiles import StaticFiles
from api import uploads
import os
import models
from core.database import engine
models.Base.metadata.create_all(bind=engine)
# Khởi tạo ứng dụng
app = FastAPI(
    title="Smartpost Logistics - MVP Backend",
    description="Hệ thống quản lý vận hành Logistics chuyên nghiệp",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Trong thực tế nên để domain cụ thể của Frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Đăng ký các Router (Kết nối các bộ phận vào tổng đài)
app.include_router(auth.router)
app.include_router(hubs.router)
app.include_router(waybills.router)
app.include_router(warehouse.router)
app.include_router(delivery.router)
app.include_router(accounting.router)
app.include_router(pricing.router)
app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(printing.router)
app.include_router(uploads.router)
app.include_router(customers.router)

@app.get("/", tags=["Root"])
async def root():
    return {"message": "Chào mừng đến với Smartpost API. Hệ thống đang hoạt động!"}

async def schedule_overdue_check():
    """Tự động quét đơn ngâm mỗi 1 tiếng"""
    while True:
        db = SessionLocal()
        try:
            count = scan_overdue_waybills(db)
            print(f"[{datetime.now()}] Flagged {count} overdue waybills.")
            db.commit()
        finally:
            db.close()
        await asyncio.sleep(3600) # Nghỉ 1 tiếng rồi chạy lại

@app.on_event("startup")
async def startup_event():
    # Chạy tác vụ quét quá hạn ngay khi server lên
    asyncio.create_task(schedule_overdue_check())
    os.makedirs("uploads/pod", exist_ok=True)