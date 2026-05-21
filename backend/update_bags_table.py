from core.database import engine
from sqlalchemy import text

def update_table():
    with engine.connect() as conn:
        try:
            print("Altering bags table...")
            # 1. Add customer_id column if not exists
            conn.execute(text("ALTER TABLE bags ADD COLUMN IF NOT EXISTS customer_id INTEGER;"))
            # 2. Add foreign key constraint if not exists
            conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'bags_customer_id_fkey'
                    ) THEN
                        ALTER TABLE bags 
                        ADD CONSTRAINT bags_customer_id_fkey 
                        FOREIGN KEY (customer_id) 
                        REFERENCES customers(customer_id);
                    END IF;
                END;
                $$;
            """))
            conn.commit()
            print("Successfully updated bags table with customer_id and foreign key constraint.")
        except Exception as e:
            print(f"Error occurred: {e}")

if __name__ == "__main__":
    update_table()
