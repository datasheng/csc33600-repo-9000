from fastapi import APIRouter, Request, HTTPException
from app.db.connection import get_db_connection
import firebase_admin
from firebase_admin import auth

router = APIRouter()

@router.post("/register-user")
async def register_user(request: Request):
    body = await request.json()
    token = body.get("token")  # Firebase ID token from frontend

    if not token:
        raise HTTPException(status_code=400, detail="Token required.")

    try:
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token["uid"]
        email = decoded_token.get("email", "")

        conn = get_db_connection()
        cur = conn.cursor()

        # Check if user exists
        cur.execute("SELECT * FROM users WHERE firebase_uid = %s", (firebase_uid,))
        user = cur.fetchone()

        if not user:
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
