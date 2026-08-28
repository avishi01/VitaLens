import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/useAuth"
import { api } from "../api/client"

function UploadReport() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [file, setFile] = useState(null)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [stage, setStage] = useState("")

  function handleFileChange(e) {
    setFile(e.target.files?.[0] || null)
    setError("")
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    if (!file) {
      setError("Please choose a PDF file to upload.")
      return
    }

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.")
      return
    }

    setSubmitting(true)
    setStage("Uploading report...")

    try {
      // The backend does upload, OCR fallback, and parameter extraction
      // synchronously in one request, so we show a general "processing"
      // message for the duration of the request rather than fake substeps.
      setStage("Uploading and processing report (extracting text and parameters)...")
      const result = await api.uploadReport(token, file)
      navigate(`/reports/${result.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
      setStage("")
    }
  }

  return (
    <div className="page-container">
      <h1>Upload Blood Report</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={submitting}
        />

        {error && <p className="form-error">{error}</p>}
        {submitting && <p className="page-loading">{stage}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Processing..." : "Upload Report"}
        </button>
      </form>
    </div>
  )
}

export default UploadReport
