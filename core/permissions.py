from fastapi import HTTPException, Depends
from core.security import get_current_user

class PermissionChecker:
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self, current_user: dict = Depends(get_current_user)):
        # Giả sử trường permissions trong bảng Roles là dict: {"can_approve": True, "is_admin": True}
        user_permissions = current_user.get("permissions", {})
        
        # Quyền 'all' dành cho Admin hệ thống
        if user_permissions.get("all"):
            return True
            
        if not user_permissions.get(self.required_permission):
            raise HTTPException(
                status_code=403, 
                detail=f"Bạn không có quyền: {self.required_permission}"
            )
        return True