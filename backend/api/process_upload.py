import os
import io
import uuid
import base64
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import cv2
from api.image_redactor import extract_barcode_boxes

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

def apply_backend_redaction_and_watermark(img: Image.Image) -> str:
    """
    Applies solid black redaction rectangles and semi-transparent watermark on the Pillow image
    and returns a Base64 Data URL string.
    """
    base_image = img.convert("RGBA")
    width, height = base_image.size
    
    overlay = Image.new("RGBA", base_image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # 1. Draw solid black PII redaction boxes across credential zones
    box_w = int(width * 0.75)
    box_h = max(24, int(height * 0.085))
    x_start = (width - box_w) // 2
    
    y1 = int(height * 0.42)
    y2 = int(height * 0.62)
    
    draw.rectangle([x_start, y1, x_start + box_w, y1 + box_h], fill=(0, 0, 0, 255))
    draw.rectangle([x_start, y2, x_start + box_w, y2 + box_h], fill=(0, 0, 0, 255))

    # 1.5. Detect and redact Barcodes/QR Codes intelligently
    try:
        cv_img = cv2.cvtColor(np.array(img.convert('RGB')), cv2.COLOR_RGB2BGR)
        print("[PROCESS_UPLOAD] 🔍 Scanning image for Barcodes/QR codes...")
        barcode_boxes = extract_barcode_boxes(cv_img)
        print(f"[PROCESS_UPLOAD] 📊 Barcode Scan Complete -> Found {len(barcode_boxes)} Barcode/QR region(s).")
        for box in barcode_boxes:
            x_min, y_min, x_max, y_max = box["coords"]
            padding = 10
            draw.rectangle(
                [
                    max(0, x_min - padding),
                    max(0, y_min - padding),
                    min(width, x_max + padding),
                    min(height, y_max + padding)
                ],
                fill=(0, 0, 0, 255)
            )
        if barcode_boxes:
            print(f"[PROCESS_UPLOAD] ✍️ Masked {len(barcode_boxes)} Barcode/QR code region(s) with solid black boxes.")
    except Exception as e:
        print(f"[PROCESS_UPLOAD] ❌ Barcode redaction failed: {e}")

    # 2. Add diagonal SAFELENS watermark overlay
    watermark_text = "SAFELENS DECOY - PII PROTECTED"
    try:
        font_size = max(20, int(width / 14))
        font = ImageFont.truetype("arial.ttf", font_size)
    except IOError:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), watermark_text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    x_center = (width - text_w) // 2
    y_center = (height - text_h) // 2
    
    draw.text((x_center, y_center), watermark_text, font=font, fill=(255, 0, 0, 160))
    
    # Merge overlay with base image
    watermarked_image = Image.alpha_composite(base_image, overlay).convert("RGB")

    # Fast Byte Buffer encoding (JPEG format is ~10x faster than PNG)
    buffered = io.BytesIO()
    watermarked_image.save(buffered, format="JPEG", quality=88)
    encoded_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded_b64}"


@router.post("/v2/process-upload", tags=["v2"])
async def process_upload_v2(
    request: ProcessUploadRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    req_id = str(uuid.uuid4())
    # 🔵 [DIAGNOSTIC] Confirm route is being hit
    print(f"[ROUTE: /api/v2/process-upload] \u2705 REQUEST RECEIVED | req_id={req_id}")
    print(f"[ROUTE: /api/v2/process-upload] fileDataUrl present: {bool(request.fileDataUrl)} | image_data present: {bool(request.image_data)} | domain: {request.target_domain}")
    raw_data = request.image_data or request.fileDataUrl
    
    image_info: Dict[str, Any] = {}
    saved_filename = None
    redaction_applied = False
    base64_redacted_image = None
    
    if raw_data:
        try:
            if "," in raw_data:
                header, encoded = raw_data.split(",", 1)
            else:
                encoded = raw_data
                
            image_bytes = base64.b64decode(encoded)
            img = Image.open(io.BytesIO(image_bytes))
            
            # Apply Redaction & Generate Base64 Redacted Output
            base64_redacted_image = apply_backend_redaction_and_watermark(img)
            
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            file_ext = (img.format or "png").lower()
            saved_filename = f"v2_upload_{req_id[:8]}.{file_ext}"
            file_path = UPLOAD_DIR / saved_filename
            img.save(file_path)
            
            redaction_applied = True
            
            # 🚀 POPULATE IMAGE_INFO WITH THE REDACTED BASE64 IMAGE
            image_info = {
                "width": img.width,
                "height": img.height,
                "format": img.format or "PNG",
                "size_bytes": len(image_bytes),
                "processed_image": base64_redacted_image,  # Base64 string for extension
                "redacted_data_url": base64_redacted_image
            }
            
        except Exception as e:
            image_info = {"warning": f"Could not parse image bytes: {str(e)}"}
            
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
    
    result = workflow_app.invoke(initial_state)
    
    for log in result.get("logs", []):
        log["request_id"] = req_id
        background_tasks.add_task(manager.broadcast, log)
        
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
        "image_info": image_info,  # Now contains processed_image Base64 string!
        "payload": result.get("synthetic_payload", {}),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
# Reload trigger
