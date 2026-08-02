import os
import re
from pathlib import Path
from typing import List, Dict, Any
from langgraph.graph import StateGraph, END
from graph_engine.state import AgentState
from datetime import datetime
from decoy_synthesis.synthesizer import DecoySynthesizer
from rag_pipeline.vector_store import PolicyVectorStore
from gliner import GLiNER

# Initialize embeddings and Chroma for enterprise_policies lookup
try:
    from langchain_community.embeddings import HuggingFaceEmbeddings
    from langchain_chroma import Chroma
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
except Exception as e:
    print(f"[ERROR] Failed to load LangChain embeddings/Chroma: {e}")
    embeddings = None

def extract_forbidden_terms(policy_text: str) -> List[str]:
    """
    Extract potential forbidden words, project names, or concepts
    from the text of an organization's policy.
    """
    terms = []
    
    # 1. Terms in single, double, or backtick quotes, e.g. "Project Apollo", 'CTC'
    quoted = re.findall(r'["\'`]([^"\'`]{2,})["\'`]', policy_text)
    terms.extend(quoted)
    
    # 2. Capitalized phrases or proper nouns (e.g. "Project Apollo")
    capitalized = re.findall(r'\b[A-Z][a-zA-Z0-9_-]*(?:\s+[A-Z][a-zA-Z0-9_-]*)*\b', policy_text)
    for cap in capitalized:
        terms.append(cap)
        # Split and add individual words
        words = cap.split()
        if len(words) > 1:
            terms.extend(words)
            # Add all consecutive sub-sequences of length >= 2
            for length in range(2, len(words) + 1):
                for start in range(len(words) - length + 1):
                    sub_seq = " ".join(words[start : start + length])
                    terms.append(sub_seq)
    
    # 3. Uppercase acronyms of length 2-8 (e.g. "CTC", "PAN", "SSN")
    acronyms = re.findall(r'\b[A-Z]{2,8}\b', policy_text)
    terms.extend(acronyms)
    
    # 4. Filter and clean the terms
    ignored_words = {
        "Policy", "Rule", "Guidelines", "The", "A", "An", "Any", "All", 
        "If", "Under", "DLP", "PII", "PDF", "GDPR", "ChromaDB", "FastAPI",
        "Upload", "Compliance", "Must", "Should", "Restricted", "Confidential",
        "Guidelines", "Uploading"
    }
    
    filtered_terms = []
    for term in terms:
        t = term.strip()
        # Exclude terms that are fully numeric, too short, or in our ignore list
        if len(t) >= 2 and t not in ignored_words and not t.isdigit():
            filtered_terms.append(t)
            
    # Sort by length descending so that longer phrases are matched first
    return sorted(list(set(filtered_terms)), key=len, reverse=True)

def get_replacement_placeholder(term: str, policy_text: str = "") -> str:
    """
    Map a forbidden term/concept to a realistic redacted placeholder
    based on the term itself and policy context.
    """
    term_lower = term.lower()
    policy_lower = policy_text.lower()
    
    # 1. Project/Codename mappings (Check term itself first)
    project_keywords = {"project", "apollo", "codename", "product", "internal"}
    if term_lower in project_keywords or any(k in term_lower for k in project_keywords):
        return "[REDACTED_INTERNAL_PROJECT]"
        
    # 2. Financial mappings (Check term itself first)
    financial_keywords = {"ctc", "salary", "compensation", "bonus", "financial", "revenue", "price", "pricing", "cost", "bank"}
    if term_lower in financial_keywords or any(k in term_lower for k in financial_keywords):
        return "[REDACTED_FINANCIALS]"
        
    # 3. PII/Identity mappings (Check term itself first)
    pii_keywords = {"aadhaar", "pan", "ssn", "passport", "id", "card", "phone", "email", "upi"}
    if term_lower in pii_keywords or any(k in term_lower for k in pii_keywords):
        return "[REDACTED_PII]"
        
    # 4. Fallback checks on policy context
    if any(k in policy_lower for k in ["project", "codename", "internal"]):
        return "[REDACTED_INTERNAL_PROJECT]"
        
    if any(k in policy_lower for k in ["financial", "salary", "ctc", "compensation"]):
        return "[REDACTED_FINANCIALS]"
        
    # Default fallback
    return "[REDACTED_SENSITIVE]"

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
    r'\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b',       # UPI
    r'\b(?:\+91[-\s]?)?[6-9]\d{9}\b'                    # Phone
]

REGEX_REDACTION_MAP = {
    r'\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b': '[CVV_REDACTED]-[CVV_REDACTED]-[CVV_REDACTED]',
    r'\b(?:\+91[-\s]?)?[6-9]\d{9}\b': '[REDACTED_PHONE]',
    r'\b[A-Z]{5}[0-9]{4}[A-Z]\b': '[REDACTED_PAN]',
    r'\b(?:\d[ -]*?){13,16}\b': '[REDACTED_CARD]',
    r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b': '[REDACTED_EMAIL]',
    r'\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b': '[REDACTED_UPI]'
}

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
    
    # 🚀 CHECK 1: Regex PII Scan & Redaction
    has_regex_pii = False
    sanitized_text = extracted_text
    for pattern, replacement in REGEX_REDACTION_MAP.items():
        if re.search(pattern, sanitized_text, re.IGNORECASE):
            has_regex_pii = True
            sanitized_text = re.sub(pattern, replacement, sanitized_text, flags=re.IGNORECASE)
    
    # 🧠 CHECK 2: Contextual AI Masking (GLiNER NER + Regex Fallback)
    has_gliner_pii = False
    
    if gliner_model and extracted_text:
        labels = [
            "password", "secret", "passcode", "API key",
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

    # 🧠 CHECK 2.6: Custom Enterprise Policy Terms from ChromaDB
    has_enterprise_policy_violation = False
    matched_enterprise_policies = []
    violated_terms_raw = []
    
    enterprise_db_path = str(Path(__file__).resolve().parent.parent / "database" / "chroma_db")
    try:
        if os.path.exists(enterprise_db_path) and embeddings is not None and extracted_text:
            enterprise_db = Chroma(
                collection_name="enterprise_policies",
                embedding_function=embeddings,
                persist_directory=enterprise_db_path
            )
            
            # Query similarity search using the user's input text
            search_results = enterprise_db.similarity_search(extracted_text, k=3)
            
            violated_terms = []
            for doc in search_results:
                policy_text = doc.page_content
                candidate_terms = extract_forbidden_terms(policy_text)
                
                # Check if any candidate term is inside our text
                for term in candidate_terms:
                    escaped_term = re.escape(term)
                    pattern = rf'\b{escaped_term}\b'
                    if re.search(pattern, sanitized_text, re.IGNORECASE):
                        placeholder = get_replacement_placeholder(term, policy_text)
                        sanitized_text, count = re.subn(pattern, placeholder, sanitized_text, flags=re.IGNORECASE)
                        if count > 0:
                            has_enterprise_policy_violation = True
                            violated_terms.append(f"{term} -> {placeholder}")
                            violated_terms_raw.append(term)
                            if policy_text not in matched_enterprise_policies:
                                matched_enterprise_policies.append(policy_text)
                            print(f"[Enterprise Policy Match] Redacted term '{term}' with '{placeholder}' based on policy: '{policy_text[:100]}...'")
            
            if has_enterprise_policy_violation:
                print(f"[Enterprise Policy Scan] Redacted violated terms: {violated_terms}")
        else:
            print("[Enterprise Policy Scan] enterprise_policies ChromaDB not found or not initialized.")
    except Exception as e:
        print(f"[ERROR] Failed to run Enterprise Policy check on ChromaDB: {e}")

    has_pii = has_regex_pii or has_gliner_pii or has_enterprise_policy_violation

    # Clean text check
    if not has_pii:
        print(f"[NODE: RAG Evaluator] Clean text detected. Passing through...")
        return {
            "rag_context_matched": "Clean Text - No PII",
            "is_safe": True,
            "confidence_score": 1.0,
            "extracted_text": sanitized_text,
            "enterprise_policy_violated": False,
            "violated_terms": [],
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
    
    # If custom enterprise policy was violated, append it to the matched context
    if has_enterprise_policy_violation:
        custom_docs = "; ".join(matched_enterprise_policies)
        if matched_doc:
            matched_doc = f"Custom Enterprise Policy Violation: ({custom_docs}) | Whitelist Policy: {matched_doc}"
        else:
            matched_doc = f"Custom Enterprise Policy Violation: {custom_docs}"
        # Trigger decoy generation path (is_safe becomes False unless target domain is explicitly whitelisted as internal)
        if not ("internal" in target_domain.lower() or action == "PASS"):
            is_safe = False
            
    return {
        "rag_context_matched": matched_doc,
        "is_safe": is_safe,
        "confidence_score": 0.95,
        "extracted_text": sanitized_text,
        "enterprise_policy_violated": has_enterprise_policy_violation,
        "violated_terms": list(set(violated_terms_raw)),
        "logs": state.get("logs", []) + [{"step": "RAG_EVALUATION", "result": "WHITELISTED" if is_safe else "UNTRUSTED"}]
    }

def decoy_generator_node(state: AgentState):
    print("[NODE: Decoy Engine] PII Policy triggered. Synthesizing decoy payload...")
    input_data = state.get("input_data", {})
    pii_type = input_data.get("pii_type", "AADHAAR")
    pii_type_upper = pii_type.upper()
    
    original_val = state.get("extracted_text") or state.get("raw_text") or input_data.get("text", "")
    
    if pii_type_upper in ["FORM_DATA", "FILE_UPLOAD", "TEXT", "TEXT_PAYLOAD"]:
        synthetic_val = original_val
    else:
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