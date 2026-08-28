import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/useAuth"

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/")
  }

  return (
    <nav>
      <Link to="/" className="logo">
        VitaLens
      </Link>

      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <span className="nav-user">{user?.name}</span>
            <button className="nav-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="nav-register">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
