from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import logging
import time
import os
from pathlib import Path

from models.schemas import QueryRequest, QueryResponse
from iris_db import IRISVectorDB
from ingestion.embedder import EmbeddingGenerator
from rag.retriever import VectorRetriever
from rag.generator import ResponseGenerator
from config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global instances
db = None
embedder = None
retriever = None
generator = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    global db, embedder, retriever, generator

    # Startup
    logger.info("Starting up FN Brno Virtual Assistant API")

    try:
        # Initialize components
        settings = get_settings()
        logger.info("Initializing database connection...")
        db = IRISVectorDB()
        db.connect()

        logger.info("Initializing embedding generator...")
        embedder = EmbeddingGenerator()

        logger.info("Initializing retriever and generator...")
        retriever = VectorRetriever(db, embedder)
        generator = ResponseGenerator()

        logger.info("Startup complete!")

    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down...")
    if db:
        db.disconnect()
    logger.info("Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="FN Brno Virtual Assistant API",
    description="RAG-based virtual assistant for FN Brno employees",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "FN Brno Virtual Assistant API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        chunk_count = db.get_chunk_count() if db else 0
        return {
            "status": "healthy",
            "database": "connected" if db else "disconnected",
            "chunks_in_db": chunk_count
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    """
    Process user query and return RAG response.

    Args:
        request: Query request with user question

    Returns:
        QueryResponse with answer and sources
    """
    start_time = time.time()

    try:
        logger.info(f"Received query: {request.query}")

        # Retrieve relevant chunks
        retrieved_chunks = retriever.retrieve(request.query)

        if not retrieved_chunks:
            logger.warning("No relevant chunks found")
            return QueryResponse(
                answer="Omlouvám se, ale nenašel jsem relevantní informace k vaší otázce v dostupných dokumentech. Můžete zkusit přeformulovat otázku nebo kontaktovat příslušné oddělení.",
                sources=[],
                processing_time=time.time() - start_time
            )

        # Generate response
        result = generator.generate_response_with_sources(
            request.query,
            retrieved_chunks
        )

        processing_time = time.time() - start_time
        logger.info(f"Query processed in {processing_time:.2f}s")

        return QueryResponse(
            answer=result['answer'],
            sources=result['sources'],
            processing_time=processing_time
        )

    except Exception as e:
        logger.error(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats")
async def get_stats():
    """Get database statistics."""
    try:
        chunk_count = db.get_chunk_count() if db else 0
        return {
            "total_chunks": chunk_count,
            "embedding_model": get_settings().embedding_model,
            "llm_model": get_settings().openai_model
        }
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download/{filename}")
async def download_file(filename: str):
    """
    Download a document file.

    Args:
        filename: Name of the file to download

    Returns:
        File response
    """
    try:
        # Get raw_data directory
        base_dir = Path(__file__).parent.parent / "raw_data"

        # Search for file in subdirectories
        for root, dirs, files in os.walk(base_dir):
            if filename in files:
                file_path = os.path.join(root, filename)
                logger.info(f"Serving file: {file_path}")
                return FileResponse(
                    file_path,
                    filename=filename,
                    media_type="application/octet-stream"
                )

        raise HTTPException(status_code=404, detail=f"File not found: {filename}")

    except Exception as e:
        logger.error(f"Error downloading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
