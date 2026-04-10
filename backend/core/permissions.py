from fastapi import HTTPException, Depends
from core.security import get_current_user

class PermissionChecker:
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self, current_user: dict = Depends(get_current_user)):
        # Lấy thông tin role và permissions từ Token
        role_id = current_user.get("role_id")
        user_permissions = current_user.get("permissions", {})
        
        # 1. QUYỀN LỰC TỐI CAO: Super Admin (Role 1) được làm mọi thứ
        if role_id == 1 or user_permissions.get("all"):
            return True
            
        # 2. ĐẶC QUYỀN QUẢN LÝ (Role 2): Nếu là Manager, họ tự động có toàn quyền trong kho (warehouse_*)
        if role_id == 2 and self.required_permission.startswith("warehouse_"):
            return True
            
        # 3. KIỂM TRA BÌNH THƯỜNG: Với nhân viên thường (Role 3), phải có đúng chữ "warehouse_scan" mới được cho qua
        # Hoặc dùng quyền bao trùm "warehouse_ops" thay thế
        has_specific_permission = user_permissions.get(self.required_permission)
        has_broad_permission = user_permissions.get("warehouse_ops")

        if not (has_specific_permission or has_broad_permission):
            raise HTTPException(
                status_code=403, 
                detail=f"Bạn không có quyền: {self.required_permission}"
            )
            
        return True