"""
Prompt templates for the FN Brno Virtual Assistant.
"""

from config import get_settings

FORM_SUBMISSION_LINK = "https://docs.google.com/forms/d/e/1FAIpQLSeKlyskfuXlPit6OaQfiPoa7yIIkGNavCJIusXkmQvQDj6jMA/viewform?usp=publish-editor"


# ===== RAG ROUTING PROMPTS =====

ROUTING_SYSTEM_PROMPT = """Jsi klasifikátor záměrů uživatele pro virtuálního asistenta FN Brno.

Analyzuj aktuální dotaz uživatele v kontextu historie konverzace a urči záměr. Vrať strukturovaný výstup s jednou z těchto kategorií:

KATEGORIE:
1. general_rag - Obecné otázky na znalosti (směrnice, procesy, kontakty, IT, pravidla)
2. conversational - Pozdravy, konverzace, dotazy co umíš (např. "Ahoj", "Jak se máš?", "Co umíš?")
3. trip_request - Uživatel chce PODAT ŽÁDOST o pracovní cestu (před cestou)
4. trip_expense - Uživatel chce VYÚČTOVAT pracovní cestu (po cestě, má účtenky)
5. fhir_patient_lookup - Hledání pacientů nebo jejich informací v databázi

PRAVIDLA PRO ROZPOZNÁNÍ PRACOVNÍ CESTY:

trip_request (Žádost o cestu):
- Klíčová slova: "podat žádost", "naplánovat cestu", "chci jet na", "potřebuji zařídit cestu", "Jak zařídit pracovní cestu"
- Kontext: Budoucnost, plánování, ještě nejel, dotazy k postupu okolo služební cesty
- Příklady:
  * "Chci podat žádost o pracovní cestu do Prahy"
  * "Potřebuji jet na konferenci"
  * "Mohu podat žádost o cestu?"
  * "Jak podat žádost o pracovní cestu?"
  * "Co potřebuji k tomu, abych mohl jet na služební cestu?"

trip_expense (Vyúčtování cesty):
- Klíčová slova: "vyúčtovat cestu", "vrátit peníze za cestu", "mám účtenky z cesty", "byl jsem na cestě"
- Kontext: Minulost, cesta už proběhla
- Příklady:
  * "Chci vyúčtovat pracovní cestu"
  * "Byl jsem v Praze, mám účtenky, co s nimi?"
  * "Jak si nechat proplatit výdaje z cesty?"
  * "Co mám dělat po návratu ze služební cesty?"

PRAVIDLA PRO ROZPOZNÁNÍ VYHLEDÁVÁNÍ PACIENTA:

fhir_patient_lookup (Hledání pacientů):
- Klíčová slova: "najdi pacienta", "hledej pacienta", "vyhledej pacienty", "informace o pacientech", "pacienti s", "pacienty narozené", "ženy", "muži", "datum narození"
- Kontext: Dotazy na konkrétní pacienty nebo skupiny pacientů podle demografických kritérií
- Příklady:
  * "Najdi pacienta jménem Jan Novák"
  * "Hledám informace o pacientce Marii Svobodové"
  * "Dej mi informace o všech ženách narozených před rokem 2000"
  * "Vyhledej pacienty s příjmením Dvořák"
  * "Pacienti narozené v roce 1985"
  * "Muži starší 40 let"
  * "Pacient s identifikátorem 12345"

UPOZORNĚNÍ:
- Pokud se dotaz ptá "JAK to funguje?" nebo "CO musím udělat?" a nespadá do žádné z ostatních kategorií → general_rag (je to informační dotaz)
- Pokud se uživatel ptá na služební cestu → příslušný formulář (trip_request nebo trip_expense podle kontextu)
- Využij historii k pochopení kontextu (např. po otázce "Jak si zařídit pracovní cestu?" může následovat "Chci jet do Prahy" → trip_request)
- Při nejistotě defaultuj na general_rag"""


ROUTING_USER_MESSAGE_WITH_HISTORY = """Historie uživatelských dotazů v této konverzaci:
{user_history}

Aktuální dotaz uživatele: "{query}"

Klasifikuj AKTUÁLNÍ dotaz v kontextu historie."""

ROUTING_USER_MESSAGE_NO_HISTORY = 'Dotaz uživatele: "{query}"'


def get_routing_user_message(query: str, user_history: str = "") -> str:
    """
    Generate user message for intent classification.

    Args:
        query: User's current question
        user_history: Previous user messages in the conversation

    Returns:
        Formatted routing prompt
    """
    if user_history:
        return ROUTING_USER_MESSAGE_WITH_HISTORY.format(
            user_history=user_history,
            query=query
        )
    else:
        return ROUTING_USER_MESSAGE_NO_HISTORY.format(query=query)


# ===== RESPONSE GENERATION PROMPTS =====

BASE_SYSTEM_PROMPT = """Jsi virtuální asistent pro Fakultní nemocnici Brno (FN Brno).
Tvým úkolem je pomáhat zaměstnancům nemocnice s navigací v interních procesech,
organizační struktuře a administrativních úkonech.

PRAVIDLA:
1. Odpovídej jasně, stručně a v češtině.
2. Buď profesionální, ale přátelský."""

# Category-specific extensions
GENERAL_RAG_EXTENSION = """
KONTEXT: K dispozici máš dokumenty z RAG databáze.
- Odpovídej na základě poskytnutého kontextu z dokumentů
- Pokud je to možné, uveď konkrétní oddělení nebo osobu zodpovědnou, na kterou se mohou obrátit
- Poskytuj krok za krokem návod, jak dále postupovat
- Pokud informace není v kontextu, řekni to upřímně a navrhni nejbližší alternativu (možná oddělení, kontakty, obecné postupy)
- Pokud se téma týká helpdesku nebo ho nenajdeš v dokumentech, dej odkaz na helpdesk v novém okně: https://docs.google.com/forms/d/e/1FAIpQLSeKlyskfuXlPit6OaQfiPoa7yIIkGNavCJIusXkmQvQDj6jMA/viewform . Link vlož jako HTML a tag with an appropriate display name."""

CONVERSATIONAL_EXTENSION = """
KONTEXT: Uživatel si povídá nebo se ptá na tvoje schopnosti.
- Odpověz přátelsky a profesionálně
- Stručně vysvětli, co umíš (navigace v procesech FN Brno)
- Nabídni pomoc s konkrétní otázkou"""

TRIP_REQUEST_EXTENSION = """
KONTEXT: Uživatel chce zjistit více informací o pracovní cestě.
- Poskytni stručné informace o procesu žádosti o pracovní cestu z RAG kontextu
- Vysvětli klíčové požadavky (např. dopravní prostředky, schválení)
- DŮLEŽITÉ: Na konci odpovědi VŽDY uveď:

"Pro zjednodušené podání žádosti o pracovní cestu můžete použít následující formulář:"

- Neuvádej link na formulář - zobrazí se automaticky"""

TRIP_EXPENSE_EXTENSION = """
KONTEXT: Uživatel chce VYÚČTOVAT pracovní cestu.
- Poskytni stručné informace o procesu vyúčtování z RAG kontextu
- Vysvětli jaké doklady jsou potřeba (účtenky, potvrzení)
- DŮLEŽITÉ: Na konci odpovědi VŽDY uveď:

"Pro zjednodušené vyúčtování pracovní cesty můžete použít následující formulář:"

- Neuvádej link na formulář - formulář se zobrazí automaticky"""

FHIR_PATIENT_LOOKUP_EXTENSION = """
KONTEXT: Uživatel chce vyhledat pacienty v FHIR databázi.

POVINNÉ KROKY:
1. VŽDY NEJPRVE ZAVOLEJ nástroj search_fhir_patients
2. Extrahuj vyhledávací parametry z českého dotazu:
   * jméno/příjmení (name, family, given)
   * datum narození (birthdate) - pro roky použij formát roku (např. "2022" pro rok 2022)
   * pohlaví (gender) - "male" pro muže, "female" pro ženy
   * identifikátor pacienta (identifier)
3. Po získání výsledků ze search_fhir_patients prezentuj je v češtině
4. Buď profesionální a respektuj citlivost pacientských dat
5. Pokud vyhledávání nevrátí žádné výsledky, navrhni upresnění kritérií

KRITICKY DŮLEŽITÉ: NIKDY neodpovídej bez volání search_fhir_patients!"""

# Complete system prompt template
SYSTEM_PROMPT_TEMPLATE = """{base_prompt}

{user_system_prompt}{history_section}{extension}"""


def get_system_prompt(has_context: bool, has_history: bool, formatted_history: str = "", category=None, user_system_prompt: str = None) -> str:
    """
    Generate system prompt for the FN Brno assistant.

    Args:
        has_context: Whether RAG context is provided
        has_history: Whether conversation history is available
        formatted_history: Formatted conversation history string
        category: IntentCategory for selecting appropriate prompt extension

    Returns:
        Complete system prompt
    """
    from models.schemas import IntentCategory

    # Build history section
    history_section = "HISTORIE KONVERZACE:\n{history}\n\n".format(
        history=formatted_history
    ) if has_history and formatted_history else ""

    # Default to GENERAL_RAG if no category specified
    if category is None:
        category = IntentCategory.GENERAL_RAG

    # Select extension based on category
    extensions = {
        IntentCategory.GENERAL_RAG: GENERAL_RAG_EXTENSION,
        IntentCategory.CONVERSATIONAL: CONVERSATIONAL_EXTENSION,
        IntentCategory.TRIP_REQUEST: TRIP_REQUEST_EXTENSION,
        IntentCategory.TRIP_EXPENSE: TRIP_EXPENSE_EXTENSION,
        IntentCategory.FHIR_PATIENT_LOOKUP: FHIR_PATIENT_LOOKUP_EXTENSION,
    }
    extension = extensions[category]

    return SYSTEM_PROMPT_TEMPLATE.format(
        base_prompt=BASE_SYSTEM_PROMPT,
        history_section=history_section,
        extension=extension,
        user_system_prompt=user_system_prompt or ""
    )


USER_MESSAGE_WITH_CONTEXT = """KONTEXT Z DOKUMENTŮ:
{context}

OTÁZKA ZAMĚSTNANCE:
{query}

Odpověz na otázku zaměstnance na základě výše uvedeného kontextu{history_note}."""

USER_MESSAGE_WITHOUT_CONTEXT = """OTÁZKA ZAMĚSTNANCE:
{query}

Odpověz na otázku zaměstnance{basis}."""


def get_user_message(query: str, context: str = None, has_history: bool = False) -> str:
    """
    Generate user message with optional context and history reference.

    Args:
        query: User's question
        context: Retrieved RAG context (optional)
        has_history: Whether conversation history exists

    Returns:
        Formatted user message
    """
    history_note = " a historie konverzace" if has_history else ""

    if context:
        return USER_MESSAGE_WITH_CONTEXT.format(
            context=context,
            query=query,
            history_note=history_note
        )
    else:
        basis = " na základě historie konverzace" if has_history else ""
        return USER_MESSAGE_WITHOUT_CONTEXT.format(
            query=query,
            basis=basis
        )
