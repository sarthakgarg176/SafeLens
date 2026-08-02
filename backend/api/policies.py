import os
import tempfile
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma

router = APIRouter()

# Initialize embeddings once during module import
try:
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
except Exception as e:
    print(f"[ERROR] Failed to initialize HuggingFaceEmbeddings: {e}")
    embeddings = None

@router.post("/policies/upload")
async def upload_policy(file: UploadFile = File(...)):
    # 1. Validate extension
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only PDF files are supported."
        )

    # 2. Save PDF to a temporary file safely
    try:
        suffix = Path(file.filename).suffix
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp_path = tmp.name
            content = await file.read()
            tmp.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save temporary upload: {str(e)}"
        )

    # 3. Load PDF and parse pages
    try:
        loader = PyPDFLoader(tmp_path)
        documents = loader.load()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse PDF document: {str(e)}"
        )
    finally:
        # Cleanup temporary file
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception as e_cleanup:
                print(f"[WARNING] Failed to remove temp file {tmp_path}: {e_cleanup}")

    if not documents:
        raise HTTPException(
            status_code=400,
            detail="The uploaded PDF file contains no extractable text."
        )

    # 4. Split text into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(documents)

    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="The document could not be partitioned into any text chunks."
        )

    # 5. Ingest into ChromaDB
    try:
        db_path = str(Path(__file__).resolve().parent.parent / "database" / "chroma_db")
        os.makedirs(db_path, exist_ok=True)

        if embeddings is None:
            raise HTTPException(
                status_code=500,
                detail="Embedding model is not initialized."
            )

        db = Chroma(
            collection_name="enterprise_policies",
            embedding_function=embeddings,
            persist_directory=db_path
        )

        db.add_documents(chunks)
        total_chunks = db._collection.count()

        return {
            "success": True,
            "message": "Policy successfully parsed and indexed into vector database.",
            "filename": file.filename,
            "chunks_added": len(chunks),
            "total_chunks": total_chunks
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to vector-index document: {str(e)}"
        )
