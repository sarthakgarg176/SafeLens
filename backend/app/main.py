import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os
from .database.connection import engine, Base
from .api import health, assets, dashboard, incidents, settings, scan, protect, reports, scans

from .database.connection import engine, Base
from .api import (
    health,
    assets,
    dashboard,
    incidents,
    settings,
    scan,
    protect,
    reports,
    scans,
)

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SafeLens Backend",
    version="1.0.0"
)

# Ensure storage directories exist
os.makedirs("app/storage/uploads", exist_ok=True)
os.makedirs("app/storage/thumbnails", exist_ok=True)
os.makedirs("app/storage/reports", exist_ok=True)

app.mount("/storage", StaticFiles(directory="app/storage"), name="storage")

# Deployed environment compatibility ke liye origins updated
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Production deployment par global request routing allow karne ke liye
        "http://localhost:3000",
        "chrome-extension://*",
        "https://www.remove.bg",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "success": True,
        "message": "SafeLens Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

app.include_router(health.router, prefix="/api")
app.include_router(assets.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(scan.router, prefix="/api")
app.include_router(protect.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(scans.router, prefix="/api")
