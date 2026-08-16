# VitaLens — API Design Document

**Document:** 04_API.md
**Version:** 1.0
**Status:** Draft
**Based On:** VitaLens PRD v1.0, 02_ARCHITECTURE.md, 03_DATABASE.md

---

## 1. API Overview

VitaLens exposes a single **REST API** served by FastAPI, consumed exclusively by the React (Vite) frontend. The API is organized into five domains that mirror the backend's service layer (`02_ARCHITECTURE.md`, Section 12): **Authentication**, **Reports**, **Parameters**, **Trends**, and **AI**.

The API is the only interface into the system — all business logic (extraction, trend computation, AI orchestration, authorization) lives behind it. The frontend never accesses PostgreSQL, ChromaDB, file storage, or Ollama directly.

Two categories of endpoints exist, and this distinction is preserved throughout the document:
- **Deterministic endpoints** (`auth`, `reports`, `parameters`, `trends`) — backed entirely by PostgreSQL and backend logic, no LLM involvement.
- **AI endpoints** (`ai`) — the only endpoints that invoke the LangChain → Ollama → local LLM pipeline, always operating on data the backend has already retrieved from PostgreSQL.

---

## 2. API Design Principles

1. **REST over HTTP/JSON** — resource-oriented URLs, standard HTTP methods, JSON request/response bodies. No GraphQL, no RPC-style endpoints.
2. **Statelessness** — every request is authenticated independently via a JWT bearer token; the server holds no session state.
3. **User-Scoped by Default** — every endpoint that touches user data implicitly filters by the authenticated user's ID; there is no endpoint that returns data across users.
4. **Explicit Separation of Deterministic and AI Behavior** — AI-generated responses are only ever produced by `ai/*` endpoints and are clearly labeled as such in the response body.
5. **Predictable Resource Naming** — endpoints are nouns representing resources (`/reports`, `/parameters`), with HTTP methods expressing the action (`GET`, `POST`, `PATCH`, `DELETE`).
6. **Fail Safely and Clearly** — validation errors, authentication failures, and not-found conditions return consistent, structured error bodies (Section 14) rather than raw stack traces.
7. **Minimal Surface Area** — only endpoints required to support the confirmed MVP capabilities are defined; no speculative endpoints.

---

## 3. Base URL / Versioning

```
https://<host>/api/v1
```

- All endpoints are versioned under `/api/v1` to allow non-breaking evolution of the API in the future without affecting the current frontend.
- Content type for all requests/responses is `application/json`, except the report upload endpoint, which accepts `multipart/form-data`.
- All endpoint paths in this document are relative to the base URL above (e.g., `/auth/login` refers to `/api/v1/auth/login`).

---

## 4. Authentication Flow

1. User registers via `POST /auth/register` or logs in via `POST /auth/login`.
2. On success, the backend returns a signed **JWT access token**.
3. The frontend stores the token (in memory, per frontend architecture) and attaches it to every subsequent request as:
   ```
   Authorization: Bearer <token>
   ```
4. FastAPI validates the token on every protected route via a shared dependency (`get_current_user`), which decodes the JWT, verifies its signature/expiry, and resolves the authenticated `user_id`.
5. If the token is missing, invalid, or expired, the request is rejected with `401 Unauthorized` before reaching any business logic.
6. All downstream database queries use the resolved `user_id` to scope data access (per `03_DATABASE.md`, Section 8).

No session cookies, refresh-token rotation, or OAuth flows are included in the MVP — a single access token with a fixed expiry is sufficient for the confirmed scope.

---

## 5. Endpoint Summary

| # | Method | Path | Purpose | Auth Required | AI Involved |
|---|---|---|---|---|---|
| 1 | POST | `/auth/register` | Create a new user account | No | No |
| 2 | POST | `/auth/login` | Authenticate and obtain a JWT | No | No |
| 3 | GET | `/auth/me` | Get current authenticated user info | Yes | No |
| 4 | POST | `/reports` | Upload a blood report PDF | Yes | No |
| 5 | GET | `/reports` | List all reports for the current user | Yes | No |
| 6 | GET | `/reports/{report_id}` | View a specific report's metadata | Yes | No |
| 7 | GET | `/reports/{report_id}/status` | Get processing status of a report | Yes | No |
| 8 | DELETE | `/reports/{report_id}` | Delete a report and its parameters | Yes | No |
| 9 | GET | `/reports/{report_id}/parameters` | List extracted parameters for a report | Yes | No |
| 10 | PATCH | `/parameters/{parameter_id}` | Correct an extracted parameter value | Yes | No |
| 11 | GET | `/trends` | Get historical values for a parameter | Yes | No |
| 12 | GET | `/ai/reports/{report_id}/explanation` | Generate AI explanation of a report | Yes | Yes |
| 13 | GET | `/ai/summary` | Generate AI summary comparing two reports | Yes | Yes |
| 14 | GET | `/ai/reports/{report_id}/questions` | Generate doctor discussion questions | Yes | Yes |

---

## 6. Authentication Endpoints

### 6.1 `POST /auth/register`
- **Purpose:** Create a new user account.
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "full_name": "string",
    "email": "user@example.com",
    "password": "string (min 8 chars)"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "uuid",
    "full_name": "string",
    "email": "user@example.com",
    "created_at": "timestamp"
  }
  ```
- **Status Codes:** `201 Created`, `400 Bad Request` (validation), `409 Conflict` (email already registered)
- **Backend Component:** `auth_service` → `users` table (`03_DATABASE.md`, 5.1)

### 6.2 `POST /auth/login`
- **Purpose:** Authenticate a user and issue a JWT access token.
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "string"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "jwt-string",
    "token_type": "bearer",
    "expires_in": 3600
  }
  ```
- **Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized` (invalid credentials)
- **Backend Component:** `auth_service` (password verification, JWT issuance)

### 6.3 `GET /auth/me`
- **Purpose:** Retrieve the authenticated user's profile information.
- **Auth Required:** Yes
- **Request Parameters:** None
- **Response (200 OK):**
  ```json
  {
    "id": "uuid",
    "full_name": "string",
    "email": "user@example.com",
    "created_at": "timestamp"
  }
  ```
- **Status Codes:** `200 OK`, `401 Unauthorized`
- **Backend Component:** `auth_service` → `users` table

---

## 7. User Endpoints

The MVP does not require a separate profile-management domain beyond `GET /auth/me` (Section 6.3). No additional user endpoints (e.g., password reset, profile editing) are defined, as they are not part of the confirmed MVP scope. This section is retained for structural completeness and future extension (see Section 20).

---

## 8. Report Endpoints

### 8.1 `POST /reports`
- **Purpose:** Upload a blood report PDF for processing and storage.
- **Auth Required:** Yes
- **Request:** `multipart/form-data`
  | Field | Type | Description |
  |---|---|---|
  | `file` | file (PDF) | The blood report PDF file |
- **Response (202 Accepted):**
  ```json
  {
    "id": "uuid",
    "original_filename": "report_aug2026.pdf",
    "processing_status": "pending",
    "upload_date": "timestamp"
  }
  ```
- **Status Codes:** `202 Accepted`, `400 Bad Request` (invalid file type/size), `401 Unauthorized`
- **Backend Component:** `reports` router → file storage + `extraction_service` (PyMuPDF) → `reports` / `parameters` tables

### 8.2 `GET /reports`
- **Purpose:** List all reports belonging to the current user.
- **Auth Required:** Yes
- **Query Parameters:** `limit` (optional, default 20), `offset` (optional, default 0)
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "original_filename": "string",
        "report_date": "date | null",
        "upload_date": "timestamp",
        "processing_status": "processed"
      }
    ],
    "total": 5
  }
  ```
- **Status Codes:** `200 OK`, `401 Unauthorized`
- **Backend Component:** `reports` router → `reports` table (scoped to `user_id`)

### 8.3 `GET /reports/{report_id}`
- **Purpose:** View metadata for a specific report.
- **Auth Required:** Yes
- **Path Parameters:** `report_id` (UUID)
- **Response (200 OK):**
  ```json
  {
    "id": "uuid",
    "original_filename": "string",
    "report_date": "date | null",
    "upload_date": "timestamp",
    "processing_status": "processed"
  }
  ```
- **Status Codes:** `200 OK`, `401 Unauthorized`, `404 Not Found` (report does not exist or does not belong to user)
- **Backend Component:** `reports` router → `reports` table (scoped to `user_id`)

### 8.4 `GET /reports/{report_id}/status`
- **Purpose:** Poll the processing status of a report after upload (e.g., while extraction runs).
- **Auth Required:** Yes
- **Path Parameters:** `report_id` (UUID)
- **Response (200 OK):**
  ```json
  {
    "id": "uuid",
    "processing_status": "processing"
  }
  ```
- **Status Codes:** `200 OK`, `401 Unauthorized`, `404 Not Found`
- **Backend Component:** `reports` router → `reports` table

### 8.5 `DELETE /reports/{report_id}`
- **Purpose:** Delete a report, its stored file, and all associated parameters.
- **Auth Required:** Yes
- **Path Parameters:** `report_id` (UUID)
- **Response:** No content
- **Status Codes:** `204 No Content`, `401 Unauthorized`, `404 Not Found`
- **Backend Component:** `reports` router → file storage deletion + `reports` table (cascades to `parameters` per `03_DATABASE.md`, Section 6)

---

## 9. Parameter Endpoints

### 9.1 `GET /reports/{report_id}/parameters`
- **Purpose:** List all extracted parameters for a given report.
- **Auth Required:** Yes
- **Path Parameters:** `report_id` (UUID)
- **Response (200 OK):**
  ```json
  {
    "report_id": "uuid",
    "parameters": [
      {
        "id": "uuid",
        "parameter_name": "Hemoglobin",
        "normalized_name": "hemoglobin",
        "value": 13.8,
        "unit": "g/dL",
        "reference_range_low": 13.0,
        "reference_range_high": 17.0,
        "reference_range_text": null,
        "status": "normal"
      }
    ]
  }
  ```
- **Status Codes:** `200 OK`, `401 Unauthorized`, `404 Not Found` (report not found or not owned by user)
- **Backend Component:** `parameters` router → `parameters` table (scoped to `report_id` and `user_id`)

### 9.2 `PATCH /parameters/{parameter_id}`
- **Purpose:** Correct an extracted parameter value when automated extraction was uncertain or inaccurate (supports `status = 'unparsed'` review, per `03_DATABASE.md`, Section 12).
- **Auth Required:** Yes
- **Path Parameters:** `parameter_id` (UUID)
- **Request Body** (all fields optional; only provided fields are updated):
  ```json
  {
    "value": 13.8,
    "unit": "g/dL",
    "reference_range_low": 13.0,
    "reference_range_high": 17.0,
    "reference_range_text": null
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "id": "uuid",
    "parameter_name": "Hemoglobin",
    "normalized_name": "hemoglobin",
    "value": 13.8,
    "unit": "g/dL",
    "reference_range_low": 13.0,
    "reference_range_high": 17.0,
    "reference_range_text": null,
    "status": "normal"
  }
  ```
- **Status Codes:** `200 OK`, `400 Bad Request` (invalid values), `401 Unauthorized`, `404 Not Found` (parameter not found or not owned by user)
- **Backend Component:** `parameters` router → `parameters` table (scoped to `user_id`); `status` is recomputed server-side against the reference range after any correction

---

## 10. Trend Analysis Endpoints

### 10.1 `GET /trends`
- **Purpose:** Retrieve the historical time series of a specific parameter for charting and trend computation.
- **Auth Required:** Yes
- **Query Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `parameter` | string | Yes | The `normalized_name` of the parameter (e.g., `hemoglobin`) |
- **Response (200 OK):**
  ```json
  {
    "parameter": "hemoglobin",
    "unit": "g/dL",
    "history": [
      { "report_id": "uuid", "report_date": "2026-02-10", "value": 12.9, "status": "low" },
      { "report_id": "uuid", "report_date": "2026-08-10", "value": 13.8, "status": "normal" }
    ],
    "trend": "increasing"
  }
  ```
- **Status Codes:** `200 OK`, `400 Bad Request` (unknown/missing `parameter`), `401 Unauthorized`
- **Backend Component:** `trends` router → `trend_service` → `parameters` + `reports` tables (joined, scoped to `user_id`); `trend` direction computed entirely in backend logic, per `02_ARCHITECTURE.md` Section 4.4 and `03_DATABASE.md` Section 10

---

## 11. AI Endpoints

All endpoints in this section are the **only** entry points into the AI Orchestration Module (`ai_orchestration_service`), which performs RAG via ChromaDB and inference via LangChain → Ollama → local LLM (`02_ARCHITECTURE.md`, Section 7). All responses include a `disclaimer` field and are treated by the frontend as AI-generated, educational content — never diagnostic.

### 11.1 `GET /ai/reports/{report_id}/explanation`
- **Purpose:** Generate a plain-language explanation of a report's extracted parameters.
- **Auth Required:** Yes
- **Path Parameters:** `report_id` (UUID)
- **Response (200 OK):**
  ```json
  {
    "report_id": "uuid",
    "explanation": "string (AI-generated, plain-language text)",
    "source": "ai_generated",
    "disclaimer": "This explanation is for educational purposes only and is not a medical diagnosis."
  }
  ```
- **Status Codes:** `200 OK`, `401 Unauthorized`, `404 Not Found` (report not found/not owned/not yet processed), `503 Service Unavailable` (local LLM unreachable)
- **Backend Component:** `ai` router → `ai_orchestration_service` → fetches `parameters` from PostgreSQL → retrieves reference context from ChromaDB → LangChain prompt → Ollama → local LLM

### 11.2 `GET /ai/summary`
- **Purpose:** Generate an AI summary describing what changed between two reports.
- **Auth Required:** Yes
- **Query Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `from_report_id` | UUID | Yes | Earlier report in the comparison |
  | `to_report_id` | UUID | Yes | Later report in the comparison |
- **Response (200 OK):**
  ```json
  {
    "from_report_id": "uuid",
    "to_report_id": "uuid",
    "summary": "string (AI-generated comparison summary)",
    "source": "ai_generated",
    "disclaimer": "This summary is for educational purposes only and is not a medical diagnosis."
  }
  ```
- **Status Codes:** `200 OK`, `400 Bad Request` (reports not comparable, e.g., same report twice), `401 Unauthorized`, `404 Not Found` (either report not found/not owned), `503 Service Unavailable`
- **Backend Component:** `ai` router → `ai_orchestration_service` → fetches both reports' `parameters` from PostgreSQL (diffed by `normalized_name`, per `03_DATABASE.md` Section 10) → ChromaDB retrieval → LangChain → Ollama → local LLM

### 11.3 `GET /ai/reports/{report_id}/questions`
- **Purpose:** Generate a list of non-diagnostic discussion questions the user can bring to their doctor, based on a report's findings.
- **Auth Required:** Yes
- **Path Parameters:** `report_id` (UUID)
- **Response (200 OK):**
  ```json
  {
    "report_id": "uuid",
    "questions": [
      "string",
      "string"
    ],
    "source": "ai_generated",
    "disclaimer": "These questions are intended to support your conversation with a healthcare provider and are not medical advice."
  }
  ```
- **Status Codes:** `200 OK`, `401 Unauthorized`, `404 Not Found`, `503 Service Unavailable`
- **Backend Component:** `ai` router → `ai_orchestration_service` → fetches `parameters` from PostgreSQL → ChromaDB retrieval → LangChain → Ollama → local LLM

---

## 12. Request/Response Formats

- **Content Type:** `application/json` for all requests and responses, except `POST /reports` which accepts `multipart/form-data`.
- **Date/Time Format:** ISO 8601 (`timestamp` fields as `YYYY-MM-DDTHH:MM:SSZ`; `report_date` as `YYYY-MM-DD`).
- **Identifiers:** All resource IDs are UUIDs, represented as strings in JSON.
- **Pagination:** List endpoints (`GET /reports`) use `limit`/`offset` query parameters and return `items` + `total` in the response body.
- **Null Handling:** Fields that may be legitimately absent (e.g., `report_date`, `reference_range_text`) are explicitly returned as `null` rather than omitted, so the frontend can rely on a consistent response shape.
- **AI Response Marking:** Every AI endpoint response includes `"source": "ai_generated"` and a `disclaimer` field, allowing the frontend to render these consistently and distinctly from deterministic data (per `02_ARCHITECTURE.md`, Section 10).

---

## 13. HTTP Status Codes

| Code | Meaning | Used For |
|---|---|---|
| `200 OK` | Successful GET/PATCH request | Fetching or updating a resource |
| `201 Created` | Resource successfully created | User registration |
| `202 Accepted` | Request accepted for asynchronous/background processing | Report upload (processing happens after acceptance) |
| `204 No Content` | Successful request with no response body | Report deletion |
| `400 Bad Request` | Invalid request payload or parameters | Validation failures |
| `401 Unauthorized` | Missing, invalid, or expired JWT | All protected endpoints |
| `403 Forbidden` | Authenticated but not permitted to access the resource | Reserved for future role-based scenarios (not used in MVP, since ownership violations return `404`, see Section 17) |
| `404 Not Found` | Resource does not exist or does not belong to the current user | Reports, parameters |
| `409 Conflict` | Resource conflict | Duplicate email on registration |
| `422 Unprocessable Entity` | Request body fails schema validation (FastAPI/Pydantic default) | Malformed JSON bodies |
| `503 Service Unavailable` | Local LLM (Ollama) unreachable or failed to respond | AI endpoints only |

---

## 14. Error Response Format

All error responses follow a consistent structure:

```json
{
  "error": {
    "code": "string (machine-readable error code)",
    "message": "string (human-readable description)",
    "details": {}
  }
}
```

**Example — validation failure:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Password must be at least 8 characters long.",
    "details": { "field": "password" }
  }
}
```

**Example — AI service unavailable:**
```json
{
  "error": {
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "The local AI model is currently unavailable. Please try again shortly.",
    "details": {}
  }
}
```

This structure is used uniformly across all endpoints so the frontend can implement a single error-handling path.

---

## 15. Authentication and Authorization Rules

- **Public Endpoints:** Only `POST /auth/register` and `POST /auth/login` are accessible without a JWT.
- **All Other Endpoints:** Require a valid `Authorization: Bearer <token>` header; requests without one, or with an invalid/expired token, receive `401 Unauthorized`.
- **Authorization (Ownership Check):** Beyond authentication, every endpoint that accesses a specific resource (`report_id`, `parameter_id`) verifies that the resource's `user_id` matches the authenticated user's ID before returning data. A mismatch returns `404 Not Found` rather than `403 Forbidden`, so as not to reveal the existence of another user's resource (Section 17).
- **No Role-Based Access Control in MVP:** All authenticated users have identical permissions over their own data; there are no admin or elevated roles in the confirmed scope.
- **Token Validation Location:** Enforced centrally via a shared FastAPI dependency injected into every protected router, consistent with `02_ARCHITECTURE.md` Section 9.

---

## 16. File Upload Rules

- **Endpoint:** `POST /reports` only.
- **Accepted Format:** PDF only (`application/pdf`); other MIME types are rejected with `400 Bad Request`.
- **Maximum File Size:** Enforced server-side (e.g., 10 MB) to prevent abuse; oversized files are rejected with `400 Bad Request`.
- **Storage:** The uploaded file is written to file storage (not PostgreSQL); only the resulting `file_path` and `original_filename` are persisted in the `reports` table, per `03_DATABASE.md` Section 5.2.
- **Processing:** File parsing (PyMuPDF) and parameter extraction occur after the file is accepted and stored; the endpoint returns `202 Accepted` immediately with `processing_status: "pending"`, and the client polls `GET /reports/{report_id}/status` for completion.
- **Failure Handling:** If parsing fails irrecoverably, `processing_status` is set to `"failed"`; the original file and report record are retained so the user can review or delete it.

---

## 17. User Data Isolation

Every endpoint that reads or writes user-owned data enforces isolation at two layers, consistent with `03_DATABASE.md` Section 8:

1. **Query-Level Scoping:** Every database query issued by any router (`reports`, `parameters`, `trends`, `ai`) includes a `user_id` filter derived from the authenticated JWT — never from a client-supplied parameter.
2. **Not-Found Instead of Forbidden:** If a `report_id` or `parameter_id` exists but belongs to a different user, the API responds with `404 Not Found`, identical to the response for a genuinely nonexistent ID. This prevents the API from confirming the existence of another user's data through response-code differences.
3. **No Cross-User List Endpoints:** `GET /reports` and `GET /trends` always operate implicitly on the authenticated user's data; there is no query parameter capable of requesting another user's `user_id`.
4. **AI Endpoints Inherit Isolation:** Because `ai/*` endpoints only operate on report/parameter data already fetched under the same user-scoped queries, the LLM never receives another user's data as context.

---

## 18. API-to-Component Mapping

| Endpoint Group | FastAPI Router | Backend Service(s) | Data Store(s) Touched |
|---|---|---|---|
| `/auth/*` | `api/auth.py` | `auth_service` | PostgreSQL (`users`) |
| `/reports` (POST) | `api/reports.py` | `extraction_service` (PyMuPDF + parsing) | File storage, PostgreSQL (`reports`, `parameters`) |
| `/reports` (GET, DELETE) | `api/reports.py` | `reports` data access | PostgreSQL (`reports`), file storage (delete) |
| `/reports/{id}/parameters` | `api/parameters.py` | `parameters` data access | PostgreSQL (`parameters`) |
| `/parameters/{id}` (PATCH) | `api/parameters.py` | `parameters` data access | PostgreSQL (`parameters`) |
| `/trends` | `api/trends.py` | `trend_service` | PostgreSQL (`parameters`, `reports`) |
| `/ai/*` | `api/ai.py` | `ai_orchestration_service` (LangChain) | PostgreSQL (read-only, for context) → ChromaDB (RAG) → Ollama (local LLM) |

This mapping mirrors the layered backend structure defined in `02_ARCHITECTURE.md` Section 12 — routers remain thin, and only `ai_orchestration_service` is permitted to invoke LangChain/Ollama.

---

## 19. Example API Flows

### 19.1 Upload → Process → View Parameters

```
POST /auth/login                          → 200 OK (JWT issued)
POST /reports  (multipart PDF)             → 202 Accepted { processing_status: "pending" }
GET  /reports/{id}/status  (poll)          → 200 OK { processing_status: "processing" }
GET  /reports/{id}/status  (poll again)    → 200 OK { processing_status: "processed" }
GET  /reports/{id}/parameters              → 200 OK { parameters: [...] }
```

### 19.2 Correcting an Uncertain Parameter

```
GET   /reports/{id}/parameters             → 200 OK (one row has status: "unparsed")
PATCH /parameters/{parameter_id}           → 200 OK (updated, status recomputed)
```

### 19.3 Trend Chart for a Parameter

```
GET /reports                               → 200 OK { items: [report1, report2, report3] }
GET /trends?parameter=hemoglobin           → 200 OK { history: [...], trend: "increasing" }
```

### 19.4 AI-Assisted Consultation Prep

```
GET /reports                                        → 200 OK
GET /ai/reports/{latest_id}/explanation              → 200 OK (AI-generated, disclaimed)
GET /ai/summary?from_report_id=R1&to_report_id=R2    → 200 OK (AI-generated, disclaimed)
GET /ai/reports/{latest_id}/questions                → 200 OK (AI-generated, disclaimed)
```

---

## 20. Future API Considerations

The following are **not part of the MVP** API surface but are noted as realistic extensions, consistent with the Future Scope defined in `01_PRD.md` and `02_ARCHITECTURE.md` Section 16:

- **Password Reset / Email Verification Endpoints** — under an expanded `auth` or new `user` domain.
- **Profile Update Endpoint** (`PATCH /auth/me`) — for editing name/email, not required by current MVP flows.
- **Refresh Token Endpoint** (`POST /auth/refresh`) — if session longevity beyond a single access token becomes necessary.
- **Caregiver/Shared Access Endpoints** — for the multi-user/family account future scope item, requiring new authorization rules beyond single-owner isolation.
- **Report Export Endpoint** (`GET /reports/{id}/export`) — for the future "exportable consultation summary" feature.
- **Asynchronous Job Status via WebSocket** — replacing status polling (Section 8.4) with push-based updates if upload volume or processing time grows.
- **Rate Limiting on AI Endpoints** — to protect local LLM throughput if concurrent usage increases.

None of these are included in the current API design, as none are required by the confirmed MVP scope.

---

*End of Document*
