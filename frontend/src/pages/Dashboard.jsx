import { useEffect, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/useAuth"
import { api } from "../api/client"
import { parameterLabel, normalizeParameters, formatValueWithUnit } from "../utils/parameters"

function formatDate(dateString){return new Date(dateString).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"})}
function Dashboard(){
 const {token,user}=useAuth();const[reports,setReports]=useState([]);const[latest,setLatest]=useState(null);const[loading,setLoading]=useState(true);const[error,setError]=useState("")
 const load=useCallback(async()=>{setLoading(true);setError("");try{const data=await api.listReports(token);data.sort((a,b)=>new Date(b.uploaded_at)-new Date(a.uploaded_at));setReports(data);if(data[0])setLatest(await api.getReport(token,data[0].id))}catch(e){setError(e.message)}finally{setLoading(false)}},[token])
 useEffect(()=>{load()},[load])
 const latestParams=latest?normalizeParameters(latest.extracted_parameters):{}
 const snapshot=Object.entries(latestParams).filter(([,v])=>v?.value!==null).slice(0,4)
 return <div className="page-container">
  <div className="dashboard-hero"><div><div className="eyebrow">Personal overview</div><h1>Good to see you{user?.name?`, ${user.name.split(" ")[0]}`:""}.</h1><p>A simple view of your latest health reports and extracted data.</p></div><Link to="/upload" className="btn btn-primary">＋ Upload report</Link></div>
  {error&&<p className="form-error">{error} <button className="btn btn-ghost" onClick={load}>Retry</button></p>}
  {!loading&&!error&&<>
   <div className="dashboard-grid">
    <div className="card latest-card"><div className="eyebrow">Latest report</div>{latest?<><div className="latest-title">{latest.filename}</div><p>{formatDate(latest.uploaded_at)}</p><Link className="latest-link" to={`/reports/${latest.id}`}>Open report →</Link></>:<><div className="latest-title">No reports yet</div><p>Upload your first blood report to get started.</p><Link className="latest-link" to="/upload">Upload a report →</Link></>}</div>
    <div className="card stat-card"><span className="stat-label">Reports tracked</span><span className="stat-number">{reports.length}</span><span className="stat-note">Your uploaded report history</span></div>
   </div>
   {reports.length>0&&<div className="section-block"><div className="section-heading"><h2>Recent reports</h2><Link to="/upload">Upload another →</Link></div><ul className="report-list">{reports.slice(0,5).map(r=><li key={r.id}><Link to={`/reports/${r.id}`}><span className="report-file-icon">PDF</span><span className="report-row-copy"><span className="report-filename">{r.filename}</span><span className="report-date">{formatDate(r.uploaded_at)}</span></span><span className="row-arrow">→</span></Link></li>)}</ul></div>}
   {snapshot.length>0&&<div className="section-block"><div className="section-heading"><h2>Latest parameter snapshot</h2><Link to={`/reports/${latest.id}`}>View all →</Link></div><div className="snapshot-grid">{snapshot.map(([key,v])=><div className="card snapshot-card" key={key}><div className="snapshot-label">{parameterLabel(key)}</div><div className="snapshot-value">{formatValueWithUnit(v)}</div><div className={`snapshot-status status-${String(v.status||"unknown").toLowerCase()}`}>{v.status}</div></div>)}</div></div>}
   <div className="section-block"><div className="section-heading"><h2>Explore your data</h2></div><div className="quick-grid">{reports.length>=2&&<><Link to="/trends" className="card quick-card"><span className="quick-icon">⌁</span><span><strong>Parameter trends</strong><span>See shared values over time</span></span></Link><Link to="/compare" className="card quick-card"><span className="quick-icon">⇄</span><span><strong>Compare reports</strong><span>Review changes between reports</span></span></Link></>}</div></div>
  </>}
  {!loading&&!error&&reports.length===0&&<div className="card empty-state"><h2>Your workspace is ready.</h2><p>Upload a blood report to extract its parameters, explore an AI explanation and start building your report history.</p><Link to="/upload" className="btn btn-primary">Upload your first report</Link></div>}
 </div>
}
export default Dashboard
