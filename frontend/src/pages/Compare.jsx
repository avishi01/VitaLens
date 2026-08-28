import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useAuth } from "../context/useAuth"
import { api } from "../api/client"
import AIResultPanel from "../components/AIResultPanel"
import { parameterLabel, normalizeParameters } from "../utils/parameters"

function formatShortDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    dateStyle: "medium",
  })
}

function formatChange(oldValue, newValue) {
  if (oldValue === null || newValue === null) return "—"
  const diff = newValue - oldValue
  if (diff === 0) return "No change"
  const rounded = Math.round(Math.abs(diff) * 100) / 100
  return diff > 0 ? `+${rounded}` : `-${rounded}`
}

function Compare() {
  const { token } = useAuth()
  const [searchParams] = useSearchParams()

  const [summaries, setSummaries] = useState([])
  const [loadingSummaries, setLoadingSummaries] = useState(true)
  const [error, setError] = useState("")

  const [reportAId, setReportAId] = useState("")
  const [reportBId, setReportBId] = useState("")

  const [reportA, setReportA] = useState(null)
  const [reportB, setReportB] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Load the list of reports once, and pre-select from ?report= if present.
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoadingSummaries(true)
      setError("")
      try {
        const data = await api.listReports(token)
        // Newest first for convenience when picking.
        data.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
        if (!cancelled) {
          setSummaries(data)

          const preselected = searchParams.get("report")
          if (preselected && data.some((r) => String(r.id) === preselected)) {
            setReportBId(preselected)
            const other = data.find((r) => String(r.id) !== preselected)
            if (other) setReportAId(String(other.id))
          } else if (data.length >= 2) {
            setReportAId(String(data[1].id))
            setReportBId(String(data[0].id))
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoadingSummaries(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // Only run once on mount -- searchParams is only used for the initial default.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    let cancelled = false

    async function loadDetails() {
      if (!reportAId || !reportBId) {
        setReportA(null)
        setReportB(null)
        return
      }

      setLoadingDetails(true)
      setError("")
      try {
        const [a, b] = await Promise.all([
          api.getReport(token, reportAId),
          api.getReport(token, reportBId),
        ])
        if (!cancelled) {
          setReportA(a)
          setReportB(b)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoadingDetails(false)
      }
    }

    loadDetails()
    return () => {
      cancelled = true
    }
  }, [token, reportAId, reportBId])

  // Always compare chronologically: older -> newer, regardless of which
  // dropdown the user picked which report in.
  const [olderReport, newerReport] = useMemo(() => {
    if (!reportA || !reportB) return [null, null]
    return new Date(reportA.uploaded_at) <= new Date(reportB.uploaded_at)
      ? [reportA, reportB]
      : [reportB, reportA]
  }, [reportA, reportB])

  const comparisonRows = useMemo(() => {
    if (!olderReport || !newerReport) return []

    const olderParams = normalizeParameters(olderReport.extracted_parameters)
    const newerParams = normalizeParameters(newerReport.extracted_parameters)
    const allKeys = new Set([...Object.keys(olderParams), ...Object.keys(newerParams)])

    return Array.from(allKeys)
      .sort()
      .map((key) => {
        const older = olderParams[key]
        const newer = newerParams[key]
        return {
          key,
          olderValue: older?.value ?? null,
          newerValue: newer?.value ?? null,
          unit: newer?.unit ?? older?.unit ?? null,
        }
      })
  }, [olderReport, newerReport])

  if (loadingSummaries) {
    return <div className="page-loading">Loading reports...</div>
  }

  if (summaries.length < 2) {
    return (
      <div className="page-container">
        <Link to="/dashboard" className="back-link">
          &larr; Back to dashboard
        </Link>
        <h1>Compare Reports</h1>
        <p>You need at least two uploaded reports to compare.</p>
      </div>
    )
  }

  return (
    <div className="page-container page-container-wide">
      <Link to="/dashboard" className="back-link">
        &larr; Back to dashboard
      </Link>

      <h1>Compare Reports</h1>

      <div className="compare-selectors">
        <div className="form-field">
          <label htmlFor="report-a">Report A</label>
          <select
            id="report-a"
            value={reportAId}
            onChange={(e) => setReportAId(e.target.value)}
          >
            <option value="">Select a report</option>
            {summaries.map((r) => (
              <option key={r.id} value={r.id}>
                {r.filename} ({formatShortDate(r.uploaded_at)})
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="report-b">Report B</label>
          <select
            id="report-b"
            value={reportBId}
            onChange={(e) => setReportBId(e.target.value)}
          >
            <option value="">Select a report</option>
            {summaries.map((r) => (
              <option key={r.id} value={r.id}>
                {r.filename} ({formatShortDate(r.uploaded_at)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loadingDetails && <p className="page-loading">Loading comparison...</p>}

      {!loadingDetails && olderReport && newerReport && (
        <>
          {reportAId === reportBId && (
            <p className="form-error">Please select two different reports.</p>
          )}

          <table className="parameter-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Older ({formatShortDate(olderReport.uploaded_at)})</th>
                <th>Newer ({formatShortDate(newerReport.uploaded_at)})</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.key}>
                  <td>{parameterLabel(row.key)}</td>
                  <td>
                    {row.olderValue === null ? "—" : `${row.olderValue}${row.unit ? ` ${row.unit}` : ""}`}
                  </td>
                  <td>
                    {row.newerValue === null ? "—" : `${row.newerValue}${row.unit ? ` ${row.unit}` : ""}`}
                  </td>
                  <td>{formatChange(row.olderValue, row.newerValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="disclaimer">
            This comparison shows numerical changes between two reports for
            educational purposes only. It does not diagnose any condition —
            please discuss meaningful changes with a doctor.
          </p>

          <div className="ai-section">
            <AIResultPanel
              key={`${olderReport.id}-${newerReport.id}`}
              title="AI Comparison Summary"
              buttonLabel="Summarize changes"
              onGenerate={async () => {
                const res = await api.getComparisonSummary(
                  token,
                  olderReport.id,
                  newerReport.id
                )
                return res.summary
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default Compare
