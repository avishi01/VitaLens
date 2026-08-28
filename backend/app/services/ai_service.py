"""
Local AI service for VitaLens.

Uses LangChain's Ollama integration to talk to a locally-running Ollama
instance only. No cloud LLM APIs (OpenAI, Gemini, Claude, Groq, etc.) are
used or configured anywhere in this module.

This service builds prompts strictly from the structured parameter data
already extracted and stored by the existing report pipeline (see
app/services/parameter_extractor.py). It never invents values or reference
ranges that weren't already extracted.
"""

import httpx
from ollama import ResponseError
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import settings


class AIServiceUnavailableError(Exception):
    """Raised when the local Ollama server cannot be reached at all."""


class AIServiceTimeoutError(Exception):
    """Raised when the local model takes too long to respond."""


class AIServiceModelError(Exception):
    """Raised when the configured model is missing/unusable, or the
    response is empty/malformed."""


REQUEST_TIMEOUT_SECONDS = 90


def _get_llm() -> ChatOllama:
    return ChatOllama(
        model=settings.ollama_model,
        base_url=settings.ollama_base_url,
        temperature=0.2,
        client_kwargs={"timeout": REQUEST_TIMEOUT_SECONDS},
    )


def _invoke(system_prompt: str, user_prompt: str) -> str:
    llm = _get_llm()

    try:
        response = llm.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ]
        )
    except httpx.ConnectError as e:
        raise AIServiceUnavailableError(
            "Could not connect to the local Ollama server. "
            "Make sure Ollama is running."
        ) from e
    except httpx.TimeoutException as e:
        raise AIServiceTimeoutError(
            "The local model took too long to respond."
        ) from e
    except ResponseError as e:
        # Raised by the ollama client for things like "model not found".
        raise AIServiceModelError(str(e)) from e
    except Exception as e:
        raise AIServiceModelError(
            f"The local AI model returned an unexpected error: {e}"
        ) from e

    content = getattr(response, "content", None)

    if not content or not content.strip():
        raise AIServiceModelError(
            "The local AI model returned an empty response."
        )

    return content.strip()


def _normalize_parameter(entry):
    """Handles both the legacy flat-number shape and the enriched
    {value, unit, reference_low, reference_high, status} shape, without
    inventing any missing fields."""
    if entry is None:
        return None

    if isinstance(entry, (int, float)):
        return {
            "value": entry,
            "unit": None,
            "reference_low": None,
            "reference_high": None,
            "status": "Unknown",
        }

    if isinstance(entry, dict):
        return {
            "value": entry.get("value"),
            "unit": entry.get("unit"),
            "reference_low": entry.get("reference_low"),
            "reference_high": entry.get("reference_high"),
            "status": entry.get("status") or "Unknown",
        }

    return None


PARAMETER_LABELS = {
    "hemoglobin": "Hemoglobin",
    "rbc": "RBC Count",
    "pcv": "PCV",
    "mcv": "MCV",
    "mch": "MCH",
    "mchc": "MCHC",
    "platelets": "Platelets",
    "total_count": "Total WBC Count",
    "neutrophils": "Neutrophils",
    "lymphocytes": "Lymphocytes",
    "monocytes": "Monocytes",
    "eosinophils": "Eosinophils",
    "basophils": "Basophils",
}


def _format_parameters_block(extracted_parameters: dict) -> str:
    """Renders the extracted parameters as a plain, explicit fact list for
    the prompt -- exactly what was extracted, nothing inferred."""
    lines = []

    for key, raw_entry in (extracted_parameters or {}).items():
        normalized = _normalize_parameter(raw_entry)
        if normalized is None or normalized["value"] is None:
            continue

        label = PARAMETER_LABELS.get(key, key)
        value_str = str(normalized["value"])
        if normalized["unit"]:
            value_str += f" {normalized['unit']}"

        if normalized["reference_low"] is not None and normalized["reference_high"] is not None:
            range_str = f"{normalized['reference_low']} - {normalized['reference_high']}"
        else:
            range_str = "not available"

        lines.append(
            f"- {label}: value = {value_str}; reference range = {range_str}; "
            f"status = {normalized['status']}"
        )

    if not lines:
        return "(No parameters were available to include.)"

    return "\n".join(lines)


SAFETY_INSTRUCTIONS = (
    "You are an educational assistant inside VitaLens, a personal health "
    "information tool. You are NOT a doctor and must never behave like one.\n\n"
    "Strict rules you must always follow:\n"
    "- Only use the exact values, units, reference ranges, and statuses given "
    "to you below. Never invent, estimate, or guess a value or reference "
    "range that wasn't provided.\n"
    "- If a parameter has no reference range or an 'Unknown' status, say "
    "clearly that a range wasn't available or reliably extracted, and "
    "recommend the person check the original report -- do not silently "
    "fill it in.\n"
    "- If a value looks medically implausible (e.g. wildly outside any "
    "realistic human range), say it may be an extraction/OCR error and "
    "should be verified against the original report, rather than treating "
    "it as fact.\n"
    "- Never diagnose a disease or medical condition.\n"
    "- Never prescribe or suggest medication, dosages, or specific "
    "treatments.\n"
    "- Never claim medical certainty. Use cautious, educational language "
    "(e.g. 'this may indicate', 'this is often associated with', "
    "'worth discussing with a doctor').\n"
    "- Clearly separate the extracted facts (what the report actually says) "
    "from general educational background (what a parameter generally "
    "represents), so the reader can tell which is which.\n"
    "- End your response by reminding the reader this is educational "
    "information only and not a substitute for professional medical advice."
)


def explain_report(extracted_parameters: dict) -> str:
    parameters_block = _format_parameters_block(extracted_parameters)

    user_prompt = (
        "Here are the blood parameters extracted from a patient's report:\n\n"
        f"{parameters_block}\n\n"
        "Explain what each of these parameters generally represents, and "
        "what the reported values and statuses mean in plain, "
        "patient-friendly language. Clearly mark which parts are the "
        "extracted facts from this specific report and which parts are "
        "general educational background."
    )

    return _invoke(SAFETY_INSTRUCTIONS, user_prompt)


def generate_doctor_questions(extracted_parameters: dict) -> str:
    parameters_block = _format_parameters_block(extracted_parameters)

    user_prompt = (
        "Here are the blood parameters extracted from a patient's report:\n\n"
        f"{parameters_block}\n\n"
        "Generate a short list of clear, useful questions this patient "
        "could ask their doctor about this report. Base the questions on "
        "the actual values and statuses above. Do not diagnose any "
        "condition and do not suggest treatments -- only generate "
        "questions for the patient to ask."
    )

    return _invoke(SAFETY_INSTRUCTIONS, user_prompt)


def generate_comparison_summary(
    older_parameters: dict,
    newer_parameters: dict,
    older_date: str,
    newer_date: str,
) -> str:
    older_block = _format_parameters_block(older_parameters)
    newer_block = _format_parameters_block(newer_parameters)

    user_prompt = (
        f"Here are two of the same patient's blood reports.\n\n"
        f"Older report ({older_date}):\n{older_block}\n\n"
        f"Newer report ({newer_date}):\n{newer_block}\n\n"
        "Summarize the important changes between the older and newer "
        "report -- what increased, what decreased, and what stayed "
        "similar. Only discuss parameters that are present in the data "
        "above; if a parameter is missing from one report, say so rather "
        "than guessing its value. Do not draw any medical conclusions or "
        "diagnose based on these changes -- you may suggest general "
        "questions the patient could raise with their doctor about "
        "notable changes."
    )

    return _invoke(SAFETY_INSTRUCTIONS, user_prompt)
