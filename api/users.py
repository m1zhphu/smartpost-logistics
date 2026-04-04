# File: api/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.security import get_current_user
from core.permissions import PermissionChecker
import crud.users as crud_users
import schemas.users as schema_users
import models

router = APIRouter(prefix="/api/users", tags=["Staff Management"])

@router.post("", 
             response_model=schema_users.UserResponse, 
             dependencies=[Depends(PermissionChecker("user_manage"))])
def create_staff(
    data: schema_users.UserCreate, 
    db: Session = Depends(get_db)
):
    """Tạo tài khoản nhân viên mới (Chỉ Admin)"""
    # SỬA LỖI TẠI ĐÂY: Gọi qua CRUD thay vì dùng models.Users trực tiếp
    existing_user = crud_users.get_user_by_username(db, data.username)
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")
    
    new_user = crud_users.create_user_record(db, data.model_dump())
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("", 
            response_model=List[schema_users.UserResponse],
            dependencies=[Depends(PermissionChecker("user_manage"))])
def list_staff(db: Session = Depends(get_db)):
    """Xem danh sách toàn bộ nhân viên bưu cục"""
    return crud_users.get_all_users(db)

@router.delete("/{user_id}", dependencies=[Depends(PermissionChecker("user_manage"))])
def delete_staff(user_id: int, db: Session = Depends(get_db)):
    """Xóa mềm tài khoản nhân viên"""
    success = crud_users.soft_delete_user_record(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên")
    return {"message": "Đã vô hiệu hóa tài khoản thành công"}

@router.get("/shippers")
def get_shippers_by_hub(hub_id: int, db: Session = Depends(get_db)):
    """API lấy danh sách Shipper tại bưu cục để phân công giao hàng """
    # Giả định role_id của Shipper là 3
    shippers = db.query(models.Users).filter(
        models.Users.role_id == 3, 
        models.Users.primary_hub_id == hub_id,
        models.Users.status == True
    ).all()
    return shippers