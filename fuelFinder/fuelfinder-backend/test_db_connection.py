from app.db.connection import get_db_connection

try:
    conn = get_db_connection()
    print("✅ Connected to Railway Postgres!")
    conn.close()
except Exception as e:
    print("❌ Failed to connect:", e)
