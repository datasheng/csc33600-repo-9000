from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, stations, favorites

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers (including Authorization)
)

# Registering routes
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(stations.router, prefix="/stations", tags=["stations"])
app.include_router(favorites.router, prefix="/favorites", tags=["favorites"])
