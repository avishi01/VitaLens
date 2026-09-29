import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/useAuth"

const items = [
  ["/dashboard", "Overview", "⌂"],
  ["/reports", "Reports", "▤"],
  ["/trends", "Trends", "⌁"],
  ["/compare", "Compare", "⇄"],
]

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (!isAuthenticated) {
    return (
      <header className="public-nav">
        <Link to="/" className="brand">
          <span className="brand-mark">V</span><span className="brand-name">VitaLens</span>
        </Link>
        <nav className="public-links">
          <Link to="/login">Log in</Link>
          <Link to="/register" className="nav-cta">Get started</Link>
        </nav>
      </header>
    )
  }

  const active = (path) => path === "/reports" ? (location.pathname.startsWith("/reports") || location.pathname === "/reports") : location.pathname === path

  function handleLogout() {
    logout()
    navigate("/")
  }

  return (
    <aside className="app-sidebar">
      <Link to="/dashboard" className="brand">
        <span className="brand-mark">V</span><span className="brand-name">VitaLens</span>
      </Link>
      <div className="side-label">Workspace</div>
      <nav className="side-nav">
        {items.map(([path, label, icon]) => (
          <Link key={path} to={path} className={`side-link ${active(path) ? "active" : ""}`}>
            <span className="side-icon">{icon}</span><span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="side-spacer" />
      <Link to="/upload" className="side-link side-upload"><span>＋</span><span>Upload report</span></Link>
      <div className="side-user">
        <div className="avatar">{(user?.name || "U").charAt(0).toUpperCase()}</div>
        <div className="side-user-name"><strong>{user?.name || "Account"}</strong><span>Personal workspace</span></div>
        <button className="logout-btn" onClick={handleLogout} title="Log out">↪</button>
      </div>
    </aside>
  )
}

export default Navbar
