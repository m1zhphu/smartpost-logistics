from sqlalchemy.orm import Session
import models
from typing import Optional

def get_waybill_by_code(db: Session, waybill_code: str):
    """Tìm vận đơn theo mã"""
    return db.query(models.Waybills).filter(models.Waybills.waybill_code == waybill_code).first()

def log_and_override_status(db: Session, waybill: models.Waybills, admin_id: int, new_status: str, reason: str):
    """Ghi log và cập nhật trạng thái mới"""
    old_status = waybill.status
    
    # 1. Ghi lại Audit Log
    audit_entry = models.AuditLogs(
        admin_id=admin_id,
        target_table="waybills",
        target_id=waybill.waybill_id,
        column_name="status",
        old_value=old_status,
        new_value=new_status,
        reason=reason
    )
    db.add(audit_entry)

    # 2. Thực hiện Override trạng thái và tăng version (Optimistic Locking)
    waybill.status = new_status
    waybill.version += 1
    
    db.commit()
    return old_status

def get_audit_logs(db: Session, target_id: Optional[int] = None):
    """Lấy danh sách nhật ký kiểm toán"""
    query = db.query(models.AuditLogs)
    if target_id:
        query = query.filter(models.AuditLogs.target_id == target_id)
    return query.order_by(models.AuditLogs.timestamp.desc()).all()

def get_active_departments(db: Session):
    """Lấy danh sách phòng ban đang hoạt động"""
    return db.query(models.Departments).filter(models.Departments.status == True).all()