# rag_pipeline/policy_loader.py

from typing import List, Dict, Any
from rag_pipeline.vector_store import PolicyVectorStore

class PolicyLoader:
    """
    Parses and ingests organization/privacy compliance policies 
    into the ChromaDB vector database.
    """

    def __init__(self):
        self.vector_store = PolicyVectorStore()

    def seed_default_policies(self):
        """
        Seeds baseline security rules into the vector database.
        """
        default_rules = [
            {
                "id": "rule_001",
                "text": "Uploading government issued IDs like Aadhaar or PAN to untrusted or external public forms strictly requires PII decoy synthesis.",
                "metadata": {"category": "PII_PROTECTION", "action": "DECOY"}
            },
            {
                "id": "rule_002",
                "text": "Internal bank networks and corporate domains are whitelisted. Pass-through allowed without modifying PII data.",
                "metadata": {"category": "WHITELIST", "action": "PASS"}
            },
            {
                "id": "rule_003",
                "text": "Credit card and financial account entries on third-party sites must be swapped with Luhn-compliant synthetic card numbers.",
                "metadata": {"category": "FINANCIAL_DATA", "action": "DECOY"}
            }
        ]

        docs = [rule["text"] for rule in default_rules]
        metas = [rule["metadata"] for rule in default_rules]
        ids = [rule["id"] for rule in default_rules]

        success = self.vector_store.add_policies(documents=docs, metadatas=metas, ids=ids)
        if success:
            print("[SUCCESS] Baseline privacy policies successfully seeded into ChromaDB!")
        else:
            print("[INFO] Native mode active. Skipping vector seeding.")

# Quick Local Test
if __name__ == "__main__":
    loader = PolicyLoader()
    loader.seed_default_policies()