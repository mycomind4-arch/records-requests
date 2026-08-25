'use client'

import { useMemo, useState } from 'react'

import { MAILMYPDF_HOME } from "@/app/lib/ecosystem"
import { EcosystemFooter } from "@/app/components/EcosystemFooter"
const categories = [
  ['planning-application','Planning / development applications'],
  ['zoning','Zoning and land-use records'],
  ['staff-reports','Staff reports / analyses'],
  ['site-plans','Site plans and project plans'],
  ['planning-communications','Planning department communications'],
  ['public-notices','Notices and hearing materials'],
  ['planning-commission','Planning commission records'],
  ['conditions-of-approval','Conditions / resolutions / approvals'],
  ['environmental','Environmental review records'],
  ['related-permits','Related permits and cross-referenced records'],
] as const

export function PlanningRecordsBuilder() {
  const [form, setForm] = useState({
    agency: '',
    jurisdiction: '',
    address: '',
    parcel: '',
    projectNumber: '',
    projectName: '',
    applicant: '',
    dateStart: '',
    dateEnd: '',
    subjectMatter: '',
  })
  const [selected, setSelected] = useState<string[]>(categories.map(([id]) => id))
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle')
  const [message, setMessage] = useState('')

  const set = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }))

  const requestItems = useMemo(() => {
    const context = [
      form.address && `property address: ${form.address}`,
      form.parcel && `parcel/APN: ${form.parcel}`,
      form.projectNumber && `project number: ${form.projectNumber}`,
      form.projectName && `project name: ${form.projectName}`,
      form.applicant && `applicant: ${form.applicant}`,
    ].filter(Boolean).join('; ')
    return selected.map(id => {
      const label = categories.find(([categoryId]) => categoryId === id)?.[1] ?? id
      return {
        category: label,
        description: `${label} relating to ${form.subjectMatter || 'the identified planning matter'}${context ? ` (${context})` : ''}. Include responsive attachments and records that are maintained with the identified matter.`,
        dateStart: form.dateStart || undefined,
        dateEnd: form.dateEnd || undefined,
        format: 'Electronic/native format when available',
      }
    })
  }, [form, selected])

  const submit = async () => {
    const missing = ['agency', 'dateStart', 'dateEnd', 'subjectMatter'].filter(key => !form[key as keyof typeof form].trim())
    if (missing.length || !selected.length || (!form.address.trim() && !form.parcel.trim() && !form.projectNumber.trim() && !form.projectName.trim())) {
      setStatus('error')
      setMessage('Add the planning matter, date range, and at least one property or project identifier, then select at least one record category.')
      return
    }
    setStatus('saving')
    setMessage('')
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: `Planning Records Request — ${form.subjectMatter}`,
          agency: form.agency,
          jurisdiction: form.jurisdiction || undefined,
          purpose: 'Planning, zoning, development, and related public-records research',
          scope: `Planning matter: ${form.subjectMatter}. ${form.address ? `Address: ${form.address}. ` : ''}${form.parcel ? `Parcel/APN: ${form.parcel}. ` : ''}${form.projectNumber ? `Project number: ${form.projectNumber}. ` : ''}${form.projectName ? `Project name: ${form.projectName}. ` : ''}${form.applicant ? `Applicant: ${form.applicant}.` : ''}`.trim(),
          items: requestItems,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body?.issues?.[0]?.message ?? body?.error ?? 'Unable to create request')
      setStatus('saved')
      setMessage(`Request ${body.request?.id ?? ''} created and saved to your workspace.`)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Unable to create request')
    }
  }

  return <main className="landing workflowPage">
    <header className="landingNav"><strong>My-CoMind <span>/ Records Requests</span></strong><nav><a href="/workflows/planning-records">Workflow overview</a><a href={MAILMYPDF_HOME}>MailMyPDF →</a><a href="/dashboard">Workspace →</a></nav></header>
    <section className="workflowHero"><div className="eyebrow">PLANNING RECORDS · REQUEST BUILDER</div><h1>Build the request around the project, property, and planning file.</h1><p className="lede">Give the custodian the identifiers that connect the project to zoning, applications, staff reports, notices, approvals, and communications.</p></section>
    <section className="section" style={{maxWidth:920,margin:'0 auto'}}>
      <div className="card" style={{padding:28}}><h2>1. Identify the planning matter</h2><div className="grid" style={{marginTop:18}}>{([['agency','Agency *'],['jurisdiction','City / county / jurisdiction'],['address','Property address'],['parcel','Parcel / APN'],['projectNumber','Project / application number'],['projectName','Project name'],['applicant','Applicant / owner']] as const).map(([key,label])=><label key={key}><span className="label">{label}</span><input value={form[key]} onChange={e=>set(key,e.target.value)} /></label>)}</div><div className="grid" style={{marginTop:18}}>{([['dateStart','Record start date *'],['dateEnd','Record end date *']] as const).map(([key,label])=><label key={key}><span className="label">{label}</span><input type="date" value={form[key]} onChange={e=>set(key,e.target.value)} /></label>)}</div><label style={{display:'block',marginTop:18}}><span className="label">Planning matter / subject *</span><textarea rows={4} value={form.subjectMatter} onChange={e=>set('subjectMatter',e.target.value)} placeholder="e.g. rezoning, subdivision, development application, conditional use permit, site plan review" /></label></div>
      <div className="card" style={{padding:28,marginTop:16}}><h2>2. Choose the records</h2><p className="muted">Keep categories explicit so the production can later be checked for completeness.</p><div className="workflowList" style={{marginTop:16}}>{categories.map(([id,label])=><label className="workflowItem" key={id} style={{display:'flex',gap:12,alignItems:'center',cursor:'pointer'}}><input type="checkbox" checked={selected.includes(id)} onChange={e=>setSelected(current=>e.target.checked?[...current,id]:current.filter(value=>value!==id))}/><strong>{label}</strong></label>)}</div></div>
      <div className="card" style={{padding:28,marginTop:16}}><h2>3. Save and review</h2><p className="muted">The request is created through the same authenticated, owner-scoped request lifecycle used by the existing production workflows.</p>{message && <div className={status==='error'?'issue':'pill'} style={{margin:'16px 0'}}>{message}</div>}<button className="primary" onClick={submit} disabled={status==='saving'}>{status==='saving'?'Saving…':'Create request →'}</button></div>
    </section>
    <EcosystemFooter />
  </main>
}
