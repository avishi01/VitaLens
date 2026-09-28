import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/useAuth"
import { api } from "../api/client"

function UploadReport(){
 const{token}=useAuth();const navigate=useNavigate();const[file,setFile]=useState(null);const[error,setError]=useState("");const[submitting,setSubmitting]=useState(false);const[stage,setStage]=useState("")
 function handleFileChange(e){setFile(e.target.files?.[0]||null);setError("")}
 async function handleSubmit(e){e.preventDefault();setError("");if(!file){setError("Please choose a PDF file to upload.");return}if(file.type!=="application/pdf"){setError("Only PDF files are allowed.");return}setSubmitting(true);setStage("Uploading and processing report...");try{const result=await api.uploadReport(token,file);navigate(`/reports/${result.id}`)}catch(err){setError(err.message)}finally{setSubmitting(false);setStage("")}}
 return <div className="page-container"><div className="page-header"><div className="page-header-copy"><div className="eyebrow">Report workspace</div><h1>Upload a blood report</h1><p>Bring a PDF into VitaLens and we'll extract the available parameters.</p></div></div>
  <div className="card upload-card"><form onSubmit={handleSubmit}><div className="drop-zone"><div className="upload-icon">↑</div><h2>Choose your PDF report</h2><p>Upload a blood-test report in PDF format. Your extracted values will be shown for review.</p><label className="btn btn-secondary file-input-label"><input type="file" accept=".pdf,application/pdf" onChange={handleFileChange} disabled={submitting}/>{file?"Choose another PDF":"Select PDF"}</label>{file&&<div className="selected-file">✓ {file.name}</div>}</div>{error&&<p className="form-error">{error}</p>}{submitting&&<p className="page-loading">{stage}</p>}<div className="upload-actions"><button className="btn btn-primary" type="submit" disabled={submitting}>{submitting?"Processing...":"Upload report →"}</button></div></form></div>
 </div>
}
export default UploadReport
