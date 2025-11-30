# FN Brno Virtual Assistant (Hackathon PoC)

## Project Overview
A RAG-based virtual assistant for University Hospital Brno (FN Brno) to help its 7500 employees navigate complex internal structures. The hospital has hundreds of organizational units and processes, making it difficult for employees to know who to contact or how to proceed with specific administrative tasks.

## Core Objectives
1.  **Signpost (Level 1):** Serve as a first point of contact to navigate employees on "How, Where, With Whom, and When" to solve specific situations.
2.  **Guide (Level 2):** Provide step-by-step guidance, variant procedures, or direct navigation to the correct system/document/person.
3.  **Unified Experience:** The robot must act as a single interface, masking the complexity of underlying systems.

## Current Implementation

### Architecture
- **Backend:** FastAPI application with RAG pipeline
- **Frontend:** React + Vite single-page application
- **Vector Database:** InterSystems IRIS with HNSW indexing
- **Embeddings:** OpenAI text-embedding-3-large (3072 dimensions)
- **LLM:** Configurable in `backend/config.py` (currently supports OpenAI models)
- **Language:** Czech (all data, prompts, and responses)

### Data Sources
The knowledge base is derived from a mix of structured and unstructured files in `raw_data/`:
-   **CSV/Excel (Structured):** Organizational structure, lists of processes, process owners (NI, CI departments), and responsibilities
-   **Word Docs (.docx):** Internal directives (e.g., Travel Expenses, Organizational Rules of specific clinics)

**Note:** Only .docx format is supported. Legacy .doc files must be converted to .docx before ingestion.

### Key Features
- Vector similarity search with configurable top-k results and relevance score thresholds
- Source attribution with document references and metadata
- Single-turn conversational interface
- Document download capability
- Chunking strategy: 500 characters with 100 character overlap

### Configuration
All application configuration is centralized in `backend/config.py`:
- Model selection (embedding and LLM models)
- RAG parameters (top_k_results, min_relevance_score)
- Database connection settings

Environment variables (`.env`) contain only secrets and environment-specific values:
- OPENAI_API_KEY
- IRIS database credentials (IRIS_PORT=32782, IRIS_PASSWORD=ISCDEMO)

**IMPORTANT:**
- IRIS_PORT must be 32782 (NOT 1972) - this is the Docker-mapped host port
- IRIS_PASSWORD must be ISCDEMO (NOT SYS) - this is the FHIR-AI-Hackathon-Kit default

### Key Scenarios Handled
-   "Co mám dělat, když si chci koupit nový mobil?" (IT purchase procedures)
-   "Jak si zařídit pracovní cestu? Mohu použít moje auto?" (Travel expense workflow & vehicle usage rules)
-   "Jaké procesy má oddělení CI?" (CI department processes)

## Resources
- InterSystems IRIS Vector Search Reference (NOT required for this project): https://github.com/intersystems-community/FHIR-AI-Hackathon-Kit
  - The FHIR-AI-Hackathon-Kit directory is included for reference only. This project implements its own vector search integration and does not depend on the kit.
- Additional documentation: https://docs.google.com/document/d/1Vd1ltLGVu0yFTqC8BLcWroGTwIXRB-9xUg9ux2rO8wI/edit?usp=sharing
- to memorize This is what the openAPI function calling looks like 

from openai import OpenAI
import json

client = OpenAI()

# 1. Define a list of callable tools for the model
tools = [
    {
        "type": "function",
        "name": "get_horoscope",
        "description": "Get today's horoscope for an astrological sign.",
        "parameters": {
            "type": "object",
            "properties": {
                "sign": {
                    "type": "string",
                    "description": "An astrological sign like Taurus or Aquarius",
                },
            },
            "required": ["sign"],
        },
    },
]

def get_horoscope(sign):
    return f"{sign}: Next Tuesday you will befriend a baby otter."

# Create a running input list we will add to over time
input_list = [
    {"role": "user", "content": "What is my horoscope? I am an Aquarius."}
]

# 2. Prompt the model with tools defined
response = client.responses.create(
    model="gpt-5",
    tools=tools,
    input=input_list,
)

# Save function call outputs for subsequent requests
input_list += response.output

for item in response.output:
    if item.type == "function_call":
        if item.name == "get_horoscope":
            # 3. Execute the function logic for get_horoscope
            horoscope = get_horoscope(json.loads(item.arguments))
            
            # 4. Provide function call results to the model
            input_list.append({
                "type": "function_call_output",
                "call_id": item.call_id,
                "output": json.dumps({
                  "horoscope": horoscope
                })
            })

print("Final input:")
print(input_list)

response = client.responses.create(
    model="gpt-5",
    instructions="Respond only with a horoscope generated by a tool.",
    tools=tools,
    input=input_list,
)

# 5. The model should be able to give a response!
print("Final output:")
print(response.model_dump_json(indent=2))
print("\n" + response.output_text)