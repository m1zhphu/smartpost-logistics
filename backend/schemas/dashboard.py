# File: schemas/dashboard.py
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime

class HubStatsResponse(BaseModel):
    total_waybills: int
    status_breakdown: Dict[str, int] # Ví dụ: {"CREATED": 10, "DELIVERING": 5}
    total_cod_pending: float # Tiền COD shipper đang giữ chưa nộp
    total_cod_settled: float # Tiền đã nộp về kho
    overdue_alerts: int
    chart_data: Dict[str, int] # Ví dụ: {"Thứ 2": 10, "Thứ 3": 15}
    last_updated: datetime