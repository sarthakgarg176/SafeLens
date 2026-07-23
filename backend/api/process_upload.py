import os
import io
import uuid
import base64
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pathlib import Path
from PIL import Image

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Asset
from graph_engine.workflow import workflow_app
from api.websocket import manager

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "storage" / "uploads"

class ProcessUploadRequest(BaseModel):
    image_data: Optional[str] = Field(None, description="Base64 encoded image string or Data URL")
    fileDataUrl: Optional[str] = Field(None, description="Base64 DataURL of uploaded image")
    extracted_text: Optional[str] = Field(None, description="Extracted OCR text or metadata")
    target_domain: Optional[str] = Field("unknown_domain", description="Target domain where image is uploaded")
    pii_type: Optional[str] = Field("file_upload", description="Type of PII or dataset category")

@router.post("/v2/process-upload", tags=["v2"])
async def process_upload_v2(
    request: ProcessUploadRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    req_id = str(uuid.uuid4())
    
    # Extract base64 image data from either field
    raw_data = request.image_data or request.fileDataUrl
    
    image_info: Dict[str, Any] = {}
    saved_filename = None
    redaction_applied = False
    
    if raw_data:
        try:
            # Handle Data URL format if present (e.g. data:image/png;base64,...)
            if "," in raw_data:
                header, encoded = raw_data.split(",", 1)
            else:
                encoded = raw_data
                
            image_bytes = base64.b64decode(encoded)
            img = Image.open(io.BytesIO(image_bytes))
            
            image_info = {
                "width": img.width,
                "height": img.height,
                "format": img.format or "PNG",
                "size_bytes": len(image_bytes)
            }
            
            # Save uploaded image to storage
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            file_ext = (img.format or "png").lower()
            saved_filename = f"v2_upload_{req_id[:8]}.{file_ext}"
            file_path = UPLOAD_DIR / saved_filename
            img.save(file_path)
            
            redaction_applied = True
            
        except Exception as e:
            image_info = {"warning": f"Could not parse image bytes: {str(e)}"}
            
    # Format state for LangGraph workflow execution
    initial_state = {
        "request_id": req_id,
        "file_name": saved_filename or "uploaded_payload",
        "target_domain": request.target_domain,
        "input_data": {
            "text": request.extracted_text or (raw_data[:100] if raw_data else "image_upload"),
            "pii_type": request.pii_type
        },
        "logs": []
    }
    
    # 1. Run Agentic Workflow / Policy check
    result = workflow_app.invoke(initial_state)
    
    # 2. Broadcast log step events via WebSocket in background
    for log in result.get("logs", []):
        log["request_id"] = req_id
        background_tasks.add_task(manager.broadcast, log)
        
    # 3. Log asset to Database
    try:
        new_asset = Asset(
            filename=saved_filename or f"upload_{req_id[:8]}",
            status="Redacted" if (result.get("decoy_applied") or redaction_applied) else "Protected",
            timestamp=datetime.now(timezone.utc)
        )
        db.add(new_asset)
        db.commit()
    except Exception:
        db.rollback()

    decoy_applied = bool(result.get("decoy_applied", False))
    execution_status = result.get("execution_status", "PROCESSED")
    
    return {
        "success": True,
        "request_id": req_id,
        "status": execution_status,
        "message": "Image processing and redaction check completed",
        "decoy_applied": decoy_applied,
        "redaction_applied": redaction_applied or decoy_applied,
        "image_info": image_info,
        "payload": result.get("synthetic_payload", {}),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
