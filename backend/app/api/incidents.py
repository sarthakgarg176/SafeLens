from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..database.connection import get_db
from ..database.models import Alert, Action, Asset
from datetime import datetime, timezone
from pydantic import BaseModel

router = APIRouter()

class DecisionRequest(BaseModel):
    decision: str

@router.get("/incidents")
def get_incidents(db: Session = Depends(get_db)):
    alerts = db.query(Alert).all()
    return {
        "success": True,
        "message": "Incidents fetched",
        "data": [
            {
                "incident_id": a.id,
                "asset_id": a.asset_id,
                "filename": a.asset.filename if a.asset else None,
                "website": a.matched_url,
                "similarity": a.match_confidence,
                "severity": a.severity,
                "status": a.status,
                "timestamp": a.timestamp.isoformat() if a.timestamp else None
            } for a in alerts
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/incidents/{incident_id}")
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == incident_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {
        "success": True,
        "message": "Incident fetched",
        "data": {
            "incident_id": alert.id,
            "asset_id": alert.asset_id,
            "filename": alert.asset.filename if alert.asset else None,
            "website": alert.matched_url,
            "similarity": alert.match_confidence,
            "severity": alert.severity,
            "status": alert.status,
            "detected_at": alert.timestamp.isoformat() if alert.timestamp else None
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.post("/incidents/{incident_id}/decision")
def make_decision(incident_id: int, request: DecisionRequest, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == incident_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Incident not found")
    action = Action(
        alert_id=incident_id,
        action_type=request.decision,
        status="Pending",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(action)
    alert.status = "In Progress"
    db.commit()
    db.refresh(action)
    return {
        "success": True,
        "message": "Decision recorded",
        "data": {
            "action_id": action.id,
            "decision": request.decision,
            "status": action.status,
            "timestamp": action.timestamp.isoformat()
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

class IncidentCreate(BaseModel):
    asset_id: int
    matched_url: str
    match_confidence: float
    severity: str = "Normal"
    status: str = "Open"

@router.post("/incidents")
def create_incident(incident: IncidentCreate, db: Session = Depends(get_db)):
    # Check if the asset exists
    asset = db.query(Asset).filter(Asset.id == incident.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    # Idempotency check: if an alert already exists for this asset, return the existing alert
    existing_alert = db.query(Alert).filter(Alert.asset_id == incident.asset_id).first()
    if existing_alert:
        return {
            "success": True,
            "message": "Incident already logged",
            "data": {
                "incident_id": existing_alert.id,
                "asset_id": existing_alert.asset_id,
                "status": existing_alert.status,
                "timestamp": existing_alert.timestamp.isoformat() if existing_alert.timestamp else None
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    new_alert = Alert(
        asset_id=incident.asset_id,
        matched_url=incident.matched_url,
        match_confidence=incident.match_confidence,
        severity=incident.severity,
        status=incident.status,
        timestamp=datetime.now(timezone.utc)
    )
    try:
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)
    except IntegrityError:
        db.rollback()
        # Retrieve the existing alert because of concurrent write race or retry
        existing_alert = db.query(Alert).filter(Alert.asset_id == incident.asset_id).first()
        if existing_alert:
            return {
                "success": True,
                "message": "Incident already logged",
                "data": {
                    "incident_id": existing_alert.id,
                    "asset_id": existing_alert.asset_id,
                    "status": existing_alert.status,
                    "timestamp": existing_alert.timestamp.isoformat() if existing_alert.timestamp else None
                },
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        raise HTTPException(status_code=500, detail="Database integrity error occurred")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database transaction failed: {str(e)}")

    return {
        "success": True,
        "message": "Incident created successfully",
        "data": {
            "incident_id": new_alert.id,
            "asset_id": new_alert.asset_id,
            "status": new_alert.status,
            "timestamp": new_alert.timestamp.isoformat()
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }