# File: crud/accounting.py
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import models
from core.state_machine import WaybillStatus

def record_cash_collection(db: Session, waybill_codes: list, hub_id: int, user_id: int, note: str):
    """
    Xử lý nghiệp vụ thu tiền mặt: Ghi Ledger Nợ/Có và cập nhật trạng thái đơn
    """
    processed_count = 0
    for code in waybill_codes:
        # 1. Tìm vận đơn
        waybill = db.query(models.Waybills).filter(models.Waybills.waybill_code == code).first()
        if not waybill or waybill.status != WaybillStatus.DELIVERED:
            continue 

        # 2. Tìm thông tin Shipper và Tiền thực thu từ DeliveryResults
        delivery_record = db.query(models.DeliveryResults).filter(
            models.DeliveryResults.waybill_id == waybill.waybill_id
        ).order_by(models.DeliveryResults.delivery_id.desc()).first()

        if not delivery_record:
            continue

        p_trans_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"
        # Lấy số tiền thực thu, nếu không có thì lấy số tiền COD dự kiến
        amount = delivery_record.actual_cod_collected or waybill.cod_amount
        shipper_id = delivery_record.shipper_id

        # 3. Bút toán Nợ (Hub - Nhận tiền)
        db.add(models.TransactionLedger(
            parent_transaction_id=p_trans_id,
            waybill_id=waybill.waybill_id,
            account_id=hub_id,
            entry_type="DEBIT", 
            amount=amount,
            account_type="COD",
            status="RECONCILED"
            # Đã xóa: description (không có trong model)
        ))

        # 4. Bút toán Có (Shipper - Trả tiền)
        db.add(models.TransactionLedger(
            parent_transaction_id=p_trans_id,
            waybill_id=waybill.waybill_id,
            account_id=shipper_id,
            entry_type="CREDIT",
            amount=amount,
            account_type="COD",
            status="RECONCILED"
            # Đã xóa: description (không có trong model)
        ))

        # 5. Cập nhật đơn hàng sang trạng thái SETTLED và ghi log
        waybill.status = WaybillStatus.SETTLED
        waybill.version += 1
        db.add(models.TrackingLogs(
            waybill_id=waybill.waybill_id, 
            status_id=WaybillStatus.SETTLED,
            hub_id=hub_id, 
            user_id=user_id, 
            system_time=datetime.utcnow(), 
            note=note
        ))
        processed_count += 1
    
    return processed_count

def get_settled_bills(db: Session, customer_id: int):
    """Lấy danh sách đơn đã đối soát xong của khách hàng"""
    return db.query(models.Waybills).filter(
        models.Waybills.customer_id == customer_id,
        models.Waybills.status == WaybillStatus.SETTLED
    ).all()

def create_cod_statement(db: Session, customer_id: int, user_id: int):
    # 1. Tìm các bút toán COD của khách hàng này đang ở trạng thái RECONCILED 
    # và CHƯA nằm trong bất kỳ bảng kê nào
    subquery = db.query(models.StatementDetails.ledger_id)
    
    pending_ledgers = db.query(models.TransactionLedger).filter(
        models.TransactionLedger.account_id == customer_id,
        models.TransactionLedger.account_type == "COD",
        models.TransactionLedger.status == "RECONCILED",
        ~models.TransactionLedger.id.in_(subquery) # 
    ).all()

    if not pending_ledgers:
        return None

    total_sum = sum(item.amount for item in pending_ledgers)

    # 2. Tạo bảng kê tổng
    new_statement = models.StatementCOD(
        statement_code=f"STM-COD-{int(datetime.utcnow().timestamp())}",
        customer_id=customer_id,
        total_amount=total_sum,
        # Bổ sung thêm các trường để bảng kê đầy đủ thông tin hơn
        total_bills=len(pending_ledgers),
        total_cod_amount=total_sum,
        status="PENDING",
        created_by=user_id
    )
    db.add(new_statement)
    db.flush()

    # 3. Ghi chi tiết liên kết
    for ledger in pending_ledgers:
        db.add(models.StatementDetails(
            # CHỖ CẦN SỬA: Đổi .id thành .statement_id
            statement_id=new_statement.statement_id, 
            ledger_id=ledger.id,
            type="COD"
        ))
    
    db.commit() # Nhớ thêm commit để lưu vĩnh viễn vào DB
    db.refresh(new_statement)
    return new_statement