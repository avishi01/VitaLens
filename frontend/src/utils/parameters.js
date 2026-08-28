// Shared helpers for working with a report's extracted_parameters payload.
//
// Reports created before Group 2 store each parameter as a plain number
// (e.g. { hemoglobin: 14.5 }). Reports created after Group 2 store a richer
// object with unit/reference range/status (e.g.
// { hemoglobin: { value: 14.5, unit: "g/dL", reference_low: 12.0,
// reference_high: 15.0, status: "Normal" } }).
//
// These helpers normalize both shapes so the UI can treat them uniformly
// without guessing at data the backend never extracted.

export const PARAMETER_LABELS = {
  hemoglobin: "Hemoglobin",
  rbc: "RBC Count",
  pcv: "PCV",
  mcv: "MCV",
  mch: "MCH",
  mchc: "MCHC",
  platelets: "Platelets",
  total_count: "Total WBC Count",
  neutrophils: "Neutrophils",
  lymphocytes: "Lymphocytes",
  monocytes: "Monocytes",
  eosinophils: "Eosinophils",
  basophils: "Basophils",
}

export function parameterLabel(key) {
  return PARAMETER_LABELS[key] || key
}

/**
 * Normalizes a single parameter entry (either a bare number or the richer
 * object shape) into a consistent { value, unit, referenceLow, referenceHigh,
 * status } object. Missing fields are null/"Unknown" rather than guessed.
 */
export function normalizeParameter(entry) {
  if (entry === null || entry === undefined) {
    return null
  }

  if (typeof entry === "number") {
    return {
      value: entry,
      unit: null,
      referenceLow: null,
      referenceHigh: null,
      status: "Unknown",
    }
  }

  return {
    value: typeof entry.value === "number" ? entry.value : null,
    unit: entry.unit ?? null,
    referenceLow:
      typeof entry.reference_low === "number" ? entry.reference_low : null,
    referenceHigh:
      typeof entry.reference_high === "number" ? entry.reference_high : null,
    status: entry.status || "Unknown",
  }
}

/**
 * Normalizes a full extracted_parameters object into
 * { [paramKey]: normalizedEntry }.
 */
export function normalizeParameters(extractedParameters) {
  const result = {}
  for (const [key, entry] of Object.entries(extractedParameters || {})) {
    const normalized = normalizeParameter(entry)
    if (normalized) result[key] = normalized
  }
  return result
}

export function formatReferenceRange(normalized) {
  if (normalized.referenceLow === null || normalized.referenceHigh === null) {
    return "—"
  }
  return `${normalized.referenceLow} - ${normalized.referenceHigh}`
}

export function formatValueWithUnit(normalized) {
  if (normalized.value === null) return "—"
  return normalized.unit ? `${normalized.value} ${normalized.unit}` : `${normalized.value}`
}
