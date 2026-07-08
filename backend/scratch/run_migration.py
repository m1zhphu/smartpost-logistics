import os
from sqlalchemy import create_engine, text

SQLALCHEMY_DATABASE_URL = "postgresql://admin:admin%40123@125.234.102.243:5432/DB_SPL_LOG"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

ddl_statements = [
    """
    CREATE TABLE IF NOT EXISTS customer_departments (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS customer_department_id INTEGER REFERENCES customer_departments(id) ON DELETE SET NULL;
    """
]

try:
    with engine.begin() as conn:
        for statement in ddl_statements:
            print(f"Executing: {statement.strip()}")
            conn.execute(text(statement))
            print("Success!")
    print("Migration completed successfully!")
except Exception as e:
    print("Error during migration:", e)
