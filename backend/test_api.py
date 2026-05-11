import requests
import json

url = "http://127.0.0.1:8000/api/pricing/calculate"
payload = {
    "origin_hub_id": 4,
    "dest_hub_id": 4,
    "weight": 2.5,
    "length": 30,
    "width": 20,
    "height": 10,
    "service_type": "STANDARD",
    "extra_services": [],
    "cod_amount": 0,
    "customer_id": 4,
    "dest_district_id": 0,
    "dest_ward_id": 0
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
