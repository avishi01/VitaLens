import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { useAuth } from "./context/useAuth"
import ProtectedRoute from "./components/ProtectedRoute"
import Navbar from "./components/Navbar"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import UploadReport from "./pages/UploadReport"
import ReportDetail from "./pages/ReportDetail"
import Trends from "./pages/Trends"
import Compare from "./pages/Compare"

function AppContent() {
  const { isAuthenticated } = useAuth()

  return (
    <div className={`app-shell ${isAuthenticated ? "authenticated" : ""}`}>
      <Navbar />
      <div className="app-main">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadReport /></ProtectedRoute>} />
            <Route path="/reports/:reportId" element={<ProtectedRoute><ReportDetail /></ProtectedRoute>} />
            <Route path="/trends" element={<ProtectedRoute><Trends /></ProtectedRoute>} />
            <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
          </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
