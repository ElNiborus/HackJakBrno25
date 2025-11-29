# FN Brno Virtual Assistant (Hackathon PoC)

## Project Overview
A RAG-based virtual assistant for University Hospital Brno (FN Brno) to help its 7500 employees navigate complex internal structures. The hospital has hundreds of organizational units and processes, making it difficult for employees to know who to contact or how to proceed with specific administrative tasks.

## Core Objectives
1.  **Signpost (Level 1):** Serve as a first point of contact to navigate employees on "How, Where, With Whom, and When" to solve specific situations.
2.  **Guide (Level 2):** Provide step-by-step guidance, variant procedures, or direct navigation to the correct system/document/person.
3.  **Unified Experience:** The robot must act as a single interface, masking the complexity of underlying systems.

## Current Implementation

### Architecture
- **Backend:** FastAPI application with RAG pipeline
- **Frontend:** React + Vite single-page application
- **Vector Database:** InterSystems IRIS with HNSW indexing
- **Embeddings:** OpenAI text-embedding-3-large (3072 dimensions)
- **LLM:** Configurable in `backend/config.py` (currently supports OpenAI models)
- **Language:** Czech (all data, prompts, and responses)

### Data Sources
The knowledge base is derived from a mix of structured and unstructured files in `raw_data/`:
-   **CSV/Excel (Structured):** Organizational structure, lists of processes, process owners (NI, CI departments), and responsibilities
-   **Word Docs (.docx):** Internal directives (e.g., Travel Expenses, Organizational Rules of specific clinics)

**Note:** Only .docx format is supported. Legacy .doc files must be converted to .docx before ingestion.

### Key Features
- Vector similarity search with configurable top-k results and relevance score thresholds
- Source attribution with document references and metadata
- Single-turn conversational interface
- Document download capability
- Chunking strategy: 500 characters with 100 character overlap

### Configuration
All application configuration is centralized in `backend/config.py`:
- Model selection (embedding and LLM models)
- RAG parameters (top_k_results, min_relevance_score)
- Database connection settings

Environment variables (`.env`) contain only secrets and environment-specific values:
- OPENAI_API_KEY
- IRIS database credentials

### Key Scenarios Handled
-   "Co mám dělat, když si chci koupit nový mobil?" (IT purchase procedures)
-   "Jak si zařídit pracovní cestu? Mohu použít moje auto?" (Travel expense workflow & vehicle usage rules)
-   "Jaké procesy má oddělení CI?" (CI department processes)

## Resources
- InterSystems IRIS Vector Search: https://github.com/intersystems-community/FHIR-AI-Hackathon-Kit
- Additional documentation: https://docs.google.com/document/d/1Vd1ltLGVu0yFTqC8BLcWroGTwIXRB-9xUg9ux2rO8wI/edit?usp=sharing