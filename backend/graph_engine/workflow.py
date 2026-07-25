import re
from langgraph.graph import StateGraph, END
from graph_engine.state import AgentState
from datetime import datetime
from decoy_synthesis.synthesizer import DecoySynthesizer
from rag_pipeline.vector_store import PolicyVectorStore
from gliner import GLiNER

synthesizer = DecoySynthesizer()
vector_store = PolicyVectorStore()

# 🧠 Load GLiNER Model Locally
try:
    gliner_model = GLiNER.from_pretrained("urchade/gliner_medium-v2.1")
    print("[SYSTEM] GLiNER Model loaded successfully for Contextual PII masking.")
except Exception as e:
    gliner_model = None
    print(f"[ERROR] GLiNER Model failed to load: {str(e)}")

# ⚡ Strict Boundary-Protected Regex Patterns
PII_PATTERNS = [
    r'\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b',            # Aadhaar
    r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b',                    # PAN
    r'\b(?:\d[ -]*?){13,16}\b',                         # Credit Card
    r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b', # Email
    r'\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b'        # UPI
]

def contains_pii(text: str) -> bool:
    if not text:
        return False
    return any(re.search(pattern, text, re.IGNORECASE) for pattern in PII_PATTERNS)

def extraction_node(state: AgentState):
    input_data = state.get("input_data", {})
    text = input_data.get("text") or state.get("raw_text") or state.get("extracted_text") or ""
    new_log = {"step": "EXTRACTION", "timestamp": str(datetime.now()), "status": "COMPLETED"}
    return {
        "raw_text": text,
        "extracted_text": text,
        "logs": state.get("logs", []) + [new_log]
    }

def rag_evaluator_node(state: AgentState):
    target_domain = state.get("target_domain", "untrusted_form.com")
    extracted_text = state.get("extracted_text") or state.get("raw_text") or ""
    
    # 🚀 CHECK 1: Regex PII Scan
    has_regex_pii = contains_pii(extracted_text)
    
    # 🧠 CHECK 2: Contextual AI Masking (GLiNER NER + Regex Fallback)
    has_gliner_pii = False
    sanitized_text = extracted_text
    
    if gliner_model and extracted_text:
        labels = [
            "password", "credential", "secret", "passcode", "API key",
            "token", "secret code", "medical record id", "salary",
            "patient id", "access key", "private key", "pin code"
        ]
        
        # 🔵 [DIAGNOSTIC] Log the raw input text being fed to GLiNER
        print(f"[GLiNER Debug] Input text to GLiNER: {extracted_text}")
        print(f"[GLiNER Debug] Labels: {labels}")
        
        entities = gliner_model.predict_entities(extracted_text, labels, threshold=0.3)
        
        # 🔵 [DIAGNOSTIC] Log ALL raw entities with their confidence scores
        print(f"[GLiNER Debug] Raw entities detected (threshold=0.3): {entities}")
        for ent in entities:
            print(f"  -> Entity: '{ent.get('text')}' | Label: {ent.get('label')} | Score: {ent.get('score', 'N/A')} | Span: [{ent.get('start')}, {ent.get('end')}]")
        
        if entities:
            has_gliner_pii = True
            print(f"[NODE: GLiNER AI Engine] Detected {len(entities)} contextual entities: {[e['text'] for e in entities]}")
            # Sort entities by start index in descending order to avoid offset shifts
            sorted_entities = sorted(entities, key=lambda x: x["start"], reverse=True)
            for entity in sorted_entities:
                start = entity["start"]
                end = entity["end"]
                label_name = entity["label"].upper().replace(" ", "_")
                replacement = f"[REDACTED_{label_name}]"
                sanitized_text = sanitized_text[:start] + replacement + sanitized_text[end:]
            
            print(f"[NODE: GLiNER AI Engine] Contextual PII masked: {sanitized_text}")
        else:
            print(f"[GLiNER Debug] GLiNER returned ZERO entities.")
    
    # CHECK 2b: Contextual Password & Secret Value Masker (Ensures secrets like admin_home_9981 are redacted)
    if extracted_text:
        import re
        contextual_pattern = re.compile(
            r'(?:\[REDACTED_\w+\]|password|pwd|passcode|secret|credential)\s+(?:\w+\s+){0,5}?(\S*[A-Za-z]\S*\d\S*|\S*\d\S*[A-Za-z]\S*)',
            re.IGNORECASE
        )
        fallback_matches = list(contextual_pattern.finditer(sanitized_text))
        if fallback_matches:
            has_gliner_pii = True
            print(f"[Contextual Redactor] Masking {len(fallback_matches)} secret values near keywords")
            for match in reversed(fallback_matches):
                secret_val = match.group(1)
                start = match.start(1)
                end = match.end(1)
                sanitized_text = sanitized_text[:start] + "[REDACTED_PASSWORD]" + sanitized_text[end:]
            print(f"[Contextual Redactor] Sanitized output: {sanitized_text}")

        # 🚀 NEW Regex Fallback Layer for General Entities
        fallback_regexes = [
            # Alphanumeric strings with underscores/hyphens (e.g., router_admin_2026, stag_tok_88123)
            (r'\b(?=[A-Za-z0-9_-]*[A-Za-z])(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[_-])[A-Za-z0-9_-]{5,}\b', '[REDACTED_SECRET]'),
            # Standard formats for IDs (e.g., HRN-882109, 440192-X)
            (r'\b[A-Za-z]{2,5}-\d{4,9}\b|\b\d{4,9}-[A-Za-z]{1,3}\b', '[REDACTED_ID]'),
            # 4 to 8 digit standalone numbers (e.g., PINs like 884221)
            (r'\b\d{4,8}\b', '[REDACTED_SECRET]')
        ]

        for pattern, replacement in fallback_regexes:
            for match in reversed(list(re.finditer(pattern, sanitized_text))):
                has_gliner_pii = True
                start, end = match.span()
                sanitized_text = sanitized_text[:start] + replacement + sanitized_text[end:]

    has_pii = has_regex_pii or has_gliner_pii

    # Clean text check
    if not has_pii:
        print(f"[NODE: RAG Evaluator] Clean text detected. Passing through...")
        return {
            "rag_context_matched": "Clean Text - No PII",
            "is_safe": True,
            "confidence_score": 1.0,
            "extracted_text": sanitized_text,
            "logs": state.get("logs", []) + [{"step": "RAG_EVALUATION", "result": "CLEAN_TEXT"}]
        }

    # 🚀 CHECK 3: ChromaDB policy lookup
    query_str = f"Uploading PII data to {target_domain}"
    results = vector_store.query_policy(query_str, n_results=1)
    
    matched_doc = ""
    action = "DECOY"
    if results and len(results) > 0:
        matched_doc = results[0].get("document", "")
        action = results[0].get("metadata", {}).get("action", "DECOY")
    
    is_safe = (action == "PASS") or ("internal" in target_domain.lower())
    
    return {
        "rag_context_matched": matched_doc,
        "is_safe": is_safe,
        "confidence_score": 0.95,
        "extracted_text": sanitized_text,
        "logs": state.get("logs", []) + [{"step": "RAG_EVALUATION", "result": "WHITELISTED" if is_safe else "UNTRUSTED"}]
    }

def decoy_generator_node(state: AgentState):
    print("[NODE: Decoy Engine] PII Policy triggered. Synthesizing decoy payload...")
    input_data = state.get("input_data", {})
    pii_type = input_data.get("pii_type", "AADHAAR")
    
    original_val = state.get("extracted_text") or state.get("raw_text") or input_data.get("text", "")
    synthetic_val = synthesizer.synthesize(pii_type, original_val)
    
    payload = {
        "original_type": pii_type,
        "synthetic_value": synthetic_val,
        "action_taken": "SWAPPED_WITH_DECOY"
    }
    
    return {
        "decoy_applied": True,
        "synthetic_payload": payload,
        "execution_status": "DECOYED",
        "result": {"status": "DECOYED", "payload": payload},
        "extracted_text": state.get("extracted_text") or original_val,
        "logs": state.get("logs", []) + [{"step": "DECOY_GENERATION", "status": "DECOYED"}]
    }

def safe_pass_node(state: AgentState):
    print("[NODE: Safe Route] Text is safe or domain is trusted. Allowing pass-through...")
    text_out = state.get("extracted_text") or state.get("raw_text") or ""
    return {
        "decoy_applied": False,
        "execution_status": "SUCCESS",
        "result": {"status": "SUCCESS", "message": "Pass-through allowed."},
        "extracted_text": text_out,
        "logs": state.get("logs", []) + [{"step": "SAFE_PASS", "status": "WHITELISTED"}]
    }

def route_safety(state: AgentState):
    if state.get("is_safe"):
        return "safe_pass_node"
    return "decoy_generator_node"

# LangGraph Build
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