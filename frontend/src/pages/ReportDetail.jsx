import { useEffect,useState } from "react"
import { useParams,Link } from "react-router-dom"
import { useAuth } from "../context/useAuth"
import { api } from "../api/client"
import AIResultPanel from "../components/AIResultPanel"
import {parameterLabel,normalizeParameters,formatReferenceRange,formatValueWithUnit} from "../utils/parameters"
function formatDate(d){return new Date(d).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"})}
function statusClassName(s){return s==="Low"?"status-low":s==="High"?"status-high":s==="Normal"?"status-normal":"status-unknown"}
function ReportDetail(){
 const{reportId}=useParams();const{token}=useAuth();const[report,setReport]=useState(null);const[loading,setLoading]=useState(true);const[error,setError]=useState("")
 useEffect(()=>{let cancelled=false;(async()=>{setLoading(true);setError("");try{const d=await api.getReport(token,reportId);if(!cancelled)setReport(d)}catch(e){if(!cancelled)setError(e.message)}finally{if(!cancelled)setLoading(false)}})();return()=>{cancelled=true}},[token,reportId])
 if(loading)return <div className="page-loading">Loading report...</div>
 if(error)return <div className="page-container"><p className="form-error">{error}</p><Link to="/dashboard" className="back-link">← Back to dashboard</Link></div>
 const params=normalizeParameters(report?.extracted_parameters);const entries=Object.entries(params);const hasRange=entries.some(([,p])=>p.referenceLow!==null&&p.referenceHigh!==null);const normal=entries.filter(([,p])=>p.status==="Normal").length;const flagged=entries.filter(([,p])=>p.status==="Low"||p.status==="High").length;const unavailable=entries.length-normal-flagged
 return <div className="page-container page-container-wide"><Link to="/dashboard" className="back-link">← Back to dashboard</Link>
  <div className="card report-hero"><div className="report-hero-top"><div><div className="eyebrow">Blood report</div><h1 className="report-title">{report.filename}</h1><p className="report-meta">Uploaded {formatDate(report.uploaded_at)}</p></div><Link to="/upload" className="btn btn-secondary">＋ New report</Link></div><div className="report-summary-grid"><div className="summary-stat"><strong>{entries.length}</strong><span>Parameters extracted</span></div><div className="summary-stat"><strong>{normal}</strong><span>Within reported range</span></div><div className="summary-stat"><strong>{flagged+unavailable}</strong><span>Needs review or unavailable</span></div></div></div>
  <div className="disclaimer">Information here is for education and organization, not diagnosis. Values, units and ranges are extracted from your PDF and may occasionally contain extraction errors. Check the original report before discussing a value with a doctor.</div>
  <div className="section-heading"><h2>Extracted parameters</h2><span style={{fontSize:11,color:"var(--muted)"}}>{entries.length} values</span></div>
  {entries.length===0?<div className="card empty-state"><h2>No parameters extracted</h2><p>VitaLens could not find usable blood parameters in this report.</p></div>:<div className="card table-card"><table className="parameter-table"><thead><tr><th>Parameter</th><th>Value</th>{hasRange&&<th>Reference range</th>}<th>Status</th></tr></thead><tbody>{entries.map(([key,p])=><tr key={key}><td className="parameter-name">{parameterLabel(key)}</td><td>{formatValueWithUnit(p)}</td>{hasRange&&<td>{formatReferenceRange(p)}</td>}<td><span className={`status-badge ${statusClassName(p.status)}`}>{p.status}</span></td></tr>)}</tbody></table></div>}
  <div className="ai-section"><AIResultPanel title="AI explanation" buttonLabel="Explain this report" onGenerate={async()=>{const r=await api.explainReport(token,reportId);return r.explanation}}/><AIResultPanel title="Doctor discussion questions" buttonLabel="Generate questions" onGenerate={async()=>{const r=await api.getDoctorQuestions(token,reportId);return r.questions}}/></div>
  <div className="report-actions"><Link to={`/trends?highlight=${reportId}`}>View parameter trends →</Link><Link to={`/compare?report=${reportId}`}>Compare with another report →</Link></div>
 </div>
}
export default ReportDetail
