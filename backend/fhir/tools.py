"""FHIR tool definitions for OpenAI tool calling with GPT-5-mini."""

# FHIR Patient search tool definition for OpenAI Responses API
FHIR_PATIENT_SEARCH_TOOL = {
    "type": "function",
    "name": "search_fhir_patients",
    "description": "Search for patients in FHIR database using standard FHIR R4 parameters. Use Czech language queries to extract appropriate search parameters.",
    "parameters": {
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "Patient name search (matches both family and given names)"
            },
            "family": {
                "type": "string",
                "description": "Patient family name (surname, příjmení)"
            },
            "given": {
                "type": "string",
                "description": "Patient given name (first name, křestní jméno)"
            },
            "birthdate": {
                "type": "string",
                "description": "Birth date in YYYY-MM-DD format or date range (e.g., 'ge2022-01-01&le2025-12-31' for years 2022-2025, 'le2000-01-01' for before 2000, 'ge1990-01-01' for after 1990, '1980' for specific year)"
            },
            "gender": {
                "type": "string",
                "enum": ["male", "female", "other", "unknown"],
                "description": "Patient gender (male=muž, female=žena)"
            },
            "identifier": {
                "type": "string",
                "description": "Patient identifier or medical record number"
            }
        },
        "required": []
    }
}

def get_fhir_tools():
    """Return list of available FHIR tools for OpenAI tool calling."""
    return [FHIR_PATIENT_SEARCH_TOOL]