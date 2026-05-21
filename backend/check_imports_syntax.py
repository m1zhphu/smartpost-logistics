import os
import sys
import py_compile
import traceback

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def check_all_files():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    has_errors = False
    
    print("=== BẮT ĐẦU KIỂM TRA CÚ PHÁP VÀ LỖI PYTHON BACKEND ===")
    
    for root, dirs, files in os.walk(backend_dir):
        # Bỏ qua thư mục venv và __pycache__
        if "venv" in root or "__pycache__" in root:
            continue
            
        for file in files:
            if file.endswith(".py"):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, backend_dir)
                try:
                    # Compile file sang pyc để check syntax
                    py_compile.compile(file_path, doraise=True)
                except py_compile.PyCompileError as pce:
                    print(f"❌ LỖI CÚ PHÁP: {rel_path}")
                    print(pce)
                    has_errors = True
                except Exception as e:
                    print(f"❌ LỖI KHÁC: {rel_path} - {str(e)}")
                    has_errors = True
                    
    # Thử import các module cốt lõi để phát hiện NameError/ImportError
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
    
    print("\n=== THỬ NGHIỆM IMPORT CÁC MODULE CỐT LÕI ===")
    for mod in modules_to_test:
        try:
            __import__(mod)
            print(f"✅ Import thành công: {mod}")
        except Exception as e:
            print(f"❌ LỖI IMPORT/NAMEERROR trong module: {mod}")
            traceback.print_exc()
            has_errors = True
            
    if has_errors:
        print("\n💥 PHÁT HIỆN LỖI TRONG BACKEND! Vui lòng sửa lại.")
        sys.exit(1)
    else:
        print("\n🎉 HOÀN TOÀN SẠCH SẼ! Không có lỗi cú pháp hoặc import nào.")
        sys.exit(0)

if __name__ == "__main__":
    check_all_files()
