<<<<<<< HEAD
# HackJakBrno25
Hackathon

https://docs.google.com/document/d/1Vd1ltLGVu0yFTqC8BLcWroGTwIXRB-9xUg9ux2rO8wI/edit?usp=sharing
=======
# FN Brno Virtual Assistant

Virtual assistant for University Hospital Brno (FN Brno) - A RAG-based chatbot to help employees navigate internal processes and organizational structure.

## Project Overview

This project was created as a PoC (Proof of Concept) for a hackathon. The system uses:
- **RAG (Retrieval-Augmented Generation)** for answering employee questions
- **InterSystems IRIS Vector Search** as the vector database
- **OpenAI API** for response generation
- **FastAPI** backend with **React** frontend

## Architecture

```
┌─────────────┐      HTTP      ┌──────────────┐
│   React     │ ────────────> │   FastAPI    │
│  Frontend   │ <──────────── │   Backend    │
└─────────────┘               └──────┬───────┘
                                     │
                              ┌──────▼───────────┐
                              │  InterSystems    │
                              │  IRIS Vector DB  │
                              └──────────────────┘
```

### Components

**Backend (`/backend`):**
- `app.py` - FastAPI application with endpoints
- `iris_db.py` - InterSystems IRIS database connector
- `ingestion/` - Document parsing, chunking, embedding
- `rag/` - Retrieval and generation components
- `models/schemas.py` - Pydantic models

**Frontend (`/frontend`):**
- React application with chat interface
- Vite as build tool
- Axios for API communication

**Scripts (`/scripts`):**
- `ingest_data.py` - Load documents into vector database

## Detailed Codebase Description

### Backend Architecture

#### Core Application (`backend/app.py`)
The FastAPI application serves as the main entry point for the backend. It uses a lifespan context manager to handle:
- **Startup**: Initializes database connection, loads embedding model, and sets up RAG components
- **Shutdown**: Gracefully disconnects from IRIS database

**Key Endpoints:**
- `GET /` - Simple status check returning API name and version
- `GET /health` - Detailed health check including database connection status and chunk count
- `POST /query` - Main RAG endpoint that processes user queries
- `GET /stats` - Returns database statistics (total chunks, documents)

**CORS Configuration:**
Configured to allow requests from `localhost:3000` (frontend) with credentials support.

#### Database Layer (`backend/iris_db.py`)
The `IRISVectorDB` class handles all interactions with InterSystems IRIS:

**Connection Management:**
- Uses `intersystems-irispython` package (not `intersystems-iris`)
- Connects to IRIS using credentials from environment variables
- Maintains persistent connection with cursor for executing SQL

**Table Structure:**
Creates `FNBrno.DocumentChunks` table with:
- `ID` - Auto-incrementing primary key
- `DocumentName` - Source document filename
- `DocumentType` - File extension (docx, xlsx)
- `ChunkText` - Text content of the chunk
- `ChunkIndex` - Position in original document
- `Department` - Extracted from metadata
- `ProcessOwner` - Responsible person/department
- `ChunkVector` - 384-dimensional vector embedding (VECTOR(DOUBLE, 384))

**Vector Search:**
- Uses HNSW (Hierarchical Navigable Small World) index for efficient similarity search
- Cosine distance metric for finding relevant chunks
- Critical SQL syntax: `TO_VECTOR(?, double)` (lowercase 'double', no quotes, no dimension)
- Returns top K results with relevance scores

**Methods:**
- `connect()` / `disconnect()` - Lifecycle management
- `create_vector_table()` - Initialize database schema
- `create_vector_index()` - Create HNSW index (drops existing first)
- `insert_chunks()` - Batch insert document chunks with embeddings
- `vector_search()` - Similarity search using query vector
- `get_chunk_count()` - Statistics
- `clear_all_data()` - Delete all records (use with caution)

#### Configuration (`backend/config.py`)
Uses Pydantic Settings for type-safe configuration management:
- Loads from `.env` file automatically
- Validates types and required fields
- Provides default values where appropriate
- Environment variables override file settings

**Configuration Groups:**
- **IRIS Database**: Connection parameters (host, port, namespace, credentials)
- **Embedding Model**: Model name and dimension (configurable in `backend/config.py`)
- **OpenAI**: API key and model selection (configurable in `backend/config.py`)
- **RAG Parameters**: Top K results, minimum relevance score (configurable in `backend/config.py`)

#### Data Ingestion Pipeline

**Document Parsers (`backend/ingestion/parsers.py`):**

- `DocxParser`:
  - Uses `python-docx` library
  - Extracts all paragraphs from Word documents
  - Handles encoding issues gracefully
  - Parses metadata from filename patterns (e.g., "Department_Process_Owner.docx")

- `XLSXParser`:
  - Uses `pandas` and `openpyxl`
  - Reads all sheets in Excel workbooks
  - Converts each row to text representation
  - Extracts department/owner from filename
  - Handles numeric and text cells appropriately

**Text Chunker (`backend/ingestion/chunker.py`):**

- `TextChunker`:
  - Splits long documents into manageable chunks
  - Default: 500 characters per chunk
  - Overlap: 100 characters (ensures context continuity)
  - Preserves document metadata for each chunk

- Special handling for structured data:
  - XLSX files chunked row-by-row (each row is one chunk)
  - DOCX files chunked by character count with overlap

**Embedding Generator (`backend/ingestion/embedder.py`):**

- `EmbeddingGenerator`:
  - Uses OpenAI Embeddings API
  - Model and dimensions configurable in `backend/config.py`
  - Supports multilingual embeddings including Czech
  - Batch processing for efficiency
  - Progress bars for user feedback (tqdm)

**Model Selection:**
The embedding model can be changed in `backend/config.py`. Current implementation uses OpenAI's embedding models for:
- High-quality multilingual support (critical for Czech documents)
- Excellent semantic understanding
- Strong performance on retrieval tasks

#### RAG Components

**Retriever (`backend/rag/retriever.py`):**

The `VectorRetriever` class handles the retrieval phase:

1. **Query Embedding**: Converts user query to vector using same model as documents
2. **Vector Search**: Queries IRIS database for top K similar chunks
3. **Context Formatting**: Formats results for LLM consumption

**Output Format:**
```
Nalezené relevantní informace:

[Zdroj: document.docx (Skóre: 0.85)]
Oddělení: IT Department
Zodpovědná osoba: Jan Novák
Obsah: [chunk text]

[Additional sources...]
```

**Generator (`backend/rag/generator.py`):**

The `ResponseGenerator` class handles the generation phase:

1. **System Prompt**: Instructs the model to act as FN Brno assistant
2. **Context Injection**: Provides retrieved chunks as context
3. **Response Generation**: Calls OpenAI API
4. **Czech Language**: All prompts and responses in Czech

**System Prompt (translated):**
> "You are a virtual assistant for University Hospital Brno (FN Brno). Your task is to help employees navigate internal processes and organizational structure. Answer in Czech language based ONLY on the provided context. If information is not in the context, say you don't know."

#### Data Models (`backend/models/schemas.py`)

Pydantic models ensure type safety and validation:

- `QueryRequest`: Validates incoming user queries
- `ChunkSource`: Represents a retrieved document chunk
- `QueryResponse`: Formats API responses with answer, sources, and timing
- `HealthResponse`: Health check data structure
- `StatsResponse`: Database statistics format

### Frontend Architecture

#### Main Application (`frontend/src/App.jsx`)
- React 18 functional component
- Renders `ChatInterface` component
- Minimal styling wrapper

#### Chat Interface (`frontend/src/components/ChatInterface.jsx`)

**State Management:**
- `messages` - Array of chat messages (user + assistant)
- `inputValue` - Current input field value
- `isLoading` - Loading state during API calls
- `stats` - Database statistics (chunk count)

**Key Features:**
- Auto-scroll to latest message
- Loading indicators
- Error handling with user-friendly messages
- Example queries for quick testing
- Source citation display with metadata

**API Integration:**
- Uses Axios for HTTP requests
- Proxied through Vite dev server (`/api` → `http://localhost:8000`)
- Handles CORS automatically
- Error retry suggestions

**Message Types:**
- User messages: Right-aligned, blue background
- Assistant messages: Left-aligned, gray background
- System messages: Centered, red for errors

**Source Display:**
Each retrieved chunk shows:
- Document name
- Relevance score (0.0 - 1.0)
- Department
- Process owner
- Expandable text preview

#### Styling

- **App.css**: Global styles, centering, fonts
- **ChatInterface.css**: Component-specific styles
  - Message bubbles
  - Input field
  - Button states
  - Loading animations
  - Source cards
  - Responsive design

- **index.css**: Base reset and typography

#### Build Configuration (`frontend/vite.config.js`)

- Dev server on port 3000
- Proxy configuration: `/api/*` → `http://localhost:8000/*`
- React plugin for JSX support
- Fast refresh for development

### Scripts

#### Data Ingestion (`scripts/ingest_data.py`)

Orchestrates the complete ingestion pipeline:

**Process Flow:**
1. **Connect to IRIS**: Establish database connection
2. **Initialize Schema**: Create table and index (if not exists)
3. **Scan Documents**: Find all .docx and .xlsx files in `raw_data/`
4. **Parse Documents**: Extract text and metadata
5. **Chunk Text**: Split into 500-char chunks with 100-char overlap
6. **Generate Embeddings**: Create 384D vectors for each chunk
7. **Store in Database**: Batch insert with TO_VECTOR conversion
8. **Create Index**: Build HNSW index for fast search
9. **Report Statistics**: Print total chunks and processing time

**Error Handling:**
- Continues on individual document failures
- Reports failed files
- Validates embeddings before insertion
- Commits in batches for efficiency

**Performance:**
- Batch embedding generation (all chunks at once)
- Batch database insertion (executemany)
- Progress bars for visibility
- Typical time: ~30 seconds for 1000 chunks

### Data Flow

**Query Processing Pipeline:**

```
User Input (Czech)
    ↓
Frontend (React)
    ↓ HTTP POST /query
Backend (FastAPI)
    ↓
EmbeddingGenerator
    ↓ [384D vector]
VectorRetriever
    ↓ VECTOR_COSINE similarity
IRIS Database (HNSW index)
    ↓ Top 5 chunks
ResponseGenerator
    ↓ Context + Prompt
OpenAI API
    ↓ Czech answer
Backend (JSON response)
    ↓
Frontend (Display)
    ↓
User sees answer + sources
```

### Key Technical Decisions

**Why InterSystems IRIS?**
- Hackathon requirement
- Native vector search support
- HNSW indexing for performance
- SQL interface (familiar to developers)
- Handles high-dimensional vectors efficiently

**Why OpenAI Embeddings?**
- Best-in-class multilingual support including Czech
- High-dimensional vectors for rich semantic representation
- Superior performance on RAG tasks
- Model selection configurable in `backend/config.py`

**Why OpenAI?**
- High-quality language models with strong reasoning capabilities
- Cost-effective and fast response times
- High quality for retrieval-based QA
- Excellent Czech language support

**Why FastAPI?**
- Async support (important for LLM calls)
- Automatic OpenAPI documentation
- Type validation with Pydantic
- Modern Python features
- Great developer experience

**Why React + Vite?**
- Fast development cycle
- Hot module replacement
- Simple component model
- Easy to extend later

### Database Schema Details

**Vector Storage:**
```sql
ChunkVector VECTOR(DOUBLE, {embedding_dimension})
```
- DOUBLE precision (not FLOAT) for accuracy
- Dimensions match the embedding model configured in `backend/config.py`
- Stored efficiently in IRIS native format

**Index Strategy:**
```sql
CREATE INDEX HNSWIndex ON FNBrno.DocumentChunks (ChunkVector)
AS HNSW(Distance='Cosine')
```
- HNSW algorithm: O(log N) search complexity
- Cosine distance: Measures angle between vectors
- Trades slight accuracy for massive speed gains
- Essential for real-time search on large datasets

### Error Handling

**Database Errors:**
- Connection failures → Logged and raised
- SQL errors → Logged with full details
- Index creation → Drops existing if needed

**API Errors:**
- OpenAI rate limits → Propagated to user
- Invalid queries → Validated by Pydantic
- No results → User-friendly message

**Frontend Errors:**
- Network errors → Retry suggestion
- Empty responses → Handled gracefully
- Loading states → Prevent double-submission

### Performance Considerations

**Embedding Generation:**
- Batch processing: ~100 chunks/second
- Uses MPS (Metal Performance Shaders) on Mac
- CUDA on Nvidia GPUs
- CPU fallback available

**Vector Search:**
- HNSW index: Sub-millisecond search on 100K vectors
- Cosine similarity: Optimized by IRIS
- Top K retrieval: Very efficient

**LLM Calls:**
- Dominant latency factor (1-5 seconds)
- Consider caching for repeat queries
- Streaming responses (future improvement)

**Memory Usage:**
- Embedding model: ~100MB RAM
- Vector index: ~1.5KB per chunk
- Minimal frontend footprint

### Security Considerations

**Current Implementation (PoC):**
- ⚠️ No authentication
- ⚠️ No rate limiting
- ⚠️ OpenAI key in backend only (good)
- ⚠️ CORS open to localhost only (acceptable for dev)

**Production Requirements:**
- Add user authentication (JWT/OAuth)
- Implement rate limiting
- Encrypt database credentials
- Use secrets manager for API keys
- Enable HTTPS
- Add input sanitization
- Implement audit logging

### Testing Strategy

**Manual Testing:**
- Health endpoint verification
- Example query testing
- Source citation accuracy
- Czech language quality

**Future Automated Testing:**
- Unit tests for parsers
- Integration tests for RAG pipeline
- End-to-end tests for API
- Embedding similarity tests
- Response quality evaluation

## Requirements

### Software
- Python 3.9+
- Node.js 18+ (for frontend)
- InterSystems IRIS Community Edition (or full version)
- OpenAI API key

### Python Packages
See `backend/requirements.txt`

## Installation and Setup

### 1. InterSystems IRIS Setup

**Option A: Docker (Recommended)**
```bash
docker run -d \
  --name iris-community \
  -p 1972:1972 \
  -p 52773:52773 \
  -e IRIS_PASSWORD=SYS \
  -e IRIS_USERNAME=_SYSTEM \
  intersystemsdc/iris-community:latest
```

**Option B: Manual Installation**
- Download InterSystems IRIS Community Edition from [official website](https://www.intersystems.com/try-intersystems-iris-for-free/)
- Install and run

### 2. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env file with your credentials:
# REQUIRED:
# - OPENAI_API_KEY=your-key-here
#
# IRIS Database (use defaults for local Docker setup):
# - IRIS_HOST=localhost
# - IRIS_PORT=1972
# - IRIS_NAMESPACE=USER
# - IRIS_USERNAME=_SYSTEM
# - IRIS_PASSWORD=SYS
#
# Note: Model configuration is in backend/config.py, not in .env
```

### 3. Ingest Data into Database

```bash
# From project root directory, with backend venv activated
source backend/venv/bin/activate  # Linux/Mac
# or
backend\venv\Scripts\activate  # Windows

python scripts/ingest_data.py
```

This script:
1. Connects to IRIS database
2. Creates table for vector embeddings
3. Loads all `.docx` and `.xlsx` files from `raw_data/`
4. Splits documents into chunks
5. Generates embeddings using OpenAI API (configured in `backend/config.py`)
6. Stores in IRIS database
7. Creates HNSW index for fast search

### 4. Start Backend API

```bash
cd backend
source venv/bin/activate  # Linux/Mac (if not already activated)
# or
venv\Scripts\activate  # Windows

uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

API runs at `http://localhost:8000`

**Test endpoints:**
- `http://localhost:8000/` - Status check
- `http://localhost:8000/health` - Health check + database stats
- `http://localhost:8000/docs` - OpenAPI documentation

### 5. Start Frontend

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:3000` (or `http://localhost:3001` if port 3000 is in use)

## Usage

1. Open browser at the URL shown by Vite (typically `http://localhost:3000`)
2. Enter a question in Czech into the chat window
3. The system:
   - Converts question to embedding
   - Finds relevant documents in IRIS database
   - Provides context to OpenAI API
   - Generates answer in Czech
   - Displays information sources

### Example Questions

- "Co mám dělat, když si chci koupit nový mobil?" (What should I do when I want to buy a new phone?)
- "Jak si zařídit pracovní cestu? Mohu použít moje auto?" (How do I arrange a business trip? Can I use my car?)
- "Kdo je zodpovědný za IT nákupy?" (Who is responsible for IT purchases?)
- "Jaké jsou pravidla pro cestovní náhrady?" (What are the rules for travel expenses?)

## Configuration

### Backend (`backend/.env`)

```env
# Secrets
OPENAI_API_KEY=sk-...

# IRIS Database (environment-specific)
IRIS_HOST=localhost
IRIS_PORT=1972
IRIS_NAMESPACE=USER
IRIS_USERNAME=_SYSTEM
IRIS_PASSWORD=SYS
```

**Note:** Application configuration (model selection, RAG parameters, etc.) should be changed in `backend/config.py`, not in `.env`.

### Frontend

To change API URL in production, create `frontend/.env`:
```env
VITE_API_URL=http://your-backend-url:8000
```

## Data Sources

The system processes two types of documents:

**1. DOCX files** (`raw_data/doc1/`, `raw_data/doc2/`)
- Internal directives
- Organizational rules
- Process documentation

**2. XLSX files** (`raw_data/xlsx/`)
- Organizational structure
- Process lists
- Process owners

## Vector Database (InterSystems IRIS)

### Table Structure

```sql
CREATE TABLE FNBrno.DocumentChunks (
    ID INTEGER PRIMARY KEY AUTO_INCREMENT,
    DocumentName VARCHAR(500),
    DocumentType VARCHAR(50),
    ChunkText LONGVARCHAR,
    ChunkIndex INTEGER,
    Department VARCHAR(200),
    ProcessOwner VARCHAR(200),
    ChunkVector VECTOR(DOUBLE, 384)
)
```

### HNSW Index

For fast searching we use HNSW (Hierarchical Navigable Small World) index:
```sql
CREATE INDEX HNSWIndex ON FNBrno.DocumentChunks (ChunkVector)
AS HNSW(Distance='Cosine')
```

## API Endpoints

### POST `/query`
Process user query

**Request:**
```json
{
  "query": "Jak si zařídit pracovní cestu?"
}
```

**Response:**
```json
{
  "answer": "Pro zařízení pracovní cesty...",
  "sources": [
    {
      "document_name": "Pracovní cesty.doc",
      "chunk_text": "...",
      "relevance_score": 0.85,
      "metadata": {
        "department": "OHTS",
        "process_owner": "Jan Novák"
      }
    }
  ],
  "processing_time": 1.23
}
```

### GET `/health`
Health check + database statistics

### GET `/stats`
Overall system statistics

## Troubleshooting

### IRIS Connection Failed
```
Error: Failed to connect to IRIS
```
**Solution:**
- Verify that IRIS is running (`docker ps` or check Management Portal)
- Check credentials in `.env`
- Check port (default 1972)

### No Documents Found
```
Warning: No documents found!
```
**Solution:**
- Verify that `raw_data/` contains documents
- Check that files are `.docx` or `.xlsx`

### OpenAI API Error
```
Error: Invalid API key
```
**Solution:**
- Check `OPENAI_API_KEY` in `.env`
- Verify credit on OpenAI account

### Frontend Can't Connect to Backend
**Solution:**
- Check that backend is running on port 8000
- Check CORS settings in `backend/app.py`
- Check `VITE_API_URL` in frontend `.env`

## Production Deployment

### Backend
```bash
# Use production WSGI server
gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend
```bash
npm run build
# Serve dist/ folder via nginx or other web server
```

### Docker Compose (TODO)
For easy deployment of the entire stack including IRIS.

## Future Improvements

- [ ] Multi-turn conversation with history
- [ ] Support for multiple languages
- [ ] Fine-tuning embeddings on medical domain
- [ ] User authentication
- [ ] Feedback system for improving answers
- [ ] Analytics dashboard
- [ ] Integration with FN Brno internal systems

## License

This project was created for a hackathon as a PoC.

## Contact

For questions or issues, create an issue in this repository.
>>>>>>> 27a220d (Add FN Brno Virtual Assistant PoC - RAG chatbot with IRIS Vector Search)
