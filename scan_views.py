import os
import json

view_dir = r"f:\Project_Ngoai\LOG\Backend\smartpost-logistics\frontend\src\views"
result = []

for root, dirs, files in os.walk(view_dir):
    for f in files:
        if f.endswith('.vue'):
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, view_dir)
            result.append(rel_path)

print(json.dumps(result, indent=2))
