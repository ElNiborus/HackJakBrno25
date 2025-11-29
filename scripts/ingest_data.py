#!/usr/bin/env python3
"""
Script to ingest documents from raw_data directory into InterSystems IRIS vector database.
"""

import os
import sys
import logging
from pathlib import Path

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from iris_db import IRISVectorDB
from ingestion.parsers import parse_document
from ingestion.chunker import TextChunker
from ingestion.embedder import EmbeddingGenerator
from config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def find_documents(base_path: str) -> list:
    """Find all supported documents in the raw_data directory."""
    documents = []
    base_path = Path(base_path)

    for ext in ['*.docx', '*.doc', '*.xlsx']:
        documents.extend(base_path.rglob(ext))

    return documents


def ingest_documents(raw_data_path: str):
    """
    Main ingestion pipeline.

    Args:
        raw_data_path: Path to raw_data directory
    """
    logger.info("Starting document ingestion pipeline")

    # Initialize components
    db = IRISVectorDB()
    chunk_size=1000
    chunker = TextChunker(chunk_size=chunk_size, overlap=100)
    logger.info(f"Chunking with chink size {chunk_size}")
    embedder = EmbeddingGenerator()

    try:
        # Connect to database
        logger.info("Connecting to InterSystems IRIS...")
        db.connect()

        # Create table and index if they don't exist
        logger.info("Setting up database schema...")
        db.create_vector_table()

        # Find all documents
        documents = find_documents(raw_data_path)
        logger.info(f"Found {len(documents)} documents to process")

        if not documents:
            logger.warning("No documents found!")
            return

        all_chunks = []

        # Process each document
        for doc_path in documents:
            try:
                logger.info(f"Processing: {doc_path.name}")

                # Parse document
                parsed_doc = parse_document(str(doc_path))

                # Create chunks
                if parsed_doc['document_type'] == 'xlsx':
                    chunks = chunker.chunk_structured_data(parsed_doc)
                else:
                    chunks = chunker.create_chunks_with_metadata(parsed_doc)

                logger.info(f"  Created {len(chunks)} chunks")
                all_chunks.extend(chunks)

            except Exception as e:
                logger.error(f"Error processing {doc_path.name}: {e}")
                continue

        if not all_chunks:
            logger.warning("No chunks created!")
            return

        logger.info(f"Total chunks to embed: {len(all_chunks)}")

        # Generate embeddings in batches
        batch_size = 100
        for i in range(0, len(all_chunks), batch_size):
            batch = all_chunks[i:i + batch_size]
            logger.info(f"Processing batch {i // batch_size + 1}/{(len(all_chunks) + batch_size - 1) // batch_size}")

            # Add embeddings
            batch_with_embeddings = embedder.add_embeddings_to_chunks(batch)

            # Insert into database
            db.insert_chunks(batch_with_embeddings)

        # Create index after insertion for better performance
        logger.info("Creating HNSW index...")
        db.create_vector_index()

        # Show statistics
        total_chunks = db.get_chunk_count()
        logger.info(f"✓ Ingestion complete! Total chunks in database: {total_chunks}")

    except Exception as e:
        logger.error(f"Error during ingestion: {e}")
        raise

    finally:
        db.disconnect()


if __name__ == "__main__":
    # Get project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    raw_data_path = project_root / "raw_data"

    if not raw_data_path.exists():
        logger.error(f"raw_data directory not found at {raw_data_path}")
        sys.exit(1)

    logger.info(f"Looking for documents in: {raw_data_path}")
    ingest_documents(str(raw_data_path))
