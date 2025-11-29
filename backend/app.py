from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import logging
import time
import os
from pathlib import Path

from models.schemas import QueryRequest, QueryResponse, ChatRequest, ChatResponse, Message, IntentCategory, ActionType, UserInfo, UsersConfig
from iris_db import IRISVectorDB
from ingestion.embedder import EmbeddingGenerator
from rag.retriever import VectorRetriever
from rag.generator import ResponseGenerator
from conversation.session_manager import SessionManager
from rag.router import RAGRouter
from config import get_settings
from datetime import datetime

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
session_manager = None
rag_router = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    global db, embedder, retriever, generator, session_manager, rag_router

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

        logger.info("Initializing session manager and RAG router...")
        session_manager = SessionManager()
        rag_router = RAGRouter()

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
        print(result)
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


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Multi-turn conversation endpoint with agentic RAG routing.

    Args:
        request: Chat request with query and optional session ID

    Returns:
        ChatResponse with answer, sources, and session ID
    """
    start_time = time.time()

    try:
        # Load user info
        settings = get_settings()
        user_data: UserInfo = settings.users_config.users[str(request.user_id)]
        
        # Log incoming request
        logger.debug("\n" + "=" * 80)
        logger.debug("INCOMING CHAT REQUEST")
        logger.debug("=" * 80)
        logger.debug(f"Query: {request.query}")
        logger.debug(f"Session ID: {request.session_id if request.session_id else 'None (new session)'}")
        logger.debug(f"User ID: {request.user_id}")
        if user_data:
            logger.debug(f"User Name: {user_data.name}")
            logger.debug(f"User Role: {user_data.role}")
        logger.debug("=" * 80 + "\n")

        # Get or create session
        if request.session_id and session_manager.session_exists(request.session_id):
            session_id = request.session_id
            history = session_manager.get_session(session_id)
            logger.info(f"Using existing session: {session_id} with {len(history)} messages")
        else:
            session_id = session_manager.create_session()
            history = []
            logger.info(f"Created new session: {session_id}")

        # Add user message to history
        user_message = Message(
            role="user",
            content=request.query,
            timestamp=datetime.now()
        )
        session_manager.add_message(session_id, user_message)

        # Classify user intent
        category = rag_router.classify_intent(request.query, history)

        # Determine if RAG needed based on category
        needs_rag = category in [
            IntentCategory.GENERAL_RAG,
            IntentCategory.TRIP_REQUEST,
            IntentCategory.TRIP_EXPENSE
        ]

        # Determine action_type for frontend
        action_type = None
        if category == IntentCategory.TRIP_REQUEST:
            action_type = ActionType.SHOW_TRIP_FORM
        elif category == IntentCategory.TRIP_EXPENSE:
            action_type = ActionType.SHOW_EXPENSE_FORM

        # Retrieve context if needed
        sources = []
        context = None
        if needs_rag:
            allowed_files = settings.users_config.get_allowed_files_for_user(user_data)
            retrieved_chunks = retriever.retrieve(request.query, allowed_files=allowed_files)
            if retrieved_chunks:
                # Format context
                context = retriever.format_context_for_llm(retrieved_chunks)
                # Format sources
                sources = [
                    {
                        'document_name': chunk['document_name'],
                        'chunk_text': chunk['chunk_text'],
                        'relevance_score': chunk['relevance_score'],
                        'metadata': {
                            'department': chunk.get('department'),
                            'process_owner': chunk.get('process_owner')
                        }
                    }
                    for chunk in retrieved_chunks
                ]
            else:
                logger.warning("No relevant chunks found despite RAG routing")

        # Generate response with history, optional context, and category
        answer = generator.generate_response(
            query=request.query,
            context=context,
            history=history,
            category=category,
            user_system_prompt=settings.users_config.get_user_system_prompt(request.user_id)
        )

        # Create assistant message
        assistant_message = Message(
            role="assistant",
            content=answer,
            timestamp=datetime.now(),
            sources=sources if needs_rag else None
        )
        session_manager.add_message(session_id, assistant_message)

        processing_time = time.time() - start_time

        # Log final response
        logger.debug("\n" + "=" * 80)
        logger.debug("CHAT RESPONSE")
        logger.debug("=" * 80)
        logger.debug(f"Session ID: {session_id}")
        logger.debug(f"Intent Category: {category.value}")
        logger.debug(f"Used RAG: {needs_rag}")
        logger.debug(f"Action Type: {action_type.value if action_type else 'None'}")
        logger.debug(f"Number of sources: {len(sources)}")
        logger.debug(f"Processing time: {processing_time:.2f}s")
        logger.debug(f"Assistant Response:\n{answer}")
        logger.debug("=" * 80 + "\n")

        return ChatResponse(
            session_id=session_id,
            message=assistant_message,
            used_rag=needs_rag,
            sources=sources,
            processing_time=processing_time,
            action_type=action_type
        )

    except Exception as e:
        logger.error(f"Error processing chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """
    Retrieve conversation history for a session.

    Args:
        session_id: Session ID to retrieve

    Returns:
        Conversation history
    """
    try:
        if not session_manager.session_exists(session_id):
            raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")

        history = session_manager.get_session(session_id)
        return {
            "session_id": session_id,
            "messages": history
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving chat history: {e}")
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


@app.get("/view-pdf/{filename}")
async def view_pdf(filename: str):
    """
    View a document as PDF (replaces extension with .pdf).

    Args:
        filename: Name of the file to view

    Returns:
        PDF file response
    """
    try:
        # Replace extension with .pdf
        base_name = os.path.splitext(filename)[0]
        pdf_filename = f"{base_name}.pdf"
        
        # Get raw_data directory
        base_dir = Path(__file__).parent.parent / "raw_data"

        # Search for PDF file in subdirectories
        for root, dirs, files in os.walk(base_dir):
            if pdf_filename in files:
                file_path = os.path.join(root, pdf_filename)
                logger.info(f"Serving PDF: {file_path}")
                return FileResponse(
                    file_path,
                    media_type="application/pdf",
                    headers={
                        "Content-Disposition": f"inline; filename={pdf_filename}"
                    }
                )

        raise HTTPException(status_code=404, detail=f"PDF not found: {pdf_filename}")

    except Exception as e:
        logger.error(f"Error viewing PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
