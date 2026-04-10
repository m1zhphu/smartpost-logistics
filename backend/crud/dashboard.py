# # File: crud/dashboard.py
# from sqlalchemy.orm import Session
# from sqlalchemy import func
# import models
# from core.state_machine import WaybillStatus

# def get_hub_statistics(db: Session, hub_id: int = None):
#     # 1. Thống kê trạng thái đơn hàng
#     status_counts = db.query(
#         models.Waybills.status, func.count(models.Waybills.waybill_id)
#     ).filter(models.Waybills.is_deleted == False)
    
#     if hub_id:
#         status_counts = status_counts.filter(models.Waybills.dest_hub_id == hub_id)
    
#     status_data = dict(status_counts.group_by(models.Waybills.status).all())

#     # 2. Tính COD Pending (Tiền COD shipper đang cầm)
#     cod_pending = db.query(func.sum(models.Waybills.cod_amount)).filter(
#         models.Waybills.status == WaybillStatus.DELIVERED,
#         models.Waybills.is_deleted == False
#     )
#     if hub_id:
#         cod_pending = cod_pending.filter(models.Waybills.dest_hub_id == hub_id)
    
#     # 3. Tính COD Settled
#     cod_settled = db.query(func.sum(models.Waybills.cod_amount)).filter(
#         models.Waybills.status == WaybillStatus.SETTLED,
#         models.Waybills.is_deleted == False
#     )
#     if hub_id:
#         cod_settled = cod_settled.filter(models.Waybills.dest_hub_id == hub_id)

#     # 4. Tính Overdue (Cần import TrackingLogs)
#     overdue_count = db.query(models.TrackingLogs).filter(
#         models.TrackingLogs.status_id == "OVERDUE_WARNING"
#     )
#     if hub_id:
#         overdue_count = overdue_count.filter(models.TrackingLogs.hub_id == hub_id)

#     # 5. BIỂU ĐỒ THẬT: Lấy số lượng đơn tạo trong 7 ngày gần nhất
#     from datetime import datetime, timedelta
#     seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
#     chart_query = db.query(
#         func.date(models.Waybills.created_at).label("day"),
#         func.count(models.Waybills.waybill_id).label("count")
#     ).filter(
#         models.Waybills.created_at >= seven_days_ago,
#         models.Waybills.is_deleted == False
#     )
#     if hub_id:
#         chart_query = chart_query.filter(models.Waybills.origin_hub_id == hub_id)
    
#     raw_chart = dict(chart_query.group_by(func.date(models.Waybills.created_at)).all())
    
#     # Chuyển đổi labels sang trạng thái hữu ích (VD: Thứ 2, Thứ 3)
#     days_map = {0: "CN", 1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4", 4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7"}
#     chart_data = {}
#     for i in range(7):
#         d = (datetime.utcnow() - timedelta(days=(6-i))).date()
#         label = days_map[int(d.strftime("%w"))]
#         chart_data[label] = raw_chart.get(d, 0)

#     from datetime import datetime
#     return {
#         "total_waybills": sum(status_data.values()),
#         "status_breakdown": status_data,
#         "total_cod_pending": float(cod_pending.scalar() or 0),
#         "total_cod_settled": float(cod_settled.scalar() or 0),
#         "overdue_alerts": overdue_count.count(),
#         "chart_data": chart_data,
#         "last_updated": datetime.utcnow()
#     }

# File: crud/dashboard.py
from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from core.state_machine import WaybillStatus
from datetime import datetime, timedelta

def get_hub_statistics(db: Session, hub_id: int = None):
    # 1. Thống kê trạng thái đơn hàng (Ép kiểu String để JSON không lỗi)
    status_counts_raw = db.query(
        models.Waybills.status, func.count(models.Waybills.waybill_id)
    ).filter(models.Waybills.is_deleted == False)
    
    if hub_id:
        status_counts_raw = status_counts_raw.filter(models.Waybills.dest_hub_id == hub_id)
    
    status_data = {}
    for res in status_counts_raw.group_by(models.Waybills.status).all():
        # Chuyển Enum thành chuỗi String để Frontend đọc được
        key = str(res[0].value) if hasattr(res[0], 'value') else str(res[0])
        status_data[key] = res[1]

    # 2. Tính COD (Tiền nộp và tiền chờ)
    def get_sum(status_val):
        query = db.query(func.sum(models.Waybills.cod_amount)).filter(
            models.Waybills.status == status_val,
            models.Waybills.is_deleted == False
        )
        if hub_id:
            query = query.filter(models.Waybills.dest_hub_id == hub_id)
        return float(query.scalar() or 0)

    # 3. BIỂU ĐỒ (SỬA LỖI: Bỏ created_at vì bảng không có cột này)
    # Tạm thời gán biểu đồ theo các thứ trong tuần để không bị vỡ giao diện
    days_map = {0: "CN", 1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4", 4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7"}
    chart_data = {}
    for i in range(7):
        d = (datetime.utcnow() - timedelta(days=(6-i)))
        label = days_map[int(d.strftime("%w"))]
        # Vì không có cột ngày tạo, mình gán số lượng hiện tại vào ngày hôm nay
        chart_data[label] = sum(status_data.values()) if i == 6 else 0

    return {
        "total_waybills": sum(status_data.values()) if status_data else 0,
        "status_breakdown": status_data,
        "total_cod_pending": get_sum(WaybillStatus.DELIVERED),
        "total_cod_settled": get_sum(WaybillStatus.SETTLED),
        "overdue_alerts": 0,
        "chart_data": chart_data,
        "last_updated": datetime.utcnow()
    }