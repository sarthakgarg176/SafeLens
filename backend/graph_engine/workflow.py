from langgraph.graph import StateGraph, END
from graph_engine.state import AgentState
from datetime import datetime
from decoy_synthesis.synthesizer import DecoySynthesizer
from rag_pipeline.vector_store import PolicyVectorStore

# Initialize components
synthesizer = DecoySynthesizer()
vector_store = PolicyVectorStore()

# ==========================================
# NODE 1: Data Extraction
# ==========================================
def extraction_node(state: AgentState):
    file_name = state.get("file_name", "unknown")
    input_data = state.get("input_data", {})
    text = input_data.get("text", "")
    
    print(f"[NODE: Extraction] Processing file/text for target domain: {state.get('target_domain')}")
    
    new_log = {"step": "EXTRACTION", "timestamp": str(datetime.now()), "status": "COMPLETED"}
    return {
        "extracted_text": text,
        "logs": state.get("logs", []) + [new_log]
    }

# ==========================================
# NODE 2: RAG Evaluator (Live Policy Query)
# ==========================================
def rag_evaluator_node(state: AgentState):
    target_domain = state.get("target_domain", "untrusted_form.com")
    extracted_text = state.get("extracted_text", "")
    
    print(f"[NODE: RAG Evaluator] Querying ChromaDB for policy match on domain: {target_domain}...")
    
    # 1. Query ChromaDB vector store
    query_str = f"Uploading PII data to {target_domain}"
    results = vector_store.query_policy(query_str, n_results=1)
    
    matched_doc = ""
    action = "DECOY"
    
    if results:
        matched_doc = results[0].get("document", "")
        action = results[0].get("metadata", {}).get("action", "DECOY")
    
    # 2. Determine safety based on policy match or domain whitelist
    is_safe = (action == "PASS") or ("internal" in target_domain.lower())
    
    new_log = {
        "step": "RAG_EVALUATION", 
        "timestamp": str(datetime.now()), 
        "result": "WHITELISTED" if is_safe else "UNTRUSTED",
        "matched_policy": matched_doc
    }
    
    return {
        "rag_context_matched": matched_doc,
        "is_safe": is_safe,
        "confidence_score": 0.95,
        "logs": state.get("logs", []) + [new_log]
    }

# ==========================================
# NODE 3A: Plausible Decoy Generator
# ==========================================
def decoy_generator_node(state: AgentState):
    print("[NODE: Decoy Engine] Policy condition triggered. Synthesizing decoy payload...")
    
    input_data = state.get("input_data", {})
    pii_type = input_data.get("pii_type", "AADHAAR")
    original_val = input_data.get("text", "")
    
    # Generate synthetic replacement
    synthetic_val = synthesizer.synthesize(pii_type, original_val)
    
    payload = {
        "original_type": pii_type,
        "synthetic_value": synthetic_val,
        "action_taken": "SWAPPED_WITH_DECOY"
    }
    
    new_log = {"step": "DECOY_GENERATION", "timestamp": str(datetime.now()), "status": "DECOYED"}
    
    return {
        "decoy_applied": True,
        "synthetic_payload": payload,
        "execution_status": "DECOYED",
        "result": {"status": "DECOYED", "payload": payload},
        "logs": state.get("logs", []) + [new_log]
    }

# ==========================================
# NODE 3B: Safe Pass-through
# ==========================================
def safe_pass_node(state: AgentState):
    print("[NODE: Safe Route] Domain is trusted. Allowing original payload...")
    
    new_log = {"step": "SAFE_PASS", "timestamp": str(datetime.now()), "status": "WHITELISTED"}
    
    return {
        "decoy_applied": False,
        "execution_status": "SUCCESS",
        "result": {"status": "SUCCESS", "message": "Domain whitelisted. Pass-through allowed."},
        "logs": state.get("logs", []) + [new_log]
    }

# Router Logic
def route_safety(state: AgentState):
    if state.get("is_safe"):
        return "safe_pass_node"
    return "decoy_generator_node"

# Workflow Assembly
workflow = StateGraph(AgentState)
workflow.add_node("extraction_node", extraction_node)
workflow.add_node("rag_evaluator_node", rag_evaluator_node)
workflow.add_node("decoy_generator_node", decoy_generator_node)
workflow.add_node("safe_pass_node", safe_pass_node)

workflow.set_entry_point("extraction_node")
workflow.add_edge("extraction_node", "rag_evaluator_node")
workflow.add_conditional_edges(
    "rag_evaluator_node",
    route_safety,
    {
        "safe_pass_node": "safe_pass_node",
        "decoy_generator_node": "decoy_generator_node"
    }
)
workflow.add_edge("decoy_generator_node", END)
workflow.add_edge("safe_pass_node", END)

workflow_app = workflow.compile()