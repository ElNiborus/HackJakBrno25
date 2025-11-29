from typing import List, Dict
import re
import logging

logger = logging.getLogger(__name__)


class TextChunker:
    """Handles text chunking for vector embeddings."""

    def __init__(self, chunk_size: int = 500, overlap: int = 100):
        """
        Initialize chunker.

        Args:
            chunk_size: Target chunk size in characters
            overlap: Overlap between chunks in characters
        """
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into overlapping chunks.

        Args:
            text: Input text to chunk

        Returns:
            List of text chunks
        """
        if not text or len(text) == 0:
            return []

        chunks = []
        start = 0

        while start < len(text):
            end = start + self.chunk_size

            # Try to break at sentence or paragraph boundary
            if end < len(text):
                # Look for paragraph break
                next_para = text.find('\n\n', end - 100, end + 100)
                if next_para != -1:
                    end = next_para

                # Look for sentence break
                else:
                    for punct in ['. ', '.\n', '! ', '?\n']:
                        last_punct = text.rfind(punct, end - 100, end + 100)
                        if last_punct != -1:
                            end = last_punct + 1
                            break

            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            # Move start position with overlap
            start = end - self.overlap

            # Prevent infinite loop
            if start <= end - self.chunk_size:
                start = end

        return chunks

    def create_chunks_with_metadata(
        self,
        document_data: Dict,
        document_name: str = None
    ) -> List[Dict]:
        """
        Create chunks with metadata from parsed document.

        Args:
            document_data: Parsed document from parsers.py
            document_name: Override document name

        Returns:
            List of chunk dictionaries with metadata
        """
        text = document_data.get('full_text', '')
        doc_name = document_name or document_data.get('document_name', 'unknown')
        doc_type = document_data.get('document_type', 'unknown')

        # Get metadata
        metadata = document_data.get('metadata', {})
        department = metadata.get('department', '')
        process_owner = metadata.get('process_owner', '')

        # Chunk the text
        text_chunks = self.chunk_text(text)

        # Create chunk objects
        chunks = []
        for idx, chunk_text in enumerate(text_chunks):
            chunk = {
                'document_name': doc_name,
                'document_type': doc_type,
                'chunk_text': chunk_text,
                'chunk_index': idx,
                'department': department,
                'process_owner': process_owner,
                'metadata': metadata
            }
            chunks.append(chunk)

        logger.info(f"Created {len(chunks)} chunks from {doc_name}")
        return chunks

    @staticmethod
    def chunk_structured_data(document_data: Dict) -> List[Dict]:
        """
        Create chunks from structured XLSX data.
        Each row becomes a separate chunk for better precision.

        Args:
            document_data: Parsed XLSX document

        Returns:
            List of chunk dictionaries
        """
        if document_data.get('document_type') != 'xlsx':
            raise ValueError("This method is only for XLSX files")

        structured_data = document_data.get('structured_data', [])
        doc_name = document_data.get('document_name', 'unknown')
        metadata = document_data.get('metadata', {})

        chunks = []
        for idx, row_dict in enumerate(structured_data):
            # Create readable text from row
            row_text = ' | '.join([
                f"{key}: {value}"
                for key, value in row_dict.items()
                if value and str(value).strip() and str(value) != 'nan'
            ])

            if row_text:
                chunk = {
                    'document_name': doc_name,
                    'document_type': 'xlsx',
                    'chunk_text': row_text,
                    'chunk_index': idx,
                    'department': metadata.get('department', ''),
                    'process_owner': metadata.get('process_owner', ''),
                    'metadata': metadata
                }
                chunks.append(chunk)

        logger.info(f"Created {len(chunks)} structured chunks from {doc_name}")
        return chunks
