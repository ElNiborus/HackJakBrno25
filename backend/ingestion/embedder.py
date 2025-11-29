from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np
import logging
from config import get_settings

logger = logging.getLogger(__name__)


class EmbeddingGenerator:
    """Generates embeddings using sentence transformers."""

    def __init__(self):
        self.settings = get_settings()
        self.model = None
        self._load_model()

    def _load_model(self):
        """Load the sentence transformer model."""
        try:
            logger.info(f"Loading embedding model: {self.settings.embedding_model}")
            # Using multilingual model for Czech language support
            self.model = SentenceTransformer(self.settings.embedding_model)
            logger.info("Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading embedding model: {e}")
            raise

    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text.

        Args:
            text: Input text

        Returns:
            Numpy array of embeddings
        """
        try:
            embedding = self.model.encode(text, normalize_embeddings=True)
            return embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise

    def generate_embeddings_batch(self, texts: List[str]) -> List[np.ndarray]:
        """
        Generate embeddings for multiple texts in batch.

        Args:
            texts: List of input texts

        Returns:
            List of embedding arrays
        """
        try:
            logger.info(f"Generating embeddings for {len(texts)} texts")
            embeddings = self.model.encode(
                texts,
                normalize_embeddings=True,
                show_progress_bar=True,
                batch_size=32
            )
            logger.info("Embeddings generated successfully")
            return embeddings
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            raise

    def add_embeddings_to_chunks(self, chunks: List[dict]) -> List[dict]:
        """
        Add embeddings to chunk dictionaries.

        Args:
            chunks: List of chunk dictionaries

        Returns:
            Chunks with added 'embedding' key
        """
        texts = [chunk['chunk_text'] for chunk in chunks]
        embeddings = self.generate_embeddings_batch(texts)

        for chunk, embedding in zip(chunks, embeddings):
            chunk['embedding'] = embedding

        return chunks
