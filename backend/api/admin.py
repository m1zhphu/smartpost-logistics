from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user
import schemas.admin
from typing import Optional 
import crud.delivery as crud_delivery
import crud.admin as crud_admin  # THÊM IMPORT CRUD MỚI

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])

@router.post("/override-waybill-status")
def override_waybill_status(
    data: schemas.admin.AdminOverrideStatus,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # 1. Kiểm tra quyền
    if current_user.get("role_id") != 1:
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền thực hiện thao tác này")

    # 2. Tìm vận đơn qua CRUD
    waybill = crud_admin.get_waybill_by_code(db, data.waybill_code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")

    # 3. Yêu cầu CRUD ghi log và cập nhật
    old_status = crud_admin.log_and_override_status(
        db=db, 
        waybill=waybill, 
        admin_id=current_user["user_id"], 
        new_status=data.new_status, 
        reason=data.reason
    )
    
    return {"message": f"Đã ghi đè trạng thái từ {old_status} sang {data.new_status} thành công"}

@router.get("/audit-logs")
def get_audit_logs(
    target_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Kiểm tra quyền
    if current_user.get("role_id") != 1:
        raise HTTPException(status_code=403, detail="Quyền truy cập bị từ chối")
    
    # Lấy dữ liệu qua CRUD
    return crud_admin.get_audit_logs(db, target_id)

@router.post("/scan-overdue")
def trigger_scan_overdue(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Kiểm tra quyền
    if current_user.get("role_id") not in [1, 2]: 
        raise HTTPException(status_code=403, detail="Không có quyền thực hiện")

    # Gọi CRUD của delivery (Giữ nguyên như cũ)
    count = crud_delivery.scan_overdue_waybills(db)
    db.commit()
    
    return {"message": f"Quét hoàn tất. Đã phát hiện và gắn cảnh báo cho {count} đơn hàng quá hạn."}

@router.get('/departments')
def get_departments(db: Session = Depends(get_db)):
    # Lấy dữ liệu qua CRUD
    return crud_admin.get_active_departments(db)