from app.db.connection import get_db_connection
import os


def run_sql_file(fname: str):
    path = os.path.join("app", "db", fname)

    with open(path, "r") as f:
        sql = f.read()

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(sql)
    conn.commit()
    cur.close()
    conn.close()


if __name__ == "__main__":
    for script in [
        "init_users_table.sql",
        "init_stations_table.sql",
        "init_prices_table.sql",
    ]:
        try:
            run_sql_file(script)
            print(f"Ran {script}")
        except Exception as e:
            print(f"Failed {script}:", e)
