from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .database.connection import engine, Base
from .api import health, assets, dashboard, incidents, settings, scan, protect, reports, scans

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SafeLens Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "chrome-extension://*"
    ],
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