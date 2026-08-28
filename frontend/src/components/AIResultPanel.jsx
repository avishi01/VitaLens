import { useState } from "react"

/**
 * Generic on-demand AI panel: shows a button that triggers a single AI
 * call (explanation, doctor questions, or comparison summary), then
 * displays the result with loading/error states. The actual API call is
 * passed in via onGenerate so this component has no knowledge of which
 * endpoint it's calling.
 */
function AIResultPanel({ title, buttonLabel, onGenerate }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleClick() {
    setLoading(true)
    setError("")
    try {
      const text = await onGenerate()
      setResult(text)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <h3>{title}</h3>
        <button onClick={handleClick} disabled={loading}>
          {loading ? "Generating..." : result ? "Regenerate" : buttonLabel}
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading && (
        <p className="page-loading">
          Generating with the local AI model — this can take a little while
          on first use...
        </p>
      )}

      {result && !loading && <div className="ai-panel-result">{result}</div>}
    </div>
  )
}

export default AIResultPanel
