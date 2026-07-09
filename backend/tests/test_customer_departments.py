# File: backend/tests/test_customer_departments.py
from core.database import SessionLocal
import models
from crud.waybills import create_bulk_mail_pickup
from schemas.waybills import BulkMailPickupCreate

def test_departments_integration():
    db = SessionLocal()
    # Start a transaction block
    db.begin()
    try:
        # Get customer user 'nguyenvana'
        user = db.query(models.Users).filter_by(username="nguyenvana").first()
        assert user is not None, "Test user 'nguyenvana' must exist"
        assert user.customer_id is not None, "User 'nguyenvana' must be associated with a customer"

        customer = db.query(models.Customers).get(user.customer_id)
        assert customer is not None

        # 1. Create a customer department
        dept = db.query(models.CustomerDepartments).filter_by(
            customer_id=customer.customer_id, name="Phòng Kế toán Test"
        ).first()
        if not dept:
            dept = models.CustomerDepartments(
                customer_id=customer.customer_id,
                name="Phòng Kế toán Test"
            )
            db.add(dept)
            db.flush()
        
        print(f"Created/found customer department: ID {dept.id}")

        # 2. Test booking request creation with department association (Standard Pickup)
        req = models.BookingRequests(
            request_code="TEST-REQ-DEPT",
            customer_id=customer.customer_id,
            sender_phone="0987654321",
            pickup_address="123 Test St",
            pickup_mode="SINGLE_WAYBILL",
            status="PENDING_CONFIRMATION",
            customer_department_id=dept.id
        )
        db.add(req)
        db.flush()

        # Verify it loads correctly
        db.refresh(req)
        assert req.customer_department_id == dept.id
        assert req.customer_department is not None
        assert req.customer_department.name == "Phòng Kế toán Test"

        # 3. Test Bulk Mail Pickup CRUD via schema validation
        bulk_data = BulkMailPickupCreate(
            product_type="PARCEL",
            service_type="TK",
            payment_method="SENDER_DEBT",
            estimated_quantity=2,
            sender={
                "name": "Nguyen Van A",
                "phone": "0987654321",
                "address": "123 Test St",
                "province_id": 1,
                "district_id": 2,
                "ward_id": 3,
                "province_name": "Province",
                "district_name": "District",
                "ward_name": "Ward"
            },
            receiver=None,
            draft_items=[
                {"sequence_no": 1, "receiver_name": "Recv 1", "receiver_phone": "0911111111", "receiver_address": "Addr 1", "note": "Note 1"},
                {"sequence_no": 2, "receiver_name": "Recv 2", "receiver_phone": "0922222222", "receiver_address": "Addr 2", "note": "Note 2"}
            ],
            target_hub_id=None,
            note="Bulk notes",
            customer_department_id=dept.id
        )

        # Call create_bulk_mail_pickup
        bulk_req, _, _ = create_bulk_mail_pickup(
            db=db,
            customer=customer,
            data=bulk_data,
            creator_id=user.user_id,
            target_hub_id=None
        )

        assert bulk_req.customer_department_id == dept.id
        print("Customer department integration tests passed successfully!")

    finally:
        # Rollback transaction to keep DB clean
        db.rollback()
        db.close()

if __name__ == "__main__":
    test_departments_integration()
