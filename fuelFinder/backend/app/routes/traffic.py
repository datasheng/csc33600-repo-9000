from fastapi import APIRouter, Depends, HTTPException
from app.db.connection import get_db_connection
from app.routes.auth import get_current_user_id
from app.schemas import TrafficLog

router = APIRouter()


@router.post("/")
async def log_user_traffic(
    data: TrafficLog,
    user_id: int = Depends(get_current_user_id),
):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO user_traffic (user_id, latitude, longitude)
            VALUES (%s, %s, %s)
            """,
            (user_id, data.latitude, data.longitude),
        )
        conn.commit()
        return {"message": "User traffic logged successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
