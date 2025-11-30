# Backend Documentation

FastAPI backend implementing multi-agent orchestration with role-based access control. See [main README](../README.md) for architecture overview and quick start.

This document covers backend-specific implementation details, API endpoints, and development guidelines.

## Project Structure

```
backend/
├── app.py                      # FastAPI application and endpoints
├── config.py                   # Configuration and settings
├── iris_db.py                  # InterSystems IRIS vector database connector
├── models/
│   └── schemas.py              # Pydantic models for API requests/responses
├── conversation/
│   └── session_manager.py      # Multi-user session management
├── rag/
│   ├── router.py               # Intent classification and agent routing
│   ├── generator.py            # Response generation with LLM
│   ├── retriever.py            # Vector similarity search
│   └── prompts.py              # Czech language system prompts
├── fhir/
│   ├── client.py               # FHIR R4 API client
│   ├── executor.py             # Function call execution handler
│   └── tools.py                # OpenAI function definitions for patient search
└── ingestion/
    ├── parsers.py              # Document parsers (DOCX, XLSX)
    ├── chunker.py              # Text chunking with overlap
    └── embedder.py             # Embedding generation
```

## FHIR Patient Lookup Integration

The Patient Lookup Agent uses OpenAI function calling to translate Czech natural language queries into FHIR R4 API requests.

### Supported Queries

The system recognizes Czech patient lookup patterns:

```
- "Najdi pacienta jménem Jan Novák"
- "Hledám informace o pacientce Marii Svobodové"
- "Dej mi informace o všech ženách narozených před rokem 2000"
- "Vyhledej pacienty s příjmením Dvořák"
- "Pacienti narozené v roce 1985"
- "Muži starší 40 let"
```

### FHIR Search Parameters

The system extracts and maps Czech queries to FHIR R4 parameters:

| Czech Term | FHIR Parameter | Description |
|------------|----------------|-------------|
| jméno/příjmení | `name`, `family`, `given` | Patient name search |
| datum narození | `birthdate` | Birth date with range support |
| pohlaví (muž/žena) | `gender` | male/female/other/unknown |
| identifikátor | `identifier` | Patient ID/MRN |

### Date Range Handling

The system supports flexible date formats:

- **Year ranges**: "2022 do 2025" → `ge2022-01-01&le2025-12-31`
- **Before/after**: "před rokem 2000" → `le2000-01-01`
- **Specific years**: "v roce 1985" → `ge1985-01-01&le1985-12-31`
- **Exact dates**: "1980-05-15" → `eq1980-05-15`

### Implementation Details

#### 1. Intent Classification
```python
# rag/router.py
category = rag_router.classify_intent(query, history)
if category == IntentCategory.FHIR_PATIENT_LOOKUP:
    # Route to FHIR tool calling
```

#### 2. Function Calling Setup
```python
# fhir/tools.py
FHIR_PATIENT_SEARCH_TOOL = {
    "type": "function",
    "name": "search_fhir_patients",
    "description": "Search for patients in FHIR database...",
    "parameters": {
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Patient name..."},
            "birthdate": {"type": "string", "description": "Birth date..."},
            "gender": {"type": "string", "enum": ["male", "female", "other", "unknown"]},
            # ... other parameters
        }
    }
}
```

#### 3. Tool Execution
```python
# rag/generator.py
response = self.client.responses.create(
    model="gpt-5-mini",
    instructions=system_prompt,
    input=input_list,
    tools=get_fhir_tools(),
    max_output_tokens=1000
)

# Process function calls
for item in response.output:
    if item.type == "function_call" and item.name == "search_fhir_patients":
        patients = fhir_client.search_patients(json.loads(item.arguments))
        # Return results to model for Czech response generation
```

#### 4. Czech Response Formatting
```python
# fhir/client.py
def format_patients_for_czech_response(self, patients):
    if not patients:
        return "Nebyli nalezeni žádní pacienti odpovídající zadaným kritériím."

    result_lines = [f"Nalezeno {len(patients)} pacientů:"]
    for i, patient in enumerate(patients, 1):
        result_lines.append(f"{i}. {patient['name']}")
        if patient['birthdate']:
            result_lines.append(f"   • Datum narození: {formatted_date}")
        # ... format other fields
```

## Intent Classification & Routing

The router (`rag/router.py`) classifies queries into categories and enforces role-based access:

| Intent Category | Agent | Role Required | Implementation |
|----------------|-------|---------------|----------------|
| `general_rag` | Knowledge Search Agent | Any | Vector search + RAG |
| `conversational` | Conversational Agent | Any | Direct LLM response |
| `trip_request` | Travel Request Agent | `employee` | Multi-step workflow |
| `trip_expense` | Travel Expense Agent | `employee` | Receipt validation |
| `fhir_patient_lookup` | Patient Lookup Agent | `doctor`, `admin` | Function calling |

## Configuration

See main README for basic configuration. Additional backend-specific settings:

### config.py Settings

```python
# Model Configuration
openai_model: str = "gpt-5"
router_model: str = "gpt-5"
router_reasoning_effort: str = "minimal"

# RAG Configuration
top_k_results: int = 10
min_relevance_score: float = 0.0
max_history_messages: int = 10

# FHIR Configuration
fhir_timeout: int = 30
fhir_max_results: int = 50
```

### User Roles (user_info.json)

Configure role-based access in `backend/user_info.json`:

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

## API Endpoints

### POST `/chat`
Main endpoint with session management and multi-agent routing.

**Request:**
```json
{
  "query": "Najdi pacienta jménem Jan Novák",
  "session_id": "optional_session_id",
  "user_id": "doctor123"
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "message": {
    "role": "assistant",
    "content": "Nalezeno 2 pacientů...",
    "sources": [...]
  },
  "processing_time": 1.23
}
```

### Other Endpoints

- `GET /health` - Health check with database stats
- `GET /chat/history/{session_id}` - Retrieve conversation history
- `GET /download/{filename}` - Download source documents
- `GET /view-pdf/{filename}` - View documents as PDF
- `POST /query` - Legacy single-turn RAG endpoint

## Development

See main README for setup instructions. This section covers backend development specifics.

### Adding New Agents

1. **Define Intent Pattern** in `rag/router.py`:
   ```python
   if "new_pattern" in query.lower():
       return IntentCategory.NEW_AGENT
   ```

2. **Create Agent Handler** in `rag/generator.py`:
   ```python
   def handle_new_agent(self, query, context):
       system_prompt = "You are a specialized agent for..."
       # Agent logic
       return response
   ```

3. **Add Role Check** in router if needed:
   ```python
   if category == IntentCategory.NEW_AGENT:
       if user_role not in ["authorized_role"]:
           return "Access denied"
   ```

### Data Ingestion

Supported formats: `.docx`, `.xlsx`

**Chunking Strategy:**
- Chunk size: 700 characters
- Overlap: 100 characters
- Metadata: department, process_owner, document_name

Run ingestion: `python scripts/ingest_data.py`

### API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Implementation Notes

### Session Management
- Multi-user sessions with conversation history
- Session IDs track context across messages
- Configurable history length (`max_history_messages`)

### Czech Language Processing
- All system prompts in Czech
- Date format: dd.mm.yyyy
- Gender mapping: male=muž, female=žena
- Natural language parameter extraction for FHIR

### Vector Search
- HNSW indexing for sub-millisecond search
- Configurable `top_k_results` and `min_relevance_score`
- Batch embedding generation for efficiency

### Error Handling
- FHIR connection timeouts with retries
- Czech error messages for users
- Detailed logging for debugging
- Graceful degradation when agents fail