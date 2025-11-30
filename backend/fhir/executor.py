"""Tool execution handler for FHIR operations."""

import json
import logging
from typing import Dict, Any, List
from fhir.client import FHIRClient, FHIRError
from config import get_settings

logger = logging.getLogger(__name__)


class FHIRToolExecutor:
    """Executes FHIR tool calls from OpenAI tool calling."""

    def __init__(self, fhir_client: FHIRClient):
        self.fhir_client = fhir_client

    def execute_tool_call(self, tool_call: Any) -> str:
        """
        Execute a single FHIR tool call.

        Args:
            tool_call: OpenAI tool call object

        Returns:
            String result of the tool execution (formatted for Czech response)
        """
        function_name = tool_call.function.name

        try:
            # Parse arguments from the tool call
            arguments = json.loads(tool_call.function.arguments)
            logger.info(f"Executing FHIR tool: {function_name} with arguments: {arguments}")

            if function_name == "search_fhir_patients":
                return self._execute_patient_search(arguments)
            else:
                logger.error(f"Unknown FHIR tool function: {function_name}")
                return f"Chyba: Neznámá funkce '{function_name}'"

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse tool call arguments: {e}")
            return "Chyba: Neplatné parametry vyhledávání"

        except FHIRError as e:
            logger.error(f"FHIR error during tool execution: {e}")
            return f"Chyba při vyhledávání pacientů: {str(e)}"

        except Exception as e:
            logger.error(f"Unexpected error during tool execution: {e}")
            return "Došlo k neočekávané chybě při vyhledávání pacientů"

    def _execute_patient_search(self, arguments: Dict[str, Any]) -> str:
        """
        Execute FHIR patient search.

        Args:
            arguments: Search parameters from tool call

        Returns:
            Formatted Czech response with patient data
        """
        # Remove empty/None values from search parameters
        search_params = {k: v for k, v in arguments.items() if v is not None and v != ""}

        logger.info(f"Searching FHIR patients with parameters: {search_params}")

        # Execute search via FHIR client
        patients = self.fhir_client.search_patients(search_params)

        # Format results for Czech response
        formatted_response = self.fhir_client.format_patients_for_czech_response(patients)

        logger.info(f"FHIR search completed, found {len(patients)} patients")

        return formatted_response

    def execute_tool_calls(self, tool_calls: List[Any]) -> List[str]:
        """
        Execute multiple FHIR tool calls.

        Args:
            tool_calls: List of OpenAI tool call objects

        Returns:
            List of formatted results
        """
        results = []
        for tool_call in tool_calls:
            result = self.execute_tool_call(tool_call)
            results.append(result)

        return results