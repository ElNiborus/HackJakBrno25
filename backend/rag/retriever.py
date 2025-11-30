from typing import List, Dict
import logging
from iris_db import IRISVectorDB
from ingestion.embedder import EmbeddingGenerator
from config import get_settings

logger = logging.getLogger(__name__)


class VectorRetriever:
    """Handles vector search and retrieval from IRIS database."""

    def __init__(self, db: IRISVectorDB, embedder: EmbeddingGenerator):
        self.db = db
        self.embedder = embedder
        self.settings = get_settings()

    def retrieve(self, query: str, top_k: int = None, min_score: float = None, allowed_files: List[str] = None) -> List[Dict]:
        """
        Retrieve relevant document chunks for a query.

        Args:
            query: User query text
            top_k: Number of results to return (default from settings)
            min_score: Minimum relevance score (default from settings)

        Returns:
            List of retrieved chunks with metadata
        """
        if top_k is None:
            top_k = self.settings.top_k_results

        if min_score is None:
            min_score = self.settings.min_relevance_score

        try:
            # Generate query embedding
            logger.info(f"Generating embedding for query: {query[:100]}...")
            query_embedding = self.embedder.generate_embedding(query)

            # Perform vector search
            logger.info(f"Searching for top {top_k} results with min score {min_score}")
            results = self.db.vector_search(
                query_vector=query_embedding.tolist(),
                top_k=top_k,
                min_score=min_score
            )

            # Format results
            retrieved_chunks = []
            for result in results:
                chunk = {
                    'id': result[0],
                    'document_name': result[1],
                    'chunk_text': result[2],
                    'department': result[3],
                    'process_owner': result[4],
                    'relevance_score': float(result[5])
                }
                if allowed_files is not None:
                    if chunk['document_name'] in allowed_files:
                        retrieved_chunks.append(chunk)

            logger.info(f"Selected {len(retrieved_chunks)} out of {len(results)} results.")
            logger.info(f"Filtering based on allowed files: {allowed_files}")
            logger.info(f"Retrieved {len(retrieved_chunks)} relevant chunks")
            return retrieved_chunks

        except Exception as e:
            logger.error(f"Error during retrieval: {e}")
            raise

    def format_context_for_llm(self, chunks: List[Dict]) -> str:
        """
        Format retrieved chunks into context string for LLM.

        Args:
            chunks: List of retrieved chunks

        Returns:
            Formatted context string
        """
        if not chunks:
            return "Nebyly nalezeny žádné relevantní dokumenty."

        context_parts = []

        for idx, chunk in enumerate(chunks, 1):
            context_part = f"--- Dokument {idx}: {chunk['document_name']} ---\n"

            if chunk.get('department'):
                context_part += f"Oddělení: {chunk['department']}\n"

            if chunk.get('process_owner'):
                context_part += f"Vlastník procesu: {chunk['process_owner']}\n"

            context_part += f"Relevance: {chunk['relevance_score']:.2f}\n\n"
            context_part += chunk['chunk_text']

            context_parts.append(context_part)

        return "\n\n".join(context_parts)
