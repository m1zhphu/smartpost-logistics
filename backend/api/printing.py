from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from core.database import get_db
import crud.waybills as crud_wb
from datetime import datetime
import barcode
from barcode.writer import ImageWriter
import qrcode
import base64
from io import BytesIO

router = APIRouter(prefix="/api/print", tags=["Printing Services"])

# --- HÀM TẠO MÃ VẠCH (BARCODE) ---
def get_base64_barcode(code: str):
    try:
        code_class = barcode.get_barcode_class('code128')
        rv = BytesIO()
        code_class(code, writer=ImageWriter()).write(rv, options={"module_height": 15, "font_size": 1, "text_distance": 1})
        return base64.b64encode(rv.getvalue()).decode()
    except Exception as e:
        print(f"Barcode Error: {e}")
        return ""

# --- HÀM TẠO MÃ QR ---
def get_base64_qr(code: str):
    try:
        qr = qrcode.QRCode(box_size=10, border=1)
        qr.add_data(code)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        rv = BytesIO()
        img.save(rv, format="PNG")
        return base64.b64encode(rv.getvalue()).decode()
    except Exception as e:
        print(f"QR Error: {e}")
        return ""

@router.get("/{waybill_code}", response_class=HTMLResponse)
async def generate_bill_html(waybill_code: str, db: Session = Depends(get_db)):
    # 1. Lấy dữ liệu vận đơn
    wb = crud_wb.get_waybill_by_code(db, waybill_code)
    if not wb: 
        raise HTTPException(404, "Vận đơn không tồn tại")

    # 2. Xử lý dữ liệu an toàn (Fix lỗi AttributeError 'phone')
    barcode_b64 = get_base64_barcode(wb.waybill_code)
    qr_b64 = get_base64_qr(f"https://smartpost.vn/track/{wb.waybill_code}")
    
    # Check thông tin khách hàng
    cust = wb.customer
    company = cust.company_name if (cust and hasattr(cust, 'company_name')) else "KHÁCH LẺ"
    sender_n = cust.representative_name if (cust and hasattr(cust, 'representative_name')) else "N/A"
    
    # SỬA LỖI TẠI ĐÂY: Thử các tên cột điện thoại phổ biến trong DB của Thảo
    sender_p = ""
    if cust:
        if hasattr(cust, 'representative_phone'):
            sender_p = cust.representative_phone
        elif hasattr(cust, 'phone_number'):
            sender_p = cust.phone_number
        elif hasattr(cust, 'phone'):
            sender_p = cust.phone
        else:
            sender_p = "Chưa có SĐT"

    origin_n = wb.origin_hub.hub_name if wb.origin_hub else "Bưu cục gửi"
    
    # Xử lý tên nhân viên (Creator)
    try:
        creator_n = wb.creator.full_name if (hasattr(wb, 'creator') and wb.creator) else "QUẢN TRỊ VIÊN"
    except:
        creator_n = "ADMIN"

    now_str = datetime.now().strftime('%H:%M %d/%m/%Y')
    total_val = (wb.cod_amount or 0) + (wb.shipping_fee or 0)

    # 3. Giao diện HTML chuẩn mẫu Speed Light
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            * {{ box-sizing: border-box; }}
            body {{ margin: 0; padding: 10px; font-family: 'Arial', sans-serif; background: #fff; }}
            .ticket {{ width: 200mm; border: 1.8px solid #000; margin: 0 auto; min-height: 140mm; }}
            .row {{ display: flex; border-bottom: 1.2px solid #000; }}
            .cell {{ border-right: 1.2px solid #000; padding: 6px; position: relative; }}
            .cell:last-child {{ border-right: none; }}
            .label {{ font-size: 9px; font-weight: bold; display: block; border-bottom: 0.5px solid #ccc; margin-bottom: 3px; }}
            .bold {{ font-weight: bold; }}
            .text-sm {{ font-size: 10px; }}
            .uppercase {{ text-transform: uppercase; }}
            .header {{ height: 85px; }}
            .logo-area {{ width: 22%; display: flex; flex-direction: column; justify-content: center; font-size: 18px; font-weight: bold; font-style: italic; }}
            .info-area {{ width: 53%; text-align: center; font-size: 9px; line-height: 1.3; }}
            .barcode-area {{ width: 25%; text-align: right; padding: 2px; }}
            .barcode-img {{ width: 100%; height: 45px; object-fit: contain; }}
            .qr-img {{ width: 85px; height: 85px; display: block; margin: 0 auto; }}
            .footer-note {{ font-size: 8px; padding: 5px; font-style: italic; border-top: 1px solid #000; background: #f5f5f5; }}
        </style>
    </head>
    <body>
        <div class="ticket">
            <div class="row header">
                <div class="cell logo-area">
                    <div style="color: #2E7D32;">SpeedLight</div>
                    <div style="color: #EF6C00;">SPEED <small style="font-style:normal;">UP</small></div>
                </div>
                <div class="cell info-area">
                    <div class="bold" style="font-size:11px;">SPEED LIGHT JOINT STOCK COMPANY</div>
                    <div class="bold" style="font-size:11px;">SPEED UP INVEST CO., LTD</div>
                    <div>Hotline: 0907 519 918 (HCM) - 0975 989 490 (HN)</div>
                    <div>www.speedlight.com.vn</div>
                </div>
                <div class="cell barcode-area">
                    <div style="font-size: 9px; font-weight: bold; color: #007bff;">Số vận đơn/Bill</div>
                    <img class="barcode-img" src="data:image/png;base64,{barcode_b64}">
                    <div style="text-align:center; font-weight:bold; letter-spacing: 2px;">{wb.waybill_code}</div>
                </div>
            </div>

            <div class="row" style="height: 110px;">
                <div class="cell" style="width: 50%;">
                    <span class="label">Thông tin người gửi:</span>
                    <div class="text-sm">Tên KH: <span class="bold uppercase">{company}</span></div>
                    <div class="text-sm">Người gửi: {sender_n}</div>
                    <div class="text-sm" style="margin-top:5px;">Địa chỉ: {origin_n}</div>
                    <div class="text-sm">SĐT: {sender_p}</div>
                </div>
                <div class="cell" style="width: 50%;">
                    <span class="label">Thông tin người nhận:</span>
                    <div class="text-sm">Người nhận: <span class="bold" style="font-size:12px;">{wb.receiver_name}</span></div>
                    <div class="text-sm">Địa chỉ: <span class="bold">{wb.receiver_address}</span></div>
                    <div class="text-sm" style="margin-top:10px;">SĐT: <span class="bold" style="font-size:12px;">{wb.receiver_phone}</span></div>
                </div>
            </div>

            <div class="row" style="height: 100px;">
                <div class="cell" style="width: 25%;">
                    <span class="label">Dịch vụ:</span>
                    <div class="bold uppercase" style="font-size:12px;">{wb.service_type or 'TIẾT KIỆM'}</div>
                </div>
                <div class="cell" style="width: 25%;"><span class="label">Cộng thêm:</span></div>
                <div class="cell" style="width: 25%;">
                    <span class="label">Cước phí:</span>
                    <div class="text-xs">COD: {wb.cod_amount:,.0f}</div>
                    <div class="text-xs">Cước: {wb.shipping_fee:,.0f}</div>
                    <div class="bold text-sm" style="border-top:1px dashed #000; margin-top:5px;">Tổng: {total_val:,.0f}</div>
                </div>
                <div class="cell" style="width: 25%;">
                    <span class="label">Hàng hoá:</span>
                    <div class="text-sm bold">1. {wb.product_name or 'Hàng hoá'}</div>
                </div>
            </div>

            <div class="row" style="height: 120px;">
                <div class="cell" style="width: 25%;">
                    <span class="label">Trọng lượng:</span>
                    <div class="bold" style="font-size:14px;">{wb.actual_weight} kg</div>
                    <div style="font-size: 9px; margin-top:10px;">Số kiện: 1</div>
                </div>
                <div class="cell" style="width: 25%; display:flex; align-items:center;">
                    <img class="qr-img" src="data:image/png;base64,{qr_b64}">
                </div>
                <div class="cell" style="width: 25%; text-align:center;"><span class="label">Ký gửi</span></div>
                <div class="cell" style="width: 25%; text-align:center;">
                    <span class="label">Nhân viên chấp nhận</span>
                    <div class="bold uppercase" style="margin-top:30px;">{creator_n}</div>
                    <div class="text-xs">{now_str}</div>
                </div>
            </div>

            <div class="row" style="height: 100px; border-bottom: none;">
                <div class="cell" style="width: 33.33%;">
                    <span class="label">Ghi chú:</span>
                    <div class="text-sm bold">{wb.note or 'Giao giờ hành chính'}</div>
                </div>
                <div class="cell" style="width: 33.33%; text-align:center;"><span class="label">Phát thất bại</span></div>
                <div class="cell" style="width: 33.34%; text-align:center;"><span class="label">Chữ ký người nhận</span></div>
            </div>

            <div class="footer-note">
                Cảm ơn Quý khách đã sử dụng dịch vụ của Speed Light. Vui lòng kiểm tra hàng trước khi ký nhận.
            </div>
        </div>
        <script>window.onload = function() {{ window.print(); }}</script>
    </body>
    </html>
    """
    return html_content