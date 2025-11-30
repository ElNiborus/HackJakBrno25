# Backend Documentation

FastAPI backend implementing multi-agent orchestration with role-based access control for the FN Brno Virtual Assistant (**Hack jak Brno 2025**).

See [main README](../README.md) for architecture overview and setup.

---

## Project Structure

```
backend/
├── app.py                      # Main FastAPI application with endpoints
├── config.py                   # Configuration management (models, RAG params, database)
├── iris_db.py                  # InterSystems IRIS database connector
├── models/
│   └── schemas.py              # API request/response models
├── conversation/
│   └── session_manager.py      # Multi-user session tracking
├── rag/
│   ├── router.py               # Intent classification and agent routing
│   ├── generator.py            # LLM response generation
│   ├── retriever.py            # Vector similarity search
│   └── prompts.py              # Czech system prompts for each agent
├── fhir/
│   ├── client.py               # FHIR R4 API client
│   ├── executor.py             # Function call handler
│   └── tools.py                # OpenAI function definitions
└── ingestion/
    ├── parsers.py              # Document parsers (DOCX, XLSX)
    ├── chunker.py              # Text chunking with overlap
    └── embedder.py             # Embedding generation
```

---

## Configuration

### Environment Variables (`backend/.env`)

```env
# Required
OPENAI_API_KEY=your_key_here

# IRIS Database (defaults work with Docker setup)
IRIS_HOST=localhost
IRIS_PORT=32782
IRIS_NAMESPACE=USER
IRIS_USERNAME=_SYSTEM
IRIS_PASSWORD=ISCDEMO
```

### Application Settings (`backend/config.py`)

Configure models and behavior:

```python
# Model Configuration
openai_model: str = "gpt-5"              # Main LLM
embedding_model: str = "text-embedding-3-large"
embedding_dimension: int = 3072

# Router Configuration
router_model: str = "gpt-5"              # Intent classifier
router_reasoning_effort: str = "minimal"

# RAG Configuration
top_k_results: int = 10                   # Number of chunks to retrieve
min_relevance_score: float = 0.0          # Minimum similarity threshold
max_history_messages: int = 10            # Conversation context length

# FHIR Configuration
fhir_base_url: str = "http://localhost:32783"
fhir_timeout: int = 30
fhir_max_results: int = 50
```

**For on-premise deployment:** Replace OpenAI endpoints with vLLM server URL (API-compatible).

### User Roles (`backend/user_info.json`)

Define users and their permissions:

```json
{
  "users": {
    "doctor123": {
      "role": "doctor",
      "name": "Dr. Novák",
      "permissions": ["fhir_patient_lookup", "general_rag"]
    },
    "employee456": {
      "role": "employee",
      "name": "Jan Dvořák",
      "permissions": ["trip_request", "trip_expense", "general_rag"]
    }
  }
}
```

---

## Key Components

### Intent Router (`rag/router.py`)
- Classifies user queries into categories
- Enforces role-based access control
- Routes to appropriate specialized agent

### Specialized Agents (`rag/generator.py`)
Each agent has a unique system prompt in `rag/prompts.py`:
- **Knowledge Search Agent** - RAG with vector search
- **Patient Lookup Agent** - FHIR queries with function calling
- **Travel Request Agent** - Multi-step trip submission
- **Travel Expense Agent** - Receipt validation and reporting
- **Conversational Agent** - Greetings and general chat

### Vector Database (`iris_db.py`)
- Connects to InterSystems IRIS
- Manages document chunks and embeddings
- Performs HNSW-indexed similarity search

### FHIR Integration (`fhir/`)
- Translates Czech queries to FHIR R4 parameters
- Uses OpenAI function calling
- Formats results in Czech

### Session Management (`conversation/session_manager.py`)
- Tracks conversation history per user session
- Maintains context across multiple queries
- Configurable history length

---

## Development

### Adding New Agents

1. **Define intent** in `rag/router.py`
2. **Create system prompt** in `rag/prompts.py`
3. **Add handler** in `rag/generator.py`
4. **Configure permissions** in `user_info.json` (if restricted)

### Data Ingestion

Place documents in `raw_data/` and run:
```bash
python scripts/ingest_data.py
```

**Supported formats:** `.docx`, `.xlsx`
**Chunking:** 700 characters with 100 character overlap
**Metadata:** Extracted from filename patterns (department, process owner)

### Running the Backend

```bash
cd backend
source venv/bin/activate
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

**API Documentation:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Implementation Details

### Multi-Language Support
- All system prompts in Czech
- Date formatting: dd.mm.yyyy
- Gender mapping: male=muž, female=žena

### Vector Search
- HNSW indexing for fast similarity search
- Cosine distance metric
- Configurable top-K and relevance thresholds

### Error Handling
- Graceful agent failures with fallback responses
- Czech error messages for users
- Detailed logging for debugging
- FHIR connection retries

### Session State
- Session IDs track multi-turn conversations
- History maintained in memory (can be extended to Redis/DB)
- Automatic cleanup of old sessions

---

## On-Premise Deployment

To run without external API dependencies:

1. **Deploy vLLM server** with compatible model
2. **Update `config.py`:**
   ```python
   openai_base_url: str = "http://your-vllm-server:8000/v1"
   ```
3. **Use local embedding model** (optional):
   - Replace OpenAI embeddings with local model
   - Update `ingestion/embedder.py`

The system maintains API compatibility with OpenAI, so minimal code changes are needed.
