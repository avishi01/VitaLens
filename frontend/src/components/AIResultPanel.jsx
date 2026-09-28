import { useState } from "react"

function renderInline(text){
 const parts=text.split(/(\*\*[^*]+\*\*)/g)
 return parts.map((part,i)=>part.startsWith("**")&&part.endsWith("**")?<strong key={i}>{part.slice(2,-2)}</strong>:part)
}
function renderAIText(text){
 const lines=String(text||"").split(/\r?\n/);const out=[];let list=[]
 const flush=()=>{if(list.length){out.push(<ul key={`ul-${out.length}`}>{list.map((x,i)=><li key={i}>{renderInline(x)}</li>)}</ul>);list=[]}}
 lines.forEach((line,i)=>{const s=line.trim();if(!s){flush();return}if(/^#{1,4}\s/.test(s)){flush();out.push(<h4 key={`h-${i}`}>{renderInline(s.replace(/^#{1,4}\s/,""))}</h4>);return}if(/^[-*]\s+/.test(s)){list.push(s.replace(/^[-*]\s+/,""));return}if(/^\d+[.)]\s+/.test(s)){list.push(s.replace(/^\d+[.)]\s+/,""));return}flush();out.push(<p key={`p-${i}`}>{renderInline(s)}</p>)});flush();return out}

function AIResultPanel({title,buttonLabel,onGenerate}){
 const[result,setResult]=useState(null);const[loading,setLoading]=useState(false);const[error,setError]=useState("")
 async function handleClick(){setLoading(true);setError("");try{setResult(await onGenerate())}catch(err){setError(err.message)}finally{setLoading(false)}}
 return <div className="ai-panel"><div className="ai-panel-header"><h3>{title}</h3><button onClick={handleClick} disabled={loading}>{loading?"Generating...":result?"Regenerate":buttonLabel}</button></div>{error&&<p className="form-error" style={{margin:"14px 18px"}}>{error}</p>}{loading&&<div className="ai-panel-loading">Preparing your response. This may take a moment.</div>}{result&&!loading&&<div className="ai-panel-result">{renderAIText(result)}</div>}</div>
}
export default AIResultPanel
