'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  ['case-file', 'Case file'],
  ['violations', 'Violations & citations'],
  ['complaints', 'Complaints & referrals'],
  ['inspections', 'Inspections & reinspections'],
  ['notices-and-orders', 'Notices & orders'],
  ['photographs-and-video', 'Photographs & video'],
  ['correspondence', 'Correspondence'],
  ['enforcement-actions', 'Enforcement actions'],
  ['abatement-and-compliance', 'Abatement & compliance'],
  ['permits-and-related-records', 'Permits & related records'],
] as const

const INITIAL = Object.fromEntries([
  ['agency', ''], ['department', ''], ['propertyAddress', ''], ['parcelNumber', ''], ['caseNumber', ''],
  ['violationNumber', ''], ['relatedParty', ''], ['jurisdiction', ''], ['dateStart', ''], ['dateEnd', ''], ['subjectMatter', ''],
]) as Record<string, string>

export default function CodeEnforcementBuilder() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [fields, setFields] = useState(INITIAL)
  const [categories, setCategories] = useState(CATEGORIES.map(([id]) => id))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (id: string, value: string) => setFields((current) => ({ ...current, [id]: value }))
  const selectedCategories = useMemo(() => CATEGORIES.filter(([id]) => categories.includes(id)), [categories])

  const validation = useMemo(() => {
    const issues: string[] = []
    if (!fields.agency.trim()) issues.push('Identify the agency or records custodian.')
    if (!fields.dateStart || !fields.dateEnd) issues.push('Provide the records date range.')
    if (fields.dateStart && fields.dateEnd && fields.dateStart > fields.dateEnd) issues.push('The end date cannot precede the start date.')
    if (!fields.propertyAddress.trim() && !fields.caseNumber.trim()) issues.push('Provide a property address or case number.')
    if (!fields.subjectMatter.trim()) issues.push('Describe the enforcement matter or code issue.')
    if (!categories.length) issues.push('Select at least one record category.')
    if (!categories.includes('case-file')) issues.push('Consider retaining the case-file category; it is the anchor record for this workflow.')
    return issues
  }, [categories, fields])

  const canContinue = Boolean(fields.agency && fields.subjectMatter && (fields.propertyAddress || fields.caseNumber) && fields.dateStart && fields.dateEnd)

  const createRequest = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const identifiers = [
        fields.propertyAddress && `property address ${fields.propertyAddress}`,
        fields.parcelNumber && `parcel/APN ${fields.parcelNumber}`,
        fields.caseNumber && `case number ${fields.caseNumber}`,
        fields.violationNumber && `violation/citation number ${fields.violationNumber}`,
        fields.relatedParty && `related party ${fields.relatedParty}`,
      ].filter(Boolean).join('; ')

      const items = selectedCategories.map(([category, label]) => ({
        category,
        description: `${label} for the code-enforcement matter concerning ${fields.subjectMatter}. ${identifiers ? `Search using ${identifiers}. ` : ''}Cover records from ${fields.dateStart} through ${fields.dateEnd}.`,
        dateStart: fields.dateStart,
        dateEnd: fields.dateEnd,
        custodian: fields.department || undefined,
        systemHint: category === 'photographs-and-video' ? 'code-enforcement field media / inspection systems' : undefined,
        format: category === 'photographs-and-video' ? 'native digital files where available' : undefined,
      }))

      const response = await fetch('/api/requests', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: `Code Enforcement Records — ${fields.propertyAddress || fields.caseNumber || fields.subjectMatter}`,
          agency: fields.agency,
          jurisdiction: fields.jurisdiction || undefined,
          purpose: 'Research and document the code-enforcement history and agency records for the identified matter.',
          scope: JSON.stringify({ workflow: 'code-enforcement-records', ...fields, categories }),
          items,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.issues?.[0]?.message || data?.error || 'Request creation failed')
      if (!data.request?.id) throw new Error('The request was created without a request ID.')
      router.push(`/dashboard?request=${encodeURIComponent(data.request.id)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request creation failed')
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="builder-shell">
    <header className="landingNav"><strong>My-CoMind <span>/ Code Enforcement Records</span></strong><nav><a href="/workflows/code-enforcement-records">Workflow</a><a href="/dashboard">Workspace →</a></nav></header>
    <section className="builder-wrap">
      <div className="eyebrow">CODE ENFORCEMENT RECORDS · BUILDER</div>
      <h1>Build a searchable enforcement-record request.</h1>
      <p className="lede">Start with the property or case, identify the matter, set the time period, then choose the record groups you want the agency to search.</p>
      <div className="builder-progress"><span className={step >= 1 ? 'active' : ''}>1. Identify</span><span className={step >= 2 ? 'active' : ''}>2. Records</span><span className={step >= 3 ? 'active' : ''}>3. Review</span></div>

      {step === 1 && <section className="builder-card">
        <h2>Identify the matter</h2>
        <div className="form-grid">
          {[
            ['agency', 'Agency / records custodian', true], ['department', 'Likely department or custodian', false],
            ['propertyAddress', 'Property address', false], ['parcelNumber', 'Parcel / APN', false],
            ['caseNumber', 'Code enforcement case number', false], ['violationNumber', 'Violation / citation number', false],
            ['relatedParty', 'Owner / operator / related person or entity', false], ['jurisdiction', 'Jurisdiction', false],
            ['dateStart', 'Records start date', true, 'date'], ['dateEnd', 'Records end date', true, 'date'], ['subjectMatter', 'Issue or subject matter', true],
          ].map(([id, label, required, type]) => <label key={id as string}>{label as string}{required ? ' *' : ''}<input type={(type as string) || 'text'} value={fields[id as string]} onChange={(e) => update(id as string, e.target.value)} /></label>)}
        </div>
        <div className="builder-note">A property address or case number is enough to start. Add the APN, violation number, related party, jurisdiction, or likely department when known.</div>
        {validation.length > 0 && <div className="builder-warning">{validation.map((issue) => <div key={issue}>• {issue}</div>)}</div>}
        <button className="primary" disabled={!canContinue} onClick={() => setStep(2)}>Choose records →</button>
      </section>}

      {step === 2 && <section className="builder-card">
        <h2>Choose the record groups</h2>
        <p>Keep the request focused, but don't omit records merely because the agency may store them in a related system.</p>
        <div className="category-grid">{CATEGORIES.map(([id, label]) => <label key={id} className={categories.includes(id) ? 'category selected' : 'category'}><input type="checkbox" checked={categories.includes(id)} onChange={(e) => setCategories((current) => e.target.checked ? [...current, id] : current.filter((item) => item !== id))} /><span><strong>{label}</strong><small>{id === 'case-file' ? 'Anchor record and indexing history.' : id === 'photographs-and-video' ? 'Field media and related metadata.' : 'Records directly related to the enforcement matter.'}</small></span></label>)}</div>
        {validation.length > 0 && <div className="builder-warning">{validation.map((issue) => <div key={issue}>• {issue}</div>)}</div>}
        <div className="builder-actions"><button className="secondary" onClick={() => setStep(1)}>← Back</button><button className="primary" disabled={validation.length > 0} onClick={() => setStep(3)}>Review request →</button></div>
      </section>}

      {step === 3 && <section className="builder-card">
        <h2>Review before creating the request</h2>
        <div className="review-grid"><div><span>Agency</span><strong>{fields.agency}</strong></div><div><span>Property</span><strong>{fields.propertyAddress || 'Not provided'}</strong></div><div><span>Case</span><strong>{fields.caseNumber || 'Not provided'}</strong></div><div><span>Parcel / APN</span><strong>{fields.parcelNumber || 'Not provided'}</strong></div><div><span>Jurisdiction</span><strong>{fields.jurisdiction || 'Not provided'}</strong></div><div><span>Date range</span><strong>{fields.dateStart} → {fields.dateEnd}</strong></div><div><span>Matter</span><strong>{fields.subjectMatter}</strong></div></div>
        <div className="review-scope"><h3>Records to request</h3>{selectedCategories.map(([id, label]) => <div className="review-item" key={id}><strong>{label}</strong><span>Search for the identified matter during the selected date range{fields.department ? ` through ${fields.department}` : ''}.</span></div>)}</div>
        {error && <div className="builder-error">{error}</div>}
        <div className="builder-actions"><button className="secondary" onClick={() => setStep(2)} disabled={submitting}>← Edit records</button><button className="primary" onClick={createRequest} disabled={submitting}>{submitting ? 'Creating…' : 'Create request →'}</button></div>
      </section>}
    </section>
  </main>
}
