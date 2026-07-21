# api/protect.py

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from graph_engine.workflow import workflow_app
from api.websocket import manager
import uuid

router = APIRouter()

class ProtectRequest(BaseModel):
    target_domain: str
    text: str
    pii_type: str

@router.post("/protect")
async def protect_data(request: ProtectRequest, background_tasks: BackgroundTasks):
    req_id = str(uuid.uuid4())
    
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
    
    # 1. Run the Agentic Workflow
    result = workflow_app.invoke(initial_state)
    
    # 2. Broadcast all step-by-step logs to the Dashboard asynchronously
    for log in result.get("logs", []):
        log["request_id"] = req_id
        background_tasks.add_task(manager.broadcast, log)
        
    # 3. Return the final decision back to the Browser Extension
    return {
        "request_id": req_id,
        "status": result.get("execution_status"),
        "decoy_applied": result.get("decoy_applied"),
        "payload": result.get("synthetic_payload", {})
    }