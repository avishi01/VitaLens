import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/useAuth"

function Login() {
  const { login } = useAuth(); const navigate = useNavigate()
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [submitting,setSubmitting]=useState(false)
  async function handleSubmit(e){e.preventDefault();setError("");setSubmitting(true);try{await login(email,password);navigate("/dashboard")}catch(err){setError(err.message)}finally{setSubmitting(false)}}
  return <div className="auth-page">
    <div className="auth-copy"><div className="eyebrow">Welcome back</div><h1>Your health data, in one calmer place.</h1><p>Continue exploring your reports, trends and AI-powered explanations with VitaLens.</p></div>
    <div className="card auth-card"><h1>Log in</h1><p>Access your personal VitaLens workspace.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-field"><label htmlFor="email">Email</label><input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required disabled={submitting} placeholder="you@example.com"/></div>
        <div className="form-field"><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required disabled={submitting} placeholder="Enter your password"/></div>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</button>
      </form><p className="auth-switch">New to VitaLens? <Link to="/register">Create an account</Link></p>
    </div>
  </div>
}
export default Login
