const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

function friendlyMessage(status, detail) {
  if (detail) return detail

  switch (status) {
    case 400:
      return "That request wasn't valid. Please check the details and try again."
    case 401:
      return "Your session has expired. Please log in again."
    case 403:
      return "You don't have permission to do that."
    case 404:
      return "We couldn't find what you were looking for."
    case 422:
      return "Some of the information provided wasn't valid."
    case 500:
      return "Something went wrong on our end. Please try again shortly."
    default:
      return "Something went wrong. Please try again."
  }
}

/**
 * Core request helper. Attaches the JWT (if present), parses JSON,
 * and normalizes errors into ApiError with a user-facing message.
 */
async function request(path, { method = "GET", body, token, isFormData = false } = {}) {
  const headers = {}

  if (!isFormData) {
    headers["Content-Type"] = "application/json"
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(
      "Couldn't reach the VitaLens server. Please check your connection and try again.",
      0
    )
  }

  let data = null
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    try {
      data = await response.json()
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    const detail = data && typeof data.detail === "string" ? data.detail : null
    throw new ApiError(friendlyMessage(response.status, detail), response.status)
  }

  return data
}

export const api = {
  register: (name, email, password) =>
    request("/auth/register", { method: "POST", body: { name, email, password } }),

  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),

  me: (token) => request("/auth/me", { token }),

  listReports: (token) => request("/reports/", { token }),

  getReport: (token, reportId) => request(`/reports/${reportId}`, { token }),

  uploadReport: (token, file) => {
    const formData = new FormData()
    formData.append("file", file)
    return request("/reports/upload", {
      method: "POST",
      token,
      body: formData,
      isFormData: true,
    })
  },

  explainReport: (token, reportId) =>
    request(`/ai/reports/${reportId}/explain`, { method: "POST", token }),

  getDoctorQuestions: (token, reportId) =>
    request(`/ai/reports/${reportId}/questions`, { method: "POST", token }),

  getComparisonSummary: (token, reportIdA, reportIdB) =>
    request(`/ai/compare/${reportIdA}/${reportIdB}/summary`, {
      method: "POST",
      token,
    }),
}
