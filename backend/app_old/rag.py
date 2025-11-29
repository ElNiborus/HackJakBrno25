from typing import List, Dict
from abc import ABC, abstractmethod
from app.logger import setup_logger

logger = setup_logger(__name__)


class RAGRetriever(ABC):
    """
    Abstract base class for RAG (Retrieval-Augmented Generation) retrieval.
    
    This class defines the interface for retrieving relevant context from a knowledge base.
    Implementations should handle the actual retrieval logic (e.g., vector search, keyword search).
    """
    
    @abstractmethod
    async def retrieve_context(self, query: str, top_k: int = 5) -> List[Dict[str, str]]:
        """
        Retrieve relevant context for a given query.
        
        Args:
            query: The user's query to search for relevant context
            top_k: Number of top relevant documents/chunks to retrieve
            
        Returns:
            List of dictionaries containing retrieved context. Each dictionary should have:
            - 'content': The text content of the retrieved chunk
            - 'source': Optional metadata about the source (file name, page number, etc.)
            - 'score': Optional relevance score
            
        Example return:
            [
                {
                    "content": "The capital of France is Paris...",
                    "source": "geography.pdf",
                    "score": 0.95
                },
                ...
            ]
        """
        pass


class MockRAGRetriever(RAGRetriever):
    """
    Mock implementation of RAG retriever for testing purposes.
    Replace this with your actual RAG implementation.
    """
    
    async def retrieve_context(self, query: str, top_k: int = 5) -> List[Dict[str, str]]:
        """
        Mock retrieval that returns placeholder context.
        
        TODO: Replace this with actual RAG implementation that:
        - Embeds the query
        - Searches vector database
        - Retrieves relevant documents
        - Returns formatted results
        """
        # Placeholder implementation
        logger.warning("Using MockRAGRetriever - replace with actual implementation")
        return [
            {
                "content": f"This is placeholder context for query: {query}",
                "source": "mock_document.txt",
                "score": 0.85
            }
        ]


# Global RAG retriever instance
# Replace MockRAGRetriever with your actual implementation
rag_retriever = MockRAGRetriever()
