from pydantic import BaseModel
from typing import List, Optional, Literal, Dict
from datetime import datetime
from enum import Enum


# User models
class UserInfo(BaseModel):
    """User information model"""
    name: str
    role: str
    file_access: List[str] = []


class RoleFileAccess(BaseModel):
    """Role-based file access configuration"""
    public: List[str] = []
    by_user_role: Dict[str, List[str]] = {}


class UsersConfig(BaseModel):
    """Root model for user configuration"""
    role_file_access: RoleFileAccess
    users: Dict[str, UserInfo]

    def get_allowed_files_for_user(self, user_info: Optional[UserInfo]) -> List[str]:
        """Get allowed files for a user based on their role"""
        if user_info is None:
            return []
        
        allowed_files = set()

        # Add public files
        allowed_files.update(self.role_file_access.public)

        # Add role-based files
        role = user_info.role
        role_based_files = self.role_file_access.by_user_role.get(role, [])
        allowed_files.update(role_based_files)

        # Add user-specific files
        allowed_files.update(user_info.file_access)

        return list(allowed_files)

    def get_user_system_prompt(self, user_id: Optional[int]) -> Optional[str]:
        """Get custom system prompt for a user by their ID"""
        if user_id is None:
            return None
        
        user_key = str(user_id)
        user_info = self.users.get(user_key)
        if user_info:
            return f"Jsi virtuální asistent pro uživatele {user_info.name} s rolí {user_info.role}.\n"
        
        return None

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
    user_id: Optional[int] = None  # User ID for role-based access control


class ChatResponse(BaseModel):
    """Response from chat endpoint"""
    session_id: str
    message: Message  # The assistant's response
    used_rag: bool  # Whether RAG retrieval was used
    sources: List[SourceReference]  # Empty if used_rag=False
    processing_time: float
    action_type: Optional[ActionType] = None  # Optional action to trigger in frontend
