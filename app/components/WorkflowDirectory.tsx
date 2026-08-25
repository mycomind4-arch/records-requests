'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type Workflow = { slug: string; title: string; description: string; category: string }

type Group = { title: string; items: string[]; description: string }

const PLACEHOLDER_IMAGE = 'https://media.base44.com/images/public/6a8bd310dfdf9ad92cf26415/06e033fed_generated_image.png'

export default function WorkflowDirectory({ workflows, groups }: { workflows: Workflow[]; groups: Group[] }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return workflows
    return workflows.filter((w) => `${w.slug} ${w.title} ${w.description} ${w.category}`.toLowerCase().includes(normalized))
  }, [query, workflows])
  const allowed = new Set(filtered.map((w) => w.slug))

  return <>
    <div className="directorySearch">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search workflows — police records, permits, FOIA, property…" aria-label="Search records workflows" />
      <span>{filtered.length} workflows</span>
    </div>
    <div className="workflowGroups">
      {groups.map((group) => {
        const visible = group.items.filter((slug) => allowed.has(slug))
        if (!visible.length) return null
        return <div className="workflowGroup" key={group.title}>
          <div><h3>{group.title}</h3><p>{group.description}</p></div>
          <div className="workflowCards">
            {visible.map((slug) => {
              const item = workflows.find((w) => w.slug === slug)
              if (!item) return null
              return <Link key={slug} href={`/workflows/${slug}`} className="workflowCard workflowCardPremium">
                <div className="workflowCardImage"><img src={PLACEHOLDER_IMAGE} alt="" aria-hidden="true" /><span>{item.category}</span></div>
                <div className="workflowCardBody"><strong>{item.title}</strong><span>{item.description}</span><span className="workflowLink">Explore workflow →</span></div>
              </Link>
            })}
          </div>
        </div>
      })}
    </div>
  </>
}
