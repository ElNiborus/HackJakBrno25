# AI Query API Backend

FastAPI backend for handling chat and RAG (Retrieval-Augmented Generation) queries with conversation history.

## Features

- **Query Classification**: Automatically classifies queries as either regular chat or RAG questions using OpenAI
- **RAG Integration**: Abstract RAG retriever interface for knowledge base queries
- **Conversation History**: Maintains conversation context for a single user across multiple interactions
- **OpenAI Integration**: Uses OpenAI's LLM for generating responses

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application and endpoints
│   ├── config.py            # Configuration and settings
│   ├── models.py            # Pydantic models for requests/responses
│   ├── classifier.py        # Query classification logic
│   ├── conversation.py      # Conversation history management
│   ├── rag.py              # RAG retriever interface (abstract)
│   └── llm_service.py      # LLM service for generating responses
├── requirements.txt
├── .env.example
└── README.md
```

## Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Run the server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   
   The API will be available at `http://localhost:8000`

## API Endpoints

### POST `/query`
Main endpoint for submitting user queries.

**Request Body**:
```json
{
  "query": "What is the capital of France?"
}
```

**Response**:
```json
{
  "response": "The capital of France is Paris.",
  "query_type": "chat",
  "used_rag_context": false
}
```

### POST `/clear-history`
Clear the conversation history.

**Response**:
```json
{
  "status": "ok",
  "message": "Conversation history cleared"
}
```

### GET `/history`
Get the full conversation history with timestamps.

**Response**:
```json
{
  "history": [
    {
      "role": "user",
      "content": "Hello",
      "timestamp": "2025-11-28T10:30:00.000000"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help you?",
      "timestamp": "2025-11-28T10:30:01.000000"
    }
  ]
}
```

### GET `/`
Health check endpoint.

## RAG Implementation

The RAG retriever is defined as an abstract interface in `app/rag.py`. To implement your own RAG system:

1. Create a class that inherits from `RAGRetriever`
2. Implement the `retrieve_context` method
3. Replace the `MockRAGRetriever` instance in `app/rag.py`

Example:
```python
class MyRAGRetriever(RAGRetriever):
    async def retrieve_context(self, query: str, top_k: int = 5):
        # Your RAG implementation here
        # - Embed the query
        # - Search vector database
        # - Return relevant documents
        pass
```

## How It Works

1. **User submits a query** via POST `/query`
2. **Query Classification**: OpenAI classifies whether it's a regular chat or RAG question
3. **Context Retrieval** (if RAG): The system retrieves relevant context from the knowledge base
4. **Response Generation**: OpenAI generates a response using:
   - The user's query
   - Conversation history
   - RAG context (if applicable)
5. **History Update**: The conversation is stored for future context
6. **Response returned** to the user

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Development

To modify the LLM model or other settings, edit `app/config.py` or set environment variables:

```python
OPENAI_MODEL=gpt-4-turbo-preview  # Default model
```

## Notes

- The system maintains conversation history for a single user (global instance)
- For multi-user support, you'd need to implement user session management
- The RAG retriever is currently a mock implementation - replace with your actual RAG system
- Adjust the `max_messages` parameter in conversation history for context window management
