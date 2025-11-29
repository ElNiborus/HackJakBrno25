import logging
from typing import List, Optional
from openai import OpenAI
from pydantic import BaseModel, Field

from models.schemas import Message, IntentCategory
from config import get_settings
from rag.prompts import ROUTING_SYSTEM_PROMPT, get_routing_user_message

logger = logging.getLogger(__name__)


class IntentClassification(BaseModel):
    """Structured output for intent classification"""
    category: IntentCategory = Field(description="The classified intent category")
    confidence: Optional[str] = Field(default=None, description="Optional explanation for classification")


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
            # Get prompts from the prompts module
            system_prompt = ROUTING_SYSTEM_PROMPT
            user_message = get_routing_user_message(query)

            # Log the routing request
            logger.info("=" * 80)
            logger.info("RAG ROUTING DECISION")
            logger.info("=" * 80)
            logger.info(f"Query: {query}")
            logger.info("-" * 80)
            logger.info(f"Routing System Prompt:\n{system_prompt}")
            logger.info("-" * 80)
            logger.info(f"Routing User Message:\n{user_message}")
            logger.info("-" * 80)

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
            needs_rag = "TRUE" in decision_text.upper()

            # Log the routing decision
            logger.info(f"LLM Decision: {decision_text}")
            logger.info(f"Final Routing Decision: needs_rag={needs_rag}")
            logger.info("=" * 80)

            return needs_rag

        except Exception as e:
            logger.error(f"Error in routing decision: {e}")
            # Default to TRUE (use RAG) on error as safe fallback
            logger.warning("Defaulting to RAG retrieval due to routing error")
            return True

    def classify_intent(self, query: str, history: List[Message]) -> IntentCategory:
        """
        Classify user intent into one of 4 categories using structured output.

        Args:
            query: Current user query
            history: Conversation history (used to extract user prompts for context)

        Returns:
            IntentCategory: The classified intent
        """
        try:
            system_prompt = ROUTING_SYSTEM_PROMPT

            # Extract only user messages from history for context
            user_history = self._format_user_history(history)
            user_message = get_routing_user_message(query, user_history)

            # Log routing request
            logger.info("=" * 80)
            logger.info("INTENT CLASSIFICATION")
            logger.info("=" * 80)
            logger.info(f"Query: {query}")
            if user_history:
                logger.info(f"User History: {user_history}")
            logger.info("-" * 80)

            # Use structured output with responses.parse()
            response = self.client.responses.parse(
                model=self.model,
                input=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                text_format=IntentClassification
            )

            # Get structured output directly
            classification = response.output_parsed
            category = classification.category

            logger.info(f"Classified as: {category.value}")
            if classification.confidence:
                logger.info(f"Confidence: {classification.confidence}")
            logger.info("=" * 80)

            return category

        except Exception as e:
            logger.error(f"Classification error: {e}, defaulting to GENERAL_RAG")
            return IntentCategory.GENERAL_RAG

    def _format_user_history(self, messages: List[Message], max_messages: int = 5) -> str:
        """
        Extract and format only user messages from conversation history.

        Args:
            messages: List of conversation messages
            max_messages: Maximum number of recent user messages to include

        Returns:
            Formatted string with user messages only
        """
        if not messages:
            return ""

        # Filter only user messages
        user_messages = [msg for msg in messages if msg.role == "user"]

        # Take last N user messages
        recent_user_messages = user_messages[-max_messages:]

        if not recent_user_messages:
            return ""

        # Format as numbered list
        formatted = []
        for i, msg in enumerate(recent_user_messages, 1):
            formatted.append(f"{i}. {msg.content}")

        return "\n".join(formatted)

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
