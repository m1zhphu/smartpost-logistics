# File: core/state_machine.py
from fastapi import HTTPException

class WaybillStatus:
    PENDING_OCR = "PENDING_OCR"
    CREATED = "CREATED"           # Vừa tạo đơn (WAIT_PICKUP)
    PICKED_PENDING_VERIFY = "PICKED_PENDING_VERIFY" # Đã lấy, chờ xác thực
    VERIFY_ERROR = "VERIFY_ERROR" # Sai dữ liệu, cần cập nhật
    READY_WAREHOUSE = "READY_WAREHOUSE" # Sẵn sàng nhập kho
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
    WaybillStatus.PENDING_OCR: [WaybillStatus.PICKED_PENDING_VERIFY, WaybillStatus.CREATED, WaybillStatus.CANCELLED],
    WaybillStatus.CREATED: [WaybillStatus.PICKED_PENDING_VERIFY, WaybillStatus.IN_HUB, WaybillStatus.CANCELLED],
    WaybillStatus.PICKED_PENDING_VERIFY: [WaybillStatus.READY_WAREHOUSE, WaybillStatus.IN_HUB, WaybillStatus.VERIFY_ERROR],
    WaybillStatus.VERIFY_ERROR: [WaybillStatus.PICKED_PENDING_VERIFY, WaybillStatus.CANCELLED],
    WaybillStatus.READY_WAREHOUSE: [WaybillStatus.IN_HUB],
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
