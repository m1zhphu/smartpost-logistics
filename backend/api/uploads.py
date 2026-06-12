import os

from fastapi import APIRouter, File, UploadFile, Depends, Request
from core.security import get_current_user
import services.file_service as file_service

router = APIRouter(prefix="/api/upload", tags=["Upload Services"])

@router.post("/pod")
async def upload_pod_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user) # Chốt chặn: Phải đăng nhập mới được up ảnh
):
    """API tải lên ảnh POD (Proof of Delivery)"""
    
    # Giao toàn bộ việc kiểm tra định dạng và lưu ổ cứng cho Service
    image_url = file_service.save_pod_image(file)
    
    return {
        "status": "success",
        "image_url": f"{os.getenv('PUBLIC_BASE_URL', str(request.base_url).rstrip('/'))}{image_url}"
    }

@router.post("/bill")
async def upload_bill_image(
    request: Request,
    file: UploadFile = File(...),
    is_pickup: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """API tải lên ảnh bill hoặc ảnh pickup"""
    image_url = file_service.save_bill_image(file, is_pickup)
    
    return {
        "status": "success",
        "image_url": f"{os.getenv('PUBLIC_BASE_URL', str(request.base_url).rstrip('/'))}{image_url}"
    }
