from pydantic import BaseModel
from typing import List, Optional


class QueryRequest(BaseModel):
    query: str


class SourceReference(BaseModel):
    document_name: str
    chunk_text: str
    relevance_score: float
    metadata: Optional[dict] = None


class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceReference]
    processing_time: float


class DocumentChunk(BaseModel):
    id: Optional[int] = None
    document_name: str
    document_type: str
    chunk_text: str
    chunk_index: int
    metadata: dict
