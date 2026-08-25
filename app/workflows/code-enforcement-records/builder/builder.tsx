'use client'

import { useMemo, useState } from 'react'

const categories = [
  ['case-file','Case file'],['violations','Violations & citations'],['complaints','Complaints'],['inspections','Inspections'],['notices-and-orders','Notices & orders'],['photographs-and-video','Photographs & video'],['correspondence','Correspondence'],['enforcement-actions','Enforcement actions'],['abatement-and-compliance','Abatement & compliance'],['permits-and-related-records','Permits & related records'],
] as const

export function CodeEnforcementBuilder() {
  const [form,setForm]=useState({agency:'',department:'',propertyAddress:'',parcelNumber:'',caseNumber:'',violationNumber:'',relatedParty:'',dateStart:'',dateEnd:'',subjectMatter:''})
  const [selected,setSelected]=useState<string[]>(categories.map(([id])=>id))
  const [status,setStatus]=useState<'idle'|'saving'|'saved'|'error'>('idle')
  const [message,setMessage]=useState('')
  const missing=useMemo(()=>['agency','dateStart','dateEnd','subjectMatter'].filter(key=>!form[key as keyof typeof form].trim()),[form])
  const set=(key:keyof typeof form,value:string)=>setForm(current=>({...current,[key]:value}))
  const submit=async()=>{
    if(missing.length || (!form.propertyAddress.trim()&&!form.caseNumber.trim())) { setStatus('error'); setMessage('Add the required fields and either a property address or case number.'); return }
    setStatus('saving'); setMessage('')
    try {
      const response=await fetch('/api/requests',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...form,categories:selected})})
      const body=await response.json()
      if(!response.ok) throw new Error(body?.issues?.[0]?.message ?? body?.error ?? 'Unable to create request')
      setStatus('saved'); setMessage(`Request ${body.request?.id ?? ''} created and saved to your workspace.`)
    } catch(error) { setStatus('error'); setMessage(error instanceof Error?error.message:'Unable to create request') }
  }
  return <main className="landing workflowPage">
    <header className="landingNav"><strong>My-CoMind <span>/ Records Requests</span></strong><nav><a href="/workflows/code-enforcement-records">Workflow overview</a><a href="/dashboard">Workspace →</a></nav></header>
    <section className="workflowHero"><div className="eyebrow">CODE ENFORCEMENT RECORDS · REQUEST BUILDER</div><h1>Build the request around the case.</h1><p className="lede">Give the agency enough identifiers to find the records without forcing you to know its internal filing system.</p></section>
    <section className="section" style={{maxWidth:920,margin:'0 auto'}}>
      <div className="card" style={{padding:28}}>
        <h2>1. Identify the agency and matter</h2>
        <div className="grid" style={{marginTop:18}}>
          {([['agency','Agency *'],['department','Likely department / custodian'],['propertyAddress','Property address'],['parcelNumber','Parcel / APN'],['caseNumber','Case number'],['violationNumber','Violation / citation number'],['relatedParty','Related person or entity'],['dateStart','Records start date *'],['dateEnd','Records end date *']] as const).map(([key,label])=><label key={key}><span className="label">{label}</span><input value={form[key]} onChange={e=>set(key,e.target.value)} /></label>)}
        </div>
        <label style={{display:'block',marginTop:18}}><span className="label">Issue or subject matter *</span><textarea rows={4} value={form.subjectMatter} onChange={e=>set('subjectMatter',e.target.value)} placeholder="e.g. unpermitted construction, nuisance complaint, property maintenance violations" /></label>
      </div>
      <div className="card" style={{padding:28,marginTop:16}}>
        <h2>2. Choose the records to request</h2><p className="muted">Start broad. You can narrow the scope before sending.</p>
        <div className="workflowList" style={{marginTop:16}}>{categories.map(([id,label])=><label className="workflowItem" key={id} style={{display:'flex',gap:12,alignItems:'center',cursor:'pointer'}}><input type="checkbox" checked={selected.includes(id)} onChange={e=>setSelected(current=>e.target.checked?[...current,id]:current.filter(value=>value!==id))}/><strong>{label}</strong></label>)}</div>
      </div>
      <div className="card" style={{padding:28,marginTop:16}}>
        <h2>3. Save and review</h2><p className="muted">The request is owner-scoped and enters the normal review/approval lifecycle. Nothing is mailed until the required approval gate is satisfied.</p>
        {message && <div className={status==='error'?'issue':'pill'} style={{margin:'16px 0'}}>{message}</div>}
        <button className="primary" onClick={submit} disabled={status==='saving'}>{status==='saving'?'Saving…':'Create request →'}</button>
      </div>
    </section>
  </main>
}
