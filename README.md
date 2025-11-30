# FN Brno Virtual Assistant

A RAG-based virtual assistant for University Hospital Brno (FN Brno) to help 7,500 employees navigate complex internal structures, processes, and administrative tasks.

## What It Does

The assistant serves as a first point of contact for employees to find:
- **Who** to contact for specific tasks
- **How** to complete administrative procedures
- **Where** to find relevant documents and forms
- **What** processes apply to their situation

Built with InterSystems IRIS vector search, OpenAI embeddings, and a React frontend.

---

## Quick Start

**Prerequisites:** Docker, Python 3.9+, Node.js 18+, OpenAI API key

```bash
# 1. Build and Start InterSystems IRIS Database (with FHIR)
cd FHIR-AI-Hackathon-Kit/Dockerfhir
docker pull intersystemsdc/irishealth-community:latest
docker-compose build
docker-compose up -d
cd ../..
# Wait 1-2 minutes for IRIS to fully initialize

# 2. Setup Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 3. Ingest Data
cd ..
python scripts/ingest_data.py

# 4. Start Backend
cd backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# 5. Start Frontend (new terminal)
cd frontend
npm install
npm run dev
```

**Access:**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **IRIS Portal:** http://localhost:32783/csp/sys/UtilHome.csp (user: `_SYSTEM`, password: `ISCDEMO`)

---

## System Overview

### Architecture

```
┌─────────────┐      HTTP      ┌──────────────┐
│   React     │ ────────────> │   FastAPI    │
│  Frontend   │ <──────────── │   Backend    │
└─────────────┘               └──────┬───────┘
                                     │
                              ┌──────▼───────────┐
                              │  InterSystems    │
                              │  IRIS Vector DB  │
                              │  + FHIR Server   │
                              └──────────────────┘
```

### Technology Stack

- **Frontend:** React + Vite (chat interface)
- **Backend:** FastAPI + Python (RAG pipeline)
- **Database:** InterSystems IRIS (vector search + FHIR)
- **Embeddings:** OpenAI text-embedding-3-large (3072D)
- **LLM:** OpenAI GPT-5 (configurable in `backend/config.py`)
- **Language:** Czech (all data, prompts, responses)

### Data Flow

1. User asks question in Czech
2. Backend converts query to 3072D vector embedding
3. IRIS finds top-K similar document chunks (HNSW index, cosine similarity)
4. Context + query sent to OpenAI GPT
5. Response generated in Czech with source citations
6. Frontend displays answer with document references

---

## Project Structure

### `/backend` - FastAPI Application
Core RAG implementation with IRIS vector search integration. See [backend/README.md](backend/README.md) for details.

### `/frontend` - React UI
Chat interface with source attribution and document download. Built with Vite for fast development.

### `/scripts` - Data Ingestion
`ingest_data.py` processes .docx and .xlsx files from `raw_data/`, chunks them, generates embeddings, and stores in IRIS.

### `/raw_data` - Knowledge Base
Hospital documents: organizational structure, internal directives, process documentation, and travel expense rules.

### `/FHIR-AI-Hackathon-Kit` - Database Setup
Docker configuration for InterSystems IRIS with FHIR server. Used for both vector storage and patient lookups.

---

## Configuration

### Environment Variables (`backend/.env`)

```env
OPENAI_API_KEY=your_key_here

# IRIS Database (defaults work with Docker setup)
IRIS_HOST=localhost
IRIS_PORT=32782
IRIS_NAMESPACE=USER
IRIS_USERNAME=_SYSTEM
IRIS_PASSWORD=ISCDEMO
```

### Application Settings (`backend/config.py`)

Change models, RAG parameters, and behavior:
- Embedding model and dimensions
- OpenAI model selection
- Top-K results and relevance thresholds
- FHIR endpoints

---

## Common Tasks

### Add New Documents
1. Place `.docx` or `.xlsx` files in `raw_data/`
2. Run: `python scripts/ingest_data.py`

### Clear Database and Re-ingest
1. Delete existing data: `python scripts/delete_database.py`
2. Re-ingest all documents: `python scripts/ingest_data.py`

**Note:** Deleting the database will remove all ingested document chunks and requires re-ingestion.

### Change Embedding Model
1. Edit `backend/config.py`: Update `embedding_model` and `embedding_dimension`
2. Clear database: `python scripts/delete_database.py`
3. Re-ingest data: `python scripts/ingest_data.py`

### Restart Services
```bash
# Restart IRIS
cd FHIR-AI-Hackathon-Kit/Dockerfhir
docker-compose restart

# Restart Backend
cd backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Restart Frontend
cd frontend
npm run dev
```

---

## Troubleshooting

### Can't Connect to IRIS
**Error:** `Access Denied` or `Failed to connect`

**Solution:**
1. Check `IRIS_PORT=32782` in `backend/.env` (NOT 1972)
2. Check `IRIS_PASSWORD=ISCDEMO` in `backend/.env` (NOT SYS)
3. Verify container is running: `docker ps | grep iris-fhir`
4. Wait 2 minutes after `docker-compose up -d` for full initialization

### No Search Results
- Check that data ingestion completed successfully
- Verify chunk count: `curl http://localhost:8000/health`
- Lower `min_relevance_score` in `backend/config.py`

### Frontend Can't Reach Backend
- Ensure backend is running on port 8000
- Check CORS settings in `backend/app.py`
- Verify Vite proxy in `frontend/vite.config.js`

---

## Documentation

- **[backend/README.md](backend/README.md)** - Backend architecture, API reference, and FHIR integration
- **[FHIR-AI-Hackathon-Kit Tutorial](FHIR-AI-Hackathon-Kit/Tutorial/)** - InterSystems IRIS and FHIR guides
- **[CLAUDE.md](CLAUDE.md)** - Project context for AI assistants

---

## Example Queries

- *"Co mám dělat, když si chci koupit nový mobil?"* (IT purchase procedures)
- *"Jak si zařídit pracovní cestu? Mohu použít moje auto?"* (Travel arrangements)
- *"Jaké procesy má oddělení CI?"* (Department processes)
- *"Kdo je zodpovědný za IT nákupy?"* (Process owners)
