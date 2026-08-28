import { Navigate } from "react-router-dom"
import { useAuth } from "../context/useAuth"

function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth()

  if (initializing) {
    return <div className="page-loading">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
