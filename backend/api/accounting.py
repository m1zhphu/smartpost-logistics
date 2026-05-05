from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.idempotency import validate_idempotency, commit_idempotency
from core.security import get_current_user
import crud.accounting as crud_acc 
from pydantic import BaseModel
from typing import List
from core.permissions import PermissionChecker
import schemas.accounting as schema_acc
import models
from io import BytesIO 
import pandas as pd 
from fastapi.responses import StreamingResponse
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side

router = APIRouter(prefix="/api/accounting", tags=["Accounting & Settlement"])

# --- SCHEMA CHO REQUEST ---
class CashConfirmRequest(BaseModel):
    waybill_codes: List[str]
    note: str = "Xác nhận Shipper đã nộp tiền mặt"

# --- 1. API LẤY DANH SÁCH CHỐT CA ---
@router.get("/cash-confirmation")
def get_cash_confirmation_list(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách Shipper kèm tên thật từ hàm CRUD mới có JOIN bảng Users"""
    hub_id = current_user.get('primary_hub_id')
    return crud_acc.get_shippers_for_cash_confirmation(db, hub_id)

# --- 2. API XÁC NHẬN NỘP TIỀN (CHỐT CA) ---
@router.post("/confirm-shipper-cash")
async def confirm_shipper_cash(
    data: CashConfirmRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Xử lý chốt ca thu tiền từ Shipper"""
    try:
        hub_id = current_user.get('primary_hub_id')
        user_id = current_user.get('user_id')
        
        # Thực hiện cập nhật trạng thái và ghi Ledger
        count = crud_acc.record_cash_collection(db, data.waybill_codes, hub_id, user_id, data.note)
        
        return {"status": "SUCCESS", "message": f"Đã chốt thành công {count} đơn hàng"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# --- 3. CÁC API ĐỐI SOÁT SHOP & EXCEL ---
@router.post("/create-shop-statement")
async def create_shop_statement(
    customer_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    bills = crud_acc.get_settled_bills(db, customer_id)
    if not bills:
        raise HTTPException(status_code=404, detail="Không có đơn hàng nào chờ đối soát.")
    stmt = crud_acc.create_cod_statement(db, customer_id, current_user['user_id'])
    if not stmt:
        raise HTTPException(status_code=400, detail="Lỗi tạo bảng kê")
    db.commit()
    return {
        "statement_id": stmt.statement_id,
        "statement_code": stmt.statement_code, 
        "total_amount": float(stmt.total_amount)
    }

@router.get("/cod/{statement_id}/export")
def export_statement_excel(
    statement_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        # GỌI CRUD thay vì viết query trực tiếp ở đây
        raw_data = crud_acc.get_statement_details_for_export(db, statement_id)

        if not raw_data:
            raise HTTPException(status_code=404, detail="Bảng kê không có dữ liệu chi tiết")

        processed_data = [
            {
                "Mã Vận Đơn": item.waybill_code,
                "Số Tiền (VNĐ)": float(item.amount),
                "Loại Bút Toán": "Tiền COD" if item.entry_type == "CREDIT" else "Phí/Dịch vụ",
                "Thời Gian": item.timestamp.strftime("%d/%m/%Y %H:%M") if item.timestamp else ""
            } for item in raw_data
        ]

        df = pd.DataFrame(processed_data)
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Doi_Soat_COD')
            worksheet = writer.sheets['Doi_Soat_COD']

            # Định nghĩa các Style
            header_fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
            header_font = Font(color="FFFFFF", bold=True, size=12)
            center_alignment = Alignment(horizontal="center", vertical="center")
            thin_border = Border(
                left=Side(style='thin'), right=Side(style='thin'), 
                top=Side(style='thin'), bottom=Side(style='thin')
            )

            # Áp dụng Style cho Header
            for cell in worksheet[1]:
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = center_alignment
                cell.border = thin_border

            # Tự động giãn cột và kẻ khung dữ liệu
            for column_cells in worksheet.columns:
                max_len = 0
                for cell in column_cells:
                    try:
                        if cell.value:
                            max_len = max(max_len, len(str(cell.value)))
                        cell.border = thin_border
                        if cell.row > 1:
                            cell.alignment = Alignment(horizontal="left")
                    except: pass
                worksheet.column_dimensions[column_cells[0].column_letter].width = max_len + 5

        output.seek(0)
        headers = {
            'Content-Disposition': f'attachment; filename="Bang_ke_COD_{statement_id}.xlsx"',
            'Access-Control-Expose-Headers': 'Content-Disposition'
        }
        return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))