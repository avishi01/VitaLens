import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/useAuth"

function Register(){
 const {register}=useAuth();const navigate=useNavigate();const[name,setName]=useState("");const[email,setEmail]=useState("");const[password,setPassword]=useState("");const[error,setError]=useState("");const[submitting,setSubmitting]=useState(false)
 async function handleSubmit(e){e.preventDefault();setError("");setSubmitting(true);try{await register(name,email,password);navigate("/dashboard")}catch(err){setError(err.message)}finally{setSubmitting(false)}}
 return <div className="auth-page"><div className="auth-copy"><div className="eyebrow">Start your workspace</div><h1>Bring your health reports together.</h1><p>Create a private VitaLens workspace to organize reports and follow your results over time.</p></div>
 <div className="card auth-card"><h1>Create account</h1><p>It only takes a moment to get started.</p><form onSubmit={handleSubmit}>
  <div className="form-field"><label htmlFor="name">Name</label><input id="name" type="text" value={name} onChange={e=>setName(e.target.value)} required disabled={submitting} placeholder="Your name"/></div>
  <div className="form-field"><label htmlFor="email">Email</label><input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required disabled={submitting} placeholder="you@example.com"/></div>
  <div className="form-field"><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} disabled={submitting} placeholder="At least 8 characters"/></div>
  {error&&<p className="form-error">{error}</p>}<button className="btn btn-primary" type="submit" disabled={submitting}>{submitting?"Creating account...":"Create account"}</button>
 </form><p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p></div></div>
}
export default Register
