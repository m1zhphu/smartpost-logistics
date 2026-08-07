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
    waybill_code: Optional[str] = None
    waybill_codes: Optional[List[str]] = None

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
    elif waybill.receiver_province_name:
        rec_prov = waybill.receiver_province_name.lower().strip()
        clean_prov = rec_prov.replace("thành phố", "").replace("tỉnh", "").strip()
        hub_name_lower = target_hub.hub_name.lower().strip()
        hub_addr_lower = (target_hub.address_detail or "").lower().strip()

        matches = (clean_prov and (clean_prov in hub_name_lower or clean_prov in hub_addr_lower)) or (rec_prov in hub_name_lower or rec_prov in hub_addr_lower)
        if not matches:
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


@router.get("/slips/{dispatch_id}")
def get_outbound_dispatch_slip_detail(
    dispatch_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy thông tin chi tiết của 1 phiếu xuất kho để in PDF / Phiếu xuất kho."""
    slip = db.query(models.OutboundDispatchSlips).filter(models.OutboundDispatchSlips.dispatch_id == dispatch_id).first()
    if not slip:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu xuất kho")

    items = []
    for it in slip.items:
        if it.waybill:
            items.append({
                "waybill_code": it.waybill.waybill_code,
                "receiver_name": it.waybill.receiver_name,
                "receiver_phone": it.waybill.receiver_phone,
                "receiver_address": it.waybill.receiver_address,
                "receiver_province_name": it.waybill.receiver_province_name,
                "weight": float(it.waybill.weight or 0),
                "cod_amount": float(it.waybill.cod_amount or 0),
                "note": it.waybill.note or ""
            })

    return {
        "dispatch_id": slip.dispatch_id,
        "dispatch_code": slip.dispatch_code,
        "origin_hub_name": slip.origin_hub.hub_name if slip.origin_hub else f"Hub #{slip.origin_hub_id}",
        "origin_hub_address": slip.origin_hub.address_detail if slip.origin_hub else "",
        "dest_hub_name": slip.dest_hub.hub_name if slip.dest_hub else f"Hub #{slip.dest_hub_id}",
        "dest_hub_address": slip.dest_hub.address_detail if slip.dest_hub else "",
        "creator_name": slip.creator.full_name if slip.creator else "N/A",
        "status": slip.status,
        "waybill_count": slip.waybill_count,
        "note": slip.note,
        "created_at": slip.created_at,
        "items": items
    }


# --- MOBILE APIS (Xử lý tại Bưu cục đến & Phát hàng) ---

def resolve_delivery_shipper_for_waybill(db: Session, wb: models.Waybills) -> tuple[Optional[int], Optional[str], str]:
    """
    Quy tắc Tự Động Phân Công Bưu Tá Đi Giao Hàng Theo Tuyến Vận Chuyển:
    1. Phân công theo Tuyến Vận Chuyển (Phường/Xã & Tỉnh/Thành của Địa chỉ Người Nhận)
    2. Nếu chưa gán tuyến: Chờ bưu tá tuyến xuất kho / nhận tự do tại bưu cục phát (UNASSIGNED)
    """
    # Route-based auto assignment (Receiver's Ward & Province)
    import crud.waybills as crud_wb
    receiver_full_text = f"{wb.receiver_address or ''}, {wb.receiver_ward_name or ''}, {wb.receiver_province_name or ''}"
    matched_shipper = crud_wb.auto_assign_shipper_by_route(db, pickup_address=receiver_full_text)
    if matched_shipper:
        return matched_shipper.user_id, matched_shipper.full_name or matched_shipper.username, "ROUTE_ASSIGNED"

    # Unassigned queue for manual dispatch / hub claim
    return None, None, "UNASSIGNED"


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
    already_received = []

    if slip:
        items = db.query(models.OutboundDispatchItems).filter(models.OutboundDispatchItems.dispatch_id == slip.dispatch_id).all()
        for it in items:
            if it.waybill:
                if it.waybill.status in ["ARRIVED_DEST_HUB", "OUT_FOR_DELIVERY", "DELIVERED"]:
                    already_received.append(it.waybill)
                else:
                    waybills_to_update.append(it.waybill)
        slip.status = "COMPLETED"
    else:
        wb = db.query(models.Waybills).filter(models.Waybills.waybill_code == code).first()
        if not wb:
            req = db.query(models.BookingRequests).filter(models.BookingRequests.request_code == code).first()
            if req and req.waybills:
                wb = req.waybills[0]
        if wb:
            if wb.status in ["ARRIVED_DEST_HUB", "OUT_FOR_DELIVERY", "DELIVERED"]:
                already_received.append(wb)
            else:
                waybills_to_update.append(wb)

    if not waybills_to_update and not already_received:
        raise HTTPException(status_code=404, detail="Không tìm thấy mã vận đơn hoặc phiếu xuất kho hợp lệ")

    if not waybills_to_update and already_received:
        db.commit()
        return {
            "success": True,
            "message": f"Tất cả {len(already_received)} đơn trong mã [{code}] đã được nhập kho bưu cục phát trước đó rồi",
            "updated_waybills": [w.waybill_code for w in already_received]
        }

    updated_codes = []
    for wb in waybills_to_update:
        wb.status = "ARRIVED_DEST_HUB"
        wb.holding_hub_id = user_hub_id
        wb.version = (wb.version or 1) + 1

        # Run 3-Tier Delivery Shipper Auto-Assignment
        assigned_shipper_id, assigned_shipper_name, tier = resolve_delivery_shipper_for_waybill(db, wb)
        if assigned_shipper_id:
            wb.holding_shipper_id = assigned_shipper_id

        db.add(models.TrackingLogs(
            waybill_id=wb.waybill_id,
            status_id="ARRIVED_DEST_HUB",
            hub_id=user_hub_id,
            user_id=user_id,
            system_time=now,
            note=f"Nhập kho thành công tại bưu cục phát. Phân công đi giao: {assigned_shipper_name or 'Chờ gán bưu tá (Ưu tiên 3)'}"
        ))
        updated_codes.append(wb.waybill_code)

    db.commit()
    return {
        "success": True,
        "message": f"Đã quét nhập kho bưu cục phát thành công {len(updated_codes)} đơn mới",
        "updated_waybills": updated_codes
    }


@router.get("/mobile/pending-delivery-waybills")
def get_pending_delivery_waybills(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách các vận đơn đang lưu tại bưu cục (ARRIVED_DEST_HUB) chờ xuất kho đi giao"""
    user_role = current_user.get("role_id")
    curr_user_id = current_user.get("user_id")

    query = db.query(models.Waybills).filter(
        models.Waybills.status == "ARRIVED_DEST_HUB",
        models.Waybills.is_deleted == False
    )

    rows = query.order_by(models.Waybills.waybill_id.desc()).limit(150).all()
    items = []
    for wb in rows:
        try:
            w_val = float(getattr(wb, "actual_weight", None) or getattr(wb, "estimated_weight", None) or 0)
        except Exception:
            w_val = 0.0

        try:
            c_val = float(getattr(wb, "cod_amount", None) or 0)
        except Exception:
            c_val = 0.0

        created_str = None
        if wb.request and getattr(wb.request, "requested_pickup_time", None):
            created_str = wb.request.requested_pickup_time.isoformat()

        # Delivery Shipper Route Assignment Check
        assigned_shipper_id, assigned_shipper_name, tier_type = resolve_delivery_shipper_for_waybill(db, wb)
        effective_shipper_id = wb.holding_shipper_id or assigned_shipper_id
        is_assigned_to_me = (effective_shipper_id == curr_user_id) if curr_user_id else False

        items.append({
            "waybill_id": wb.waybill_id,
            "waybill_code": wb.waybill_code,
            "receiver_name": wb.receiver_name or "N/A",
            "receiver_phone": wb.receiver_phone or "N/A",
            "receiver_address": wb.receiver_address or "N/A",
            "receiver_province_name": wb.receiver_province_name or "",
            "weight": w_val,
            "cod_amount": c_val,
            "status": wb.status,
            "created_at": created_str,
            "assigned_shipper_id": effective_shipper_id,
            "assigned_shipper_name": assigned_shipper_name,
            "assignment_tier": tier_type,
            "is_assigned_to_me": is_assigned_to_me,
            "is_my_route": is_assigned_to_me
        })

    return {"total": len(items), "items": items}


@router.post("/mobile/outbound-delivery-scan")
def mobile_outbound_delivery_scan(
    payload: MobileDeliveryScanRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mobile Bưu tá: Quét/Chọn xuất kho các đơn thuộc tuyến của mình để đi giao hàng"""
    user_id = current_user["user_id"]
    now = datetime.utcnow()
    codes_to_process = []
    if payload.waybill_codes:
        codes_to_process = [c.strip() for c in payload.waybill_codes if c.strip()]
    elif payload.waybill_code:
        codes_to_process = [payload.waybill_code.strip()]

    if not codes_to_process:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp mã vận đơn để xuất kho")

    processed = []
    for code in codes_to_process:
        wb = db.query(models.Waybills).filter(models.Waybills.waybill_code == code).first()
        if not wb:
            req = db.query(models.BookingRequests).filter(models.BookingRequests.request_code == code).first()
            if req and req.waybills:
                wb = req.waybills[0]

        if wb:
            assigned_shipper_id, assigned_shipper_name, _ = resolve_delivery_shipper_for_waybill(db, wb)
            effective_shipper_id = assigned_shipper_id or user_id
            
            wb.status = "OUT_FOR_DELIVERY"
            wb.holding_shipper_id = effective_shipper_id
            wb.version = (wb.version or 1) + 1

            db.add(models.TrackingLogs(
                waybill_id=wb.waybill_id,
                status_id="OUT_FOR_DELIVERY",
                user_id=user_id,
                system_time=now,
                note=f"Xuất kho đi giao thành công. Bưu tá phụ trách giao: {assigned_shipper_name or current_user.get('full_name', 'Bưu tá')}"
            ))
            processed.append(wb.waybill_code)

    db.commit()

    return {
        "success": True,
        "message": f"Đã xuất kho đi giao thành công {len(processed)} vận đơn",
        "processed_waybills": processed
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
