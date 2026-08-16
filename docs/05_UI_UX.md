# VitaLens — UI/UX Specification

**Document:** 05_UI_UX.md
**Version:** 1.0
**Status:** Draft
**Based On:** VitaLens PRD v1.0, 02_ARCHITECTURE.md, 03_DATABASE.md, 04_API.md

---

## 1. Information Architecture

VitaLens's interface is organized around one core object — the **report** — and everything the user can do with it: upload, understand, correct, track, and prepare to discuss.

```
VitaLens
├── Public Area
│   ├── Landing / Welcome
│   ├── Registration
│   └── Login
└── Authenticated Area
    ├── Dashboard (home)
    ├── Upload Report
    ├── Report Processing (transient state)
    ├── Reports
    │   ├── Report History (list)
    │   └── Report Details
    │       ├── Report Overview
    │       ├── Extracted Parameters (+ Correction)
    │       ├── AI Explanation
    │       └── Doctor-Discussion Questions
    ├── Trends
    │   ├── Historical Trends (single parameter)
    │   └── AI Comparison Summary (two reports)
    └── Profile / Settings
```

**Guiding principle:** a user should always be able to answer "where did this come from?" — every screen visually separates **data extracted from a report** (fact) from **AI-generated content** (educational interpretation). This distinction is the single most important rule governing the IA and is reinforced in Section 6.

---

## 2. Navigation Structure

### 2.1 Primary Navigation (Authenticated Area)

A persistent left sidebar (desktop) / bottom tab bar (mobile) with four top-level destinations:

| Nav Item | Destination | Icon Concept |
|---|---|---|
| **Dashboard** | Dashboard screen | Home |
| **Reports** | Report History | Document stack |
| **Trends** | Historical Trends (parameter picker if none selected) | Line chart |
| **Profile** | Profile / Settings | User circle |

A persistent **"+ Upload Report"** primary action button is always visible in the top navigation bar (desktop) or as a floating action button (mobile), since uploading is the entry point to nearly every other feature.

### 2.2 Secondary Navigation

- **Report Details** uses an in-page tab strip: `Overview | Parameters | AI Explanation | Discussion Questions`. This keeps all report-specific content under one URL context (`/reports/{id}/...`) rather than scattering it across top-level nav.
- **Trends** and **AI Comparison Summary** are reached either from the primary "Trends" nav item or contextually from a Report Details screen ("Compare with another report").

### 2.3 Navigation Rules

- Authenticated users are never shown Landing/Registration/Login; unauthenticated users are redirected to Login when attempting to reach any authenticated route.
- Breadcrumb-style back navigation (`← Back to Reports`) is present on any screen nested more than one level deep (e.g., Parameter Correction, AI Explanation).
- The Upload action is reachable from Dashboard, Report History, and the global nav — never gated behind another flow.

---

## 3. User Journey

**Primary journey — "Understand my latest report before a doctor visit":**

1. User logs in → lands on **Dashboard**.
2. Dashboard shows the latest report summary; user clicks **Upload Report** to add a newer one, or opens the existing latest report.
3. If uploading: **Upload Report** screen → **Report Processing** (transient) → redirected to **Report Overview**.
4. User reviews **Extracted Parameters**, optionally corrects any flagged as uncertain.
5. User opens **AI Explanation** to understand what the values mean in plain language.
6. User visits **Historical Trends** to see how a specific parameter (e.g., Hemoglobin) has changed over time.
7. If a prior report exists, user requests an **AI Comparison Summary** between the two.
8. User opens **Doctor-Discussion Questions** to get a short list of questions to bring to their appointment.
9. User returns to **Dashboard** or **Report History** for future reference.

**Secondary journey — "Just organizing reports over time":**
Login → Report History → Upload → (repeat over months) → Trends, viewed periodically without necessarily using AI features every time.

Both journeys are supported without forcing AI interaction — AI content is always opt-in (a tab or button the user chooses to open), never the default landing view.

---

## 4. Screen-by-Screen Specification

### 4.1 Landing / Welcome Page

- **Purpose:** Introduce VitaLens to a first-time, unauthenticated visitor and route them to registration or login.
- **Main UI Sections:** Hero section (name, one-line value proposition, illustration), brief "How it works" (3-step: Upload → Understand → Track), a visible non-diagnostic disclaimer near the fold, footer with basic links.
- **Components:** `Navbar` (logged-out variant), `HeroSection`, `StepList`, `PrimaryButton` ("Get Started"), `SecondaryButton` ("Log In"), `DisclaimerBanner`.
- **Information Displayed:** Product description; explicit statement that VitaLens supports understanding and organization, not diagnosis.
- **User Actions:** Navigate to Registration; navigate to Login.
- **Navigation Behavior:** Entry point only; no authenticated data. Redirects authenticated users straight to Dashboard if a valid session exists.
- **API Endpoints Used:** None.
- **Loading State:** Static page; no data fetch.
- **Empty/Error State:** Not applicable.

---

### 4.2 Registration

- **Purpose:** Allow a new user to create an account.
- **Main UI Sections:** Centered form card: full name, email, password, confirm password, submit button, link to Login.
- **Components:** `FormCard`, `TextInput`, `PasswordInput` (with strength hint), `PrimaryButton`, `InlineError`, `DisclaimerBanner` (brief, e.g., "Your reports are stored privately and are for your personal understanding only.").
- **Information Displayed:** Field-level validation hints (min password length, required fields).
- **User Actions:** Submit registration form; navigate to Login instead.
- **Navigation Behavior:** On success, auto-login and redirect to Dashboard (or redirect to Login with a success message — implementation choice, but flow must land the user in the authenticated area promptly).
- **API Endpoints Used:** `POST /auth/register`, then `POST /auth/login`.
- **Loading State:** Submit button shows a spinner and disables while the request is in flight.
- **Empty State:** Not applicable.
- **Error State:** Inline field errors (e.g., "Email already registered" mapped from `409 Conflict`); a general `ErrorBanner` for network/server failures.

---

### 4.3 Login

- **Purpose:** Authenticate an existing user.
- **Main UI Sections:** Centered form card: email, password, submit button, link to Registration.
- **Components:** `FormCard`, `TextInput`, `PasswordInput`, `PrimaryButton`, `InlineError`.
- **Information Displayed:** Validation and authentication error messages.
- **User Actions:** Submit login form; navigate to Registration.
- **Navigation Behavior:** On success, redirect to Dashboard. On failure, remain on Login with an inline error.
- **API Endpoints Used:** `POST /auth/login`.
- **Loading State:** Submit button spinner/disable.
- **Empty State:** Not applicable.
- **Error State:** `401 Unauthorized` → "Incorrect email or password" inline message (deliberately generic, not specifying which field is wrong).

---

### 4.4 Dashboard

- **Purpose:** Give the user an immediate, at-a-glance summary of their most recent health data and quick access to core actions.
- **Main UI Sections:**
  1. Welcome header ("Welcome back, {name}").
  2. **Latest Report Summary Card** — upload date, processing status, count of out-of-range parameters (labeled neutrally, e.g., "3 values outside typical range" — not "3 problems").
  3. **Quick Actions** — Upload Report, View Trends, View Report History.
  4. **Recent Reports** — a compact list (last 3–5) with quick links to each report's Overview.
- **Components:** `SummaryCard`, `StatusBadge`, `QuickActionButton`, `ReportListItem`, `EmptyStateIllustration` (for new users).
- **Information Displayed:** Most recent report's key facts; no AI content is auto-generated on this screen — the user must navigate into a report to request AI explanations (per product rule: not chatbot-first).
- **User Actions:** Upload a new report; open latest/recent report; navigate to Trends or Report History.
- **Navigation Behavior:** Default landing screen after login. All quick links route into Report Details or Upload.
- **API Endpoints Used:** `GET /reports` (limited/recent), `GET /reports/{id}/status` (for the latest report if still processing).
- **Loading State:** Skeleton cards for the summary and recent list while `GET /reports` resolves.
- **Empty State:** First-time user with zero reports sees an `EmptyStateIllustration` + message ("Upload your first blood report to get started") + prominent Upload button, replacing the summary card.
- **Error State:** `ErrorBanner` ("We couldn't load your dashboard right now") with a Retry action if `GET /reports` fails.

---

### 4.5 Upload Report

- **Purpose:** Let the user upload a blood report PDF.
- **Main UI Sections:** Drag-and-drop upload zone (with a standard file-picker fallback), file requirements note (PDF only, max size), selected-file preview (filename, size), submit button.
- **Components:** `FileDropzone`, `FileInfoRow`, `PrimaryButton` ("Upload & Process"), `DisclaimerBanner` (brief privacy note).
- **Information Displayed:** Accepted format/size constraints; selected file name before submission.
- **User Actions:** Drag/select a PDF; remove/replace selection; submit upload.
- **Navigation Behavior:** On successful submission, navigate to **Report Processing** for that report's `id`.
- **API Endpoints Used:** `POST /reports`.
- **Loading State:** Upload button shows progress/spinner during the `multipart/form-data` request itself (network transfer), distinct from the subsequent processing state.
- **Empty State:** Default state of the screen before a file is chosen (dropzone with instructional copy).
- **Error State:** Inline error for wrong file type or oversized file (client-side check before submit, plus server-side `400 Bad Request` handling); `ErrorBanner` for network failures with a Retry action.

---

### 4.6 Report Processing / Loading State

- **Purpose:** Communicate that the uploaded report is being parsed and extracted, without blocking the user indefinitely.
- **Main UI Sections:** Centered status panel with a progress indicator, current status label (`pending` → `processing`), reassurance copy ("This usually takes under a minute").
- **Components:** `ProgressIndicator` (indeterminate spinner or step tracker: Uploaded → Reading Report → Extracting Values), `StatusBadge`, `SecondaryButton` ("Go to Dashboard while you wait").
- **Information Displayed:** Current `processing_status` value, polled periodically.
- **User Actions:** Wait on screen, or navigate away (processing continues server-side; user can return via Report History).
- **Navigation Behavior:** On `processing_status = "processed"`, auto-navigate to **Report Overview**. On `"failed"`, show an inline failure message with options to retry upload or delete the report.
- **API Endpoints Used:** `GET /reports/{report_id}/status` (polled, e.g., every 2–3 seconds).
- **Loading State:** This screen *is* the loading state for the upload flow.
- **Empty State:** Not applicable.
- **Error State:** `processing_status = "failed"` → `ErrorBanner` ("We couldn't process this report") with "Delete Report" and "Try Uploading Again" actions.

---

### 4.7 Report Overview

- **Purpose:** Present a single report's key metadata and a quick-glance summary before drilling into parameters or AI content.
- **Main UI Sections:** Report header (filename, report date, upload date, status), summary strip (total parameters extracted, count flagged for review, count outside reference range), tab navigation to Parameters / AI Explanation / Discussion Questions.
- **Components:** `ReportHeader`, `SummaryStrip`, `TabBar`, `StatusBadge`.
- **Information Displayed:** Only deterministic, extracted data — no AI content is shown by default on this screen.
- **User Actions:** Navigate to Parameters, AI Explanation, or Discussion Questions tabs; delete the report; download/view original PDF reference (if supported by file storage access).
- **Navigation Behavior:** Reached from Dashboard, Report History, or directly after processing completes. Tabs switch content within the same URL context (`/reports/{id}/...`).
- **API Endpoints Used:** `GET /reports/{report_id}`.
- **Loading State:** Skeleton header/strip while the report metadata loads.
- **Empty State:** Not applicable (a report always has at least attempted extraction by the time this screen is reached).
- **Error State:** `404` → "Report not found" screen with a link back to Report History.

---

### 4.8 Extracted Parameters

- **Purpose:** Show every blood parameter extracted from the report in a scannable, tabular format.
- **Main UI Sections:** Filter/sort bar (e.g., "Show only out-of-range," "Show only flagged for review"), parameter table/list.
- **Components:** `ParameterTable` (columns: Name, Value, Unit, Reference Range, Status badge), `StatusBadge` (`normal` / `high` / `low` / `needs review`), `FilterToggle`, `EditIconButton` (per row, opens Parameter Correction).
- **Information Displayed:** `parameter_name`, `value`, `unit`, `reference_range_low/high` or `reference_range_text`, `status` — all directly from `03_DATABASE.md`'s `parameters` table via the API, with no AI interpretation on this screen.
- **User Actions:** Filter/sort the table; click a row or edit icon to correct a value; navigate to AI Explanation for interpretation of these same values.
- **Navigation Behavior:** Tab within Report Details. Clicking "Correct this value" opens the Parameter Correction screen/modal for that row.
- **API Endpoints Used:** `GET /reports/{report_id}/parameters`.
- **Loading State:** Skeleton table rows.
- **Empty State:** If extraction produced zero parameters (rare, e.g., unsupported format), show a message: "We couldn't extract structured values from this report" with a suggestion to check the original PDF or contact support (out of MVP scope for actual support flow, but the state must be handled gracefully).
- **Error State:** `ErrorBanner` with Retry if the fetch fails.

---

### 4.9 Parameter Correction

- **Purpose:** Allow the user to correct a parameter that extraction flagged as uncertain (`status = "unparsed"`) or simply got wrong.
- **Main UI Sections:** Modal or dedicated panel showing the original extracted values (read-only reference) alongside editable fields.
- **Components:** `Modal` (or `SidePanel`), `NumberInput` (value), `TextInput` (unit), `RangeInputPair` (reference range low/high), `TextInput` (reference range text fallback), `PrimaryButton` ("Save Correction"), `SecondaryButton` ("Cancel").
- **Information Displayed:** The parameter's current stored values, clearly labeled as "as extracted" vs. the editable fields the user is changing.
- **User Actions:** Edit value/unit/reference range; save or cancel.
- **Navigation Behavior:** Opens from Extracted Parameters (modal overlay preferred, to avoid full navigation away from the table context); on save, closes and refreshes the affected row.
- **API Endpoints Used:** `PATCH /parameters/{parameter_id}`.
- **Loading State:** Save button spinner/disable during the request.
- **Empty State:** Not applicable.
- **Error State:** Inline validation error (e.g., non-numeric value) before submission; `ErrorBanner` within the modal on `400`/`404` responses.

---

### 4.10 AI Explanation

- **Purpose:** Provide a plain-language explanation of what the report's extracted parameters mean, generated by the local LLM.
- **Main UI Sections:** Prominent "AI-generated" label/header, disclaimer strip, explanation text body (organized by parameter or by theme, as generated), a "Regenerate" option (optional, low priority).
- **Components:** `AIContentCard` (visually distinct background/border from deterministic cards — e.g., a subtle accent color and an "AI Generated" tag), `DisclaimerBanner` ("This explanation is for educational purposes only and is not a medical diagnosis."), `LoadingSpinner`, `PrimaryButton` ("Generate Explanation") if not yet generated.
- **Information Displayed:** AI-generated explanation text tied to this report's parameters; always paired with the disclaimer text returned by the API.
- **User Actions:** Trigger generation (if not already generated/cached client-side for the session); read explanation; navigate to Discussion Questions next.
- **Navigation Behavior:** Tab within Report Details. Explicit user action to generate (button press) rather than auto-fetching on tab open, so AI usage is always an intentional choice — consistent with the "not a chatbot" product rule.
- **API Endpoints Used:** `GET /ai/reports/{report_id}/explanation`.
- **Loading State:** `LoadingSpinner` with reassuring copy ("Generating your explanation locally — this may take a moment") while the local LLM responds.
- **Empty State:** Before generation is triggered, show a prompt card explaining what this feature does, with the "Generate Explanation" button.
- **Error State:** `503 Service Unavailable` → `ErrorBanner` ("The AI explanation service is temporarily unavailable. Your report data is safe — please try again shortly.") with Retry.

---

### 4.11 Historical Trends

- **Purpose:** Visualize how a single parameter has changed across all of a user's reports over time.
- **Main UI Sections:** Parameter selector (dropdown/search, populated from parameters the user has across their reports), line chart, data table beneath the chart (date, value, status) for users who prefer tabular detail.
- **Components:** `ParameterSelect`, `TrendChart` (line chart with reference-range band overlay), `TrendDirectionBadge` ("Increasing" / "Decreasing" / "Stable" — neutral, non-alarmist phrasing), `DataTable`.
- **Information Displayed:** Time-series values for the selected parameter, its unit, and reference range band; direction of change as computed by the backend (never phrased as a clinical judgment).
- **User Actions:** Select a different parameter; hover/tap chart points for exact values; switch to AI Comparison Summary for two specific reports.
- **Navigation Behavior:** Reached via primary nav ("Trends") or contextually from a Report Details screen. If reached without a pre-selected parameter, defaults to the most recently viewed or most common parameter (e.g., first one alphabetically) with a clear selector to change it.
- **API Endpoints Used:** `GET /trends?parameter={normalized_name}`.
- **Loading State:** Skeleton chart area while data loads.
- **Empty State:** If the user has only one report (no history to trend), show: "Upload another report to start tracking trends for this value" with an Upload shortcut.
- **Error State:** `ErrorBanner` with Retry if the fetch fails; graceful handling of `400` (unknown parameter) by falling back to the parameter selector.

---

### 4.12 AI Comparison Summary

- **Purpose:** Generate an AI-written summary of what changed between two selected reports.
- **Main UI Sections:** Two report selectors ("Compare from" / "Compare to," defaulting to the two most recent reports), Generate button, AI-generated summary output area.
- **Components:** `ReportSelect` (×2), `PrimaryButton` ("Generate Summary"), `AIContentCard`, `DisclaimerBanner`.
- **Information Displayed:** Selected reports' dates for context; AI-generated summary text once produced.
- **User Actions:** Select two reports; trigger generation; change selection and regenerate.
- **Navigation Behavior:** Reached from Trends screen ("Compare Reports") or from a Report Overview ("Compare with another report"). Requires at least two processed reports to be usable — otherwise disabled with explanatory copy.
- **API Endpoints Used:** `GET /ai/summary?from_report_id=...&to_report_id=...`.
- **Loading State:** `LoadingSpinner` with the same local-generation reassurance copy as AI Explanation.
- **Empty State:** Fewer than two reports available → disabled selectors with a message: "Upload at least two reports to generate a comparison summary."
- **Error State:** `400 Bad Request` (e.g., same report selected twice) → inline validation message; `503` → `ErrorBanner` with Retry.

---

### 4.13 Doctor-Discussion Questions

- **Purpose:** Give the user a short, AI-generated list of questions they can ask their doctor based on the report's findings.
- **Main UI Sections:** Header framing the feature clearly ("Questions to consider for your next appointment"), generated question list, disclaimer.
- **Components:** `AIContentCard`, `QuestionListItem` (simple bullet/numbered list, optionally with a "copy to clipboard" or "print" action for bringing to an appointment), `DisclaimerBanner` ("These questions are meant to support your conversation with a healthcare provider and are not medical advice.").
- **Information Displayed:** A list of plain-language questions generated from the report's parameters.
- **User Actions:** Trigger generation; copy or print the list; navigate back to Report Overview.
- **Navigation Behavior:** Tab within Report Details, typically the last step in the consultation-prep journey.
- **API Endpoints Used:** `GET /ai/reports/{report_id}/questions`.
- **Loading State:** `LoadingSpinner`, consistent with other AI screens.
- **Empty State:** Pre-generation prompt card, same pattern as AI Explanation.
- **Error State:** `503` → `ErrorBanner` with Retry.

---

### 4.14 Report History

- **Purpose:** Give the user a complete, browsable list of every report they've uploaded.
- **Main UI Sections:** Search/filter bar (by date range, optional), chronological list/table of reports, pagination controls.
- **Components:** `ReportListTable` (columns: Report Date, Upload Date, Status, Quick Actions), `StatusBadge`, `PaginationControl`, `PrimaryButton` ("Upload New Report").
- **Information Displayed:** All reports belonging to the user, most recent first.
- **User Actions:** Open a report (→ Report Overview); delete a report (with confirmation dialog); upload a new report.
- **Navigation Behavior:** Reached via primary nav ("Reports"). Row click navigates into Report Details.
- **API Endpoints Used:** `GET /reports` (with `limit`/`offset`).
- **Loading State:** Skeleton table rows.
- **Empty State:** Zero reports → same empty-state pattern as Dashboard (illustration + "Upload your first report").
- **Error State:** `ErrorBanner` with Retry.

---

### 4.15 Report Details

*(Container screen — see Section 4.7–4.13, which are its tabs: Overview, Parameters, AI Explanation, Discussion Questions. Documented here for structural completeness.)*

- **Purpose:** Serve as the persistent context/shell for everything related to one report.
- **Main UI Sections:** Shared `ReportHeader` (report date, status, delete action) + `TabBar` (Overview | Parameters | AI Explanation | Discussion Questions), with tab content swapped below.
- **Components:** `ReportHeader`, `TabBar`.
- **Navigation Behavior:** URL structure `/reports/{id}` (Overview), `/reports/{id}/parameters`, `/reports/{id}/explanation`, `/reports/{id}/questions` — each tab deep-linkable and independently loadable.
- **API Endpoints Used:** `GET /reports/{report_id}` (shared header data); each tab fetches its own data per its own spec above.

---

### 4.16 User Profile / Settings

- **Purpose:** Let the user view their basic account information.
- **Main UI Sections:** Profile card (name, email, account created date), logout action.
- **Components:** `ProfileCard`, `SecondaryButton` ("Log Out").
- **Information Displayed:** `full_name`, `email`, `created_at` from `GET /auth/me`.
- **User Actions:** Log out.
- **Navigation Behavior:** Reached via primary nav ("Profile"). Logout clears the stored JWT and redirects to Landing/Login.
- **API Endpoints Used:** `GET /auth/me`.
- **Loading State:** Skeleton profile card.
- **Empty State:** Not applicable.
- **Error State:** `401` → redirect to Login (expired session).

> Note: Profile editing, password change, and notification settings are **not** part of the MVP (per `04_API.md` Section 20) — this screen is intentionally minimal.

---

## 5. Reusable UI Components

| Component | Used On | Notes |
|---|---|---|
| `Navbar` / `Sidebar` | All authenticated screens | Logged-in vs. logged-out variants |
| `TabBar` | Report Details | Underline-style active-tab indicator |
| `PrimaryButton` / `SecondaryButton` | Global | Two-tier button hierarchy; see Section 6 |
| `TextInput` / `PasswordInput` / `NumberInput` | Auth forms, Parameter Correction | Consistent label/error pattern |
| `FormCard` | Registration, Login | Centered card container |
| `FileDropzone` | Upload Report | Drag/drop + click-to-browse |
| `StatusBadge` | Reports, Parameters | Color-coded: normal (neutral/green), high/low (amber — not red/alarming), needs review (gray), processing (blue) |
| `SummaryCard` / `SummaryStrip` | Dashboard, Report Overview | Compact metric display |
| `ParameterTable` / `DataTable` | Extracted Parameters, Trends | Sortable/filterable |
| `TrendChart` | Historical Trends | Line chart with reference-range band |
| `AIContentCard` | AI Explanation, Comparison Summary, Discussion Questions | Visually distinct "AI-generated" styling |
| `DisclaimerBanner` | AI screens, Upload, Registration | Short, non-intrusive, consistent copy patterns |
| `ErrorBanner` | Global | Retry-capable, consistent structure per `04_API.md` Section 14 |
| `LoadingSpinner` / `SkeletonBlock` | Global | Used per screen-specific loading states above |
| `EmptyStateIllustration` | Dashboard, Report History, Trends | Consistent friendly, non-clinical illustration style |
| `Modal` / `SidePanel` | Parameter Correction | Overlay pattern, dismissible |
| `PaginationControl` | Report History | Simple prev/next + page indicator |
| `ConfirmDialog` | Report deletion | Explicit confirm/cancel, used for destructive actions only |

---

## 6. Design System Basics

### 6.1 Typography
- **Typeface:** A single clean, highly legible sans-serif (system font stack acceptable — e.g., Inter, or the OS default sans-serif) for both UI text and data.
- **Scale:** A restrained type scale — e.g., H1 (page titles) / H2 (section headers) / H3 (card/table headers) / Body / Small (captions, disclaimers).
- **Numeric Data:** Parameter values and chart axis labels use a tabular-figure (monospace-numeral) style where available, so numbers align cleanly in tables.
- **AI Content Typography:** AI-generated text uses the same base typeface as the rest of the app (never a "chat bubble" or distinct playful font) — reinforcing that it is informational content, not a conversational agent.

### 6.2 Spacing
- A consistent spacing scale (e.g., 4px base unit: 4/8/12/16/24/32/48) applied uniformly across padding, margins, and gaps.
- Generous whitespace around data tables and AI content blocks to avoid a dense, clinical-chart feel.

### 6.3 Buttons
- **Primary Button:** Solid fill, used for the single main action per screen (Upload, Save, Generate, Submit).
- **Secondary Button:** Outlined/ghost style, used for lower-emphasis actions (Cancel, Log Out, "Go to Dashboard while you wait").
- **Destructive Action:** Reserved for report deletion only; uses a clearly distinct (but not alarmist) treatment, always paired with a `ConfirmDialog`.
- Buttons always show a disabled/spinner state during in-flight requests to prevent duplicate submissions.

### 6.4 Cards
- Standard `Card` component: subtle border/shadow, consistent corner radius, used for summary blocks, form containers, and list items.
- `AIContentCard` is a visual variant of `Card` — same shape/radius, but with a distinct accent (e.g., a left border stripe or subtle background tint) and a persistent small "AI Generated" tag in the header, so it is instantly distinguishable from data-only cards even at a glance.

### 6.5 Forms
- Label above field (not placeholder-only labels, for accessibility).
- Inline validation messages appear beneath the relevant field, in a consistent color/icon pattern.
- Required fields are clearly marked; optional fields (e.g., `reference_range_text`) are labeled "optional."

### 6.6 Tables
- Zebra-striping optional; clear column headers; right-aligned numeric columns; status conveyed via `StatusBadge`, not row background color alone (to remain colorblind-friendly, per Section 7).
- Tables are horizontally scrollable (not squeezed) on narrow viewports rather than truncating columns.

### 6.7 Alerts
- Three alert tiers, each with a distinct but restrained visual treatment:
  - **Informational** (e.g., "This report is still processing") — neutral blue/gray.
  - **Disclaimer** — a consistent, low-emphasis style used only for the educational/non-diagnostic notices, so it registers as a standard part of the interface rather than a warning.
  - **Error** — amber/red, always paired with a clear next step (Retry, Contact, Go Back) — never a dead end.
- No alert uses fear-inducing icons (e.g., no skulls, exclamation-triangle-heavy styling) per the product rule against fear-inducing language.

### 6.8 Charts
- **Chart Type:** Line chart only for trends (per PRD scope) — no unnecessary chart-type variety.
- **Clarity Rules:** Reference range shown as a shaded horizontal band behind the line; data points clearly marked and labeled on hover/tap; axis labels always include units.
- **Color Use:** A single accent color for the trend line; the reference band uses a neutral, low-saturation fill (not green/red, to avoid implying "good/bad" via color alone — status is conveyed via the accompanying `StatusBadge`/table, not chart color coding).
- **No 3D, no unnecessary gridlines, no chart junk** — prioritizing clarity per the product rule.

---

## 7. Accessibility Considerations

- **Color Independence:** Status (normal/high/low/needs review) is always conveyed with both color and text/icon — never color alone — for colorblind accessibility.
- **Contrast:** All text meets WCAG AA contrast minimums against its background, including within `AIContentCard` and `StatusBadge` variants.
- **Keyboard Navigation:** All interactive elements (buttons, form fields, table row actions, tab bar, modal controls) are reachable and operable via keyboard, with visible focus states.
- **Screen Reader Support:** Form fields have associated labels; `StatusBadge` and chart data points include accessible text equivalents (e.g., `aria-label="Hemoglobin: 13.8 g/dL, within normal range"`); AI-generated content sections are announced with a clear "AI generated content" cue for assistive technology, not just visual styling.
- **Motion:** Loading spinners and transitions are subtle and respect `prefers-reduced-motion`.
- **Plain Language:** Both UI copy and AI-generated explanations target plain, non-jargon language wherever possible, supporting users with varying health literacy — consistent with the PRD's core goal.
- **Disclaimers Are Legible, Not Buried:** Disclaimer text meets the same contrast/size standards as body text — it is not rendered as illegible fine print.

---

## 8. Responsive Design Strategy

### 8.1 Breakpoints (indicative)
- **Mobile:** up to ~640px
- **Tablet:** ~641–1024px
- **Desktop:** 1025px+

### 8.2 Layout Adaptations
- **Navigation:** Sidebar (desktop/tablet) collapses to a bottom tab bar (mobile) with the same four primary destinations; the "Upload" action becomes a floating action button on mobile.
- **Tables → Stacked Cards:** On mobile, `ParameterTable` and `ReportListTable` rows reflow into stacked card-style rows (label/value pairs) rather than horizontally scrolling a dense table, to preserve readability.
- **Charts:** `TrendChart` remains a line chart at all breakpoints but simplifies axis labeling density on mobile (fewer tick labels, tap-to-reveal detail instead of hover).
- **Tabs:** `TabBar` within Report Details becomes horizontally scrollable on mobile rather than wrapping.
- **Forms:** Single-column at all breakpoints (no multi-column form layouts) for consistency and simplicity.
- **AI Content:** `AIContentCard` retains its full-width, clearly-labeled treatment on mobile — never collapsed into a chat-bubble pattern, preserving the "informational card" identity across screen sizes.

### 8.3 Touch Targets
- All interactive elements meet a minimum touch target size (~44×44px) on mobile/tablet, including table row actions and chart data points.

---

## 9. Frontend-to-Backend Interaction Map

| Screen | Primary Endpoint(s) | Notes |
|---|---|---|
| Registration | `POST /auth/register`, `POST /auth/login` | Auto-login after registration |
| Login | `POST /auth/login` | |
| Dashboard | `GET /reports` | Limited/recent subset |
| Upload Report | `POST /reports` | `multipart/form-data` |
| Report Processing | `GET /reports/{id}/status` | Polled |
| Report Overview | `GET /reports/{id}` | |
| Extracted Parameters | `GET /reports/{id}/parameters` | |
| Parameter Correction | `PATCH /parameters/{id}` | |
| AI Explanation | `GET /ai/reports/{id}/explanation` | User-triggered |
| Historical Trends | `GET /trends?parameter=...` | |
| AI Comparison Summary | `GET /ai/summary?from_report_id=...&to_report_id=...` | User-triggered |
| Doctor-Discussion Questions | `GET /ai/reports/{id}/questions` | User-triggered |
| Report History | `GET /reports` | Paginated |
| Report Deletion | `DELETE /reports/{id}` | Confirmed via `ConfirmDialog` |
| Profile / Settings | `GET /auth/me` | |

This mapping is exhaustive against `04_API.md`'s Section 5 endpoint summary — every defined endpoint is used by exactly one clear UI flow, and no screen requires an endpoint that doesn't exist in the API design.

---

## 10. Future UI Considerations

The following are **not part of the MVP** UI scope, consistent with the Future Scope defined in `01_PRD.md`, `02_ARCHITECTURE.md`, and `04_API.md`:

- **Print/Export Layout** for the Doctor-Discussion Questions and AI Comparison Summary screens, formatted for a printed consultation-prep sheet.
- **Caregiver/Shared View Mode** — a UI mode for viewing another person's reports under permission, once multi-user/family accounts are supported.
- **Notification Center** — for reminders about periodic testing (future scope item).
- **Report Type Filtering** (e.g., filter Report History by panel type) if `report_type` categorization is added to the data model.
- **Multi-Language UI** — if localization becomes a future goal.
- **Push-Based Processing Updates** — replacing the polling pattern on the Report Processing screen with WebSocket-driven updates if upload volume grows.
- **Native Mobile App Layout** — the current strategy is responsive web only; a dedicated native app is out of scope.

None of these are designed or included in the current specification, as none are required by the confirmed MVP scope.

---

*End of Document*
