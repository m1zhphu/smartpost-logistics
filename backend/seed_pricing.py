from core.database import SessionLocal
import models
import decimal

def seed_pricing():
    db = SessionLocal()
    try:
        # 1. Đảm bảo có Pricing Policy mặc định (ID=1)
        policy = db.query(models.PricingPolicies).filter(models.PricingPolicies.policy_id == 1).first()
        if not policy:
            policy = models.PricingPolicies(
                policy_id=1,
                policy_code="DEFAULT",
                policy_name="Bảng giá mặc định",
                policy_type="GENERAL",
                is_approved=True,
                is_active=True
            )
            db.add(policy)
            db.flush()
            print("Created default policy.")

        # 2. Tạo quy tắc giá cho tuyến 3 -> 3 (Nội tỉnh)
        existing_rule = db.query(models.PricingRules).filter(
            models.PricingRules.from_province_id == 3,
            models.PricingRules.to_province_id == 3,
            models.PricingRules.service_type == "STANDARD"
        ).first()

        if not existing_rule:
            rule = models.PricingRules(
                policy_id=1,
                from_province_id=3,
                to_province_id=3,
                service_type="STANDARD",
                min_weight=decimal.Decimal("0.00"),
                max_weight=decimal.Decimal("100.00"),
                price=decimal.Decimal("15000.00"),
                is_active=True
            )
            db.add(rule)
            print("Created Rule for route 3->3.")
        else:
            print("Rule for route 3->3 already exists.")

        # 3. Tạo vùng sâu vùng xa giả lập để test logic Phụ phí
        # Giả sử district_id=1, ward_id=1 là vùng sâu vùng xa
        existing_remote = db.query(models.RemoteAreas).filter(
            models.RemoteAreas.province_id == 3,
            models.RemoteAreas.district_id == 1,
            models.RemoteAreas.ward_id == 1
        ).first()

        if not existing_remote:
            remote = models.RemoteAreas(
                province_id=3,
                district_id=1,
                ward_id=1,
                fee=decimal.Decimal("5000.00"),
                is_active=True
            )
            db.add(remote)
            print("Created fake remote area (3-1-1).")

        db.commit()
        print("Seed data completed!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_pricing()
