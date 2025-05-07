from fastapi import APIRouter, Depends, Header, Request, HTTPException
from app.db.connection import get_db_connection
import firebase_admin
from firebase_admin import credentials, auth
import os

router = APIRouter()

# ✅ Initialize Firebase Admin SDK once
if not firebase_admin._apps:
    cred_path = os.path.join(
        os.path.dirname(__file__), "../credentials/firebase-service-account.json"
    )
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)


@router.post("/register-user")
async def register_user(request: Request):
    body = await request.json()
    token = body.get("token")  # Firebase ID token from frontend

    if not token:
        raise HTTPException(status_code=400, detail="Token required.")

    try:
        # Verify Firebase ID token
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token["uid"]
        email = decoded_token.get("email", "")

        # Connect to database
        conn = get_db_connection()
        cur = conn.cursor()

        # Check if user already exists
        cur.execute("SELECT * FROM users WHERE firebase_uid = %s", (firebase_uid,))
        user = cur.fetchone()

        if user:
            # Updating last_login
            cur.execute(
                "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE firebase_uid = %s",
                (firebase_uid,),
            )
        else:
            # Insert new user into the table
            cur.execute(
                "INSERT INTO users (firebase_uid, email) VALUES (%s, %s)",
                (firebase_uid, email),
            )

        conn.commit()
        cur.close()
        conn.close()
        return {"message": "User registered or already exists."}

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token. {str(e)}")


async def get_current_user_id(
    authorization: str = Header(..., description="Bearer <Firebase ID token>")
) -> int:
    """
    Verifies the incoming Firebase ID token, ensures the user exists in our DB,
    updates last_login, and returns our internal users.id.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Invalid auth header")
    id_token = authorization.split(" ", 1)[1]

    try:
        decoded = auth.verify_id_token(id_token)
        firebase_uid = decoded["uid"]
    except Exception as e:
        raise HTTPException(401, f"Invalid token: {e}")

    conn = get_db_connection()
    cur = conn.cursor()
    # ensure user exists (or register on‑the‑fly)
    cur.execute(
        "SELECT id FROM users WHERE firebase_uid = %s",
        (firebase_uid,),
    )
    row = cur.fetchone()
    if row:
        user_id = row[0]
        # bump last_login
        cur.execute(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = %s",
            (user_id,),
        )
    else:
        # first time: insert
        cur.execute(
            "INSERT INTO users (firebase_uid, email) VALUES (%s, %s) RETURNING id",
            (firebase_uid, decoded.get("email", "")),
        )
        user_id = cur.fetchone()[0]

    conn.commit()
    cur.close()
    conn.close()
    return user_id
