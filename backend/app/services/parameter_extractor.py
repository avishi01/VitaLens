import re


PARAMETER_PATTERNS = {
    "hemoglobin": [
        r"HAEMOGLOBIN\s*\(HB%\)\s*([\d.]+)",
        r"HEMOGLOBIN\s*\(HB%\)\s*([\d.]+)",
    ],
    "rbc": [
        r"RED BLOODCELL COUNT\s*([\d.]+)",
        r"RED BLOOD CELL COUNT\s*([\d.]+)",
    ],
    "pcv": [
        r"PCV\s*\(PACKED CELL VOLUME\)\s*/?\s*([\d.]+)",
        r"HEMATOCRIT\s*([\d.]+)",
    ],
    "mcv": [
        r"MCV\s*\(MEAN CORPUSCULAR VOLUME\)\s*([\d.]+)",
    ],
    "mch": [
        r"MCH\s*\(MEAN CORPUSCULAR\s+MAH.*?\)\s*([\d.]+)\s*pg", 
    ],
    "mchc": [
        r"MCHC\s*\(MEAN CORPUSCULAR\s*[\s\S]*?CONCENTRATION\)\s*([\d.]+)",
    ],
    "platelets": [
        r"PLATELET COUNT\s*([\d.]+)",
    ],
    "total_count": [
        r"TOTAL\s*COUNT\s*\(TC\)\s*([\d.]+)",
    ],
    "neutrophils": [
        r"Neutrophils\s*([\d.]+)",
    ],
    "lymphocytes": [
        r"Lymphocytes\s*([\d.]+)",
    ],
    "monocytes": [
        r"Monocytes\s*([\d.]+)",
    ],
    "eosinophils": [
        r"Eosinophils\s*([\d.]+)",
    ],
    "basophils": [
        r"Basophils\s*([\d.]+)",
    ],
}


# Parameters where the unit + reference range immediately following the
# value in these reports' text correspond directly to the extracted value
# (same unit, no mismatch). Safe to parse the inline "X-Y" range for these.
INLINE_RANGE_PARAMETERS = {
    "hemoglobin", "rbc", "pcv", "mcv", "mch", "mchc", "platelets", "total_count",
}

# Differential count parameters are extracted as percentages, but the range
# immediately following them in these reports is for an absolute count in a
# different unit (e.g. "thous/pL") -- attaching that would misrepresent the
# value. These reports separately print a bracketed percentage reference
# range (e.g. "[40-75%]") that DOES correspond to the extracted percentage,
# so that is used instead when present.
PERCENTAGE_DIFFERENTIAL_PARAMETERS = {
    "neutrophils", "lymphocytes", "monocytes", "eosinophils", "basophils",
}

INLINE_RANGE_PATTERN = re.compile(
    r"([A-Za-z%/,\.\s]{0,20}?)\s*([\d]+\.?[\d]*)\s*-\s*([\d]+\.?[\d]*)"
)

BRACKETED_PERCENT_RANGE_PATTERN = re.compile(
    r"\[\s*([\d]+\.?[\d]*)\s*-\s*([\d]+\.?[\d]*)\s*%?\s*\]"
)

SEARCH_WINDOW_CHARS = 80


def _sane_bounds(low, high):
    return low < high


def _parse_inline_range(low_raw, high_raw):
    # These lab reports consistently print inline absolute-count reference
    # ranges with one decimal place (e.g. "12.0-15.0"). When OCR corrupts
    # one of these ranges it reliably does so by dropping the decimal point
    # (e.g. "3.8-4.8" becomes "38-48"), which would otherwise silently
    # produce a wrong Low/High/Normal status. If either bound lacks a
    # decimal point, treat the range as unreliable rather than risk
    # reporting an incorrect status.
    if "." not in low_raw or "." not in high_raw:
        return None, None

    try:
        low = float(low_raw)
        high = float(high_raw)
    except ValueError:
        return None, None

    if not _sane_bounds(low, high):
        return None, None

    return low, high


def _parse_bracket_percent_range(low_raw, high_raw):
    # Percentage reference ranges in these reports are conventionally
    # printed as whole numbers (e.g. "[40-75%]"), so a missing decimal
    # point here is normal, not a sign of OCR corruption -- no decimal
    # check is applied.
    try:
        low = float(low_raw)
        high = float(high_raw)
    except ValueError:
        return None, None

    if not _sane_bounds(low, high):
        return None, None

    return low, high


def _extract_inline_unit_and_range(text: str, start: int):
    window = text[start:start + SEARCH_WINDOW_CHARS]
    match = INLINE_RANGE_PATTERN.search(window)
    if not match:
        return None, None, None

    unit_raw, low_raw, high_raw = match.groups()
    unit = unit_raw.strip() or None
    low, high = _parse_inline_range(low_raw, high_raw)
    return unit, low, high


def _extract_bracketed_percent_range(text: str, start: int):
    window = text[start:start + SEARCH_WINDOW_CHARS]
    match = BRACKETED_PERCENT_RANGE_PATTERN.search(window)
    if not match:
        return None, None

    low_raw, high_raw = match.groups()
    return _parse_bracket_percent_range(low_raw, high_raw)


def _compute_status(value: float, low, high) -> str:
    if low is None or high is None:
        return "Unknown"
    if value < low:
        return "Low"
    if value > high:
        return "High"
    return "Normal"


def extract_parameters(text: str) -> dict:
    parameters = {}

    normalized_text = re.sub(r"\s+", " ", text)

    for parameter, patterns in PARAMETER_PATTERNS.items():
        for pattern in patterns:
            match = re.search(pattern, normalized_text, re.IGNORECASE)

            if not match:
                continue

            try:
                value = float(match.group(1))
            except ValueError:
                break

            unit = None
            low = None
            high = None

            if parameter in INLINE_RANGE_PARAMETERS:
                unit, low, high = _extract_inline_unit_and_range(
                    normalized_text, match.end()
                )
            elif parameter in PERCENTAGE_DIFFERENTIAL_PARAMETERS:
                unit = "%"
                low, high = _extract_bracketed_percent_range(
                    normalized_text, match.end()
                )

            parameters[parameter] = {
                "value": value,
                "unit": unit,
                "reference_low": low,
                "reference_high": high,
                "status": _compute_status(value, low, high),
            }
            break

    return parameters
