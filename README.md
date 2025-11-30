# FN Brno Virtual Assistant

![FN Brno Virtual Assistant](assets/cover_photo.png)

A RAG-based virtual assistant for University Hospital Brno (FN Brno) to help 7,500 employees navigate complex internal structures, processes, and administrative tasks.

**Created for Hack jak Brno 2025 hackathon.**

## What It Does

An intelligent, **multi-agent system** that serves as a unified interface for hospital employees to navigate complex administrative tasks:

- **Knowledge Agent** - Answers questions using hospital documentation (RAG with vector search)
- **Patient Lookup Agent** - Searches FHIR database for patient information
- **Business Trip Agent** - Handles travel request submissions and expense reporting
- **Router/Classifier** - Orchestrates agents based on user intent and role-based permissions

**Role-Based Access:** Different employees see different capabilities based on their permissions (e.g., only authorized staff can access patient data, only employees can submit trip requests).

---

## System Overview

### Architecture

![System Architecture](assets/Diagram.png)

### Agentic Architecture

The system uses a **router-based multi-agent architecture**:

1. **User Query** → Application interface (role-aware)
2. **Intent Classifier** → Analyzes query and user role to determine which agent to invoke
3. **Agent Routing** → Delegates to specialized agents:
   - **Knowledge Search Agent** - Retrieves from vector DB (hospital policies, processes)
   - **Patient Data Agent** - Queries FHIR database for patient records
   - **Travel Request Agent** - Handles future business trip submissions
   - **Travel Expense Agent** - Processes expense reports for past trips
4. **Response Generation** → Agent returns structured Czech response with sources
5. **User Interface** → Displays answer with citations and suggested actions

### Extensibility

- **Add New Agents:** Create new specialized agents by defining intent patterns and system prompts
- **Add New Workflows:** Extend existing agents with multi-step workflows (approval chains, integrations)
- **On-Premise Deployment:** Replace OpenAI API with vLLM running local models for air-gapped environments
- **Role Management:** Easily configure new roles and permissions in user configuration

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

## Additional Documentation

- **[backend/README.md](backend/README.md)** - Backend structure, configuration, and development guide
- **[frontend/README.md](frontend/README.md)** - Frontend development and deployment
- **[FHIR-AI-Hackathon-Kit Tutorial](FHIR-AI-Hackathon-Kit/Tutorial/)** - InterSystems IRIS and FHIR guides
- **[CLAUDE.md](CLAUDE.md)** - Project context for AI assistants
