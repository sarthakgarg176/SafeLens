# rag_pipeline/vector_store.py

import os
from pathlib import Path
from typing import List, Dict, Any

try:
    import chromadb
    from chromadb.config import Settings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False


class PolicyVectorStore:
    """
    Manages the ChromaDB vector database for storing and querying 
    privacy policy guidelines and trusted domain rules.
    """

    def __init__(self, collection_name: str = "privacy_policies"):
        self.collection_name = collection_name
        self.db_path = str(Path(__file__).resolve().parent.parent / "storage" / "chroma_db")
        
        if CHROMADB_AVAILABLE:
            self.client = chromadb.PersistentClient(path=self.db_path)
            self.collection = self.client.get_or_create_collection(name=self.collection_name)
        else:
            self.client = None
            self.collection = None
            print("[WARNING] ChromaDB package not installed. Running in Native Fallback mode.")

    def add_policies(self, documents: List[str], metadatas: List[Dict[str, Any]], ids: List[str]):
        """Adds policy chunks into the vector collection."""
        if not CHROMADB_AVAILABLE or not self.collection:
            return False
            
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        return True

    def query_policy(self, query_text: str, n_results: int = 2) -> List[Dict[str, Any]]:
        """
        Queries ChromaDB for policy context related to a domain or data type.
        """
        if not CHROMADB_AVAILABLE or not self.collection:
            # Fallback mock context if ChromaDB isn't loaded yet
            return [{"document": "Default Policy: Untrusted third-party forms require PII decoy masking.", "distance": 0.1}]

        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        
        matches = []
        if results and 'documents' in results and results['documents']:
            for i, doc in enumerate(results['documents'][0]):
                meta = results['metadatas'][0][i] if 'metadatas' in results and results['metadatas'] else {}
                matches.append({"document": doc, "metadata": meta})
                
        return matches


# Quick Local Test
if __name__ == "__main__":
    store = PolicyVectorStore()
    print("[SUCCESS] PolicyVectorStore Initialized at:", store.db_path)
    res = store.query_policy("Is uploading Aadhaar to untrusted site allowed?")
    print("Test Query Result:", res)