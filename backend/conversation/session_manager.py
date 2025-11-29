import uuid
import logging
from typing import Dict, List, Optional
from datetime import datetime

from models.schemas import Message

logger = logging.getLogger(__name__)


class SessionManager:
    """Manages conversation sessions in memory."""

    def __init__(self):
        """Initialize session manager with empty storage."""
        self.conversations: Dict[str, List[Message]] = {}
        logger.info("SessionManager initialized")

    def create_session(self) -> str:
        """
        Create a new conversation session.

        Returns:
            str: New session ID (UUID)
        """
        session_id = str(uuid.uuid4())
        self.conversations[session_id] = []
        logger.info(f"Created new session: {session_id}")
        return session_id

    def get_session(self, session_id: str) -> List[Message]:
        """
        Retrieve conversation history for a session.

        Args:
            session_id: Session ID to retrieve

        Returns:
            List of messages in the session

        Raises:
            KeyError: If session doesn't exist
        """
        if session_id not in self.conversations:
            raise KeyError(f"Session not found: {session_id}")

        return self.conversations[session_id]

    def add_message(self, session_id: str, message: Message) -> None:
        """
        Add a message to a session's conversation history.

        Args:
            session_id: Session ID
            message: Message to add

        Raises:
            KeyError: If session doesn't exist
        """
        if session_id not in self.conversations:
            raise KeyError(f"Session not found: {session_id}")

        self.conversations[session_id].append(message)
        logger.debug(f"Added {message.role} message to session {session_id}")

    def session_exists(self, session_id: str) -> bool:
        """
        Check if a session exists.

        Args:
            session_id: Session ID to check

        Returns:
            bool: True if session exists
        """
        return session_id in self.conversations

    def get_session_count(self) -> int:
        """
        Get the total number of active sessions.

        Returns:
            int: Number of sessions
        """
        return len(self.conversations)
