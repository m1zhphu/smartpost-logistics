import os
import sys
import py_compile

def check_all_files():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    has_errors = False
    
    print("=== START PYTHON BACKEND SYNTAX CHECK ===")
    
    for root, dirs, files in os.walk(backend_dir):
        if "venv" in root or "__pycache__" in root:
            continue
            
        for file in files:
            if file.endswith(".py") and file != "check_syntax.py":
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, backend_dir)
                try:
                    py_compile.compile(file_path, doraise=True)
                except py_compile.PyCompileError as pce:
                    print(f"ERROR: {rel_path}")
                    print(pce)
                    has_errors = True
                except Exception as e:
                    print(f"OTHER ERROR: {rel_path} - {str(e)}")
                    has_errors = True
                    
    modules_to_test = [
        "main",
        "models",
        "core.database",
        "core.security",
        "core.state_machine",
        "core.permissions",
        "core.idempotency",
        "services.ocr_service",
        "services.file_service",
        "crud.waybills",
        "crud.warehouse",
        "crud.pricing",
        "api.waybills",
        "api.warehouse",
        "api.users",
        "api.pricing",
        "api.accounting"
    ]
    
    print("\n=== TESTING CORE MODULE IMPORTS ===")
    sys.path.append(backend_dir)
    for mod in modules_to_test:
        try:
            __import__(mod)
            print(f"OK: {mod}")
        except Exception as e:
            print(f"IMPORT ERROR in module: {mod} - {str(e)}")
            has_errors = True
            
    if has_errors:
        print("\nERRORS FOUND IN BACKEND!")
        sys.exit(1)
    else:
        print("\nALL CLEAN! No syntax or import errors.")
        sys.exit(0)

if __name__ == "__main__":
    check_all_files()
