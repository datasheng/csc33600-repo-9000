from app.db.connection import get_db_connection
import os

def init_users_table():
    sql_path = os.path.join("app", "db", "init_users_table.sql")  # ✅ corrected path

    with open(sql_path, "r") as f:
        sql = f.read()

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(sql)
        conn.commit()
        cur.close()
        conn.close()
        print("✅ 'users' table created (or already exists).")
    except Exception as e:
        print("❌ Failed to create table:", e)

if __name__ == "__main__":
    init_users_table()
