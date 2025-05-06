import psycopg2

def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        database="fuelfinder",
        user="fueladmin",
        password="fuelpass"
    )
