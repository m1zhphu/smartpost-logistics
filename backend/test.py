import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8')

from sqlalchemy import create_engine, text
from core.database import SQLALCHEMY_DATABASE_URL
engine = create_engine(SQLALCHEMY_DATABASE_URL)
conn = engine.connect()

print("=== HUBS ===")
r = conn.execute(text("SELECT hub_id, hub_code, hub_name, province_id FROM hubs LIMIT 10"))
for row in r:
    print(dict(row._mapping))

print("\n=== CUSTOMERS ===")
r = conn.execute(text("SELECT customer_id, customer_code, company_name, customer_type FROM customers LIMIT 5"))
for row in r:
    print(dict(row._mapping))

print("\n=== USERS (Shippers) ===")
r = conn.execute(text("SELECT user_id, username, full_name, role_id, primary_hub_id FROM users WHERE role_id=2 LIMIT 5"))
for row in r:
    print(dict(row._mapping))

print("\n=== PRICING RULES ===")
r = conn.execute(text("SELECT rule_id, from_province_id, to_province_id, service_type, min_weight, max_weight, price FROM pricing_rules WHERE is_active=true LIMIT 10"))
for row in r:
    print(dict(row._mapping))

print("\n=== WAYBILLS (latest 5) ===")
r = conn.execute(text("SELECT waybill_id, waybill_code, status, origin_hub_id, dest_hub_id, cod_amount, shipping_fee FROM waybills WHERE is_deleted=false ORDER BY waybill_id DESC LIMIT 5"))
for row in r:
    print(dict(row._mapping))

print("\n=== ROLES ===")
r = conn.execute(text("SELECT role_id, role_name FROM roles"))
for row in r:
    print(dict(row._mapping))
