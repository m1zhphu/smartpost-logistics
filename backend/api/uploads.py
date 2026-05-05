from fastapi import APIRouter, File, UploadFile, Depends
from core.security import get_current_user
import services.file_service as file_service

router = APIRouter(prefix="/api/upload", tags=["Upload Services"])

@router.post("/pod")
async def upload_pod_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user) # Chốt chặn: Phải đăng nhập mới được up ảnh
):
    """API tải lên ảnh POD (Proof of Delivery)"""
    
    # Giao toàn bộ việc kiểm tra định dạng và lưu ổ cứng cho Service
    image_url = file_service.save_pod_image(file)
    
    return {
        "status": "success",
        "image_url": image_url
    }