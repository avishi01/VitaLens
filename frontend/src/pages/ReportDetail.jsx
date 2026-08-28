import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useAuth } from "../context/useAuth"
import { api } from "../api/client"
import AIResultPanel from "../components/AIResultPanel"
import {
  parameterLabel,
  normalizeParameters,
  formatReferenceRange,
  formatValueWithUnit,
} from "../utils/parameters"

function formatDate(dateString) {
  return new Date(dateString).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function statusClassName(status) {
  switch (status) {
    case "Low":
      return "status-low"
    case "High":
      return "status-high"
    case "Normal":
      return "status-normal"
    default:
      return "status-unknown"
  }
}

function ReportDetail() {
  const { reportId } = useParams()
  const { token } = useAuth()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError("")
      try {
        const data = await api.getReport(token, reportId)
        if (!cancelled) setReport(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [token, reportId])

  if (loading) {
    return <div className="page-loading">Loading report...</div>
  }

  if (error) {
    return (
      <div className="page-container">
        <p className="form-error">{error}</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </div>
    )
  }

  const parameters = normalizeParameters(report?.extracted_parameters)
  const parameterEntries = Object.entries(parameters)
  const hasAnyRange = parameterEntries.some(
    ([, p]) => p.referenceLow !== null && p.referenceHigh !== null
  )

  return (
    <div className="page-container">
      <Link to="/dashboard" className="back-link">
        &larr; Back to dashboard
      </Link>

      <h1>{report.filename}</h1>
      <p className="report-meta">Uploaded {formatDate(report.uploaded_at)}</p>

      <p className="disclaimer">
        Information shown here is for educational purposes only and is not a
        medical diagnosis or a substitute for professional medical advice.
        Values, units, and reference ranges are extracted automatically from
        your uploaded PDF and may occasionally contain extraction errors —
        always check the original report for anything you plan to discuss
        with a doctor.
      </p>

      <h2>Extracted Parameters</h2>

      {parameterEntries.length === 0 ? (
        <p>No parameters could be extracted from this report.</p>
      ) : (
        <table className="parameter-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
              {hasAnyRange && <th>Reference Range</th>}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {parameterEntries.map(([key, normalized]) => (
              <tr key={key}>
                <td>{parameterLabel(key)}</td>
                <td>{formatValueWithUnit(normalized)}</td>
                {hasAnyRange && <td>{formatReferenceRange(normalized)}</td>}
                <td>
                  <span className={`status-badge ${statusClassName(normalized.status)}`}>
                    {normalized.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="ai-section">
        <AIResultPanel
          title="AI Explanation"
          buttonLabel="Explain this report"
          onGenerate={async () => {
            const res = await api.explainReport(token, reportId)
            return res.explanation
          }}
        />

        <AIResultPanel
          title="Doctor Discussion Questions"
          buttonLabel="Generate questions"
          onGenerate={async () => {
            const res = await api.getDoctorQuestions(token, reportId)
            return res.questions
          }}
        />
      </div>

      <div className="report-actions">
        <Link to={`/trends?highlight=${reportId}`}>View parameter trends</Link>
        <Link to={`/compare?report=${reportId}`}>Compare with another report</Link>
      </div>
    </div>
  )
}

export default ReportDetail
