# api/protect.py

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel
from graph_engine.workflow import workflow_app
from api.websocket import manager
import uuid
import time
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import Incident

router = APIRouter()

class ProtectRequest(BaseModel):
    target_domain: str
    text: str
    pii_type: str

@router.post("/protect")
async def protect_data(
    request: ProtectRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    req_id = str(uuid.uuid4())
    print(f"[ROUTE: /api/protect] ✅ REQUEST RECEIVED | domain={request.target_domain} | pii_type={request.pii_type}")
    print(f"[ROUTE: /api/protect] Text payload: {request.text[:120]}...")

    # Format state for LangGraph
    initial_state = {
        "request_id": req_id,
        "file_name": "text_payload",
        "target_domain": request.target_domain,
        "input_data": {
            "text": request.text,
            "pii_type": request.pii_type
        },
        "logs": []
    }

    # 1. Run the Agentic Workflow and measure processing latency
    start_time = time.time()
    result = workflow_app.invoke(initial_state)
    latency_ms = int((time.time() - start_time) * 1000)

    # Log incident to the database if an enterprise policy violation is found
    if result.get("enterprise_policy_violated"):
        try:
            violated_terms = result.get("violated_terms", [])
            new_incident = Incident(
                incident_type="Policy Violation (Enterprise Policy)",
                action_taken="Payload Sanitized / Decoy Swapped",
                detected_terms=json.dumps(violated_terms),
                severity="HIGH",
                latency_ms=latency_ms,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(new_incident)
            db.commit()
            print(f"[protect_data] 🔒 Enterprise policy violation saved: {violated_terms} | Latency: {latency_ms}ms")
        except Exception as e:
            db.rollback()
            print(f"[ERROR] Failed to save enterprise policy violation incident: {e}")

    # 2. Broadcast all step-by-step logs to the Dashboard asynchronously
    for log in result.get("logs", []):
        log["request_id"] = req_id
        background_tasks.add_task(manager.broadcast, log)

    # 2b. Determine the correct text to send back to the extension.
    # Priority order:
    #   1. If a decoy/redaction was applied, use the actual synthetic
    #      (redacted) value from synthetic_payload — this is the text
    #      that is actually safe to send to the untrusted site.
    #   2. Otherwise fall back to extracted_text if the workflow produced one.
    #   3. Otherwise fall back to the original request text (nothing to redact).
    synthetic_payload = result.get("synthetic_payload", {}) or {}
    if result.get("decoy_applied") and synthetic_payload.get("synthetic_value"):
        sanitized_text = synthetic_payload["synthetic_value"]
    elif result.get("extracted_text"):
        sanitized_text = result.get("extracted_text")
    else:
        sanitized_text = request.text

    print(f"[ROUTE: /api/protect] ✅ WORKFLOW COMPLETE | GLiNER/RAG Sanitized Output: {sanitized_text[:120]}...")

    # 3. Return the final decision back to the Browser Extension
    return {
        "request_id": req_id,
        "status": result.get("execution_status"),
        "decoy_applied": result.get("decoy_applied"),
        "sanitized_text": sanitized_text,
        "payload": result.get("synthetic_payload", {})
    }