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

        # 2. Tạo quy tắc giá cho tuyến 29 -> 29 (Nội tỉnh Hà Nội)
        services_data = [
            ("CPN", 16500.00, 100.00),
            ("TK", 12000.00, 100.00),
            ("HT", 30000.00, 50.00),
            ("PT9H", 45000.00, 30.00),
            ("QT", 250000.00, 1000.00),
            ("STANDARD", 15000.00, 100.00),
            ("EXPRESS", 30000.00, 50.00),
        ]
        
        for svc, price, max_w in services_data:
            existing_rule = db.query(models.PricingRules).filter(
                models.PricingRules.from_province_id == 29,
                models.PricingRules.to_province_id == 29,
                models.PricingRules.service_type == svc
            ).first()

            if not existing_rule:
                rule = models.PricingRules(
                    policy_id=1,
                    from_province_id=29,
                    to_province_id=29,
                    service_type=svc,
                    min_weight=decimal.Decimal("0.00"),
                    max_weight=decimal.Decimal(str(max_w)),
                    price=decimal.Decimal(str(price)),
                    is_active=True
                )
                db.add(rule)
                print(f"Created Rule {svc} for route 29->29 (Hà Nội).")

        # 3. Tạo quy tắc giá cho tuyến 29 -> 59 (Hà Nội -> HCM)
        inter_services_data = [
            ("CPN", 38500.00, 50.00),
            ("TK", 28000.00, 50.00),
            ("HT", 80000.00, 20.00),
            ("PT9H", 120000.00, 15.00),
            ("QT", 500000.00, 500.00),
            ("STANDARD", 35000.00, 30.00),
            ("EXPRESS", 70000.00, 20.00),
        ]

        for svc, price, max_w in inter_services_data:
            existing_hcm = db.query(models.PricingRules).filter(
                models.PricingRules.from_province_id == 29,
                models.PricingRules.to_province_id == 59,
                models.PricingRules.service_type == svc
            ).first()

            if not existing_hcm:
                rule_hcm = models.PricingRules(
                    policy_id=1,
                    from_province_id=29,
                    to_province_id=59,
                    service_type=svc,
                    min_weight=decimal.Decimal("0.00"),
                    max_weight=decimal.Decimal(str(max_w)),
                    price=decimal.Decimal(str(price)),
                    is_active=True
                )
                db.add(rule_hcm)
                print(f"Created Rule {svc} for route 29->59 (HN -> HCM).")

        # 4. Tạo vùng sâu vùng xa giả lập để test logic Phụ phí
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
