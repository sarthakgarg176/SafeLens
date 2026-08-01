# test_rag_expansion.py

from rag_pipeline.vector_store import PolicyVectorStore
from rag_pipeline.policy_loader import PolicyLoader

def run_rag_expansion_test():
    print("=== STARTING RAG POLICY EXPANSION TEST ===\n")
    
    store = PolicyVectorStore()
    
    # 1. Add new advanced policies
    new_policies = [
        {
            "id": "rule_004",
            "text": "Any crypto wallet addresses, seed phrases, or exchange logins on unknown third-party domains must be intercepted.",
            "metadata": {"category": "CRYPTO_SECURITY", "action": "DECOY"}
        },
        {
            "id": "rule_005",
            "text": "Official government portals with .gov.in or .nic.in domain extensions are verified safe for direct ID submission.",
            "metadata": {"category": "GOVT_WHITELIST", "action": "PASS"}
        }
    ]
    
    docs = [p["text"] for p in new_policies]
    metas = [p["metadata"] for p in new_policies]
    ids = [p["id"] for p in new_policies]
    
    store.add_policies(documents=docs, metadatas=metas, ids=ids)
    print("[1] New custom policies successfully ingested into ChromaDB!\n")
    
    # 2. Test semantic search scenarios
    test_queries = [
        ("Uploading credit card details on suspicious-checkout.com", "DECOY"),
        ("Submitting verification documents on uidai.gov.in portal", "PASS"),
        ("Entering secret key on web3-crypto-free-coins.org", "DECOY")
    ]
    
    print("[2] Running Semantic Vector Similarity Queries:\n")
    for query, expected_action in test_queries:
        results = store.query_policy(query, n_results=1)
        if results:
            doc = results[0].get("document", "")
            action = results[0].get("metadata", {}).get("action", "DECOY")
            match_status = "✅ PASSED" if action == expected_action else "❌ FAILED"
            
            print(f"Query: '{query}'")
            print(f"Matched Rule: '{doc}'")
            print(f"Resolved Action: {action} (Expected: {expected_action}) -> {match_status}")
            print("-" * 70)

if __name__ == "__main__":
    run_rag_expansion_test()