from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import uuid
import decimal
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

def create_cod_settlement(db: Session, customer_id: int, user_id: int):
    """Lập bảng kê thanh toán COD cho Shop (Bản cũ/Quyết toán)"""
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
            statement_type="COD"
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

# --- 4. NGHIỆP VỤ ĐỐI SOÁT KẾ TOÁN (STATEMENT DEBT) ---

def get_statement(db: Session, statement_id: int, statement_type: str = "DEBT"):
    if statement_type == "DEBT":
        return db.query(models.StatementDebt).filter(models.StatementDebt.statement_id == statement_id).first()
    return db.query(models.StatementCOD).filter(models.StatementCOD.statement_id == statement_id).first()

def get_statements_by_customer(db: Session, customer_id: int):
    return db.query(models.StatementDebt).filter(models.StatementDebt.customer_id == customer_id).all()

def create_statement(db: Session, data: dict):
    waybill_ids = data.pop("waybill_ids", [])
    
    # Tự động tính toán tổng tiền từ danh sách vận đơn nếu chưa có
    waybills = db.query(models.Waybills).filter(models.Waybills.waybill_id.in_(waybill_ids)).all()
    
    calc_main = decimal.Decimal(str(sum((w.shipping_fee or 0) for w in waybills)))
    calc_extra = decimal.Decimal(str(sum((w.extra_services_fee or 0) for w in waybills)))
    calc_vat = decimal.Decimal(str(sum((w.vat_amount or 0) for w in waybills)))
    calc_grand = calc_main + calc_extra + calc_vat
    
    # Ưu tiên giá trị tính toán được nếu đầu vào là 0 hoặc None
    if not data.get("total_main_fee"): data["total_main_fee"] = calc_main
    if not data.get("total_extra_fee"): data["total_extra_fee"] = calc_extra
    if not data.get("total_vat"): data["total_vat"] = calc_vat
    if not data.get("grand_total"): data["grand_total"] = calc_grand

    statement = models.StatementDebt(**data)
    db.add(statement)
    db.flush()
    db.refresh(statement)
    
    for w_id in waybill_ids:
        detail = models.StatementDetails(
            statement_id=statement.statement_id,
            waybill_id=w_id,
            statement_type="DEBT"
        )
        db.add(detail)
    db.flush()
    return statement

def create_cod_statement(db: Session, data: dict):
    """Tạo bảng kê tiền thu hộ COD (Mục 15 Đặc tả)"""
    waybill_ids = data.pop("waybill_ids", [])
    
    # Tự động tính toán tổng COD từ danh sách vận đơn
    waybills = db.query(models.Waybills).filter(models.Waybills.waybill_id.in_(waybill_ids)).all()
    calc_total_cod = sum((w.cod_amount or 0) for w in waybills)
    
    if not data.get("total_amount"): data["total_amount"] = calc_total_cod

    statement = models.StatementCOD(**data)
    db.add(statement)
    db.flush()
    db.refresh(statement)
    
    for w_id in waybill_ids:
        detail = models.StatementDetails(
            statement_id=statement.statement_id,
            waybill_id=w_id,
            statement_type="COD"
        )
        db.add(detail)
    db.flush()
    return statement

def update_statement_status(db: Session, statement, new_status: str):
    statement.status = new_status
    db.flush()
    db.refresh(statement)
    return statement

def is_waybill_in_confirmed_statement(db: Session, waybill_id: int) -> bool:
    """Kiểm tra xem Vận đơn đã nằm trong bảng kê (DEBT hoặc COD) đã chốt chưa."""
    details = db.query(models.StatementDetails).filter(models.StatementDetails.waybill_id == waybill_id).all()
    for detail in details:
        if detail.statement_type == "DEBT":
            statement = db.query(models.StatementDebt).filter(models.StatementDebt.statement_id == detail.statement_id).first()
        else: # COD
            statement = db.query(models.StatementCOD).filter(models.StatementCOD.statement_id == detail.statement_id).first()
            
        if statement and getattr(statement, 'status', None) in ["CONFIRMED", "SETTLED"]:
            return True
    return False

def create_price_override_log(db: Session, waybill_id: int, user_id: int, old_amount: float, new_amount: float, reason: str):
    log = models.AuditLogs(
        target_table="waybills",
        target_id=waybill_id,
        column_name="total_amount_to_collect",
        old_value=str(old_amount),
        new_value=str(new_amount),
        reason=reason,
        admin_id=user_id,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    db.flush()
    return log

def create_statement_adjustment(db: Session, statement_id: int, statement_type: str, waybill_id: int, amount: float, reason: str, user_id: int):
    """Tạo phiếu điều chỉnh sau khi bảng kê đã chốt (Mục 18 Đặc tả)"""
    # 1. Chuyển đổi sang Decimal để đảm bảo độ chính xác tài chính
    decimal_amount = decimal.Decimal(str(amount))
    
    adjustment = models.StatementAdjustments(
        statement_id=statement_id,
        statement_type=statement_type,
        waybill_id=waybill_id,
        amount=decimal_amount,
        reason=reason,
        created_by=user_id
    )
    db.add(adjustment)
    
    # 2. Cập nhật lại tổng tiền trên bảng kê tương ứng
    if statement_type == "DEBT":
        statement = db.query(models.StatementDebt).filter(models.StatementDebt.statement_id == statement_id).first()
        if statement:
            if statement.grand_total is None: statement.grand_total = decimal.Decimal('0')
            statement.grand_total += decimal_amount
            
    elif statement_type == "COD":
        # Khóa chính của StatementCOD là statement_id, trường tổng tiền là total_amount
        statement_cod = db.query(models.StatementCOD).filter(models.StatementCOD.statement_id == statement_id).first()
        if statement_cod:
            if statement_cod.total_amount is None: statement_cod.total_amount = decimal.Decimal('0')
            statement_cod.total_amount += decimal_amount
            
    db.flush()
    db.refresh(adjustment)
    return adjustment

def get_adjustments_for_statement(db: Session, statement_id: int, statement_type: str):
    return db.query(models.StatementAdjustments).filter(
        models.StatementAdjustments.statement_id == statement_id,
        models.StatementAdjustments.statement_type == statement_type
    ).all()

def get_debt_statement_details_for_export(db: Session, statement_id: int):
    """Lấy dữ liệu chi tiết bảng kê cước để xuất Excel (Bao gồm cả Adjustments - Mục 18)"""
    
    # Subquery để tính tổng điều chỉnh cho từng vận đơn trong bảng kê này
    subq_adj = db.query(
        models.StatementAdjustments.waybill_id,
        func.sum(models.StatementAdjustments.amount).label("total_adj")
    ).filter(
        models.StatementAdjustments.statement_id == statement_id,
        models.StatementAdjustments.statement_type == "DEBT"
    ).group_by(models.StatementAdjustments.waybill_id).subquery()

    return db.query(
        models.Waybills.waybill_code,
        models.Customers.company_name,
        models.Waybills.service_type,
        models.Waybills.actual_weight,
        models.Waybills.converted_weight,
        models.Waybills.shipping_fee,
        models.Waybills.extra_services_fee,
        models.Waybills.vat_amount,
        # Thành tiền = (Cước chính + Phụ phí + VAT) + Tổng điều chỉnh (nếu có)
        (func.coalesce(models.Waybills.shipping_fee, 0) + 
         func.coalesce(models.Waybills.extra_services_fee, 0) + 
         func.coalesce(models.Waybills.vat_amount, 0) + 
         func.coalesce(subq_adj.c.total_adj, 0)).label("total_amount_to_collect")
    ).join(
        models.Customers, models.Waybills.customer_id == models.Customers.customer_id
    ).join(
        models.StatementDetails, models.Waybills.waybill_id == models.StatementDetails.waybill_id
    ).outerjoin(
        subq_adj, models.Waybills.waybill_id == subq_adj.c.waybill_id
    ).filter(
        models.StatementDetails.statement_id == statement_id,
        models.StatementDetails.statement_type == "DEBT"
    ).all()