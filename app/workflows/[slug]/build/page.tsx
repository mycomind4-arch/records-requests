'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { workflows } from '../workflow-data'

const codeEnforcementFields = [
  ['agency','Agency','The city, county, department, or records custodian.',true],
  ['department','Likely department or custodian','Code enforcement, building, planning, neighborhood services, or another likely custodian.',false],
  ['propertyAddress','Property address','Exact site address, including unit or suite where relevant.',false],
  ['parcelNumber','Parcel / APN','Assessor parcel number or other parcel identifier when known.',false],
  ['caseNumber','Code enforcement case number','Case, complaint, violation, or file number when known.',false],
  ['violationNumber','Violation / citation number','Citation, violation, notice, or order number when known.',false],
  ['relatedParty','Related person or entity','Owner, operator, business, tenant, or other entity associated with the matter.',false],
  ['dateStart','Records start date','Beginning of the requested records period.',true],
  ['dateEnd','Records end date','End of the requested records period.',true],
  ['subjectMatter','Issue or subject matter','Plain-English description of the code issue or enforcement matter.',true],
] as const

export default function WorkflowBuilder() {
  const params = useParams<{ slug: string }>()
  const workflow = workflows.find((item) => item.slug === params.slug)
  const [values, setValues] = useState<Record<string,string>>({})
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  if (!workflow) return <main className="landing final"><h1>Workflow not found</h1></main>

  const fields = workflow.slug === 'code-enforcement-records' ? codeEnforcementFields : []
  const update = (id: string, value: string) => setValues((current) => ({ ...current, [id]: value }))

  async function submit() {
    setStatus('Building your request…')
    setError('')
    try {
      const response = await fetch(`/api/workflows/${workflow.slug}/build`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(values),
      })
      const data = await response.json() as { ok?: boolean; request?: { id?: string }; issues?: { field: string; message: string }[]; error?: string }
      if (!response.ok || !data.ok) {
        setError(data.issues?.map((issue) => issue.message).join(' ') || data.error || 'Unable to build the request.')
        setStatus('')
        return
      }
      setStatus(data.request?.id ? `Request created: ${data.request.id}` : 'Request created.')
    } catch {
      setError('Unable to reach the request builder.')
      setStatus('')
    }
  }

  return <main className="landing workflowPage">
    <header className="landingNav"><strong>My-CoMind <span>/ Records Requests</span></strong><nav><a href={`/workflows/${workflow.slug}`}>← Workflow</a><a href="/dashboard">Workspace</a></nav></header>
    <section className="workflowHero">
      <div className="eyebrow">WORKFLOW BUILDER</div>
      <h1>{workflow.title}</h1>
      <p className="lede">Start with the facts that make the records searchable. We will construct the request scope from them.</p>
    </section>
    <section className="section workflowSection"><div className="composer" style={{maxWidth:'760px',margin:'0 auto'}}>
      {fields.map(([id,label,help,required]) => <label key={id} style={{display:'grid',gap:'8px',marginBottom:'20px'}}><span><strong>{label}</strong>{required && ' *'}</span><small className="muted">{help}</small><input value={values[id] ?? ''} required={required} onChange={(event) => update(id,event.target.value)} /></label>)}
      <button className="primary" type="button" onClick={submit}>Build request →</button>
      {status && <p className="muted" role="status">{status}</p>}
      {error && <p role="alert" style={{color:'crimson'}}>{error}</p>}
    </div></section>
  </main>
}
