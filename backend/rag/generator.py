from openai import OpenAI
from typing import List, Dict
import logging
from config import get_settings

logger = logging.getLogger(__name__)


class ResponseGenerator:
    """Generates responses using OpenAI LLM."""

    def __init__(self):
        self.settings = get_settings()
        self.client = OpenAI(api_key=self.settings.openai_api_key)

    def generate_response(self, query: str, context: str) -> str:
        """
        Generate response using retrieved context and query.

        Args:
            query: User query
            context: Retrieved context from vector search

        Returns:
            Generated response
        """
        try:
            # System prompt for FN Brno assistant
            system_prompt = """Jsi virtuální asistent pro Fakultní nemocnici Brno (FN Brno).
Tvým úkolem je pomáhat zaměstnancům nemocnice s navigací v interních procesech,
organizační struktuře a administrativních úkonech.

PRAVIDLA:
1. Odpovídej POUZE na základě poskytnutého kontextu z dokumentů.
2. Odpovídej jasně, stručně a v češtině.
3. Pokud je to možné, uveď konkrétní oddělení nebo osobu zodpovědnou za daný proces.
4. Poskytuj krok za krokem návod, když se ptají na postupy.
5. Pokud informace není v kontextu, řekni to upřímně a navrhni kontaktovat příslušné oddělení.
6. Buď profesionální, ale přátelský.
7. Při odkazech na dokumenty uveď jejich název.

FORMÁT ODPOVĚDI:
- Začni přímou odpovědí na otázku
- Pokud je to relevantní, uveď zodpovědné oddělení nebo osobu
- Poskytni konkrétní kroky, pokud se ptají na postup
- Na konci můžeš uvést zdroj informace (název dokumentu)"""

            # Create user message with context
            user_message = f"""KONTEXT Z DOKUMENTŮ:
{context}

OTÁZKA ZAMĚSTNANCE:
{query}

Odpověz na otázku zaměstnance na základě výše uvedeného kontextu."""

            logger.info("Generating response with OpenAI")

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

            logger.info(f"OpenAI response: {response}")

            # Extract answer from the new response structure
            # The Responses API returns output_text directly
            answer = response.output_text
            logger.info(f"Response generated successfully. Answer length: {len(answer) if answer else 0}")
            logger.info(f"Answer content: {answer[:200] if answer else 'EMPTY/NULL'}")
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
