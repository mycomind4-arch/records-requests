import Link from 'next/link'
import { notFound } from 'next/navigation'

const workflows = [
  { slug: 'public-records-request', title: 'Public Records Request', category: 'Start here', intent: 'public records request', description: 'Turn a plain-English objective into a precise request with record categories, date ranges, custodians, identifiers, format requirements, and exclusions.', bestFor: ['General public records', 'Agency records', 'Open records requests'], cta: 'Build a records request' },
  { slug: 'police-records', title: 'Police Records Request', category: 'Law enforcement', intent: 'how to get a police report', description: 'Request incident reports, arrest records, dispatch materials, body-camera records, and related police records with enough specificity to make the request searchable.', bestFor: ['Incident reports', 'Police reports', 'Arrest records', 'Body-camera and related records'], cta: 'Request police records' },
  { slug: 'court-records', title: 'Court Records Request', category: 'Courts', intent: 'how to get court records', description: 'Organize a request for case files, docket materials, filings, exhibits, and other court-held records while preserving case identifiers and date ranges.', bestFor: ['Case files', 'Dockets', 'Court filings', 'Exhibits'], cta: 'Request court records' },
  { slug: 'property-records', title: 'Property & Parcel Records', category: 'Property', intent: 'request property records', description: 'Build a targeted request for property, parcel, assessor, recorder, ownership, and related public records tied to a property or parcel.', bestFor: ['Property files', 'Parcel records', 'Ownership records', 'Recorder records'], cta: 'Request property records' },
  { slug: 'code-enforcement-records', title: 'Code Enforcement Records', category: 'Property', intent: 'code enforcement records request', description: 'Request violation histories, inspection records, notices, photographs, communications, complaints, and enforcement files for a property or case.', bestFor: ['Violation files', 'Inspection records', 'Complaints', 'Enforcement communications'], cta: 'Request code records' },
  { slug: 'permit-inspection-records', title: 'Permit & Inspection Records', category: 'Property', intent: 'permit records request', description: 'Target permits, plans, inspection reports, correction notices, approvals, and related building-department records with project identifiers and date ranges.', bestFor: ['Building permits', 'Inspection reports', 'Plans', 'Correction notices'], cta: 'Request permit records' },
  { slug: 'government-emails', title: 'Government Emails & Communications', category: 'Communications', intent: 'government email records request', description: 'Structure an email and communications request around custodians, domains, date ranges, subjects, projects, and identifiers so the scope is usable by the responding agency.', bestFor: ['Government emails', 'Agency correspondence', 'Text and communication records'], cta: 'Request communications' },
  { slug: 'planning-records', title: 'Planning & Development Records', category: 'Planning', intent: 'planning records request', description: 'Request planning applications, staff reports, zoning materials, development correspondence, meeting records, and related agency files.', bestFor: ['Planning files', 'Zoning records', 'Development applications', 'Staff reports'], cta: 'Request planning records' },
  { slug: 'case-records', title: 'Records About a Specific Case', category: 'Case research', intent: 'records about a specific case', description: 'Build a case-centered request that connects names, addresses, case numbers, dates, departments, and referenced documents into one coherent records scope.', bestFor: ['Enforcement cases', 'Administrative cases', 'Agency investigations', 'Cross-department records'], cta: 'Build a case request' },
  { slug: 'foia-request', title: 'FOIA / Federal Records Request', category: 'Federal', intent: 'how do I file a FOIA request', description: 'Prepare a federal records request with a clear description of the records, date range, custodians or systems when known, and the requester information needed for the agency.', bestFor: ['Federal agencies', 'FOIA requests', 'Federal records'], cta: 'Build a FOIA request' },
]

export function generateStaticParams() { return workflows.map(({ slug }) => ({ slug })) }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const workflow = workflows.find((item) => item.slug === slug)
  if (!workflow) return {}
  return { title: `${workflow.title} | Records Requests`, description: workflow.description, alternates: { canonical: `/workflows/${workflow.slug}` }, openGraph: { title: `${workflow.title} | Records Requests`, description: workflow.description } }
}

export default async function WorkflowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const workflow = workflows.find((item) => item.slug === slug)
  if (!workflow) notFound()

  return <main className="landing workflowPage">
    <header className="landingNav"><strong>My-CoMind <span>/ Records Requests</span></strong><nav><Link href="/">All workflows</Link><a href="/#how">How it works</a><Link href="/dashboard">Workspace →</Link></nav></header>
    <section className="workflowHero">
      <div className="eyebrow">{workflow.category} · Search intent: {workflow.intent}</div>
      <h1>{workflow.title}</h1>
      <p className="lede">{workflow.description}</p>
      <div className="cta"><Link className="primary" href="/dashboard">{workflow.cta} →</Link><Link className="secondary" href="/">Browse every records workflow</Link></div>
    </section>
    <section className="section workflowSection"><div><div className="eyebrow">WHAT THIS WORKFLOW COVERS</div><h2>Start with the records job, not the legal jargon.</h2><p className="workflowCopy">Define what you are trying to find, identify the agency or record custodian, set a defensible scope, and preserve the request as a trackable case. The workspace then keeps acknowledgements, clarifications, productions, and follow-ups attached to the same request.</p></div><div className="workflowList">{workflow.bestFor.map((item, index) => <div className="workflowItem" key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></div>)}</div></section>
    <section className="dark workflowSection"><div><div className="eyebrow">AFTER YOU SEND IT</div><h2>The request does not disappear after submission.</h2><p>Track the acknowledgement, deadlines, clarification requests, fee notices, extensions, productions, denials, and follow-up communications. When records arrive, compare the production against the original request.</p></div><div className="auditGrid"><div>Request scope preserved</div><div>Agency response timeline</div><div>Production organization</div><div>Gap detection</div><div>Redaction review</div><div>Follow-up preparation</div></div></section>
    <section className="final"><div className="eyebrow">READY TO BUILD IT</div><h2>Turn this search into an actual request.</h2><p>Start with the objective in plain English. The workspace handles the structure.</p><Link className="primary" href="/dashboard">Open the request builder →</Link></section>
  </main>
}

export { workflows }
