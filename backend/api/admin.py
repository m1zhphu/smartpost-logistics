# File: api/admin.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user
import models, schemas.admin
from typing import Optional # THÊM DÒNG NÀY
import crud.delivery as crud_delivery

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])

@router.post("/override-waybill-status")
def override_waybill_status(
    data: schemas.admin.AdminOverrideStatus,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # 1. Kiểm tra quyền Admin (role_id = 1) [cite: 41, 42, 138]
    if current_user.get("role_id") != 1:
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền thực hiện thao tác này")

    # 2. Tìm vận đơn
    waybill = db.query(models.Waybills).filter(models.Waybills.waybill_code == data.waybill_code).first()
    if not waybill:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")

    old_status = waybill.status

    # 3. Ghi lại Audit Log trước khi sửa [cite: 43, 136]
    audit_entry = models.AuditLogs(
        admin_id=current_user["user_id"],
        target_table="waybills",
        target_id=waybill.waybill_id,
        column_name="status",
        old_value=old_status,
        new_value=data.new_status,
        reason=data.reason
    )
    db.add(audit_entry)

    # 4. Thực hiện Override trạng thái và tăng version (Optimistic Locking) [cite: 60, 92]
    waybill.status = data.new_status
    waybill.version += 1
    
    db.commit()
    return {"message": f"Đã ghi đè trạng thái từ {old_status} sang {data.new_status} thành công"}

@router.get("/audit-logs")
def get_audit_logs(
    target_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Chỉ Admin mới có quyền xem nhật ký kiểm toán [cite: 41]
    if current_user.get("role_id") != 1:
        raise HTTPException(status_code=403, detail="Quyền truy cập bị từ chối")
    
    query = db.query(models.AuditLogs)
    if target_id:
        query = query.filter(models.AuditLogs.target_id == target_id)
    
    return query.order_by(models.AuditLogs.timestamp.desc()).all()

@router.post("/scan-overdue")
def trigger_scan_overdue(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Kiểm tra quyền Admin hoặc Điều phối [cite: 41, 44]
    if current_user.get("role_id") not in [1, 2]: 
        raise HTTPException(status_code=403, detail="Không có quyền thực hiện")

    count = crud_delivery.scan_overdue_waybills(db)
    db.commit()
    
    return {"message": f"Quét hoàn tất. Đã phát hiện và gắn cảnh báo cho {count} đơn hàng quá hạn."}
@router.get('/departments')
def get_departments(db: Session = Depends(get_db)):
    return db.query(models.Departments).filter(models.Departments.status == True).all()
