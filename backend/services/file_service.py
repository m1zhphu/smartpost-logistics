import shutil
import os
import uuid
from datetime import datetime
from fastapi import UploadFile, HTTPException

# Đảm bảo thư mục uploads tồn tại khi hệ thống khởi động
UPLOAD_DIR = "uploads/pod"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_pod_image(file: UploadFile) -> str:
    """Xử lý lưu file ảnh vào ổ cứng và trả về đường dẫn URL"""
    # 1. Kiểm tra định dạng file
    allowed_extensions = ["jpg", "jpeg", "png"]
    file_ext = file.filename.split(".")[-1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ định dạng JPG hoặc PNG")

    # 2. Tạo tên file duy nhất
    unique_filename = f"POD_{datetime.now().strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # 3. Lưu file vào ổ cứng
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lưu file: {str(e)}")

    # 4. Trả về đường dẫn để API gửi lại cho FE hoặc DB
    return f"/uploads/pod/{unique_filename}"