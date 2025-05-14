# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# install just Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy the app
COPY . .

EXPOSE 8000
COPY init_db.py .
RUN python init_db.py
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]