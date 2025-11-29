from openai import OpenAI
from typing import List, Dict, Optional
import logging
from config import get_settings
from models.schemas import Message
from rag.prompts import get_system_prompt, get_user_message

logger = logging.getLogger(__name__)


class ResponseGenerator:
    """Generates responses using OpenAI LLM."""

    def __init__(self):
        self.settings = get_settings()
        self.client = OpenAI(api_key=self.settings.openai_api_key)

    def generate_response(
        self,
        query: str,
        context: Optional[str] = None,
        history: Optional[List[Message]] = None
    ) -> str:
        """
        Generate response using retrieved context, query, and conversation history.

        Args:
            query: User query
            context: Retrieved context from vector search (None if RAG not used)
            history: Conversation history (None for first message)

        Returns:
            Generated response
        """
        try:
            # Format conversation history
            formatted_history = self._format_history(history) if history else None
            has_history = bool(formatted_history)
            has_context = bool(context)

            # Generate prompts using the prompts module
            system_prompt = get_system_prompt(
                has_context=has_context,
                has_history=has_history,
                formatted_history=formatted_history or ""
            )

            user_message = get_user_message(
                query=query,
                context=context,
                has_history=has_history
            )

            # Log the prompts being sent
            logger.info("=" * 80)
            logger.info("GENERATING RESPONSE")
            logger.info("=" * 80)
            logger.info(f"System Prompt:\n{system_prompt}")
            logger.info("-" * 80)
            logger.info(f"User Message:\n{user_message}")
            logger.info("-" * 80)

            # Call OpenAI API
            # For reasoning models (gpt-5-mini), use the new responses API
            response = self.client.responses.create(
                model=self.settings.openai_model,
                instructions=system_prompt,
                input=[
                    {"role": "user", "content": user_message}
                ],
                max_output_tokens=1000,
                reasoning={"effort": "minimal"}
            )

            # Extract answer from the new response structure
            # The Responses API returns output_text directly
            answer = response.output_text

            # Log the response
            logger.info(f"Generated Response:\n{answer}")
            logger.info("=" * 80)

            return answer

        except Exception as e:
            logger.error(f"Error generating response: {e}")
            raise

    def generate_response_with_sources(
        self,
        query: str,
        retrieved_chunks: List[Dict]
    ) -> Dict:
        """
        Generate response and include source information.

        Args:
            query: User query
            retrieved_chunks: List of retrieved chunks with metadata

        Returns:
            Dict with 'answer' and 'sources'
        """
        from rag.retriever import VectorRetriever

        # Format context
        retriever = VectorRetriever(None, None)
        context = retriever.format_context_for_llm(retrieved_chunks)

        # Generate answer
        answer = self.generate_response(query, context)

        # Format sources
        sources = [
            {
                'document_name': chunk['document_name'],
                'chunk_text': chunk['chunk_text'][:200] + '...' if len(chunk['chunk_text']) > 200 else chunk['chunk_text'],
                'relevance_score': chunk['relevance_score'],
                'metadata': {
                    'department': chunk.get('department'),
                    'process_owner': chunk.get('process_owner')
                }
            }
            for chunk in retrieved_chunks
        ]

        return {
            'answer': answer,
            'sources': sources
        }

    def _format_history(self, messages: List[Message]) -> str:
        """
        Format conversation history for inclusion in prompts.

        Args:
            messages: List of conversation messages

        Returns:
            Formatted history string in Czech
        """
        if not messages:
            return ""

        settings = get_settings()
        max_messages = settings.max_history_messages

        # Take last N messages to manage token limits
        recent_messages = messages[-max_messages:]

        formatted = []
        for msg in recent_messages:
            role = "Uživatel" if msg.role == "user" else "Asistent"
            formatted.append(f"[{role}]: {msg.content}")

        return "\n".join(formatted)
