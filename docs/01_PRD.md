# Product Requirements Document (PRD)
## VitaLens — AI-Powered Personal Health Intelligence Platform

**Document Version:** 1.0
**Status:** Draft
**Prepared For:** Final-Year Engineering Project

---

## 1. Executive Summary

VitaLens is an AI-powered Personal Health Intelligence Platform that enables patients to upload, organize, understand, and track their blood reports over time. The platform extracts key parameters from uploaded blood reports, explains them in plain language using a locally hosted open-source large language model (LLM), visualizes trends across multiple reports, and generates discussion points patients can bring to their doctor.

VitaLens is explicitly designed as a **patient education and organization tool**, not a diagnostic system. All AI-generated content is framed as informational and is intended to improve the quality of doctor-patient conversations, not to replace medical judgment.

The system is built entirely on a self-hosted, open-source technology stack — React, FastAPI, PostgreSQL, LangChain, ChromaDB, and Ollama-hosted open-source LLMs — with no dependency on any cloud-based AI provider, ensuring full control over data privacy and infrastructure cost.

---

## 2. Problem Statement

Patients routinely receive blood test reports filled with unfamiliar terminology, reference ranges, and numeric values that are difficult to interpret without medical training. This creates several recurring problems:

- **Fragmented records:** Reports are often scattered across paper printouts, emails, and diagnostic lab portals, making it hard to track health trends over time.
- **Low health literacy:** Patients frequently do not understand what a parameter like "MCHC" or "eGFR" means, or whether a value outside the reference range is a cause for concern.
- **Poor consultation preparation:** Patients often arrive at doctor visits without a clear understanding of what has changed since their last report, leading to shorter, less productive conversations.
- **No longitudinal view:** Individual reports are typically viewed in isolation; there is no easy way to visualize how a parameter (e.g., hemoglobin, cholesterol, creatinine) has trended across multiple tests.

Existing solutions either require manual data entry, are tied to a specific hospital or lab ecosystem, or rely on cloud-based AI services that raise data privacy concerns for sensitive medical information.

---

## 3. Vision

To give every patient a private, intelligent, and easy-to-understand view of their own blood health history — empowering them to engage more meaningfully with their healthcare providers, without compromising the privacy of their medical data or relying on third-party cloud AI services.

---

## 4. Objectives

1. Enable secure upload and centralized storage of blood reports in PDF format.
2. Automatically extract structured blood parameters from unstructured PDF reports.
3. Translate clinical terminology into plain-language explanations using a local LLM.
4. Allow users to compare multiple reports and visualize trends over time.
5. Generate AI-assisted summaries of changes between reports.
6. Generate relevant, non-diagnostic questions patients can ask their doctors.
7. Ensure the entire AI pipeline runs on locally hosted, open-source models — no cloud LLM APIs.
8. Deliver a portfolio-quality, professionally engineered full-stack application suitable for demonstration and evaluation.

---

## 5. Target Users

| User Persona | Description | Primary Needs |
|---|---|---|
| **Health-Conscious Individual** | Regularly gets blood work done (e.g., annual checkups, fitness tracking) | Wants to track trends and understand results without googling every term |
| **Chronic Condition Patient** | Manages a condition (e.g., diabetes, thyroid disorder) requiring frequent testing | Needs to monitor specific parameters over time and prepare for recurring doctor visits |
| **Caregiver / Family Member** | Manages health records on behalf of a parent or dependent | Needs an organized, understandable view of another person's reports |
| **Pre-Consultation Patient** | Has an upcoming doctor's appointment | Wants a summary of changes and a list of questions to ask |

Out of scope for this MVP: clinicians/doctors as primary users, hospital administrators, and insurance providers.

---

## 6. Scope

### In Scope (MVP)
- Individual patient-facing web application (React frontend, FastAPI backend).
- Upload and storage of blood reports in PDF format.
- Automated extraction of common blood parameters (e.g., CBC, lipid profile, liver/kidney function panels) from supported report formats.
- Local LLM-based explanation, summarization, and question-generation features.
- Report history, trend visualization, and comparison between two or more reports.
- JWT-based user authentication and account management.

### Out of Scope (MVP)
- Diagnosis, treatment recommendations, or medical advice of any kind.
- Integration with hospital/lab systems, EHR/EMR platforms, or insurance systems.
- Support for non-blood-report medical documents (e.g., imaging, prescriptions) — reserved for Future Scope.
- Mobile native applications (iOS/Android).
- Multi-language support.
- Use of any cloud-hosted LLM or third-party AI API.

---

## 7. Functional Requirements

### 7.1 User Registration & Login
- FR-1.1: Users shall be able to register with an email and password.
- FR-1.2: Passwords shall be securely hashed before storage (e.g., bcrypt/argon2).
- FR-1.3: Users shall be able to log in and receive a JWT access token.
- FR-1.4: JWT tokens shall be validated on all protected API endpoints.
- FR-1.5: Users shall be able to log out (client-side token invalidation) and view/update basic profile information.

### 7.2 Dashboard
- FR-2.1: The dashboard shall display a summary of the user's most recent report.
- FR-2.2: The dashboard shall show quick indicators for out-of-range parameters from the latest report.
- FR-2.3: The dashboard shall provide navigation to report history, upload, and trend views.

### 7.3 Upload Blood Report (PDF)
- FR-3.1: Users shall be able to upload blood reports in PDF format via drag-and-drop or file picker.
- FR-3.2: The system shall validate file type and size before accepting an upload.
- FR-3.3: Users shall receive feedback on upload success, processing status, and failure reasons.

### 7.4 Store Reports
- FR-4.1: Uploaded PDF files shall be stored securely and associated with the uploading user's account.
- FR-4.2: Extracted structured data shall be stored in PostgreSQL, linked to the source report and user.
- FR-4.3: Users shall be able to view, download, or delete their previously uploaded reports.

### 7.5 Blood Parameter Extraction
- FR-5.1: The system shall parse uploaded PDFs using PyMuPDF to extract text content.
- FR-5.2: The system shall identify and extract standard blood parameters (name, value, unit, reference range) into a structured format.
- FR-5.3: The system shall flag parameters it could not confidently extract for user review.
- FR-5.4: The system shall associate each extracted parameter with a report date.

### 7.6 AI Report Explanation
- FR-6.1: The system shall generate a plain-language explanation of each extracted parameter using a local LLM via Ollama and LangChain.
- FR-6.2: Explanations shall indicate whether a value falls within, above, or below its reference range.
- FR-6.3: Explanations shall include a clear disclaimer that the content is educational and not a medical diagnosis.
- FR-6.4: Relevant reference material (e.g., parameter definitions) may be retrieved via ChromaDB to ground explanations.

### 7.7 Report History
- FR-7.1: Users shall be able to view a chronological list of all uploaded reports.
- FR-7.2: Users shall be able to open any historical report to view its extracted parameters and explanations.

### 7.8 Trend Analysis
- FR-8.1: The system shall allow users to select a parameter (e.g., Hemoglobin) and view its values across all available reports in chronological order.
- FR-8.2: The system shall calculate and display the direction of change (increasing/decreasing/stable) between consecutive reports.

### 7.9 Interactive Charts
- FR-9.1: The system shall render interactive line/bar charts for selected parameters over time.
- FR-9.2: Charts shall visually indicate reference range boundaries.
- FR-9.3: Users shall be able to hover/tap on data points to view exact values and dates.

### 7.10 Doctor Discussion Questions
- FR-10.1: The system shall generate a list of relevant, non-diagnostic questions a user can ask their doctor, based on notable findings or trends in their reports.
- FR-10.2: Generated questions shall avoid suggesting diagnoses or treatments.

### 7.11 AI Health Summary
- FR-11.1: The system shall generate a natural-language summary describing what has changed between two selected reports.
- FR-11.2: The summary shall highlight parameters that moved out of range, moved into range, or changed significantly.
- FR-11.3: The summary shall include an educational disclaimer.

---

## 8. Non-Functional Requirements

### 8.1 Security & Privacy
- NFR-1.1: All sensitive medical data shall be stored in a self-hosted PostgreSQL database; no data shall be transmitted to third-party cloud AI services.
- NFR-1.2: All AI inference shall occur locally via Ollama; no report content shall leave the local/self-hosted environment.
- NFR-1.3: All API endpoints handling user or medical data shall require valid JWT authentication.
- NFR-1.4: Passwords shall never be stored in plaintext.
- NFR-1.5: File uploads shall be validated and sanitized to prevent malicious payloads.

### 8.2 Performance
- NFR-2.1: PDF parameter extraction shall complete within a reasonable time (target: under 15 seconds per report on standard development hardware).
- NFR-2.2: Dashboard and history views shall load within 2 seconds under normal conditions with a moderate report history (up to ~50 reports).

### 8.3 Reliability & Maintainability
- NFR-3.1: The backend shall follow a modular, layered architecture (API, service, data access layers) to support maintainability.
- NFR-3.2: The codebase shall include automated tests for core extraction and API logic.
- NFR-3.3: The system shall log errors during PDF parsing and LLM inference for debugging.

### 8.4 Usability
- NFR-4.1: The UI shall be responsive and usable on both desktop and tablet screen sizes.
- NFR-4.2: Medical terminology in the UI shall be accompanied by plain-language explanations wherever feasible.

### 8.5 Portability & Deployment
- NFR-5.1: The application shall be containerizable (e.g., via Docker) to support consistent local deployment.
- NFR-5.2: The system shall run entirely on open-source, locally hosted components with no mandatory paid third-party service.

### 8.6 Compliance & Ethical Use
- NFR-6.1: All AI-generated explanations and summaries shall include a visible disclaimer that VitaLens does not provide medical diagnosis or treatment advice.
- NFR-6.2: The system shall avoid generating language that could be interpreted as a clinical diagnosis.

---

## 9. MVP Features (Explained)

| Feature | Description |
|---|---|
| **User Registration & Login** | Secure account creation and JWT-based authentication so each user's reports remain private to their account. |
| **Dashboard** | A central landing page summarizing the user's latest report and highlighting any out-of-range values at a glance. |
| **Upload Blood Report (PDF)** | Simple interface for uploading lab report PDFs, with validation and processing status feedback. |
| **Store Reports** | Secure, user-scoped storage of both the original PDF and the extracted structured data. |
| **Blood Parameter Extraction** | Automated parsing of PDF reports using PyMuPDF to identify parameter names, values, units, and reference ranges. |
| **AI Report Explanation** | LangChain-orchestrated, Ollama-powered local LLM explanations that translate clinical parameters into plain language, with ChromaDB-backed retrieval for grounding. |
| **Report History** | A chronological archive of all reports a user has uploaded, each viewable individually. |
| **Trend Analysis** | Logic to track a given parameter's values across multiple reports and describe the direction of change over time. |
| **Interactive Charts** | Visual, interactive graphs of parameter trends, with reference ranges overlaid for context. |
| **Doctor Discussion Questions** | AI-generated, non-diagnostic questions tailored to the user's report findings, intended to improve doctor consultations. |
| **AI Health Summary** | A natural-language summary of what changed between two reports, helping users quickly grasp their health trajectory. |

---

## 10. Future Scope

The following features are explicitly **out of scope for the MVP** but may be considered for future iterations:

- Support for additional document types (imaging reports, prescriptions, discharge summaries).
- OCR support for scanned/image-based PDF reports.
- Multi-user family accounts / caregiver management with shared access controls.
- Mobile applications (iOS/Android).
- Integration with wearable health devices for continuous data (e.g., heart rate, activity).
- Multi-language support for explanations and summaries.
- Exportable PDF/print-friendly consultation summary reports.
- Notification/reminder system for periodic testing based on trend patterns.
- Support for additional local LLM backends and model selection within the app.
- Role-based access for optional clinician-shared views (with explicit patient consent).

---

## 11. Success Metrics

| Metric | Target / Indicator |
|---|---|
| **Extraction Accuracy** | Percentage of blood parameters correctly extracted from a representative sample of report formats |
| **Explanation Clarity** | Qualitative user feedback on whether AI explanations were understandable without medical background |
| **Report Processing Time** | Average time from upload to fully processed report (parameters + explanations) |
| **Trend Visualization Usage** | Number of users who view trend charts across multiple reports |
| **System Reliability** | Uptime and error rate of core upload/extraction pipeline during testing/demo periods |
| **Academic Evaluation** | Successful demonstration of end-to-end functionality (upload → extraction → explanation → trends → summary) for project evaluation |
| **Codebase Quality** | Test coverage of core modules, adherence to modular architecture, and documentation completeness |

---

## 12. Assumptions & Constraints

### Assumptions
- Users will upload blood reports in digital, text-based PDF format (not scanned images) for the MVP.
- Blood reports follow reasonably standard formats with identifiable parameter names, values, units, and reference ranges.
- The local machine or server running Ollama has sufficient hardware resources (CPU/GPU/RAM) to run the selected open-source LLM at acceptable latency.
- Users have basic digital literacy to navigate a web application.

### Constraints
- **No cloud LLM APIs:** The application must not use OpenAI, Gemini, Claude, or any other cloud-based AI API. All AI inference must run through locally hosted, open-source models via Ollama (e.g., Qwen, Llama, or Gemma variants).
- **Technology stack is fixed:** React (Vite) for frontend, FastAPI for backend, PostgreSQL for the database, JWT for authentication, LangChain for AI orchestration, ChromaDB for vector storage, and PyMuPDF for PDF processing.
- **Non-diagnostic scope:** The application must not present itself as a diagnostic tool or provide treatment recommendations; all AI outputs are educational in nature.
- **Academic project constraints:** Development timeline, hardware resources, and team size are bounded by final-year project requirements, which may limit the breadth of report formats and edge cases handled in the MVP.
- **Data privacy:** All patient data must remain within the self-hosted environment; no report content or extracted health data may be transmitted to external third-party services.

---

*End of Document*
