import sys
from sqlalchemy import create_engine, inspect
from core.database import DATABASE_URL
from models import Base

def test_sync():
    print(f"Checking database connection to: {DATABASE_URL}")
    try:
        engine = create_engine(DATABASE_URL)
        inspector = inspect(engine)
        db_tables = inspector.get_table_names()
        print(f"Connected successfully! Tables in DB: {len(db_tables)}")
        
        # Check SQLAlchemy models
        model_tables = Base.metadata.tables.keys()
        print(f"Tables in SQLAlchemy Models: {len(model_tables)}")
        
        missing_in_db = []
        for table in model_tables:
            if table not in db_tables:
                missing_in_db.append(table)
                
        if missing_in_db:
            print("\n❌ Missing tables in Database:")
            for table in missing_in_db:
                print(f"  - {table}")
        else:
            print("\n✅ All SQLAlchemy model tables exist in the Database!")
            
        # Check columns for existing tables
        print("\nChecking columns mismatch...")
        mismatch_found = False
        for table in model_tables:
            if table in db_tables:
                model_cols = Base.metadata.tables[table].columns.keys()
                db_cols = [col['name'] for col in inspector.get_columns(table)]
                
                missing_cols = [col for col in model_cols if col not in db_cols]
                if missing_cols:
                    print(f"❌ Table '{table}' has missing columns in DB:")
                    for col in missing_cols:
                        print(f"  - {col}")
                    mismatch_found = True
                    
        if not mismatch_found:
            print("✅ All columns match perfectly!")
            
    except Exception as e:
        print(f"Error connecting/inspecting DB: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_sync()
