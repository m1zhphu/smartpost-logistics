import os
from sqlalchemy import create_engine, text

SQLALCHEMY_DATABASE_URL = "postgresql://admin:admin%40123@125.234.102.243:5432/DB_SPL_LOG"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT current_database(), current_user"))
        db_info = result.fetchone()
        print("Connected successfully to database!")
        print("Database details:", db_info)
except Exception as e:
    print("Error connecting to database:", e)
