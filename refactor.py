import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    for old, new in replacements:
        content = content.replace(old, new)
        
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

mobile_src = os.path.join("mobile", "src")

# 1. customer.js
replace_in_file(os.path.join(mobile_src, "services", "customer.js"), [
    ("import { ENDPOINTS } from '../constants/data';", "import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';"),
    ("ENDPOINTS.GET_CUSTOMERS", "WAREHOUSE_ENDPOINTS.GET_CUSTOMERS")
])

# 2. expoToken.js
replace_in_file(os.path.join(mobile_src, "services", "expoToken.js"), [
    ("import { ENDPOINTS } from '../constants/data';", "import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';"),
    ("ENDPOINTS.UPDATE_PUSH_TOKEN(token)", "WAREHOUSE_ENDPOINTS.UPDATE_PUSH_TOKEN_URL, { token }")
])

# 3. inventory.js
replace_in_file(os.path.join(mobile_src, "services", "inventory.js"), [
    ("import { ENDPOINTS } from '../constants/data';", "import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';"),
    ("ENDPOINTS.", "WAREHOUSE_ENDPOINTS.")
])

# 4. product.js
replace_in_file(os.path.join(mobile_src, "services", "product.js"), [
    ("import { ENDPOINTS } from '../constants/data';", "import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';"),
    ("ENDPOINTS.", "WAREHOUSE_ENDPOINTS.")
])

# 5. shipmentService.js
replace_in_file(os.path.join(mobile_src, "services", "shipmentService.js"), [
    ("import { ENDPOINTS } from '../constants/data';", "import { CUSTOMER_ENDPOINTS } from '../constants/customerEndpoints';"),
    ("ENDPOINTS.", "CUSTOMER_ENDPOINTS.")
])

# 6. shipper.js
replace_in_file(os.path.join(mobile_src, "services", "shipper.js"), [
    ("import { ENDPOINTS } from '../constants/data';", "import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';"),
    ("ENDPOINTS.", "WAREHOUSE_ENDPOINTS.")
])

# 7. vehicle.js
replace_in_file(os.path.join(mobile_src, "services", "vehicle.js"), [
    ("import { ENDPOINTS } from '../constants/data';", "import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';"),
    ("ENDPOINTS.", "WAREHOUSE_ENDPOINTS.")
])

# 8. vi_tri_kho.js
replace_in_file(os.path.join(mobile_src, "services", "vi_tri_kho.js"), [
    ("import { ENDPOINTS } from '../constants/data';", "import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';"),
    ("ENDPOINTS.", "WAREHOUSE_ENDPOINTS.")
])

# 9. GlobalChat.js
replace_in_file(os.path.join(mobile_src, "components", "GlobalChat.js"), [
    ("import { API_BASE_URL } from '../constants/data';", "import { API_BASE_URL } from '../constants/customerEndpoints';")
])

# 10. HomeScreen.js
replace_in_file(os.path.join(mobile_src, "screens", "HomeScreen.js"), [
    ("import { ENDPOINTS } from '../constants/data';", "import { CUSTOMER_ENDPOINTS } from '../constants/customerEndpoints';"),
    ("ENDPOINTS.", "CUSTOMER_ENDPOINTS.")
])

# And let's remove the old data.js
data_js_path = os.path.join(mobile_src, "constants", "data.js")
if os.path.exists(data_js_path):
    os.remove(data_js_path)
    print(f"Removed {data_js_path}")

