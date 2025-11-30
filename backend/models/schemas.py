from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime
from enum import Enum


# Intent classification and action types
class IntentCategory(str, Enum):
    """User intent classification categories"""
    GENERAL_RAG = "general_rag"
    CONVERSATIONAL = "conversational"
    TRIP_REQUEST = "trip_request"
    TRIP_EXPENSE = "trip_expense"
    FHIR_PATIENT_LOOKUP = "fhir_patient_lookup"


class ActionType(str, Enum):
    """Actions to trigger in frontend"""
    SHOW_TRIP_FORM = "show_trip_form"
    SHOW_EXPENSE_FORM = "show_expense_form"


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


# Multi-turn conversation models
class Message(BaseModel):
    """Single message in a conversation"""
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime
    sources: Optional[List[SourceReference]] = None  # Only for assistant messages with RAG


class ChatRequest(BaseModel):
    """Request for chat endpoint with optional session ID"""
    query: str
    session_id: Optional[str] = None  # If None, create new session


class ChatResponse(BaseModel):
    """Response from chat endpoint"""
    session_id: str
    message: Message  # The assistant's response
    used_rag: bool  # Whether RAG retrieval was used
    sources: List[SourceReference]  # Empty if used_rag=False
    processing_time: float
    action_type: Optional[ActionType] = None  # Optional action to trigger in frontend
