import iris
from typing import List, Tuple, Optional
import logging
from config import get_settings

logger = logging.getLogger(__name__)


class IRISVectorDB:
    def __init__(self):
        self.settings = get_settings()
        self.conn = None
        self.cursor = None

    def connect(self):
        """Establish connection to InterSystems IRIS database."""
        try:
            self.conn = iris.connect(
                hostname=self.settings.iris_host,
                port=self.settings.iris_port,
                namespace=self.settings.iris_namespace,
                username=self.settings.iris_username,
                password=self.settings.iris_password
            )
            self.cursor = self.conn.cursor()
            logger.info("Successfully connected to InterSystems IRIS")
        except Exception as e:
            logger.error(f"Failed to connect to IRIS: {e}")
            raise

    def disconnect(self):
        """Close database connection."""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        logger.info("Disconnected from InterSystems IRIS")

    def create_vector_table(self):
        """Create the vector search table for document chunks."""
        create_table_sql = f"""
        CREATE TABLE IF NOT EXISTS FNBrno.DocumentChunks (
            ID INTEGER PRIMARY KEY AUTO_INCREMENT,
            DocumentName VARCHAR(500),
            DocumentType VARCHAR(50),
            ChunkText LONGVARCHAR,
            ChunkIndex INTEGER,
            Department VARCHAR(200),
            ProcessOwner VARCHAR(200),
            ChunkVector VECTOR(DOUBLE, {self.settings.embedding_dimension})
        )
        """

        try:
            self.cursor.execute(create_table_sql)
            self.conn.commit()
            logger.info("Vector table created successfully")
        except Exception as e:
            logger.error(f"Error creating vector table: {e}")
            raise

    def create_vector_index(self):
        """Create HNSW index for efficient vector search."""
        # IRIS doesn't support IF NOT EXISTS for indexes, so we try to drop first
        try:
            self.cursor.execute("DROP INDEX HNSWIndex ON FNBrno.DocumentChunks")
            self.conn.commit()
        except:
            pass  # Index doesn't exist, that's fine

        create_index_sql = """
        CREATE INDEX HNSWIndex
        ON FNBrno.DocumentChunks (ChunkVector)
        AS HNSW(Distance='Cosine')
        """

        try:
            self.cursor.execute(create_index_sql)
            self.conn.commit()
            logger.info("HNSW index created successfully")
        except Exception as e:
            logger.error(f"Error creating index: {e}")
            raise

    def insert_chunks(self, chunks: List[dict]):
        """
        Insert document chunks with embeddings into the database.

        Args:
            chunks: List of dicts with keys: document_name, document_type,
                    chunk_text, chunk_index, department, process_owner, embedding
        """
        insert_sql = """
        INSERT INTO FNBrno.DocumentChunks
        (DocumentName, DocumentType, ChunkText, ChunkIndex, Department, ProcessOwner, ChunkVector)
        VALUES (?, ?, ?, ?, ?, ?, TO_VECTOR(?))
        """

        try:
            rows = [
                (
                    chunk['document_name'],
                    chunk['document_type'],
                    chunk['chunk_text'],
                    chunk['chunk_index'],
                    chunk.get('department', ''),
                    chunk.get('process_owner', ''),
                    str(chunk['embedding'].tolist())
                )
                for chunk in chunks
            ]

            self.cursor.executemany(insert_sql, rows)
            self.conn.commit()
            logger.info(f"Inserted {len(chunks)} chunks successfully")
        except Exception as e:
            logger.error(f"Error inserting chunks: {e}")
            raise

    def vector_search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        min_score: float = 0.0
    ) -> List[Tuple]:
        """
        Perform vector similarity search.

        Args:
            query_vector: Embedding vector of the query
            top_k: Number of top results to return
            min_score: Minimum relevance score threshold

        Returns:
            List of tuples: (id, document_name, chunk_text, department,
                           process_owner, relevance_score)
        """
        # Use IRIS vector search syntax: TO_VECTOR(?, double) with lowercase double
        search_sql = f"""
        SELECT TOP {top_k}
            ID,
            DocumentName,
            ChunkText,
            Department,
            ProcessOwner,
            VECTOR_COSINE(ChunkVector, TO_VECTOR(?, double)) AS RelevanceScore
        FROM FNBrno.DocumentChunks
        WHERE VECTOR_COSINE(ChunkVector, TO_VECTOR(?, double)) >= ?
        ORDER BY RelevanceScore DESC
        """

        try:
            vector_str = str(query_vector)
            self.cursor.execute(search_sql, [vector_str, vector_str, min_score])
            results = self.cursor.fetchall()
            logger.info(f"Vector search returned {len(results)} results")
            return results
        except Exception as e:
            logger.error(f"Error performing vector search: {e}")
            raise

    def get_chunk_count(self) -> int:
        """Get total number of chunks in the database."""
        try:
            self.cursor.execute("SELECT COUNT(*) FROM FNBrno.DocumentChunks")
            count = self.cursor.fetchone()[0]
            return count
        except Exception as e:
            logger.error(f"Error getting chunk count: {e}")
            return 0

    def clear_all_data(self):
        """Clear all data from the vector table (use with caution)."""
        try:
            self.cursor.execute("DELETE FROM FNBrno.DocumentChunks")
            self.conn.commit()
            logger.info("All data cleared from vector table")
        except Exception as e:
            logger.error(f"Error clearing data: {e}")
            raise
