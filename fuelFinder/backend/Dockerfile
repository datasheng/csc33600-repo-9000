FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN apt-get update \
 && apt-get install -y --no-install-recommends gcc libpq-dev \
 && pip install --no-cache-dir -r requirements.txt \
 && rm -rf /var/lib/apt/lists/*

COPY . .

# initialize your DB schema, if you have an init_db.py:
COPY init_db.py .
RUN python init_db.py

# → listen on $PORT (Cloud Run sets PORT=8080)
CMD ["sh","-c","uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]