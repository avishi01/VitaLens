import { useEffect, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/useAuth"
import { api } from "../api/client"

function formatDate(dateString) {
  return new Date(dateString).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function Dashboard() {
  const { token, user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchReports = useCallback(async () => {
    const data = await api.listReports(token)
    return data
  }, [token])

  const loadReports = useCallback(() => {
    setLoading(true)
    setError("")
    fetchReports()
      .then(setReports)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [fetchReports])

  useEffect(() => {
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="page-container">
      <h1>Dashboard</h1>
      <p>Welcome to VitaLens{user?.name ? `, ${user.name}` : ""}.</p>

      <Link to="/upload">
        <button>Upload Blood Report</button>
      </Link>

      {!loading && !error && reports.length >= 2 && (
        <div className="dashboard-actions">
          <Link to="/trends">View Trends</Link>
          <Link to="/compare">Compare Reports</Link>
        </div>
      )}

      <h2>Recent Reports</h2>

      {loading && <p className="page-loading">Loading reports...</p>}

      {!loading && error && (
        <div>
          <p className="form-error">{error}</p>
          <button onClick={loadReports}>Retry</button>
        </div>
      )}

      {!loading && !error && reports.length === 0 && <p>No reports yet.</p>}

      {!loading && !error && reports.length > 0 && (
        <ul className="report-list">
          {reports.map((report) => (
            <li key={report.id}>
              <Link to={`/reports/${report.id}`}>
                <span className="report-filename">{report.filename}</span>
                <span className="report-date">
                  {formatDate(report.uploaded_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Dashboard
