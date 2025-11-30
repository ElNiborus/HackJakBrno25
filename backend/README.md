# FN Brno Virtual Assistant Backend

FastAPI backend implementing a **multi-agent orchestration system** for University Hospital Brno (FN Brno).

## Overview

An intelligent agent-based system that unifies access to hospital information systems for 7,500 employees. The backend orchestrates specialized agents to handle different types of queries based on user intent and role-based permissions.

### Multi-Agent Architecture

The system uses a **router-based architecture** where a central classifier determines which specialized agent should handle each query:

1. **Intent Classification** - Analyzes user query and session context to determine intent
2. **Role Verification** - Checks user permissions before routing to restricted agents
3. **Agent Delegation** - Routes to appropriate specialized agent
4. **Response Generation** - Agent processes request and returns structured response

**Specialized Agents:**
- **Knowledge Search Agent** - RAG with vector similarity search for hospital policies and processes
- **Patient Lookup Agent** - FHIR database queries with function calling (role-restricted)
- **Travel Request Agent** - Business trip submission workflow (employee role required)
- **Travel Expense Agent** - Expense reporting with receipt validation (employee role required)
- **Conversational Agent** - Handles greetings and general chat

**Role-Based Access Control:**
Users are authenticated with different permission levels (e.g., `employee`, `doctor`, `admin`). The router enforces access control before delegating to restricted agents like Patient Lookup.

**Extensibility:**
- **New Agents:** Add specialized agents by creating intent patterns and system prompts
- **New Workflows:** Build multi-step processes with approval chains and external integrations
- **On-Premise Deployment:** Replace OpenAI with vLLM running local models (API-compatible)
- **Custom Roles:** Define new permission levels in user configuration

## Features

- **Intent-Based Routing** with role-aware access control
- **RAG Integration** using InterSystems IRIS vector search and OpenAI embeddings
- **FHIR Patient Lookup** with GPT-5 function calling for natural language queries
- **Multi-turn Conversations** with session-based context management
- **Czech Language Support** across all agents and interactions
- **Document Management** with download and PDF viewing
- **Workflow Orchestration** for complex multi-step processes (e.g., business trip lifecycle)

## Architecture

### Core Components

```
backend/
├── app.py                      # FastAPI application and endpoints
├── config.py                   # Configuration and settings
├── models/
│   └── schemas.py              # Pydantic models for requests/responses
├── conversation/
│   └── session_manager.py      # Multi-user session management
├── rag/
│   ├── router.py              # Intent classification and routing
│   ├── generator.py           # Response generation with OpenAI
│   ├── retriever.py           # Vector similarity search
│   └── prompts.py             # Czech language prompts
├── fhir/                      # FHIR integration (NEW)
│   ├── client.py              # FHIR API client
│   ├── executor.py            # Tool execution handler
│   └── tools.py               # OpenAI function definitions
├── ingestion/
│   └── embedder.py            # OpenAI embedding generation
└── iris_db.py                 # InterSystems IRIS vector database
```

### Technology Stack

- **Backend**: FastAPI with Python 3.11
- **Vector Database**: InterSystems IRIS with HNSW indexing
- **Embeddings**: OpenAI text-embedding-3-large (3072 dimensions)
- **LLM**: GPT-5 with OpenAI API
  - **On-Premise Alternative**: vLLM with local models (API-compatible, for air-gapped environments)
- **FHIR Integration**: Custom FHIR R4 Patient endpoint client
- **Multi-Agent Framework**: Router-based orchestration with role-aware delegation

## FHIR Patient Lookup Integration

### Overview

The system integrates with FHIR R4 Patient endpoints using GPT-5-mini's function calling capabilities to enable natural language patient searches in Czech.

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

## Intent Categories & Agent Routing

The router classifies queries into these categories and routes to corresponding agents:

| Intent Category | Agent | Role Required | Example Query |
|----------------|-------|---------------|---------------|
| `general_rag` | Knowledge Search Agent | Any | "Jaké procesy má oddělení CI?" |
| `conversational` | Conversational Agent | Any | "Ahoj, co umíš?" |
| `trip_request` | Travel Request Agent | `employee` | "Chci podat žádost o cestu do Prahy" |
| `trip_expense` | Travel Expense Agent | `employee` | "Jak vyúčtovat cestu? Mám účtenky" |
| `fhir_patient_lookup` | Patient Lookup Agent | `doctor`, `admin` | "Najdi pacienta jménem Jan Novák" |

**Workflow Example - Business Trip Lifecycle:**
1. **Request Phase:** Employee uses Travel Request Agent → "Chci jet do Prahy 15.12."
   - Agent collects details (destination, dates, purpose)
   - Validates against travel policies
   - Submits request for approval
2. **Trip Execution:** Employee travels and collects receipts
3. **Expense Phase:** Employee uses Travel Expense Agent → "Jak vyúčtovat cestu? Mám účtenky"
   - Agent guides through expense submission
   - Validates receipts against policies
   - Submits for reimbursement processing

## Configuration

### Environment Variables (.env)

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# InterSystems IRIS Database
IRIS_CONNECTION_STRING=iris://username:password@localhost:1972/DEMO
IRIS_NAMESPACE=DEMO

# FHIR Configuration (NEW)
FHIR_BASE_URL=http://localhost:32783
FHIR_PATIENT_ENDPOINT=/csp/healthshare/demo/fhir/r4/Patient
FHIR_TIMEOUT=30
FHIR_MAX_RESULTS=50
```

### Application Settings (config.py)

```python
# Model Configuration
openai_model: str = "gpt-5-mini"
embedding_model: str = "text-embedding-3-large"

# RAG Configuration
top_k_results: int = 5
min_relevance_score: float = 0.6
max_context_length: int = 4000

# FHIR Configuration (NEW)
fhir_base_url: str = "http://localhost:32783"
fhir_patient_endpoint: str = "/csp/healthshare/demo/fhir/r4/Patient"
fhir_timeout: int = 30
fhir_max_results: int = 50
```

## API Endpoints

### POST `/chat`
Main conversational endpoint with session management.

**Request**:
```json
{
  "query": "Najdi pacienta jménem Jan Novák",
  "session_id": "optional_session_id"
}
```

**Response**:
```json
{
  "session_id": "uuid-session-id",
  "message": {
    "role": "assistant",
    "content": "Nalezeno 2 pacientů:\n1. Jan Novák\n   • Datum narození: 15.05.1980...",
    "timestamp": "2025-11-30T10:30:00",
    "sources": []
  },
  "used_rag": false,
  "sources": [],
  "processing_time": 2.34,
  "action_type": null
}
```

### POST `/query`
Legacy single-turn endpoint for RAG queries.

### GET `/chat/history/{session_id}`
Retrieve conversation history for a session.

### GET `/download/{filename}`
Download documents from the knowledge base.

### GET `/view-pdf/{filename}`
View documents as PDF in browser.

### GET `/health`
Health check with database and embedding stats.

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys and database connection
```

### 3. Start FHIR Server (for patient lookup)
Ensure your FHIR R4 Patient endpoint is running on:
```
http://localhost:32783/csp/healthshare/demo/fhir/r4/Patient
```

### 4. Run the Server
```bash
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## Data Sources

The knowledge base supports structured and unstructured files:

- **CSV/Excel**: Organizational structure, process ownership, responsibilities
- **Word Docs (.docx)**: Internal directives, travel policies, clinic rules

**Note**: Only `.docx` format supported. Convert legacy `.doc` files before ingestion.

### Chunking Strategy
- **Chunk size**: 500 characters
- **Overlap**: 100 characters
- **Metadata**: department, process_owner, document_name

## Example Queries

### RAG Knowledge Base
```
"Co mám dělat, když si chci koupit nový mobil?"
"Jak si zařídit pracovní cestu? Mohu použít moje auto?"
"Jaké procesy má oddělení CI?"
```

### FHIR Patient Lookup *(NEW)*
```
"Najdi pacienta jménem Jan Novák"
"Dej mi všechny ženy narozené v roce 2022"
"Hledám pacienty s příjmením Svoboda"
"Muži starší 40 let"
```

### Travel Management
```
"Chci podat žádost o pracovní cestu do Prahy"
"Jak vyúčtovat cestu? Mám účtenky"
```

## API Documentation

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Development Notes

### Multi-User Session Management
The system supports multiple concurrent users with session-based conversation history.

### FHIR Error Handling
- Connection timeouts and retries
- Invalid parameter validation
- Czech error messages for users
- Detailed logging for debugging

### Vector Search Performance
- HNSW indexing for fast similarity search
- Configurable relevance score thresholds
- Batch embedding generation

### Czech Language Processing
- All prompts and responses in Czech
- Date format localization (dd.mm.yyyy)
- Gender mapping (male=muž, female=žena)
- Natural language parameter extraction

## Troubleshooting

### FHIR Integration Issues
1. **Tool Definition Errors**: Ensure tool format matches OpenAI Responses API specification
2. **Date Format Errors**: Check FHIR server supports `ge/le` prefix format for date ranges
3. **No Function Calls**: Verify prompt explicitly instructs model to call search_fhir_patients
4. **Connection Errors**: Confirm FHIR endpoint URL and accessibility

### Common Error Messages
- `"Missing required parameter: 'tools[0].name'"` → Check tool definition format
- `"<ILLEGAL VALUE>ConvertToUTC"` → Date parameter formatting issue
- `"Omlouváme se, při vyhledávání pacientů došlo k chybě"` → General FHIR error

## License

This is a hackathon proof-of-concept for University Hospital Brno (FN Brno).