# File: core/state_machine.py
from fastapi import HTTPException

class WaybillStatus:
    CREATED = "CREATED"           # Vừa tạo đơn
    IN_HUB = "IN_HUB"             # Đã nhập kho
    BAGGED = "BAGGED"             # Đã đóng túi
    IN_TRANSIT = "IN_TRANSIT"     # Đang trên xe trung chuyển
    ARRIVED = "ARRIVED"           # Đã đến kho đích
    DELIVERING = "DELIVERING"     # Shipper đang đi giao
    DELIVERED = "DELIVERED"       # Giao thành công
    DELIVERY_FAILED = "DELIVERY_FAILED" # Giao thất bại
    RETURNED = "RETURNED"         # Đã trả hàng
    SETTLED = "SETTLED"           # Đã đối soát xong (Kết thúc)
    CANCELLED = "CANCELLED"       # Đã hủy
    OVERDUE_WARNING = "OVERDUE_WARNING"
    
# Định nghĩa các bước đi hợp lệ (Mục 3.3 đặc tả)
VALID_TRANSITIONS = {
    WaybillStatus.CREATED: [WaybillStatus.IN_HUB, WaybillStatus.CANCELLED],
    WaybillStatus.IN_HUB: [WaybillStatus.BAGGED, WaybillStatus.DELIVERING],
    WaybillStatus.BAGGED: [WaybillStatus.IN_TRANSIT],
    WaybillStatus.IN_TRANSIT: [WaybillStatus.ARRIVED],
    WaybillStatus.ARRIVED: [WaybillStatus.DELIVERING],
    WaybillStatus.DELIVERING: [WaybillStatus.DELIVERED, WaybillStatus.DELIVERY_FAILED],
    WaybillStatus.DELIVERY_FAILED: [WaybillStatus.DELIVERING, WaybillStatus.RETURNED],
    WaybillStatus.DELIVERED: [WaybillStatus.SETTLED],
    # Các trạng thái Terminal (kết thúc) không được đi đâu tiếp
    WaybillStatus.SETTLED: [],
    WaybillStatus.CANCELLED: [],
    WaybillStatus.RETURNED: []
}

def validate_state_transition(current_status: str, next_status: str):
    """
    Hàm kiểm tra xem việc đổi từ trạng thái A sang B có đúng luật không.
    """
    if current_status == next_status:
        return True
        
    allowed_next_statuses = VALID_TRANSITIONS.get(current_status, [])
    
    if next_status not in allowed_next_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Chuyển đổi trạng thái sai quy trình: Không thể đi từ {current_status} sang {next_status}"
        )
    return True