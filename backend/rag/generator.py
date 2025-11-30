from openai import OpenAI
from typing import List, Dict, Optional
import logging
from config import get_settings
from models.schemas import Message, IntentCategory
from rag.prompts import get_system_prompt, get_user_message
from fhir.tools import get_fhir_tools
from fhir.executor import FHIRToolExecutor

logger = logging.getLogger(__name__)


class ResponseGenerator:
    """Generates responses using OpenAI LLM."""

    def __init__(self, fhir_tool_executor: Optional[FHIRToolExecutor] = None):
        self.settings = get_settings()
        self.client = OpenAI(api_key=self.settings.openai_api_key)
        self.fhir_tool_executor = fhir_tool_executor

    def generate_response(
        self,
        query: str,
        context: Optional[str] = None,
        history: Optional[List[Message]] = None,
        category: IntentCategory = IntentCategory.GENERAL_RAG,
        user_system_prompt: Optional[str] = None
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
                formatted_history=formatted_history or "",
                category=category,
                user_system_prompt=user_system_prompt
            )

            user_message = get_user_message(
                query=query,
                context=context,
                has_history=has_history,
            )

            # Log the prompts being sent
            logger.info("=" * 80)
            logger.info("GENERATING RESPONSE")
            logger.info("=" * 80)
            logger.info(f"System Prompt:\n{system_prompt}")
            logger.info("-" * 80)
            logger.info(f"User Message:\n{user_message}")
            logger.info("-" * 80)

            # Handle FHIR tool calling for patient lookup
            if category == IntentCategory.FHIR_PATIENT_LOOKUP and self.fhir_tool_executor:
                return self._generate_response_with_fhir_tools(
                    system_prompt, user_message
                )

            # Standard response generation (existing flow)
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
                'chunk_text': chunk['chunk_text'],
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

    def _generate_response_with_fhir_tools(self, system_prompt: str, user_message: str) -> str:
        """
        Generate response using FHIR tool calling with Responses API.
        Implementation based on official OpenAI documentation.

        Args:
            system_prompt: System prompt for the LLM
            user_message: User message

        Returns:
            Generated response with FHIR data
        """
        try:
            logger.info("Generating response with FHIR tool calling using Responses API")

            # Create input list for conversation
            input_list = [
                {"role": "user", "content": user_message}
            ]

            # First call: LLM with tools to extract parameters and call FHIR
            response = self.client.responses.create(
                model=self.settings.openai_model,
                instructions=system_prompt,
                input=input_list,
                tools=get_fhir_tools(),
                max_output_tokens=1000,
                reasoning={"effort": "minimal"}
            )

            # Debug logging
            logger.info(f"Response output: {response.output}")
            logger.info(f"Response output type: {type(response.output)}")
            logger.info(f"Response output length: {len(response.output) if hasattr(response.output, '__len__') else 'N/A'}")

            # Detailed debug of each item in output
            for i, item in enumerate(response.output):
                logger.info(f"Output item {i}: {type(item)} - {item}")
                if hasattr(item, 'type'):
                    logger.info(f"  Item type: {item.type}")
                if hasattr(item, '__dict__'):
                    logger.info(f"  Item attributes: {item.__dict__}")

            # Save function call outputs for subsequent requests
            input_list += response.output

            # Check for function calls in response.output
            function_calls_made = False
            for item in response.output:
                if hasattr(item, 'type') and item.type == "function_call":
                    function_calls_made = True
                    logger.info(f"Function call detected: {item.name} with arguments: {item.arguments}")

                    if item.name == "search_fhir_patients":
                        # Execute the FHIR search
                        import json
                        try:
                            search_params = json.loads(item.arguments)
                            logger.info(f"Executing FHIR search with params: {search_params}")

                            # Handle special date formatting for Czech queries
                            if 'birthdate' in search_params:
                                birthdate = search_params['birthdate']
                                # Handle Czech year format like "2022" for years 2022-2025
                                if birthdate and birthdate.isdigit() and len(birthdate) == 4:
                                    year = int(birthdate)
                                    # For year range queries from user context
                                    search_params['birthdate'] = f"ge{year}-01-01&le2025-12-31"
                                    logger.info(f"Converted birthdate to range: {search_params['birthdate']}")

                            # Execute search via FHIR client
                            patients = self.fhir_tool_executor.fhir_client.search_patients(search_params)
                            formatted_results = self.fhir_tool_executor.fhir_client.format_patients_for_czech_response(patients)

                            logger.info(f"FHIR search results:\n{formatted_results}")

                            # Provide function call results to the model
                            input_list.append({
                                "type": "function_call_output",
                                "call_id": item.call_id,
                                "output": json.dumps({
                                    "patient_results": formatted_results
                                })
                            })

                        except Exception as e:
                            logger.error(f"Error executing FHIR search: {e}")
                            import traceback
                            logger.error(f"Full traceback: {traceback.format_exc()}")
                            input_list.append({
                                "type": "function_call_output",
                                "call_id": item.call_id,
                                "output": json.dumps({
                                    "error": f"Chyba při vyhledávání pacientů: {str(e)}"
                                })
                            })

            if function_calls_made:
                # Second call: LLM with tool results to generate final response
                logger.info("Making second call with function results")
                final_response = self.client.responses.create(
                    model=self.settings.openai_model,
                    instructions=system_prompt,
                    input=input_list,
                    tools=get_fhir_tools(),
                    max_output_tokens=1000,
                    reasoning={"effort": "minimal"}
                )

                answer = final_response.output_text
                logger.info(f"Final FHIR response:\n{answer}")
                return answer
            else:
                # No tools called, return direct response
                logger.info("No function calls detected, returning direct response")
                return response.output_text or "Nepodařilo se zpracovat dotaz."

        except Exception as e:
            logger.error(f"Error in FHIR tool calling: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            # Fallback to error message
            return "Omlouváme se, při vyhledávání pacientů došlo k chybě. Zkuste prosím dotaz zformulovat jinak nebo kontaktujte technickou podporu."
