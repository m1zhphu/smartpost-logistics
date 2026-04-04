# File: api/dashboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime # SỬA LỖI TẠI ĐÂY: Thêm import datetime

from core.database import get_db
from core.security import get_current_user
from core.permissions import PermissionChecker
import crud.dashboard as crud_dashboard
import schemas.dashboard as schema_dashboard

router = APIRouter(prefix="/api/dashboard", tags=["Analytics"])

@router.get("/summary", 
            response_model=schema_dashboard.HubStatsResponse,
            dependencies=[Depends(PermissionChecker("report_view"))])
def get_hub_summary(
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    # 1. Lấy thông tin từ Token
    hub_id = current_user.get('primary_hub_id')
    role_id = current_user.get('role_id')

    # 2. LOGIC QUAN TRỌNG: 
    # Nếu là Admin (role_id = 1), chúng ta truyền hub_id = None 
    # để hàm CRUD không thực hiện filter, từ đó thấy được tổng toàn quốc.
    if role_id == 1:
        stats = crud_dashboard.get_hub_statistics(db, hub_id=None)
    else:
        stats = crud_dashboard.get_hub_statistics(db, hub_id=hub_id)

    return stats