import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'app.db')

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH, timeout=60)
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(predictions)")
    existing_cols = {r[1] for r in cur.fetchall()}

    new_cols = [
        ('target_timestamp', 'TIMESTAMP'),
        ('baseline_price', 'REAL'),
        ('actual_price', 'REAL'),
        ('absolute_error', 'REAL'),
        ('percentage_error', 'REAL'),
        ('directional_success', 'BOOLEAN'),
        ('in_corridor', 'BOOLEAN'),
        ('status', "TEXT DEFAULT 'pending'"),
        ('data_quality', "TEXT DEFAULT 'fresh'"),
        ('evaluated_at', 'TIMESTAMP')
    ]

    for col_name, col_type in new_cols:
        if col_name not in existing_cols:
            print(f"Adding column {col_name} ({col_type}) to predictions...")
            cur.execute(f"ALTER TABLE predictions ADD COLUMN {col_name} {col_type}")

    # Backfill baseline_price and target_timestamp for existing rows
    cur.execute("""
        UPDATE predictions 
        SET baseline_price = current_price 
        WHERE baseline_price IS NULL AND current_price IS NOT NULL
    """)
    cur.execute("""
        UPDATE predictions 
        SET target_timestamp = datetime(generated_at, '+24 hours')
        WHERE target_timestamp IS NULL AND generated_at IS NOT NULL
    """)

    conn.commit()
    conn.close()
    print("Database migration executed successfully!")

if __name__ == '__main__':
    migrate()

