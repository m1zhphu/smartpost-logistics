from core.database import SessionLocal
import models
from core.state_machine import WaybillStatus

db = SessionLocal()
try:
    # Tìm các đơn đã SETTLED nhưng chưa có bút toán COD cho Khách hàng
    settled_bills = db.query(models.Waybills).filter(models.Waybills.status == WaybillStatus.SETTLED).all()
    
    for wb in settled_bills:
        if not wb.customer_id:
            continue
            
        # Kiểm tra xem đã có bút toán CREDIT cho Shop chưa
        existing = db.query(models.TransactionLedger).filter(
            models.TransactionLedger.waybill_id == wb.waybill_id,
            models.TransactionLedger.account_id == wb.customer_id,
            models.TransactionLedger.entry_type == "CREDIT"
        ).first()
        
        if not existing:
            print(f"Fixing Waybill {wb.waybill_code} (ID: {wb.waybill_id}) for Customer {wb.customer_id}")
            new_ledger = models.TransactionLedger(
                parent_transaction_id=f"FIX-COD-{wb.waybill_id}",
                waybill_id=wb.waybill_id,
                account_id=wb.customer_id,
                entry_type="CREDIT",
                amount=wb.cod_amount or 0,
                account_type="COD",
                status="RECONCILED"
            )
            db.add(new_ledger)
    
    db.commit()
    print("Data fix complete.")
finally:
    db.close()
