# File: schemas/dashboard.py
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime

class HubStatsResponse(BaseModel):
    total_waybills: int
    status_breakdown: Dict[str, int] # Ví dụ: {"CREATED": 10, "DELIVERING": 5}
    total_cod_pending: float # Tiền COD shipper đang giữ chưa nộp
    total_cod_settled: float # Tiền đã nộp về kho
    last_updated: datetime