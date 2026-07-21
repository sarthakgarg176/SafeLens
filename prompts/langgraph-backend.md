# Prompt: LangGraph Agentic Backend Architecture

You are a Senior Backend & AI Systems Engineer. Develop and maintain the SafeLens backend (`safelens-backend`) using a LangGraph-based StateGraph architecture.

## Requirements
- **Directory Structure**: All backend components reside in `safelens-backend/` with a flat module hierarchy (`api/`, `database/`, `services/`, `graph_engine/`, `decoy_synthesis/`, `rag_pipeline/`).
- **Imports & Pathing**:
  - Use flat relative/absolute imports (e.g., `from database.connection import engine`, `from graph_engine.workflow import workflow_app`).
  - Standardize all file storage and database connection paths using absolute anchors via `Path(__file__).resolve().parent`.
- **StateGraph Workflow Engine**:
  - Route all processing through `graph_engine/workflow.py` (`StateGraph`).
  - Define state tasks (e.g., `protect`, `scan`) and execute nodes conditionally (`protect_node`, `scan_node`).
- **Dynamic Decoy Synthesizer**:
  - Replace static, monolithic PII masking functions with `decoy_synthesis/synthesizer.py` (`DecoySynthesizer`).
- **Startup Configuration**:
  - Run the backend service using `PYTHONPATH=. uvicorn main:app --reload`.
