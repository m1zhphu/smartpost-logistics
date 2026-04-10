# File: api/uploads.py
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from core.security import get_current_user
import shutil
import os
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/upload", tags=["Upload Services"])

# Đảm bảo thư mục uploads tồn tại
UPLOAD_DIR = "uploads/pod"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/pod")
async def upload_pod_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # 1. Kiểm tra định dạng file (Chỉ cho phép ảnh)
    allowed_extensions = ["jpg", "jpeg", "png"]
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ định dạng JPG hoặc PNG")

    # 2. Tạo tên file duy nhất (Tránh trùng lặp)
    unique_filename = f"POD_{datetime.now().strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # 3. Lưu file vào ổ cứng
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lưu file: {str(e)}")

    # 4. Trả về URL để lưu vào Database (Bảng delivery_results)
    # Lưu ý: /uploads là đường dẫn chúng ta sẽ mount trong main.py
    return {
        "status": "success",
        "image_url": f"/uploads/pod/{unique_filename}"
    }