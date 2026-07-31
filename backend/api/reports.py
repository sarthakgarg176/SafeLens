import os, uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import Alert, Action
from datetime import datetime, timezone
import uuid

router = APIRouter()

@router.post("/report")
async def generate_report(
    incident_id: int,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == incident_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Incident not found")

    action = db.query(Action).filter(
        Action.alert_id == incident_id
    ).first()

    report_id = str(uuid.uuid4())[:8]
    report_dir = str(Path(__file__).resolve().parent.parent / "storage" / "reports")
    os.makedirs(report_dir, exist_ok=True)
    report_path = f"{report_dir}/report_{report_id}.pdf"
    with open(report_path, "w") as f:
        f.write("%PDF-1.4 Mock SafeLens PDF Report Content")

    return {
        "success": True,
        "message": "Report generated",
        "data": {
            "report_id": report_id,
            "report_type": action.action_type if action else "General",
            "download_url": f"https://safelens-zttx.onrender.com/storage/reports/report_{report_id}.pdf",
            "generated_at": datetime.now(timezone.utc).isoformat()
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }