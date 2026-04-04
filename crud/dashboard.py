# File: crud/dashboard.py
from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from core.state_machine import WaybillStatus

def get_hub_statistics(db: Session, hub_id: int = None):
    """
    Tính toán KPI: Success Rate, COD Pending, Overdue Alerts.
    Bám sát đặc tả MVP về giám sát vận hành.
    """
    query = db.query(models.Waybills).filter(models.Waybills.is_deleted == False)
    
    if hub_id:
        query = query.filter(models.Waybills.dest_hub_id == hub_id)

    # 1. Thống kê trạng thái đơn hàng
    status_counts = db.query(
        models.Waybills.status, func.count(models.Waybills.waybill_id)
    ).filter(models.Waybills.is_deleted == False)
    
    if hub_id:
        status_counts = status_counts.filter(models.Waybills.dest_hub_id == hub_id)
    
    status_data = dict(status_counts.group_by(models.Waybills.status).all())

    # 2. Tính Success Rate (Tỷ lệ giao thành công)
    total_delivered = status_data.get(WaybillStatus.DELIVERED, 0) + status_data.get(WaybillStatus.SETTLED, 0)
    total_orders = sum(status_data.values())
    success_rate = (total_delivered / total_orders * 100) if total_orders > 0 else 0

    # 3. Tính COD Pending (Tiền COD shipper đang cầm, chưa nộp quỹ)
    cod_pending = db.query(func.sum(models.Waybills.cod_amount)).filter(
        models.Waybills.status == WaybillStatus.DELIVERED,
        models.Waybills.is_deleted == False
    )
    if hub_id:
        cod_pending = cod_pending.filter(models.Waybills.dest_hub_id == hub_id)
    
    # 4. Đếm cảnh báo Overdue (SLA Monitoring)
    overdue_count = db.query(models.TrackingLogs).filter(
        models.TrackingLogs.status_id == "OVERDUE_WARNING"
    )
    if hub_id:
        overdue_count = overdue_count.filter(models.TrackingLogs.hub_id == hub_id)

    return {
        "status_summary": status_data,
        "success_rate": round(success_rate, 2),
        "total_cod_pending": cod_pending.scalar() or 0,
        "overdue_alerts": overdue_count.count()
    }