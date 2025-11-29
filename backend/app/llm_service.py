from openai import OpenAI
from typing import List, Dict
from app.config import get_settings
from app.logger import setup_logger

logger = setup_logger(__name__)


class LLMService:
    """Service for interacting with OpenAI's LLM."""
    
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model
    
    async def generate_response(
        self,
        user_query: str,
        conversation_history: List[Dict[str, str]],
        context: str = None
    ) -> str:
        """
        Generate a response using OpenAI's LLM.
        
        Args:
            user_query: The user's current query
            conversation_history: List of previous messages in the conversation
            context: Optional RAG context to include in the prompt
            
        Returns:
            The generated response from the LLM
        """
        # Build messages for the API call
        messages = []
        
        # Add system message with or without RAG context
        if context:
            system_message = f"""You are a helpful AI assistant. Use the following context to answer the user's question accurately and comprehensively.

Context:
{context}

If the answer cannot be found in the context, say so and provide the best answer you can based on your general knowledge."""
        else:
            system_message = "You are a helpful AI assistant. Answer the user's questions clearly and accurately."
        
        messages.append({
            "role": "system",
            "content": system_message
        })
        
        # Add conversation history
        messages.extend(conversation_history)
        
        # Add current user query
        messages.append({
            "role": "user",
            "content": user_query
        })
        
        try:
            logger.info(f"Calling OpenAI API with model {self.model}")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            logger.info(f"OpenAI API call successful, tokens used: {response.usage.total_tokens if response.usage else 'N/A'}")
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating LLM response: {str(e)}", exc_info=True)
            raise Exception(f"Error generating LLM response: {str(e)}")
