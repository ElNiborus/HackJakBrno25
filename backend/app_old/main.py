from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models import QueryRequest, QueryResponse
from app.classifier import QueryClassifier, QueryType
from app.conversation import conversation_history
from app.rag import rag_retriever
from app.llm_service import LLMService
from app.logger import setup_logger

logger = setup_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Query API",
    description="Backend API for handling chat and RAG queries with conversation history",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
classifier = QueryClassifier()
llm_service = LLMService()


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "AI Query API is running"}


@app.post("/query", response_model=QueryResponse)
async def handle_query(request: QueryRequest):
    """
    Main endpoint for handling user queries.
    
    This endpoint:
    1. Classifies the query as either 'chat' or 'rag'
    2. If RAG: retrieves relevant context from the knowledge base
    3. Generates a response using the LLM with conversation history
    4. Stores the conversation for future context
    
    Args:
        request: QueryRequest containing the user's query
        
    Returns:
        QueryResponse with the generated response and metadata
    """
    try:
        user_query = request.query
        logger.info(f"Received query: {user_query[:100]}...")  # Log first 100 chars
        
        # Step 1: Classify the query
        query_type = await classifier.classify_query(user_query)
        logger.info(f"Query classified as: {query_type.value}")
        
        # Step 2: Retrieve RAG context if needed
        rag_context = None
        used_rag = False
        
        if query_type == QueryType.RAG:
            # Retrieve relevant context from RAG
            logger.info("Retrieving RAG context...")
            retrieved_docs = await rag_retriever.retrieve_context(user_query)
            logger.info(f"Retrieved {len(retrieved_docs)} documents")
            
            # Format the context for the LLM
            if retrieved_docs:
                rag_context = "\n\n".join([
                    f"[Source: {doc.get('source', 'Unknown')}]\n{doc['content']}"
                    for doc in retrieved_docs
                ])
                used_rag = True
        
        # Step 3: Get conversation history
        history = conversation_history.get_context_window(max_messages=10)
        
        # Step 4: Generate response using LLM
        logger.info("Generating LLM response...")
        response = await llm_service.generate_response(
            user_query=user_query,
            conversation_history=history,
            context=rag_context
        )
        logger.info("Response generated successfully")
        
        # Step 5: Store in conversation history
        conversation_history.add_message("user", user_query)
        conversation_history.add_message("assistant", response)
        
        # Return the response
        return QueryResponse(
            response=response,
            query_type=query_type.value,
            used_rag_context=used_rag
        )
        
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@app.post("/clear-history")
async def clear_conversation_history():
    """
    Clear the conversation history.
    
    Useful for starting a fresh conversation.
    """
    conversation_history.clear()
    logger.info("Conversation history cleared")
    return {"status": "ok", "message": "Conversation history cleared"}


@app.get("/history")
async def get_conversation_history():
    """
    Get the full conversation history.
    
    Returns all messages with timestamps.
    """
    return {
        "history": conversation_history.get_full_history()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
