# File: api/printing.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from core.database import get_db
import crud.waybills as crud_wb
from jinja2 import Template
import barcode
from barcode.writer import ImageWriter
import qrcode
import base64
from io import BytesIO

router = APIRouter(prefix="/api/print", tags=["Printing Services"])

def get_base64_barcode(code: str):
    code_class = barcode.get_barcode_class('code128')
    rv = BytesIO()
    code_class(code, writer=ImageWriter()).write(rv)
    return base64.b64encode(rv.getvalue()).decode()

def get_base64_qr(code: str):
    qr = qrcode.make(code)
    rv = BytesIO()
    qr.save(rv, format="PNG")
    return base64.b64encode(rv.getvalue()).decode()

@router.get("/{waybill_code}", response_class=HTMLResponse)
async def generate_bill_html(waybill_code: str, db: Session = Depends(get_db)):
    wb = crud_wb.get_waybill_by_code(db, waybill_code)
    if not wb: raise HTTPException(404, "Vận đơn không tồn tại")

    # Sinh mã vạch và QR
    barcode_b64 = get_base64_barcode(wb.waybill_code)
    qr_b64 = get_base64_qr(f"https://smartpost.vn/track/{wb.waybill_code}")

    # Template HTML mô phỏng chính xác ảnh Leader gửi
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            .ticket {{ width: 800px; border: 2px solid #000; font-family: 'Arial', sans-serif; padding: 10px; }}
            .header {{ display: flex; justify-content: space-between; border-bottom: 1px solid #000; padding-bottom: 5px; }}
            .grid-container {{ display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #000; }}
            .col {{ border-right: 1px solid #000; padding: 5px; }}
            .no-border {{ border: none; }}
            .label {{ font-size: 10px; font-weight: bold; text-transform: uppercase; }}
            .value {{ font-size: 12px; margin-top: 3px; font-weight: bold; }}
            .barcode-area {{ text-align: right; }}
            .qr-area {{ text-align: center; padding: 10px; }}
            .footer-grid {{ display: grid; grid-template-columns: 1.5fr 1fr 1fr; height: 100px; }}
        </style>
    </head>
    <body>
        <div class="ticket">
            <div class="header">
                <div><strong style="color: green;">SmartPost</strong> <strong>SPEED UP</strong></div>
                <div class="barcode-area">
                    <img src="data:image/png;base64,{barcode_b64}" width="200"><br>
                    <span>{wb.waybill_code}</span>
                </div>
            </div>
            
            <div class="grid-container">
                <div class="col">
                    <div class="label">Thông tin người gửi:</div>
                    <div class="value">{wb.customer.customer_name if wb.customer else "Khách lẻ"}</div>
                    <div class="value" style="font-weight: normal;">{wb.origin_hub.hub_name if wb.origin_hub else ""}</div>
                </div>
                <div class="col no-border">
                    <div class="label">Thông tin người nhận:</div>
                    <div class="value">{wb.receiver_name}</div>
                    <div class="value" style="font-weight: normal;">{wb.receiver_address}</div>
                    <div class="value">ĐT: {wb.receiver_phone}</div>
                </div>
            </div>

            <div class="grid-container" style="grid-template-columns: 1fr 1fr 1fr;">
                <div class="col qr-area">
                    <img src="data:image/png;base64,{qr_b64}" width="80">
                </div>
                <div class="col">
                    <div class="label">Cước phí/Fees:</div>
                    <div class="value">Thu hộ/COD: {wb.cod_amount:,.0f} VNĐ</div>
                    <div class="value">Tổng cộng: {wb.shipping_fee:,.0f} VNĐ</div>
                </div>
                <div class="col no-border">
                    <div class="label">Hàng hóa:</div>
                    <div class="value">{wb.service_type} - {wb.actual_weight}kg</div>
                </div>
            </div>

            <div class="footer-grid">
                <div class="col"><div class="label">Ghi chú:</div><div class="value">Giao giờ hành chính</div></div>
                <div class="col"><div class="label">Chữ ký người gửi</div></div>
                <div class="col no-border"><div class="label">Nhân viên nhận</div></div>
            </div>
        </div>
        <script>window.print();</script>
    </body>
    </html>
    """
    return html_content