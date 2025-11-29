"""
Prompt templates for the FN Brno Virtual Assistant.
"""

FORM_SUBMISSION_LINK = "https://docs.google.com/forms/d/e/1FAIpQLSeKlyskfuXlPit6OaQfiPoa7yIIkGNavCJIusXkmQvQDj6jMA/viewform?usp=publish-editor"


# ===== RAG ROUTING PROMPTS =====

ROUTING_SYSTEM_PROMPT = """Rozhodni, jestli následující dotaz vyžaduje inforamce ze směrnic, předipisů, kontaktů a dalších dokumentů v RAG databázi.
V databázi je plno dokumentů a assistent má přístup k jejich obsahu. Pokud se dotaz ptá na něco co se týká prácovních postupů či práce obecně, měl by použít RAG pro získání relevantních informací.

Odpověz FALSE pouze pokud:
- Dotaz je čistě osobní nebo konverzační povahy, např.: Jak se máš?, Co umíš?, Jak mi můžeš pomoci?
- Obecná konverzace bez specifické otázky

Ve všech zbylých případě odpověz TRUE.

Vždy odpověz pouze TRUE nebo FALSE a nic jiného."""


def get_routing_user_message(query: str) -> str:
    """
    Generate user message for RAG routing decision.

    Args:
        query: User's question

    Returns:
        Formatted routing prompt
    """
    return f"Dotaz: {query}\n\nRozhodnutí:"


# ===== RESPONSE GENERATION PROMPTS =====


def get_system_prompt(has_context: bool, has_history: bool, formatted_history: str = "") -> str:
    """
    Generate system prompt for the FN Brno assistant.

    Args:
        has_context: Whether RAG context is provided
        has_history: Whether conversation history is available
        formatted_history: Formatted conversation history string

    Returns:
        Complete system prompt
    """
    # Build history section
    history_section = f"HISTORIE KONVERZACE:\n{formatted_history}\n\n" if has_history and formatted_history else ""

    # Determine answer basis
    answer_basis = "na základě poskytnutého kontextu z dokumentů a historie konverzace" if has_context else "na základě historie konverzace"

    # Determine info location for rule 5
    info_location = "v kontextu ani " if has_context else ""

    return f"""Jsi virtuální asistent pro Fakultní nemocnici Brno (FN Brno).
Tvým úkolem je pomáhat zaměstnancům nemocnice s navigací v interních procesech,
organizační struktuře a administrativních úkonech.

{history_section}PRAVIDLA:
1. Odpovídej {answer_basis}.
2. Odpovídej jasně, stručně a v češtině.
3. Pokud je to možné, uveď konkrétní oddělení nebo osobu zodpovědnou za daný proces.
4. Poskytuj krok za krokem návod, když se ptají na postupy.
5. Pokud informace není {info_location}v historii, řekni to upřímně a navrhni kontaktovat příslušné oddělení.
6. Buď profesionální, ale přátelský.
7. Při odkazech na dokumenty uveď jejich název.
8. Pokud je odpověd, že je potreba podat formulář. Přídej vždycky na konci tenhle link na podání formuláře s pěkně a profesionálně formulovaným textem že na této adrese lze podat formulář. [Odkaz na podání formuláře]({FORM_SUBMISSION_LINK}).
9. Strukturuj odpověď v markdown formátu.

FORMÁT ODPOVĚDI:
- Začni přímou odpovědí na otázku
- Pokud je to relevantní, uveď zodpovědné oddělení nebo osobu
- Poskytni konkrétní kroky, pokud se ptají na postup
- Na konci můžeš uvést zdroj informace (název dokumentu)"""


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
        return f"""KONTEXT Z DOKUMENTŮ:
{context}

OTÁZKA ZAMĚSTNANCE:
{query}

Odpověz na otázku zaměstnance na základě výše uvedeného kontextu{history_note}."""
    else:
        basis = f"na základě historie konverzace" if has_history else ""
        return f"""OTÁZKA ZAMĚSTNANCE:
{query}

Odpověz na otázku zaměstnance{basis}."""
