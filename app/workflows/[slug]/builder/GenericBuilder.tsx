'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MAILMYPDF_HOME } from '@/app/lib/ecosystem'
import { EcosystemFooter } from '@/app/components/EcosystemFooter'

type Field = { id: string; label: string; required?: boolean; helpText?: string }
type WorkflowConfig = {
  slug: string
  title: string
  eyebrow: string
  lede: string
  fields: readonly Field[]
  categories: readonly [string, string][]
  agencyLabel: string
  requireDateRange: boolean
}

export default function GenericBuilder({ config }: { config: WorkflowConfig }) {
  const router = useRouter()
  const [fields, setFields] = useState<Record<string, string>>(() => Object.fromEntries(config.fields.map(f => [f.id, ''])))
  const [selectedCats, setSelectedCats] = useState<string[]>(config.categories.map(([id]) => id))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (id: string, value: string) => setFields(current => ({ ...current, [id]: value }))

  const requiredFields = config.fields.filter(f => f.required)
  const canSubmit = requiredFields.every(f => fields[f.id]?.trim())

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const catMap = new Map(config.categories)
      const items = selectedCats.map(catId => ({
        category: catId,
        description: `${catMap.get(catId) ?? catId} for the requested matter. ${config.fields.filter(f => fields[f.id]).map(f => `${f.label}: ${fields[f.id]}`).join('. ')}.`,
        dateStart: fields.dateStart || undefined,
        dateEnd: fields.dateEnd || undefined,
      }))

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: `${config.title} — ${fields[config.fields[0].id] || 'Request'}`,
          agency: fields.agency || '',
          jurisdiction: fields.jurisdiction || undefined,
          purpose: `Build a ${config.title} using the Records Requests workflow.`,
          scope: JSON.stringify({ workflow: config.slug, ...fields, categories: selectedCats }),
          items,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.issues?.[0]?.message || data?.error || 'Request creation failed')
      router.push(`/dashboard?request=${encodeURIComponent(data.request?.id ?? '')}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request creation failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="builder-shell">
      <header className="landingNav">
        <strong>My-CoMind <span>/ {config.title}</span></strong>
        <nav>
          <a href={`/workflows/${config.slug}`}>Overview</a>
          <a href={MAILMYPDF_HOME}>MailMyPDF →</a>
          <a href="/dashboard">Workspace →</a>
        </nav>
      </header>
      <section className="builder-wrap">
        <div className="eyebrow">{config.eyebrow}</div>
        <h1>Build the request.</h1>
        <p className="lede">{config.lede}</p>

        <div className="builder-card" style={{ padding: 28 }}>
          <h2>1. Identify the matter</h2>
          <div className="form-grid" style={{ marginTop: 18 }}>
            {config.fields.map(field => (
              <label key={field.id}>
                <span className="label">{field.label}{field.required && ' *'}</span>
                <input
                  type={field.id.includes('date') ? 'date' : 'text'}
                  value={fields[field.id]}
                  onChange={e => update(field.id, e.target.value)}
                  aria-required={field.required}
                  placeholder={field.helpText || ''}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="builder-card" style={{ padding: 28, marginTop: 16 }}>
          <h2>2. Choose the records</h2>
          <p className="muted">Select the record categories to request.</p>
          <div className="workflowList" style={{ marginTop: 16 }}>
            {config.categories.map(([id, label]) => (
              <label className="workflowItem" key={id} style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedCats.includes(id)}
                  onChange={e => setSelectedCats(current => e.target.checked ? [...current, id] : current.filter(c => c !== id))}
                />
                <strong>{label}</strong>
              </label>
            ))}
          </div>
        </div>

        <div className="builder-card" style={{ padding: 28, marginTop: 16 }}>
          <h2>3. Save and review</h2>
          <p className="muted">The request follows the normal review, approval, fulfillment, and tracking lifecycle.</p>
          {error && <div className="issue" style={{ margin: '16px 0' }}>{error}</div>}
          <button className="primary" onClick={submit} disabled={submitting || !canSubmit}>
            {submitting ? 'Saving…' : 'Create request →'}
          </button>
        </div>
      </section>
      <EcosystemFooter />
    </main>
  )
}
