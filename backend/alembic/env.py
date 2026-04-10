import sys
from os.path import dirname, abspath, join
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# 1. PHẢI LÀM ĐẦU TIÊN: Mở đường dẫn để Python thấy thư mục 'core' và 'models'
# Lấy đường dẫn thư mục gốc (smartpost-backend)
root_path = dirname(dirname(abspath(__file__)))
sys.path.insert(0, root_path)

# 2. SAU ĐÓ MỚI IMPORT: Bây giờ Python đã biết tìm Base và Models ở đâu
from core.database import Base 
import models # Đảm bảo file models.py của bạn dùng chung 'Base' từ core.database

# Cấu hình Alembic
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 3. QUAN TRỌNG: Metadata này chứa toàn bộ bản vẽ các bảng của bạn
target_metadata = Base.metadata 

# --- Các hàm run_migrations giữ nguyên như bạn đã viết ---

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    # Lấy cấu hình từ alembic.ini (đảm bảo file .ini đã điền đúng URL Postgres)
    configuration = config.get_section(config.config_ini_section, {})
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            compare_type=True # Phát hiện thay đổi kiểu dữ liệu (vd: String -> Text)
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()