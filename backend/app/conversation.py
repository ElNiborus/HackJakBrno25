from typing import List, Dict
from datetime import datetime


class ConversationHistory:
    """Manages conversation history for a single user."""
    
    def __init__(self):
        self._history: List[Dict[str, str]] = []
    
    def add_message(self, role: str, content: str) -> None:
        """
        Add a message to the conversation history.
        
        Args:
            role: The role of the message sender ('user', 'assistant', or 'system')
            content: The content of the message
        """
        self._history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def get_messages_for_api(self) -> List[Dict[str, str]]:
        """
        Get messages formatted for OpenAI API (without timestamps).
        
        Returns:
            List of message dictionaries with 'role' and 'content' keys
        """
        return [
            {"role": msg["role"], "content": msg["content"]}
            for msg in self._history
        ]
    
    def get_full_history(self) -> List[Dict[str, str]]:
        """
        Get the complete conversation history including timestamps.
        
        Returns:
            List of all messages with timestamps
        """
        return self._history.copy()
    
    def clear(self) -> None:
        """Clear all conversation history."""
        self._history.clear()
    
    def get_context_window(self, max_messages: int = 10) -> List[Dict[str, str]]:
        """
        Get recent messages for context window (without timestamps).
        
        Args:
            max_messages: Maximum number of recent messages to return
            
        Returns:
            List of recent message dictionaries formatted for API
        """
        recent_messages = self._history[-max_messages:] if len(self._history) > max_messages else self._history
        return [
            {"role": msg["role"], "content": msg["content"]}
            for msg in recent_messages
        ]


# Global conversation history instance (single user)
conversation_history = ConversationHistory()
