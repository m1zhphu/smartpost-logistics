from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime
from typing import List
import pandas as pd
from io import BytesIO
from fastapi.responses import StreamingResponse
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side

from core.database import get_db
from core.security import get_current_user
import models
import schemas.waybills as schema_wb
import crud.waybills as crud_wb
from core.pricing import calculate_shipping_fee
from core.permissions import PermissionChecker

router = APIRouter(prefix="/api/waybills", tags=["Waybill Management"])

@router.post("/export")
def export_waybills_excel(
    filters: schema_wb.WaybillFilter,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Xuất danh sách vận đơn ra file Excel theo bộ lọc"""
    try:
        # 1. Lấy dữ liệu theo bộ lọc (không phân trang cho export)
        filters.page = 1
        filters.size = 10000 
        
        role_id = current_user.get("role_id")
        hub_id = current_user.get("primary_hub_id") if role_id != 1 else None
        items, _ = crud_wb.get_waybills_with_filters(db, filters, current_hub_id=hub_id)

        # 2. Chuyển đổi dữ liệu sang dạng bảng
        data = []
        for w in items:
            data.append({
                "Mã Vận Đơn": w.waybill_code,
                "Trạng Thái": w.status,
                "Người Nhận": w.receiver_name,
                "SĐT Nhận": w.receiver_phone,
                "Địa Chỉ": w.receiver_address,
                "COD (VNĐ)": float(w.cod_amount or 0),
                "Cước (VNĐ)": float(w.shipping_fee or 0),
                "Khối lượng (kg)": float(w.actual_weight or 0),
                "Dịch vụ": w.service_type,
                "Bưu cục Nguồn": w.origin_hub.hub_name if w.origin_hub else "",
                "Bưu cục Đích": w.dest_hub.hub_name if w.dest_hub else "",
            })

        if not data:
            raise HTTPException(status_code=404, detail="Không có dữ liệu để xuất")

        df = pd.DataFrame(data)
        output = BytesIO()
        
        # 3. Tạo file Excel với định dạng chuyên nghiệp
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Danh_Sach_Van_Don')
            worksheet = writer.sheets['Danh_Sach_Van_Don']

            # Style tiêu đề
            header_fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
            header_font = Font(color="FFFFFF", bold=True)
            border = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))

            for cell in worksheet[1]:
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center")
                cell.border = border

            # Tự động chỉnh độ rộng cột
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if cell.value:
                            max_length = max(max_length, len(str(cell.value)))
                    except: pass
                worksheet.column_dimensions[column_letter].width = max_length + 2

        output.seek(0)
        filename = f"Danh_sach_Van_don_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Access-Control-Expose-Headers': 'Content-Disposition'
        }
        return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 1. THỐNG KÊ QUÉT TRONG NGÀY ---
@router.get("/stats/today-count")
def get_today_scan_count(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy số lượng đơn đã quét nhập kho trong ngày tại bưu cục hiện tại"""
    today = date.today()
    hub_id = current_user.get("primary_hub_id")

    count = db.query(models.TrackingLogs).filter(
        models.TrackingLogs.hub_id == hub_id,
        models.TrackingLogs.status_id == "IN_HUB",
        func.date(models.TrackingLogs.system_time) == today
    ).count()

    return {"total": count}

# --- 2. TÌM KIẾM VẬN ĐƠN ---
@router.post("/search")
def search_waybills(
    filters: schema_wb.WaybillFilter,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_role = current_user.get("role_id")
    user_hub_id = current_user.get("primary_hub_id")

    hub_filter = None
    if user_role != 1:
        # --- CHỐT CHẶN NGHIỆP VỤ ---
        if filters.status == "CREATED":
            # Đang ở tab "Chờ nhập kho": CHỈ lọc theo nguồn
            filters.origin_hub_id = user_hub_id
            filters.dest_hub_id = None
            hub_filter = None 
        elif filters.status == "ARRIVED":
            # Đang ở tab "Phân công giao": CHỈ lọc theo đích
            filters.dest_hub_id = user_hub_id
            filters.origin_hub_id = None
            hub_filter = None
        else:
            # Tra cứu chung
            hub_filter = user_hub_id

    try:
        items, total = crud_wb.get_waybills_with_filters(db, filters, current_hub_id=hub_filter)

        result = []
        for w in items:
            result.append({
                "waybill_id": w.waybill_id,
                "waybill_code": w.waybill_code,
                "status": w.status,
                "receiver_name": w.receiver_name,
                "receiver_phone": w.receiver_phone,
                "receiver_address": w.receiver_address,
                "cod_amount": float(w.cod_amount or 0),
                "shipping_fee": float(w.shipping_fee or 0),
                "actual_weight": float(w.actual_weight or 0),
                "service_type": w.service_type,
                "product_name": w.product_name,
                "note": w.note,
                "customer_id": w.customer_id,
                "origin_hub_id": w.origin_hub_id,
                "dest_hub_id": w.dest_hub_id,
                "origin_hub": {"hub_id": w.origin_hub.hub_id, "hub_name": w.origin_hub.hub_name} if w.origin_hub else None,
                "dest_hub": {"hub_id": w.dest_hub.hub_id, "hub_name": w.dest_hub.hub_name} if w.dest_hub else None,
            })

        return {"items": result, "total": total, "page": filters.page, "size": filters.size}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Lỗi hệ thống khi tìm kiếm: {str(e)}"
        )

# --- 3. TẠO MỚI VẬN ĐƠN ---
@router.post("", response_model=dict)
async def create_waybill(
    data: schema_wb.WaybillCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Tạo vận đơn mới và ghi log khởi tạo"""
    
    # 1. Bắt lỗi chặn đứng nếu giá cước không hợp lệ (Bảo vệ doanh thu)
    if data.shipping_fee <= 0:
        raise HTTPException(
            status_code=400, 
            detail="Tuyến đường này chưa được cấu hình giá cước (Cước = 0đ). Không thể tạo vận đơn."
        )

    origin_id = current_user.get("primary_hub_id") if current_user.get("role_id") != 1 else (data.origin_hub_id or current_user.get("primary_hub_id"))
    dest_id = data.dest_hub_id or origin_id

    try:
        save_data = data.model_dump()
        save_data["origin_hub_id"] = origin_id
        save_data["dest_hub_id"] = dest_id

        from crud.accounting import create_ledger_entry
        
        # 2. Tạo vận đơn mới (Sẽ xử lý cả Extra Services bên trong CRUD)
        new_waybill = crud_wb.create_waybill_record(db, save_data, fee=data.shipping_fee)

        # 3. Ghi log khởi tạo hành trình
        crud_wb.create_initial_log(db, new_waybill.waybill_id, origin_id, current_user['user_id'])

        # 4. KẾ TOÁN MVP: CHỈ ghi nợ phí ship cho Khách hàng nếu họ chọn SENDER_PAY
        if (data.shipping_fee or 0) > 0 and data.payment_method == "SENDER_PAY":
            create_ledger_entry(
                db, new_waybill.waybill_id, new_waybill.customer_id, 
                "DEBIT", float(data.shipping_fee), "FEE"
            )

        db.commit()
        return {"waybill_code": new_waybill.waybill_code, "status": new_waybill.status}
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# --- 4. CẬP NHẬT CÂN NẶNG THỰC TẾ (NEW - ĐÃ THÊM) ---
@router.patch("/{code}/weight")
def update_waybill_weight(
    code: str,
    update_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API Cập nhật cân nặng khi nhân viên kho cân lại hàng"""
    waybill = crud_wb.get_waybill_by_code(db, code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")

    new_weight = update_data.get("actual_weight")
    if new_weight is None:
        raise HTTPException(status_code=400, detail="Thiếu thông tin khối lượng thực tế")

    # Cập nhật cân nặng thực tế và tăng version (Optimistic Locking)
    result = db.query(models.Waybills).filter(
        models.Waybills.waybill_id == waybill.waybill_id,
        models.Waybills.version == waybill.version
    ).update({
        "actual_weight": float(new_weight),
        "version": models.Waybills.version + 1
    })

    if not result:
        db.rollback()
        raise HTTPException(status_code=409, detail="Dữ liệu đã bị thay đổi, vui lòng thử lại.")
    
    # Tự động tính toán lại giá cước
    try:
        new_fee = calculate_shipping_fee(
            db, 
            waybill.origin_hub_id, 
            waybill.dest_hub_id, 
            float(new_weight), 
            waybill.service_type or 'STANDARD'
        )
        # Update fee directly
        db.query(models.Waybills).filter(models.Waybills.waybill_id == waybill.waybill_id).update({"shipping_fee": new_fee})
        price_note = f"Cập nhật giá mới: {new_fee:,.0f} VNĐ"
    except Exception as e:
        price_note = f"Lỗi tính giá: {str(e)}"

    # Ghi log hành trình
    new_log = models.TrackingLogs(
        waybill_id=waybill.waybill_id,
        status_id=waybill.status,
        hub_id=current_user.get("primary_hub_id"),
        user_id=current_user['user_id'],
        note=f"Cân lại: {new_weight}kg. {price_note}",
        system_time=datetime.utcnow()
    )
    db.add(new_log)

    try:
        db.commit()
        return {"message": "Cập nhật khối lượng thành công", "actual_weight": waybill.actual_weight}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Lỗi khi lưu cân nặng")

# --- 5. CẬP NHẬT GIAO THÀNH CÔNG ---
@router.patch("/{code}/delivered")
def update_status_delivered(
    code: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API Chốt đơn giao thành công để đẩy sang màn hình đối soát"""
    from crud.accounting import create_ledger_entry

    waybill = crud_wb.get_waybill_by_code(db, code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")

    # 1. Kiểm tra Optimistic Lock (chỉ update nếu version khớp)
    # Lấy version hiện tại từ client (nếu có) hoặc mặc định xử lý
    current_version = waybill.version
    
    # Thực hiện update nguyên tử với version check
    result = db.query(models.Waybills).filter(
        models.Waybills.waybill_id == waybill.waybill_id,
        models.Waybills.version == current_version
    ).update({
        "status": "DELIVERED",
        "version": models.Waybills.version + 1
    })

    if not result:
        db.rollback()
        raise HTTPException(status_code=409, detail="Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại.")

    # 2. KẾ TOÁN MVP: Ghi nợ COD cho Shipper (Shipper cầm tiền mặt)
    if (waybill.cod_amount or 0) > 0:
        create_ledger_entry(
            db, waybill.waybill_id, current_user['user_id'], 
            "DEBIT", float(waybill.cod_amount), "COD"
        )
    
    # 3. Ghi log hành trình
    new_log = models.TrackingLogs(
        waybill_id=waybill.waybill_id,
        status_id="DELIVERED",
        hub_id=current_user.get("primary_hub_id"),
        user_id=current_user['user_id'],
        note="Giao hàng thành công - Shipper đã thu tiền mặt",
        system_time=datetime.utcnow()
    )
    db.add(new_log)

    try:
        db.commit()
        return {"message": "Đã cập nhật Giao hàng thành công", "waybill_code": code}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Lỗi hệ thống")

# --- 5.5 CẬP NHẬT THÔNG TIN VẬN ĐƠN (SỬA ĐƠN) ---
@router.put("/{code}")
def edit_waybill_info(
    code: str,
    update_data: dict,  # Nhận payload chỉnh sửa từ Frontend
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API cho phép chỉnh sửa thông tin người nhận và COD của vận đơn"""
    
    # 1. Tìm vận đơn trong DB
    waybill = crud_wb.get_waybill_by_code(db, code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn để chỉnh sửa")

    # 2. Ràng buộc nghiệp vụ: Không cho phép sửa đơn đã giao thành công hoặc đã hủy
    if waybill.status in ["DELIVERED", "CANCELLED"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Không thể chỉnh sửa vận đơn đang ở trạng thái {waybill.status}"
        )

    try:
        # 3. Gọi hàm CRUD đã viết sẵn để cập nhật dữ liệu
        updated_waybill = crud_wb.update_waybill(db, code, update_data)
        
        if not updated_waybill:
            raise HTTPException(status_code=500, detail="Lỗi khi cập nhật dữ liệu vào Database")

        # 4. Ghi log hành trình để theo dõi lịch sử sửa đổi (Audit Trail)
        new_log = models.TrackingLogs(
            waybill_id=waybill.waybill_id,
            status_id=waybill.status,  # Giữ nguyên trạng thái hiện tại
            hub_id=current_user.get("primary_hub_id"),
            user_id=current_user.get("user_id"),
            note=f"Nhân viên {current_user.get('username')} đã hiệu chỉnh thông tin vận đơn",
            system_time=datetime.utcnow()
        )
        db.add(new_log)
        
        # 5. Lưu thay đổi
        db.commit()
        return {"message": "Cập nhật vận đơn thành công", "waybill_code": code}

    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống: {str(e)}")
    
# --- 6. CÁC API PHỤ KHÁC ---
@router.get("/{code}/tracking")
def get_waybill_tracking(code: str, db: Session = Depends(get_db)):
    waybill = crud_wb.get_waybill_by_code(db, code)
    if not waybill:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")
    logs = crud_wb.get_tracking_logs(db, waybill.waybill_id)
    return {"history": [{"status_id": l.status_id, "note": l.note, "time": l.system_time} for l in logs]}

@router.delete("/{code}")
def delete_waybill(code: str, db: Session = Depends(get_db)):
    waybill = crud_wb.soft_delete_waybill(db, code)
    return {"message": "Đã hủy đơn thành công"}