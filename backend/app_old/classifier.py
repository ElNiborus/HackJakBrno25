from openai import OpenAI
from app.config import get_settings
from app.logger import setup_logger
from enum import Enum

logger = setup_logger(__name__)


class QueryType(str, Enum):
    """Enumeration of query types."""
    CHAT = "chat"
    RAG = "rag"


class QueryClassifier:
    """Classifies user queries as either regular chat or RAG questions."""
    
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model
    
    async def classify_query(self, query: str) -> QueryType:
        """
        Classify a user query as either a regular chat question or a RAG question.
        
        A RAG question typically requires external knowledge retrieval (e.g., asking about
        specific documents, data, facts that need to be looked up), while a chat question
        can be answered directly by the LLM based on its training.
        
        Args:
            query: The user's input query
            
        Returns:
            QueryType.CHAT or QueryType.RAG
        """
        classification_prompt = """You are a query classifier. Determine if the following user query requires external knowledge retrieval (RAG) or can be answered as a regular chat question.

RAG questions typically:
- Ask about specific documents, files, or data
- Request information that needs to be looked up from a knowledge base
- Require factual information from external sources
- Ask "what is in..." or "search for..." or "find information about..."

CHAT questions typically:
- Are conversational or general questions
- Can be answered from the model's training knowledge
- Are creative tasks, opinions, or general advice
- Don't require looking up specific external data

Respond with ONLY one word: either "chat" or "rag".

User query: {query}

Classification:"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that classifies queries. Respond only with 'chat' or 'rag'."
                },
                {
                    "role": "user",
                    "content": classification_prompt.format(query=query)
                }
            ],
            temperature=0,
            max_tokens=10
        )
        
        classification = response.choices[0].message.content.strip().lower()
        
        if "rag" in classification:
            return QueryType.RAG
        else:
            return QueryType.CHAT
            
