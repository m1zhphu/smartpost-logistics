import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import SessionLocal
import models

db = SessionLocal()
try:
    print("--- WAYBILL INFO ---")
    wb = db.query(models.Waybills).filter(models.Waybills.waybill_code == "SP1779316784").first()
    if wb:
        print(f"Waybill Code: {wb.waybill_code}")
        print(f"Status: {wb.status}")
        print(f"Holding Hub ID: {wb.holding_hub_id}")
        print(f"Holding Shipper ID: {wb.holding_shipper_id}")
        print(f"Verify Status: {wb.verify_status}")
    else:
        print("Waybill SP1779316784 not found!")

    print("\n--- BAG INFO ---")
    bag = db.query(models.Bags).filter(models.Bags.bag_code == "BG-3-260521125659").first()
    if bag:
        print(f"Bag Code: {bag.bag_code}")
        print(f"Status: {bag.status}")
        print(f"Dest Hub ID: {bag.dest_hub_id}")
    else:
        print("Bag BG-3-260521125659 not found!")

    print("\n--- MANIFEST INFO ---")
    manifest = db.query(models.Manifests).filter(models.Manifests.manifest_code == "MFL-260521-2890").first()
    if manifest:
        print(f"Manifest Code: {manifest.manifest_code}")
        print(f"From Hub ID: {manifest.from_hub_id}")
        print(f"To Hub ID: {manifest.to_hub_id}")
    else:
        print("Manifest MFL-260521-2890 not found!")
finally:
    db.close()
