from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.idempotency import validate_idempotency, commit_idempotency
from core.security import get_current_user
import crud.accounting as crud_acc # Đảm bảo bạn đã tạo file crud/accounting.py
from pydantic import BaseModel
from typing import List
from core.permissions import PermissionChecker
import schemas.accounting as schema_acc
import models
from io import BytesIO                         # Sửa lỗi BytesIO
import pandas as pd                            # Sửa lỗi pd
import models
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api/accounting", tags=["Accounting & Settlement"])

class CashConfirmRequest(BaseModel):
    waybill_codes: List[str]
    note: str = "Xác nhận Shipper đã nộp tiền mặt"

@router.post("/confirm-shipper-cash", dependencies=[Depends(PermissionChecker("accounting_manage"))])
async def confirm_shipper_cash(
    data: CashConfirmRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    idem_key: str = Depends(validate_idempotency)
):
    try:
        # Lấy thông tin từ token để ghi vào Ledger
        hub_id = current_user.get('primary_hub_id')
        user_id = current_user.get('user_id')
        
        # Gọi tầng CRUD thực hiện bút toán kép
        count = crud_acc.record_cash_collection(db, data.waybill_codes, hub_id, user_id, data.note)
        
        db.commit()
        res = {"status": "SUCCESS", "processed": count}
        commit_idempotency(idem_key, res)
        return res
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-shop-statement", 
             dependencies=[Depends(PermissionChecker("accounting_manage"))])
async def create_shop_statement(
    customer_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user), # THÊM DÒNG NÀY ĐỂ ĐỊNH NGHĨA current_user
    idem_key: str = Depends(validate_idempotency) 
):
    """
    Lập bảng kê thanh toán: Tiền trả Shop = Tổng COD - Phí vận chuyển
    """
    # 1. Lấy dữ liệu qua tầng CRUD
    bills = crud_acc.get_settled_bills(db, customer_id)
    if not bills:
        raise HTTPException(status_code=404, detail="Không có đơn hàng nào chờ đối soát.")

    # 2. Gọi CRUD để tạo bảng kê (truyền current_user['user_id'] vào tham số thứ 3)
    stmt = crud_acc.create_cod_statement(db, customer_id, current_user['user_id'])
    
    if not stmt:
        raise HTTPException(status_code=400, detail="Lỗi tạo bảng kê")

    db.commit()

    return {
        "statement_code": stmt.statement_code, 
        "total_amount": float(stmt.total_amount),
        "created_by": current_user['user_id']
    }

@router.post("/cod", response_model=schema_acc.StatementResponse)
def generate_cod_statement(
    data: schema_acc.StatementCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # 1. Chỉ Kế toán (Role 4) hoặc Admin (Role 1) mới được chốt tiền [cite: 50]
    if current_user.get("role_id") not in [1, 4]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền lập bảng kê")

    # 2. Gọi CRUD để gom các bút toán RECONCILED chưa thanh toán
    statement = crud_acc.create_cod_statement(db, data.customer_id, current_user['user_id'])
    
    if not statement:
        raise HTTPException(status_code=400, detail="Không có giao dịch nào cần chốt cho khách hàng này")
    
    db.commit()
    return statement

@router.get("/cod/{statement_id}")
def get_statement_details(
    statement_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Lấy thông tin chi tiết bảng kê kèm danh sách các vận đơn liên quan
    statement = db.query(models.StatementCOD).filter(models.StatementCOD.id == statement_id).first()
    if not statement:
        raise HTTPException(status_code=404, detail="Không tìm thấy bảng kê")
        
    return statement

@router.get("/cod/{statement_id}/export")
def export_statement_excel(
    statement_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # 1. Kiểm tra quyền (Admin/Kế toán) [cite: 50, 51]
    if current_user.get("role_id") not in [1, 4]:
        raise HTTPException(status_code=403, detail="Không có quyền xuất dữ liệu")

    # 2. Truy vấn dữ liệu chi tiết bảng kê kèm thông tin Vận đơn
    # Chúng ta Join StatementDetails -> TransactionLedger -> Waybills
    data = db.query(
        models.Waybills.waybill_code,
        models.TransactionLedger.amount,
        models.TransactionLedger.entry_type,
        models.TransactionLedger.timestamp
    ).join(
        models.TransactionLedger, models.Waybills.waybill_id == models.TransactionLedger.waybill_id
    ).join(
        models.StatementDetails, models.TransactionLedger.id == models.StatementDetails.ledger_id
    ).filter(
        models.StatementDetails.statement_id == statement_id
    ).all()

    if not data:
        raise HTTPException(status_code=404, detail="Bảng kê không có dữ liệu chi tiết")

    # 3. Chuyển đổi sang DataFrame của Pandas
    df = pd.DataFrame(data, columns=["Mã Vận Đơn", "Số Tiền", "Loại Bút Toán", "Thời Gian"])
    
    # 4. Ghi dữ liệu vào bộ nhớ đệm (Buffer) dưới dạng Excel
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Doi_Soat_COD')
    
    output.seek(0)
    
    # 5. Trả về file cho trình duyệt tải xuống
    headers = {
        'Content-Disposition': f'attachment; filename="Bang_ke_COD_{statement_id}.xlsx"'
    }
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')