'use client'

import { useState } from 'react'

import { MAILMYPDF_HOME } from "@/app/lib/ecosystem"
import { EcosystemFooter } from "@/app/components/EcosystemFooter"
const categories = [
  ['incident-report','Incident / offense reports'],
  ['arrest-records','Arrest / booking records'],
  ['dispatch-cad','CAD / dispatch'],
  ['body-camera','Body-camera'],
  ['dash-camera','Dash-camera'],
  ['911-calls','911 calls / communications'],
  ['photographs-and-video','Photographs / video'],
  ['witness-and-victim-statements','Witness / victim statements'],
  ['supplemental-reports','Supplemental reports'],
  ['correspondence-and-case-notes','Correspondence / case notes'],
] as const

export function PoliceRecordsBuilder() {
  const [form,setForm] = useState({agency:'',department:'',incidentDateStart:'',incidentDateEnd:'',incidentNumber:'',arrestNumber:'',location:'',person:'',vehicle:'',subjectMatter:''})
  const [selected,setSelected] = useState<string[]>(categories.map(([id])=>id))
  const [status,setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle')
  const [message,setMessage] = useState('')
  const set = (key:keyof typeof form,value:string) => setForm(current=>({...current,[key]:value}))
  const submit = async () => {
    const missing = ['agency','incidentDateStart','incidentDateEnd','subjectMatter'].filter(key=>!form[key as keyof typeof form].trim())
    if (missing.length || (!form.incidentNumber.trim() && !form.location.trim() && !form.person.trim())) {
      setStatus('error'); setMessage('Add the required incident details and at least one identifier such as an incident number, location, or person.'); return
    }
    setStatus('saving'); setMessage('')
    try {
      const response = await fetch('/api/requests',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...form,categories:selected,workflow:'police-records'})})
      const body = await response.json()
      if (!response.ok) throw new Error(body?.issues?.[0]?.message ?? body?.error ?? 'Unable to create request')
      setStatus('saved'); setMessage(`Request ${body.request?.id ?? ''} created and saved to your workspace.`)
    } catch(error) { setStatus('error'); setMessage(error instanceof Error ? error.message : 'Unable to create request') }
  }
  return <main className="landing workflowPage">
    <header className="landingNav"><strong>My-CoMind <span>/ Records Requests</span></strong><nav><a href="/workflows/police-records">Workflow overview</a><a href={MAILMYPDF_HOME}>MailMyPDF →</a><a href="/dashboard">Workspace →</a></nav></header>
    <section className="workflowHero"><div className="eyebrow">POLICE RECORDS · REQUEST BUILDER</div><h1>Build the request around the incident.</h1><p className="lede">Give the agency the identifiers it already uses so the search can reach reports, dispatch, recordings, and case materials without unnecessary guesswork.</p></section>
    <section className="section" style={{maxWidth:920,margin:'0 auto'}}>
      <div className="card" style={{padding:28}}><h2>1. Identify the incident</h2><div className="grid" style={{marginTop:18}}>{([['agency','Agency *'],['department','Likely unit / custodian'],['incidentDateStart','Incident start date *'],['incidentDateEnd','Incident end date *'],['incidentNumber','Incident / report number'],['arrestNumber','Arrest / booking number'],['location','Incident location'],['person','Person involved'],['vehicle','Vehicle / plate / unit identifier']] as const).map(([key,label])=><label key={key}><span className="label">{label}</span><input value={form[key]} onChange={e=>set(key,e.target.value)} /></label>)}</div><label style={{display:'block',marginTop:18}}><span className="label">Incident or subject matter *</span><textarea rows={4} value={form.subjectMatter} onChange={e=>set('subjectMatter',e.target.value)} placeholder="e.g. traffic collision, arrest, use of force, burglary, welfare check" /></label></div>
      <div className="card" style={{padding:28,marginTop:16}}><h2>2. Choose the records</h2><p className="muted">You can start broad and narrow before approval.</p><div className="workflowList" style={{marginTop:16}}>{categories.map(([id,label])=><label className="workflowItem" key={id} style={{display:'flex',gap:12,alignItems:'center',cursor:'pointer'}}><input type="checkbox" checked={selected.includes(id)} onChange={e=>setSelected(current=>e.target.checked?[...current,id]:current.filter(value=>value!==id))}/><strong>{label}</strong></label>)}</div></div>
      <div className="card" style={{padding:28,marginTop:16}}><h2>3. Save and review</h2><p className="muted">The request remains owner-scoped and follows the normal review, approval, fulfillment, and tracking lifecycle.</p>{message && <div className={status==='error'?'issue':'pill'} style={{margin:'16px 0'}}>{message}</div>}<button className="primary" onClick={submit} disabled={status==='saving'}>{status==='saving'?'Saving…':'Create request →'}</button></div>
    </section>
    <EcosystemFooter />
  </main>
}
