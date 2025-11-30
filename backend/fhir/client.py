"""FHIR client for interacting with Patient endpoint."""

import requests
import logging
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin, urlencode
from config import Settings

logger = logging.getLogger(__name__)


class FHIRClient:
    """Client for FHIR Patient endpoint interactions."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.base_url = settings.fhir_base_url
        self.patient_endpoint = settings.fhir_patient_endpoint
        self.timeout = settings.fhir_timeout
        self.max_results = settings.fhir_max_results

    def search_patients(self, search_params: Dict[str, str]) -> List[Dict[str, Any]]:
        """
        Search for patients using FHIR Patient endpoint.

        Args:
            search_params: Dictionary of FHIR search parameters

        Returns:
            List of patient data dictionaries
        """
        try:
            # Build the full URL
            full_url = urljoin(self.base_url, self.patient_endpoint.lstrip('/'))

            # Process and clean search parameters
            params = self._process_search_parameters(search_params)

            # Add _count parameter to limit results
            if '_count' not in params:
                params['_count'] = str(self.max_results)

            logger.info(f"Making FHIR Patient search request to {full_url} with params: {params}")

            # Make the HTTP request
            response = requests.get(
                full_url,
                params=params,
                timeout=self.timeout,
                headers={'Accept': 'application/json'}
            )

            # Log the full URL for debugging
            logger.info(f"Full request URL: {response.url}")

            # Check for HTTP errors
            response.raise_for_status()

            # Parse JSON response
            data = response.json()

            # Extract patient entries from FHIR Bundle
            patients = self._extract_patients_from_bundle(data)

            logger.info(f"FHIR search returned {len(patients)} patients")
            return patients

        except requests.exceptions.Timeout:
            logger.error("FHIR request timed out")
            raise FHIRTimeoutError("FHIR server request timed out")

        except requests.exceptions.ConnectionError:
            logger.error("Failed to connect to FHIR server")
            raise FHIRConnectionError("Cannot connect to FHIR server")

        except requests.exceptions.HTTPError as e:
            logger.error(f"FHIR HTTP error: {e}")
            if e.response.status_code == 400:
                raise FHIRBadRequestError("Invalid search parameters")
            elif e.response.status_code == 404:
                raise FHIRNotFoundError("FHIR endpoint not found")
            else:
                raise FHIRServerError(f"FHIR server error: {e}")

        except Exception as e:
            logger.error(f"Unexpected FHIR error: {e}")
            raise FHIRError(f"Unexpected error: {e}")

    def _process_search_parameters(self, search_params: Dict[str, str]) -> Dict[str, str]:
        """Process and format FHIR search parameters."""
        processed_params = {}

        for key, value in search_params.items():
            if not value or value.strip() == "":
                continue  # Skip empty parameters

            if key == 'birthdate':
                # Handle date range formatting for FHIR R4
                processed_value = self._format_birthdate_parameter(value)
                if processed_value:
                    processed_params[key] = processed_value
            else:
                processed_params[key] = value.strip()

        return processed_params

    def _format_birthdate_parameter(self, birthdate_value: str) -> Optional[str]:
        """
        Format birthdate parameter for FHIR R4 compatibility.

        Handles ranges like:
        - 'ge2022-01-01&le2025-12-31' (for years 2022-2025)
        - 'le2000-01-01' (before 2000)
        - 'ge1990-01-01' (after 1990)
        - '1980' (specific year)
        - '1980-05-15' (specific date)
        """
        if not birthdate_value:
            return None

        # Clean the value
        value = birthdate_value.strip()

        # Handle range formats like 'ge2022-01-01&le2025-12-31'
        if '&' in value:
            # Split range and return as-is (already formatted)
            return value

        # Handle prefixed ranges like 'ge2022-01-01' or 'le2000-01-01'
        if value.startswith(('ge', 'le', 'gt', 'lt', 'eq', 'ne')):
            return value

        # Handle year-only format like '1980' or '2022'
        if len(value) == 4 and value.isdigit():
            year = int(value)
            # For a specific year, search from Jan 1 to Dec 31
            return f"ge{year}-01-01&le{year}-12-31"

        # Handle full date format like '1980-05-15'
        if len(value) == 10 and value.count('-') == 2:
            # For specific date, search for exact date
            return f"eq{value}"

        # Return original value if no special formatting needed
        return value

    def _extract_patients_from_bundle(self, bundle: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract patient data from FHIR Bundle response."""
        patients = []

        if bundle.get('resourceType') != 'Bundle':
            logger.warning(f"Expected Bundle, got {bundle.get('resourceType')}")
            return patients

        entries = bundle.get('entry', [])

        for entry in entries:
            resource = entry.get('resource', {})
            if resource.get('resourceType') == 'Patient':
                patient_data = self._format_patient_data(resource)
                patients.append(patient_data)

        return patients

    def _format_patient_data(self, patient: Dict[str, Any]) -> Dict[str, Any]:
        """Format patient resource into simplified structure."""
        formatted = {
            'id': patient.get('id', ''),
            'name': self._format_patient_name(patient.get('name', [])),
            'birthdate': patient.get('birthDate', ''),
            'gender': patient.get('gender', ''),
            'telecom': self._format_telecom(patient.get('telecom', [])),
            'identifier': self._format_identifiers(patient.get('identifier', []))
        }

        return formatted

    def _format_patient_name(self, names: List[Dict[str, Any]]) -> str:
        """Format patient name from FHIR name array."""
        if not names:
            return ""

        # Use first name in array
        name = names[0]
        family = ' '.join(name.get('family', [])) if isinstance(name.get('family'), list) else name.get('family', '')
        given = ' '.join(name.get('given', [])) if isinstance(name.get('given'), list) else ' '.join(name.get('given', []))

        parts = []
        if given:
            parts.append(given)
        if family:
            parts.append(family)

        return ' '.join(parts)

    def _format_telecom(self, telecom: List[Dict[str, Any]]) -> List[str]:
        """Format telecom information."""
        contacts = []
        for contact in telecom:
            system = contact.get('system', '')
            value = contact.get('value', '')
            if value:
                if system:
                    contacts.append(f"{system}: {value}")
                else:
                    contacts.append(value)
        return contacts

    def _format_identifiers(self, identifiers: List[Dict[str, Any]]) -> List[str]:
        """Format patient identifiers."""
        ids = []
        for identifier in identifiers:
            system = identifier.get('system', '')
            value = identifier.get('value', '')
            if value:
                if 'medical-record' in system.lower() or 'mrn' in system.lower():
                    ids.append(f"MRN: {value}")
                else:
                    ids.append(value)
        return ids

    def format_patients_for_czech_response(self, patients: List[Dict[str, Any]]) -> str:
        """Format patient list as natural Czech language text."""
        if not patients:
            return "Nebyli nalezeni žádní pacienti odpovídající zadaným kritériím."

        result_lines = [f"Nalezeno {len(patients)} pacientů:"]
        result_lines.append("")

        for i, patient in enumerate(patients, 1):
            name = patient.get('name', 'Neznámé jméno')
            result_lines.append(f"{i}. {name}")

            # Add birth date if available
            birthdate = patient.get('birthdate', '')
            if birthdate:
                try:
                    # Format date from YYYY-MM-DD to Czech format
                    from datetime import datetime
                    dt = datetime.strptime(birthdate, '%Y-%m-%d')
                    formatted_date = dt.strftime('%d.%m.%Y')
                    result_lines.append(f"   • Datum narození: {formatted_date}")
                except:
                    result_lines.append(f"   • Datum narození: {birthdate}")

            # Add gender if available
            gender = patient.get('gender', '')
            if gender:
                gender_czech = {
                    'male': 'muž',
                    'female': 'žena',
                    'other': 'jiné',
                    'unknown': 'neznámé'
                }.get(gender.lower(), gender)
                result_lines.append(f"   • Pohlaví: {gender_czech}")

            # Add identifiers if available
            identifiers = patient.get('identifier', [])
            for identifier in identifiers:
                result_lines.append(f"   • Identifikátor: {identifier}")

            # Add contact info if available
            telecom = patient.get('telecom', [])
            for contact in telecom:
                result_lines.append(f"   • Kontakt: {contact}")

            result_lines.append("")  # Empty line between patients

        result_lines.append(f"Celkem nalezeno: {len(patients)} pacientů")

        return '\n'.join(result_lines)


# FHIR-specific exceptions
class FHIRError(Exception):
    """Base FHIR error."""
    pass

class FHIRConnectionError(FHIRError):
    """FHIR connection error."""
    pass

class FHIRTimeoutError(FHIRError):
    """FHIR timeout error."""
    pass

class FHIRBadRequestError(FHIRError):
    """FHIR bad request error."""
    pass

class FHIRNotFoundError(FHIRError):
    """FHIR not found error."""
    pass

class FHIRServerError(FHIRError):
    """FHIR server error."""
    pass