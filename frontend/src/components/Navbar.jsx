import { Link } from "react-router-dom"

function Navbar() {
  return (
    <nav>
      <Link to="/" className="logo">
        VitaLens
      </Link>

      <div className="nav-links">
        <Link to="/login">Login</Link>
        <Link to="/register" className="nav-register">
          Get Started
        </Link>
      </div>
    </nav>
  )
}

export default Navbar 