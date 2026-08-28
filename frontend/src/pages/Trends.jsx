import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useAuth } from "../context/useAuth"
import { api } from "../api/client"
import { parameterLabel, normalizeParameters } from "../utils/parameters"

function formatShortDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "2-digit",
  })
}

function Trends() {
  const { token } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedParameter, setSelectedParameter] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError("")
      try {
        const summaries = await api.listReports(token)
        // Reports are needed with their extracted parameters, which the
        // list endpoint doesn't include -- fetch each report's detail.
        // Uses the existing GET /reports/{id} endpoint; no new backend
        // endpoint is introduced.
        const details = await Promise.all(
          summaries.map((r) => api.getReport(token, r.id))
        )
        if (!cancelled) {
          // Chronological order (oldest first) for trend charts.
          details.sort((a, b) => new Date(a.uploaded_at) - new Date(b.uploaded_at))
          setReports(details)
        }
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
  }, [token])

  // Parameters that appear in at least 2 reports, since a trend needs at
  // least two points to be meaningful.
  const availableParameters = useMemo(() => {
    const counts = {}
    for (const report of reports) {
      const params = normalizeParameters(report.extracted_parameters)
      for (const [key, entry] of Object.entries(params)) {
        if (entry.value !== null) {
          counts[key] = (counts[key] || 0) + 1
        }
      }
    }
    return Object.keys(counts)
      .filter((key) => counts[key] >= 2)
      .sort()
  }, [reports])

  useEffect(() => {
    if (!selectedParameter && availableParameters.length > 0) {
      setSelectedParameter(availableParameters[0])
    }
  }, [availableParameters, selectedParameter])

  const chartData = useMemo(() => {
    if (!selectedParameter) return []

    return reports
      .map((report) => {
        const params = normalizeParameters(report.extracted_parameters)
        const entry = params[selectedParameter]
        if (!entry || entry.value === null) return null

        return {
          date: formatShortDate(report.uploaded_at),
          value: entry.value,
          unit: entry.unit,
        }
      })
      .filter(Boolean)
  }, [reports, selectedParameter])

  if (loading) {
    return <div className="page-loading">Loading trends...</div>
  }

  if (error) {
    return (
      <div className="page-container">
        <p className="form-error">{error}</p>
      </div>
    )
  }

  return (
    <div className="page-container page-container-wide">
      <Link to="/dashboard" className="back-link">
        &larr; Back to dashboard
      </Link>

      <h1>Parameter Trends</h1>

      {availableParameters.length === 0 ? (
        <p>
          Upload at least two reports with a shared parameter to see trends
          over time.
        </p>
      ) : (
        <>
          <div className="form-field trends-select">
            <label htmlFor="parameter-select">Parameter</label>
            <select
              id="parameter-select"
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
            >
              {availableParameters.map((key) => (
                <option key={key} value={key}>
                  {parameterLabel(key)}
                </option>
              ))}
            </select>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#526071" fontSize={13} />
                <YAxis stroke="#526071" fontSize={13} />
                <Tooltip
                  formatter={(value, name, props) =>
                    props.payload.unit ? `${value} ${props.payload.unit}` : value
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={parameterLabel(selectedParameter)}
                  stroke="#172033"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="disclaimer">
            This chart shows values as extracted from your uploaded reports
            and is for educational purposes only. It is not a diagnosis.
          </p>
        </>
      )}
    </div>
  )
}

export default Trends
