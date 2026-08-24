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


def extract_parameters(text: str) -> dict:
    parameters = {}

    normalized_text = re.sub(r"\s+", " ", text)

    for parameter, patterns in PARAMETER_PATTERNS.items():
        for pattern in patterns:
            match = re.search(pattern, normalized_text, re.IGNORECASE)

            if match:
                try:
                    parameters[parameter] = float(match.group(1))
                except ValueError:
                    pass
                break

    return parameters 