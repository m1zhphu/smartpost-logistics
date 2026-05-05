from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import uuid
import models
from core.state_machine import WaybillStatus

def create_ledger_entry(db: Session, waybill_id: int, account_id: int, entry_type: str, amount: float, account_type: str, p_trans_id: str = None):
    """
    Hệ thống kế toán kép (Double-entry): Tạo bút toán ghi Nợ/Có.
    """
    if not p_trans_id:
        p_trans_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"
        
    entry = models.TransactionLedger(
        parent_transaction_id=p_trans_id,
        waybill_id=waybill_id,
        account_id=account_id,
        entry_type=entry_type,
        amount=amount,
        account_type=account_type,
        status="PENDING" if entry_type == "DEBIT" else "RECONCILED"
    )
    db.add(entry)
    return p_trans_id

# --- 1. LẤY DANH SÁCH SHIPPER CHỜ CHỐT CA ---
def get_shippers_for_cash_confirmation(db: Session, hub_id: int):
    """
    Lấy danh sách Shipper có đơn DELIVERED kèm tên thật từ bảng Users.
    """
    latest_delivery = db.query(
        models.DeliveryResults.waybill_id,
        func.max(models.DeliveryResults.delivery_id).label("last_id")
    ).group_by(models.DeliveryResults.waybill_id).subquery()

    query = db.query(
        models.Users.user_id.label("shipper_id"),
        models.Users.full_name.label("shipper_name"),
        func.count(models.Waybills.waybill_id).label("total_bills"),
        func.sum(models.Waybills.cod_amount).label("total_cod"),
        func.string_agg(models.Waybills.waybill_code, ',').label("all_codes")
    ).join(
        latest_delivery, models.Waybills.waybill_id == latest_delivery.c.waybill_id
    ).join(
        models.DeliveryResults, models.DeliveryResults.delivery_id == latest_delivery.c.last_id
    ).join(
        models.Users, models.Users.user_id == models.DeliveryResults.shipper_id
    ).filter(
        models.Waybills.status == WaybillStatus.DELIVERED
    )
    
    if hub_id:
        query = query.filter(models.Waybills.dest_hub_id == hub_id)

    results = query.group_by(models.Users.user_id, models.Users.full_name).all()

    return [
        {
            "shipper_id": r.shipper_id,
            "shipper_name": r.shipper_name or f"Shipper #{r.shipper_id}",
            "delivered_count": r.total_bills,
            "expected_cod": float(r.total_cod or 0),
            "waybill_codes": r.all_codes.split(',') if r.all_codes else []
        } for r in results
    ]

# --- 2. GHI NHẬN THU TIỀN MẶT (CHỐT CA) ---
def record_cash_collection(db: Session, waybill_codes: list, hub_id: int, user_id: int, note: str):
    """
    Xử lý nộp tiền: Ghi Ledger và đổi trạng thái sang SETTLED
    """
    processed_count = 0
    for code in waybill_codes:
        waybill = db.query(models.Waybills).filter(models.Waybills.waybill_code == code).first()
        if not waybill or waybill.status != WaybillStatus.DELIVERED:
            continue

        p_trans_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"
        amount = waybill.cod_amount
        
        delivery = db.query(models.DeliveryResults).filter(
            models.DeliveryResults.waybill_id == waybill.waybill_id
        ).order_by(models.DeliveryResults.delivery_id.desc()).first()
        
        if not delivery:
            continue
            
        shipper_id = delivery.shipper_id
        actual_hub_id = hub_id or waybill.dest_hub_id
        
        if not actual_hub_id:
            shipper_record = db.query(models.Users).filter(models.Users.user_id == shipper_id).first()
            actual_hub_id = shipper_record.primary_hub_id if shipper_record else 1
        
        db.add(models.TransactionLedger(
            parent_transaction_id=p_trans_id,
            waybill_id=waybill.waybill_id,
            account_id=actual_hub_id,
            entry_type="DEBIT", 
            amount=amount,
            account_type="COD",
            status="RECONCILED"
        ))
        db.add(models.TransactionLedger(
            parent_transaction_id=p_trans_id,
            waybill_id=waybill.waybill_id,
            account_id=shipper_id,
            entry_type="CREDIT",
            amount=amount,
            account_type="COD",
            status="RECONCILED"
        ))

        if waybill.customer_id:
            db.add(models.TransactionLedger(
                parent_transaction_id=p_trans_id,
                waybill_id=waybill.waybill_id,
                account_id=waybill.customer_id,
                entry_type="CREDIT",
                amount=amount,
                account_type="COD",
                status="RECONCILED"
            ))

        waybill.status = WaybillStatus.SETTLED
        waybill.version += 1
        db.add(models.TrackingLogs(
            waybill_id=waybill.waybill_id, 
            status_id=WaybillStatus.SETTLED,
            hub_id=actual_hub_id, 
            user_id=user_id, 
            system_time=datetime.utcnow(), 
            note=note
        ))
        processed_count += 1
    
    db.commit()
    return processed_count

# --- 3. ĐỐI SOÁT VỚI KHÁCH HÀNG (SHOP) ---
def get_settled_bills(db: Session, customer_id: int):
    """Lấy danh sách đơn đã đối soát xong của khách hàng"""
    return db.query(models.Waybills).filter(
        models.Waybills.customer_id == customer_id,
        models.Waybills.status == WaybillStatus.SETTLED
    ).all()

def create_cod_statement(db: Session, customer_id: int, user_id: int):
    """Lập bảng kê thanh toán COD cho Shop"""
    subquery = db.query(models.StatementDetails.ledger_id)
    
    pending_ledgers = db.query(models.TransactionLedger).filter(
        models.TransactionLedger.account_id == customer_id,
        models.TransactionLedger.account_type == "COD",
        models.TransactionLedger.status == "RECONCILED",
        ~models.TransactionLedger.id.in_(subquery) 
    ).all()

    if not pending_ledgers:
        return None

    total_sum = sum(item.amount for item in pending_ledgers)

    new_statement = models.StatementCOD(
        statement_code=f"STM-COD-{int(datetime.utcnow().timestamp())}",
        customer_id=customer_id,
        total_amount=total_sum,
        total_bills=len(pending_ledgers),
        total_cod_amount=total_sum,
        status="PENDING",
        created_by=user_id
    )
    db.add(new_statement)
    db.flush()

    for ledger in pending_ledgers:
        db.add(models.StatementDetails(
            statement_id=new_statement.statement_id, 
            ledger_id=ledger.id,
            type="COD"
        ))
    
    db.commit()
    db.refresh(new_statement)
    return new_statement

# --- HÀM MỚI ĐƯỢC CHUYỂN TỪ API SANG (ĐỂ ĐẢM BẢO CHUẨN PHÂN TẦNG) ---
def get_statement_details_for_export(db: Session, statement_id: int):
    """Lấy dữ liệu chi tiết bảng kê để xuất Excel"""
    return db.query(
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