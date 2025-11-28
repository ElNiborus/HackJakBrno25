# FN Brno Virtual Assistant (Hackathon PoC)

## Project Overview
Develop a virtual assistant for University Hospital Brno (FN Brno) to help its 7500 employees navigate complex internal structures. The hospital has hundreds of organizational units and processes, making it difficult for employees to know who to contact or how to proceed with specific administrative tasks.

## Core Objectives
1.  **Signpost (Level 1):** Serve as a first point of contact to navigate employees on "How, Where, With Whom, and When" to solve specific situations.
2.  **Guide (Level 2):** Provide step-by-step guidance, variant procedures, or direct navigation to the correct system/document/person.
3.  **Unified Experience:** The robot must act as a single interface, masking the complexity of underlying systems.

## Data Sources
The knowledge base is derived from a mix of structured and unstructured files:
-   **CSV/Excel (Structured):** Organizational structure, lists of processes, process owners (NI, CI departments), and responsibilities.
-   **Word Docs (Unstructured):** Internal directives (e.g., Travel Expenses, Organizational Rules of specific clinics).

## Immediate Task (PoC)
Build a **Single-Turn RAG (Retrieval-Augmented Generation)** prototype using a Vector Database. The vector database must be the InterSystems Vector Search (hackathon rules).
See relevant resources:
https://github.com/intersystems-community/FHIR-AI-Hackathon-Kit
https://github.com/intersystems-community/FHIR-AI-Hackathon-Kit/blob/main/Tutorial/2-Creating-Vector-DB.ipynb
https://github.com/intersystems-community/FHIR-AI-Hackathon-Kit/blob/main/Tutorial/3-Vector-Search-LLM-Prompting.ipynb
It doesn't have to use everything in the git repo above, but must use the vector search component.

**Key Scenarios to Handle:**
-   "Co mám dělat, když si chci koupit nový mobil?" (Who handles IT purchases?)
-   "Jak si zařídit pracovní cestu? Mohu použít moje auto?" (Travel expense workflow & rules).