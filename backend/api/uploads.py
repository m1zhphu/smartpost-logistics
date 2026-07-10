import os
from fastapi import APIRouter, File, UploadFile, Depends, Request, HTTPException
from typing import List
from core.security import get_current_user
import services.file_service as file_service

router = APIRouter(prefix="/api/upload", tags=["Upload Services"])

def _format_url(request: Request, path: str) -> str:
    if path.startswith("http://") or path.startswith("https://"):
        return path
    base_url = os.getenv('PUBLIC_BASE_URL', str(request.base_url).rstrip('/'))
    return f"{base_url}{path}"

@router.post("/pod")
async def upload_pod_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """API tải lên ảnh POD (Proof of Delivery)"""
    image_url = file_service.save_pod_image(file)
    return {
        "status": "success",
        "image_url": _format_url(request, image_url)
    }

@router.post("/pod/batch")
async def upload_pod_images(
    request: Request,
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload up to 5 POD images in one request."""
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Chi duoc upload toi da 5 anh POD")
    image_urls = [_format_url(request, file_service.save_pod_image(file)) for file in files]
    return {
        "status": "success",
        "image_url": image_urls[0] if image_urls else None,
        "image_urls": image_urls,
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
        "image_url": _format_url(request, image_url)
    }

@router.post("/bill/batch")
async def upload_bill_images(
    request: Request,
    files: List[UploadFile] = File(...),
    is_pickup: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Upload up to 5 bill or pickup images in one request."""
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Chi duoc upload toi da 5 anh")
    image_urls = [_format_url(request, file_service.save_bill_image(file, is_pickup)) for file in files]
    return {
        "status": "success",
        "image_url": image_urls[0] if image_urls else None,
        "image_urls": image_urls,
    }
