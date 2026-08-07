from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import random
import string

from core.database import get_db
from core.security import get_current_user
import models

router = APIRouter(prefix="/api/outbound-dispatch", tags=["Outbound Dispatch"])

# --- SCHEMAS ---
class CheckWaybillRequest(BaseModel):
    waybill_code: str
    dest_hub_id: int

class ConfirmDispatchRequest(BaseModel):
    dest_hub_id: int
    waybill_codes: List[str]
    note: Optional[str] = None

class MobileInboundScanRequest(BaseModel):
    code: str  # waybill_code or dispatch_code

class MobileDeliveryScanRequest(BaseModel):
    waybill_code: str

class MobilePODRequest(BaseModel):
    waybill_code: str
    image_url: Optional[str] = None
    note: Optional[str] = None

class MobileIncidentRequest(BaseModel):
    waybill_code: str
    reason: str
    note: Optional[str] = None
    image_url: Optional[str] = None


def generate_dispatch_code(db: Session) -> str:
    now_str = datetime.utcnow().strftime("%y%m%d%H%M%S")
    rand_suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"PXK{now_str}{rand_suffix}"


# --- ENDPOINTS ---

@router.post("/check-waybill")
def check_waybill_for_dispatch(
    payload: CheckWaybillRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Kiểm tra tuyến vận chuyển và bưu cục đích của vận đơn trước khi xuất kho."""
    code = payload.waybill_code.strip()
    target_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == payload.dest_hub_id).first()
    if not target_hub:
        raise HTTPException(status_code=404, detail="Bưu cục đích không tồn tại")

    waybill = db.query(models.Waybills).filter(
        models.Waybills.waybill_code == code,
        models.Waybills.is_deleted == False
    ).first()

    # Fallback to search by BookingRequests request_code
    if not waybill:
        req = db.query(models.BookingRequests).filter(
            models.BookingRequests.request_code == code
        ).first()
        if req and req.waybills:
            waybill = req.waybills[0]

    if not waybill:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy vận đơn với mã '{code}'")

    # Determine if waybill matches target hub
    expected_hub_id = waybill.dest_hub_id
    expected_hub_name = waybill.dest_hub.hub_name if waybill.dest_hub else None

    # Routing check logic
    warning = False
    warning_message = ""

    if expected_hub_id and expected_hub_id != payload.dest_hub_id:
        warning = True
        warning_message = f"CẢNH BÁO: Đơn hàng thuộc bưu cục/tuyến [{expected_hub_name or f'Hub #{expected_hub_id}'}], không thuộc bưu cục xuất [{target_hub.hub_name}]!"
    elif waybill.receiver_province_name and target_hub.province_name:
        # Check province mismatch if hub_id not strictly set
        if waybill.receiver_province_name.lower().strip() not in target_hub.hub_name.lower() and target_hub.province_name.lower() not in waybill.receiver_province_name.lower():
            # Soft check
            warning = True
            warning_message = f"CẢNH BÁO: Đơn hàng gửi đi tỉnh [{waybill.receiver_province_name}], hãy kiểm tra xem có khớp bưu cục đích [{target_hub.hub_name}] không!"

    return {
        "valid": True,
        "warning": warning,
        "warning_message": warning_message,
        "waybill": {
            "waybill_id": waybill.waybill_id,
            "waybill_code": waybill.waybill_code,
            "receiver_name": waybill.receiver_name,
            "receiver_phone": waybill.receiver_phone,
            "receiver_address": waybill.receiver_address,
            "receiver_province_name": waybill.receiver_province_name,
            "dest_hub_id": waybill.dest_hub_id,
            "dest_hub_name": expected_hub_name,
            "status": waybill.status,
        }
    }


@router.post("/confirm")
def confirm_outbound_dispatch(
    payload: ConfirmDispatchRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Chốt phiếu xuất kho đi bưu cục đích và cập nhật trạng thái vận đơn."""
    if not payload.waybill_codes:
        raise HTTPException(status_code=400, detail="Danh sách vận đơn rỗng")

    user_id = current_user["user_id"]
    origin_hub_id = current_user.get("primary_hub_id") or 1

    dest_hub = db.query(models.Hubs).filter(models.Hubs.hub_id == payload.dest_hub_id).first()
    if not dest_hub:
        raise HTTPException(status_code=404, detail="Không tìm thấy bưu cục đích")

    dispatch_code = generate_dispatch_code(db)
    now = datetime.utcnow()

    dispatch_slip = models.OutboundDispatchSlips(
        dispatch_code=dispatch_code,
        origin_hub_id=origin_hub_id,
        dest_hub_id=payload.dest_hub_id,
        created_by_user_id=user_id,
        status="IN_TRANSIT",
        waybill_count=len(payload.waybill_codes),
        note=payload.note,
        created_at=now
    )
    db.add(dispatch_slip)
    db.flush()

    dispatched_waybills = []
    for code in payload.waybill_codes:
        wb = db.query(models.Waybills).filter(models.Waybills.waybill_code == code).first()
        if not wb:
            req = db.query(models.BookingRequests).filter(models.BookingRequests.request_code == code).first()
            if req and req.waybills:
                wb = req.waybills[0]

        if wb:
            wb.status = "DISPATCHED_TO_HUB"
            wb.holding_hub_id = payload.dest_hub_id
            wb.version = (wb.version or 1) + 1

            item = models.OutboundDispatchItems(
                dispatch_id=dispatch_slip.dispatch_id,
                waybill_id=wb.waybill_id,
                status="DISPATCHED",
                created_at=now
            )
            db.add(item)

            log = models.TrackingLogs(
                waybill_id=wb.waybill_id,
                status_id="DISPATCHED_TO_HUB",
                hub_id=payload.dest_hub_id,
                user_id=user_id,
                system_time=now,
                note=f"Đã chốt phiếu xuất kho đi bưu cục [{dest_hub.hub_name}]. Mã phiếu: {dispatch_code}"
            )
            db.add(log)
            dispatched_waybills.append(wb.waybill_code)

    db.commit()

    return {
        "success": True,
        "dispatch_code": dispatch_code,
        "dest_hub_name": dest_hub.hub_name,
        "waybill_count": len(dispatched_waybills),
        "dispatched_waybills": dispatched_waybills
    }


@router.get("/slips")
def list_outbound_dispatch_slips(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách lịch sử phiếu xuất kho đi bưu cục."""
    slips = db.query(models.OutboundDispatchSlips).order_by(models.OutboundDispatchSlips.dispatch_id.desc()).limit(100).all()
    result = []
    for s in slips:
        result.append({
            "dispatch_id": s.dispatch_id,
            "dispatch_code": s.dispatch_code,
            "origin_hub_name": s.origin_hub.hub_name if s.origin_hub else f"Hub #{s.origin_hub_id}",
            "dest_hub_name": s.dest_hub.hub_name if s.dest_hub else f"Hub #{s.dest_hub_id}",
            "creator_name": s.creator.full_name if s.creator else "N/A",
            "status": s.status,
            "waybill_count": s.waybill_count,
            "created_at": s.created_at,
            "note": s.note
        })
    return result


# --- MOBILE APIS (Xử lý tại Bưu cục đến & Phát hàng) ---

@router.post("/mobile/inbound-scan")
def mobile_inbound_scan_at_dest_hub(
    payload: MobileInboundScanRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mobile Bưu tá/Kho: Scan xác nhận hàng đến bưu cục đích (Nhập kho bưu cục phát)"""
    user_id = current_user["user_id"]
    user_hub_id = current_user.get("primary_hub_id") or 1
    now = datetime.utcnow()
    code = payload.code.strip()

    # Search if code is a dispatch slip code or a waybill code
    slip = db.query(models.OutboundDispatchSlips).filter(models.OutboundDispatchSlips.dispatch_code == code).first()
    waybills_to_update = []

    if slip:
        items = db.query(models.OutboundDispatchItems).filter(models.OutboundDispatchItems.dispatch_id == slip.dispatch_id).all()
        for it in items:
            if it.waybill:
                waybills_to_update.append(it.waybill)
        slip.status = "COMPLETED"
    else:
        wb = db.query(models.Waybills).filter(models.Waybills.waybill_code == code).first()
        if not wb:
            req = db.query(models.BookingRequests).filter(models.BookingRequests.request_code == code).first()
            if req and req.waybills:
                wb = req.waybills[0]
        if wb:
            waybills_to_update.append(wb)

    if not waybills_to_update:
        raise HTTPException(status_code=404, detail="Không tìm thấy mã vận đơn hoặc phiếu xuất kho hợp lệ")

    updated_codes = []
    for wb in waybills_to_update:
        wb.status = "ARRIVED_DEST_HUB"
        wb.holding_hub_id = user_hub_id
        wb.holding_shipper_id = None
        wb.version = (wb.version or 1) + 1

        db.add(models.TrackingLogs(
            waybill_id=wb.waybill_id,
            status_id="ARRIVED_DEST_HUB",
            hub_id=user_hub_id,
            user_id=user_id,
            system_time=now,
            note="Nhập kho thành công tại bưu cục phát"
        ))
        updated_codes.append(wb.waybill_code)

    db.commit()
    return {
        "success": True,
        "message": f"Đã quét nhập kho bưu cục phát thành công {len(updated_codes)} đơn",
        "updated_waybills": updated_codes
    }


@router.post("/mobile/outbound-delivery-scan")
def mobile_outbound_delivery_scan(
    payload: MobileDeliveryScanRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mobile Bưu tá: Quét xuất kho các đơn thuộc tuyến của mình để đi giao hàng"""
    user_id = current_user["user_id"]
    now = datetime.utcnow()
    code = payload.waybill_code.strip()

    wb = db.query(models.Waybills).filter(models.Waybills.waybill_code == code).first()
    if not wb:
        req = db.query(models.BookingRequests).filter(models.BookingRequests.request_code == code).first()
        if req and req.waybills:
            wb = req.waybills[0]

    if not wb:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")

    wb.status = "OUT_FOR_DELIVERY"
    wb.holding_shipper_id = user_id
    wb.version = (wb.version or 1) + 1

    db.add(models.TrackingLogs(
        waybill_id=wb.waybill_id,
        status_id="OUT_FOR_DELIVERY",
        user_id=user_id,
        system_time=now,
        note="Bưu tá đã xuất kho nhận đơn đi giao"
    ))
    db.commit()

    return {
        "success": True,
        "message": "Đã xuất kho đi giao thành công",
        "waybill_code": wb.waybill_code
    }


@router.post("/mobile/pod")
def mobile_submit_pod(
    payload: MobilePODRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mobile Bưu tá: Chụp báo phát / hình ảnh xác nhận giao hàng thành công (DELIVERED)"""
    user_id = current_user["user_id"]
    now = datetime.utcnow()
    code = payload.waybill_code.strip()

    wb = db.query(models.Waybills).filter(models.Waybills.waybill_code == code).first()
    if not wb:
        req = db.query(models.BookingRequests).filter(models.BookingRequests.request_code == code).first()
        if req and req.waybills:
            wb = req.waybills[0]

    if not wb:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")

    wb.status = "DELIVERED"
    if payload.image_url:
        wb.pickup_image_url = payload.image_url
    wb.version = (wb.version or 1) + 1

    db.add(models.TrackingLogs(
        waybill_id=wb.waybill_id,
        status_id="DELIVERED",
        user_id=user_id,
        system_time=now,
        note=f"Giao hàng thành công. Ghi chú: {payload.note or 'N/A'}"
    ))
    db.commit()

    return {
        "success": True,
        "message": "Giao hàng và cập nhật báo phát thành công",
        "waybill_code": wb.waybill_code
    }


@router.post("/mobile/incident")
def mobile_report_incident(
    payload: MobileIncidentRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mobile Bưu tá: Ghi nhận báo cáo sự cố giao hàng không thành công"""
    user_id = current_user["user_id"]
    now = datetime.utcnow()
    code = payload.waybill_code.strip()

    wb = db.query(models.Waybills).filter(models.Waybills.waybill_code == code).first()
    if not wb:
        req = db.query(models.BookingRequests).filter(models.BookingRequests.request_code == code).first()
        if req and req.waybills:
            wb = req.waybills[0]

    if not wb:
        raise HTTPException(status_code=404, detail="Không tìm thấy vận đơn")

    wb.status = "INCIDENT"
    wb.version = (wb.version or 1) + 1

    db.add(models.TrackingLogs(
        waybill_id=wb.waybill_id,
        status_id="INCIDENT",
        user_id=user_id,
        system_time=now,
        note=f"Phát sinh sự cố: [{payload.reason}]. Chi tiết: {payload.note or 'Không có'}"
    ))
    db.commit()

    return {
        "success": True,
        "message": "Đã ghi nhận báo cáo sự cố thành công",
        "waybill_code": wb.waybill_code,
        "reason": payload.reason
    }
