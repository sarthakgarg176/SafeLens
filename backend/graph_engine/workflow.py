from typing import TypedDict, Optional
from langgraph.graph import StateGraph
from langgraph.constants import END
from decoy_synthesis.synthesizer import DecoySynthesizer

class WorkflowState(TypedDict):
    task_type: str # "protect" or "scan"
    input_data: dict
    result: Optional[dict]
    error: Optional[str]

synthesizer = DecoySynthesizer()

def protect_node(state: WorkflowState):
    input_data = state["input_data"]
    text = input_data.get("text", "")
    
    # Synthesize PII
    if text:
        protected_text = synthesizer.synthesize_pii(text)
    else:
        protected_text = ""
        
    return {"result": {"protected_text": protected_text, "status": "protected"}}

def scan_node(state: WorkflowState):
    # This node will orchestrate the image scanning logic
    # Real integration with pHash/wHash would go here
    return {"result": {"status": "scanned", "message": "Scan processed via graph."}}

def route_task(state: WorkflowState):
    if state["task_type"] == "protect":
        return "protect_node"
    elif state["task_type"] == "scan":
        return "scan_node"
    return END

graph = StateGraph(WorkflowState)
graph.add_node("protect_node", protect_node)
graph.add_node("scan_node", scan_node)
graph.set_conditional_entry_point(
    route_task,
    {
        "protect_node": "protect_node",
        "scan_node": "scan_node",
        END: END
    }
)
graph.add_edge("protect_node", END)
graph.add_edge("scan_node", END)

workflow_app = graph.compile()
