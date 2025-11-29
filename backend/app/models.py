from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    """Request model for user queries."""
    query: str = Field(..., description="The user's query or question", min_length=1)


class QueryResponse(BaseModel):
    """Response model for query results."""
    response: str = Field(..., description="The generated response")
    query_type: str = Field(..., description="The type of query: 'chat' or 'rag'")
    used_rag_context: bool = Field(..., description="Whether RAG context was used")
