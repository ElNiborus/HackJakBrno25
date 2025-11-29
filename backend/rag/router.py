import logging
from typing import List
from openai import OpenAI

from models.schemas import Message
from config import get_settings

logger = logging.getLogger(__name__)


class RAGRouter:
    """Routes queries to RAG retrieval or direct response based on LLM decision."""

    def __init__(self):
        """Initialize RAG router with OpenAI client."""
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.router_model
        self.reasoning_effort = settings.router_reasoning_effort
        logger.info(f"RAGRouter initialized with model: {self.model}")

    def should_use_rag(self, query: str, history: List[Message]) -> bool:
        """
        Decide whether RAG retrieval is needed for this query.

        Simple strategy: Classify ONLY the current query without history context.
        This makes routing more predictable and always uses RAG for substantive questions.

        Args:
            query: Current user query
            history: Conversation history (not used for routing, only passed to generator)

        Returns:
            bool: True if RAG retrieval should be used, False otherwise
        """
        try:
            # Simple LLM-based routing
            system_prompt = """Rozhodni, jestli následující dotaz vyžaduje inforamce ze směrnic, předipisů, kontaktů a dalších dokumentů v RAG databázi.
V databázi je plno dokumentů a assistent má přístup k jejich obsahu. Pokud se dotaz ptá na něco co se týká prácovních postupů či práce obecně, měl by použít RAG pro získání relevantních informací.

Odpověz FALSE pouze pokud:
- Dotaz je čistě osobní nebo konverzační povahy, např.: Jak se máš?, Co umíš?, Jak mi můžeš pomoci?
- Obecná konverzace bez specifické otázky

Ve všech zbylých případě odpověz TRUE.

Vždy odpověz pouze TRUE nebo FALSE a nic jiného."""

            user_message = f"Dotaz: {query}\n\nRozhodnutí:"

            # Call LLM for routing decision
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_completion_tokens=1000
            )

            decision_text = response.choices[0].message.content.strip()
            logger.info(f"Routing LLM decision text: {decision_text}")
            needs_rag = "TRUE" in decision_text.upper()

            logger.info(f"Routing decision for '{query[:50]}...': needs_rag={needs_rag} (LLM routing)")
            return needs_rag

        except Exception as e:
            logger.error(f"Error in routing decision: {e}")
            # Default to TRUE (use RAG) on error as safe fallback
            logger.warning("Defaulting to RAG retrieval due to routing error")
            return True

    def _format_history(self, messages: List[Message], max_messages: int = 10) -> str:
        """
        Format conversation history for routing prompt.

        Args:
            messages: List of conversation messages
            max_messages: Maximum number of recent messages to include

        Returns:
            Formatted history string
        """
        if not messages:
            return ""

        # Take last N messages
        recent_messages = messages[-max_messages:]

        formatted = []
        for msg in recent_messages:
            role = "Uživatel" if msg.role == "user" else "Asistent"
            formatted.append(f"[{role}]: {msg.content}")

        return "\n".join(formatted)
