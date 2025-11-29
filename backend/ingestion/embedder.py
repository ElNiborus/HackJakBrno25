from openai import OpenAI
from typing import List
import numpy as np
import logging
from config import get_settings
from tqdm import tqdm

logger = logging.getLogger(__name__)


class EmbeddingGenerator:
    """Generates embeddings using OpenAI's embedding API."""

    def __init__(self):
        self.settings = get_settings()
        self.client = OpenAI(api_key=self.settings.openai_api_key)
        logger.info(f"Using embedding model: {self.settings.embedding_model}")

    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text.

        Args:
            text: Input text

        Returns:
            Numpy array of embeddings
        """
        try:
            response = self.client.embeddings.create(
                model=self.settings.embedding_model,
                input=text
            )
            embedding = np.array(response.data[0].embedding)
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

            # OpenAI API has a limit on batch size, so we process in chunks
            batch_size = 2048  # OpenAI's max batch size for embeddings
            all_embeddings = []

            for i in tqdm(range(0, len(texts), batch_size), desc="Generating embeddings"):
                batch_texts = texts[i:i + batch_size]
                response = self.client.embeddings.create(
                    model=self.settings.embedding_model,
                    input=batch_texts
                )
                batch_embeddings = [np.array(item.embedding) for item in response.data]
                all_embeddings.extend(batch_embeddings)

            logger.info("Embeddings generated successfully")
            return all_embeddings
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
