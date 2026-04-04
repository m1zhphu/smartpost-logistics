# File: api/waybills.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.idempotency import validate_idempotency, commit_idempotency
from core.security import get_current_user
from core.pricing import calculate_shipping_fee
import crud.waybills as crud_wb
import schemas.waybills as schema_wb
from typing import Optional
from schemas.waybills import WaybillFilter

router = APIRouter(prefix="/api/waybills", tags=["Waybill Management"])

@router.post("", response_model=dict)
async def create_waybill(
    data: schema_wb.WaybillCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    idem_key: str = Depends(validate_idempotency)
):
    # 1. Logic tính phí: Tra cứu từ PricingRules
    shipping_fee = calculate_shipping_fee(
        db, data.origin_hub_id, data.dest_hub_id, data.actual_weight, data.service_type
    )

    try:
        # 2. Thực thi lưu trữ qua CRUD
        new_waybill = crud_wb.create_waybill_record(db, data.model_dump(), shipping_fee)
        
        # 3. Ghi log qua CRUD
        crud_wb.create_initial_log(db, new_waybill.waybill_id, data.origin_hub_id, current_user['user_id'])

        db.commit()
        db.refresh(new_waybill)

        result = {
            "waybill_code": new_waybill.waybill_code,
            "shipping_fee": float(new_waybill.shipping_fee),
            "status": new_waybill.status
        }
        commit_idempotency(idem_key, result)
        return result

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{waybill_code}/tracking", response_model=schema_wb.WaybillTrackingResponse)
def get_waybill_tracking(waybill_code: str, db: Session = Depends(get_db)):
    """API tra cứu hành trình vận đơn"""
    waybill = crud_wb.get_waybill_by_code(db, waybill_code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không thấy vận đơn")
    
    logs = crud_wb.get_tracking_logs(db, waybill.waybill_id)
    
    return {
        "waybill_info": {
            "code": waybill.waybill_code,
            "status": waybill.status,
            "receiver": waybill.receiver_name,
            "cod": float(waybill.cod_amount)
        },
        "history": logs
    }

@router.get("/public/{waybill_code}", response_model=schema_wb.PublicTrackingResponse)
def public_tracking(waybill_code: str, db: Session = Depends(get_db)):
    """API tra cứu công khai: Đã fix lỗi lệch Schema"""
    
    # 1. Tìm đơn hàng
    waybill = crud_wb.get_waybill_by_code(db, waybill_code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Mã vận đơn không tồn tại")
    
    # 2. Lấy hành trình
    logs = crud_wb.get_tracking_logs(db, waybill.waybill_id)
    
    # 3. Trích xuất thời gian tạo đơn từ log đầu tiên (vì table waybills không có created_at)
    # Lấy log cũ nhất trong danh sách logs
    created_time = logs[-1].system_time if logs else None

    # 4. Trả về đúng cấu trúc mà PublicWaybillInfo yêu cầu
    return {
        "waybill_info": {
            "waybill_code": waybill.waybill_code,
            "status": waybill.status,
            "origin_hub_name": waybill.origin_hub.hub_name if waybill.origin_hub else "N/A",
            "dest_hub_name": waybill.dest_hub.hub_name if waybill.dest_hub else "N/A",
            "created_at": created_time
        },
        "history": logs
    }

@router.post("/search")
def search_waybills(
    filters: schema_wb.WaybillFilter,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Admin (Role 1) thấy hết, các role khác bị giới hạn bởi Hub 
    hub_id = None if current_user.get("role_id") == 1 else current_user.get("primary_hub_id")
    
    items, total = crud_wb.get_waybills_with_filters(db, filters, hub_id)
    
    return {
        "items": items,
        "total": total,
        "page": filters.page,
        "size": filters.size
    }