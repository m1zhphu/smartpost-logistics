from fastapi.testclient import TestClient
from main import app
from core.permissions import PermissionChecker
import sys

# Override auth depending
def override_auth():
    return {"user_id": 1, "role_id": 1, "primary_hub_id": 1}

app.dependency_overrides[PermissionChecker("hub_manage")] = override_auth

client = TestClient(app)
import io
sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8')

response = client.post('/api/pricing/rules', json={
  "rule_id": None,
  "policy_id": 1,
  "origin_hub_id": 3,
  "dest_hub_id": 16,
  "service_type": "STANDARD",
  "min_weight": 0,
  "max_weight": 5,
  "price": 30000,
  "is_active": True
}, headers={'Idempotency-Key': 'test-1234'})
print("Status:", response.status_code)
print("Response:", response.json())
