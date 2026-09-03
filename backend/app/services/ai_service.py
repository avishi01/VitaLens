"""
Local AI service for VitaLens.

Uses the Ollama Python client directly so Qwen3's native think=False
parameter is explicitly passed to Ollama.

No cloud LLM APIs are used.
"""

import re

import httpx
from ollama import Client, ResponseError

from app.core.config import settings


class AIServiceUnavailableError(Exception):
    pass


class AIServiceTimeoutError(Exception):
    pass


class AIServiceModelError(Exception):
    pass


REQUEST_TIMEOUT_SECONDS = 120
MAX_OUTPUT_TOKENS = 350


def _get_client() -> Client:
    return Client(
        host=settings.ollama_base_url,
        timeout=REQUEST_TIMEOUT_SECONDS,
    )


def _clean_output(text: str) -> str:
    if not text:
        return ""

    # Remove explicit Qwen thinking blocks if they somehow appear.
    text = re.sub(
        r"<think>.*?</think>",
        "",
        text,
        flags=re.DOTALL | re.IGNORECASE,
    )

    # Remove an unclosed thinking block.
    text = re.sub(
        r"<think>.*$",
        "",
        text,
        flags=re.DOTALL | re.IGNORECASE,
    )

    return text.strip()


def _call_llm(
    system_prompt: str,
    user_prompt: str,
    num_predict: int = MAX_OUTPUT_TOKENS,
) -> str:

    client = _get_client()

    try:
        response = client.chat(
            model=settings.ollama_model,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
            options={
                "temperature": 0.1,
                "num_predict": num_predict,
            },
            think=False,
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
        raise AIServiceModelError(str(e)) from e

    except Exception as e:
        raise AIServiceModelError(
            f"The local AI model returned an unexpected error: {e}"
        ) from e

    try:
        content = response.message.content or ""
    except AttributeError:
        content = ""

    return _clean_output(content)


def _invoke(system_prompt: str, user_prompt: str) -> str:
    result = _call_llm(
        system_prompt,
        user_prompt,
        MAX_OUTPUT_TOKENS,
    )

    if result:
        return result

    # One fallback only if no usable content was returned.
    result = _call_llm(
        system_prompt,
        user_prompt,
        MAX_OUTPUT_TOKENS * 2,
    )

    if not result:
        raise AIServiceModelError(
            "The local AI model did not return a usable answer. "
            "Please try again."
        )

    return result


def _normalize_parameter(entry):
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
    lines = []

    for key, raw_entry in (extracted_parameters or {}).items():
        normalized = _normalize_parameter(raw_entry)

        if normalized is None or normalized["value"] is None:
            continue

        label = PARAMETER_LABELS.get(key, key)

        value = str(normalized["value"])

        if normalized["unit"]:
            value += f" {normalized['unit']}"

        if (
            normalized["reference_low"] is not None
            and normalized["reference_high"] is not None
        ):
            reference = (
                f"{normalized['reference_low']} - "
                f"{normalized['reference_high']}"
            )
        else:
            reference = "not available"

        lines.append(
            f"- {label}: value = {value}; "
            f"reference range = {reference}; "
            f"status = {normalized['status']}"
        )

    return "\n".join(lines) if lines else "(No parameters available.)"


SAFETY_INSTRUCTIONS = (
    "You are an educational assistant inside VitaLens. You are NOT a doctor.\n\n"
    "STRICT RULES:\n"
    "- Use only the exact report data provided.\n"
    "- Never invent or guess values, units, ranges, or terminology.\n"
    "- Never diagnose diseases or medical conditions.\n"
    "- Never prescribe medication or treatment.\n"
    "- Do not infer causes of abnormal results.\n"
    "- If a reference range is unavailable, say so.\n"
    "- If information appears unclear or possibly affected by OCR, "
    "tell the user to verify it against the original report.\n"
    "- Output ONLY the requested final answer.\n"
    "- Never output your reasoning, planning, analysis, or internal thoughts.\n"
    "- End with a brief reminder that the information is educational only "
    "and is not a substitute for professional medical advice."
)


def explain_report(extracted_parameters: dict) -> str:
    parameters = _format_parameters_block(extracted_parameters)

    prompt = (
        "Explain this blood report in plain, patient-friendly language.\n\n"
        "REPORT DATA:\n"
        f"{parameters}\n\n"
        "For each parameter:\n"
        "- briefly explain what it represents;\n"
        "- state its exact reported value and unit;\n"
        "- state the report's status when available;\n"
        "- state the reference range when available;\n"
        "- if the range is unavailable, explicitly say so.\n\n"
        "Do not guess unclear terminology or units. "
        "Do not add diagnoses or causes. "
        "Keep the explanation concise."
    )

    return _invoke(SAFETY_INSTRUCTIONS, prompt)


def generate_doctor_questions(extracted_parameters: dict) -> str:
    parameters = _format_parameters_block(extracted_parameters)

    prompt = (
        "Create 3 to 6 questions a patient could ask their doctor "
        "about this blood report.\n\n"
        "REPORT DATA:\n"
        f"{parameters}\n\n"
        "Prioritize results marked Low or High and results whose "
        "reference range is unavailable.\n"
        "Every question must be directly based on the supplied data.\n"
        "Do not diagnose anything.\n"
        "Do not suggest medication or treatment.\n\n"
        "Output ONLY a numbered list of questions."
    )

    return _invoke(SAFETY_INSTRUCTIONS, prompt)


def generate_comparison_summary(
    older_parameters: dict,
    newer_parameters: dict,
    older_date: str,
    newer_date: str,
) -> str:

    older = _format_parameters_block(older_parameters)
    newer = _format_parameters_block(newer_parameters)

    prompt = (
        "Compare these two blood reports from the same patient.\n\n"
        f"OLDER REPORT ({older_date}):\n"
        f"{older}\n\n"
        f"NEWER REPORT ({newer_date}):\n"
        f"{newer}\n\n"
        "Write a concise summary of what changed.\n"
        "Mention increases, decreases, and values that stayed similar.\n"
        "Only use the supplied data.\n"
        "If a parameter is missing from one report, say so.\n"
        "Do not diagnose conditions or suggest treatments."
    )

    return _invoke(SAFETY_INSTRUCTIONS, prompt)