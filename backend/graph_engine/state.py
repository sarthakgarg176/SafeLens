from typing import TypedDict, Optional, List, Dict, Any

class AgentState(TypedDict, total=False):
    """
    Represents the execution state of the SafeLens LangGraph pipeline.
    """
    # 1. Input Metadata
    request_id: str
    file_name: str
    target_domain: str
    raw_text: Optional[str]
    input_data: Optional[Dict[str, Any]]
    
    # 2. Extracted Data
    extracted_text: Optional[str]
    detected_patterns: List[str]  # e.g., ['AADHAAR', 'PAN']
    
    # 3. RAG Evaluation Results
    rag_context_matched: Optional[str]
    is_safe: bool
    confidence_score: float
    
    # 4. Decoy Execution
    decoy_applied: bool
    synthetic_payload: Optional[Dict[str, Any]]
    
    # 5. Telemetry & Audit Logs
    execution_status: str  # SUCCESS, WARNING, FAILED, DECOYED
    logs: List[Dict[str, Any]]  # For Dashboard Timeline streaming