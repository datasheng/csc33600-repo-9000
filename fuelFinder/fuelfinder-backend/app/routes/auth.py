from fastapi import APIRouter, Request, HTTPException
from app.db.connection import get_db_connection
import firebase_admin
from firebase_admin import credentials, auth
import os

router = APIRouter()

# ✅ Initialize Firebase Admin SDK once
if not firebase_admin._apps:
    cred_path = os.path.join(os.path.dirname(__file__), "../credentials/firebase-service-account.json")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

@router.post("/register-user")
async def register_user(request: Request):
    body = await request.json()
    token = body.get("token")  # Firebase ID token from frontend

    if not token:
        raise HTTPException(status_code=400, detail="Token required.")

    try:
        # ✅ Verify Firebase ID token
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token["uid"]
        email = decoded_token.get("email", "")

        # ✅ Connect to database
        conn = get_db_connection()
        cur = conn.cursor()

        # Check if user already exists
        cur.execute("SELECT * FROM users WHERE firebase_uid = %s", (firebase_uid,))
        user = cur.fetchone()

        if not user:
            # Insert new user into the table
            cur.execute(
                "INSERT INTO users (firebase_uid, email) VALUES (%s, %s)",
                (firebase_uid, email)
            )
            conn.commit()

        cur.close()
        conn.close()
        return {"message": "User registered or already exists."}

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token. {str(e)}")
