import Link from 'next/link'
import { notFound } from 'next/navigation'
import { workflows } from '../workflow-data'

export function generateStaticParams() { return workflows.map(({ slug }) => ({ slug })) }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const workflow = workflows.find(item => item.slug === slug)
  if (!workflow) return {}
  const title = workflow.seo?.title ?? `${workflow.title} | Records Requests`
  const description = workflow.seo?.description ?? workflow.description
  return {
    title,
    description,
    keywords: workflow.seo?.keywords,
    alternates: { canonical: `/workflows/${workflow.slug}` },
    openGraph: { title, description, type: 'website', url: `/workflows/${workflow.slug}` },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function WorkflowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const workflow = workflows.find(item => item.slug === slug)
  if (!workflow) notFound()
  const builderPath = slug === 'code-enforcement-records' ? '/workflows/code-enforcement-records/builder' : '/dashboard'
  const faqs = workflow.seo?.faqs ?? []
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', name: 'Records Requests' },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Records Requests', item: '/' }, { '@type': 'ListItem', position: 2, name: workflow.title, item: `/workflows/${workflow.slug}` }] },
      ...(faqs.length ? [{ '@type': 'FAQPage', mainEntity: faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) }] : []),
    ],
  }
  return <main className="landing workflowPage">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <header className="landingNav"><strong>My-CoMind <span>/ Records Requests</span></strong><nav><Link href="/">All workflows</Link><a href="/#how">How it works</a><Link href="/dashboard">Workspace →</Link></nav></header>
    <section className="workflowHero"><div className="eyebrow">{workflow.category} · {workflow.intent}</div><h1>{workflow.title}</h1><p className="lede">{workflow.description}</p><div className="cta"><Link className="primary" href={builderPath}>{workflow.cta} →</Link><Link className="secondary" href="/">Browse every records workflow</Link></div></section>
    <section className="section workflowSection"><div><div className="eyebrow">WHAT THIS WORKFLOW COVERS</div><h2>{slug === 'code-enforcement-records' ? 'Get the records behind a property violation, inspection, or enforcement case.' : 'Start with the records job, not the legal jargon.'}</h2><p className="workflowCopy">{slug === 'code-enforcement-records' ? 'Build a focused public-records request using the property address, parcel or APN, case or violation number, date range, custodian, and record categories you know. The goal is to make the request specific enough for the agency to search while preserving the broader context you need.' : 'Define what you are trying to find, identify the agency or record custodian, set a defensible scope, and preserve the request as a trackable case.'}</p></div><div className="workflowList">{workflow.bestFor.map((item,index)=><div className="workflowItem" key={item}><span>{String(index+1).padStart(2,'0')}</span><strong>{item}</strong></div>)}</div></section>
    {slug === 'code-enforcement-records' && <>
      <section className="section workflowSection"><div><div className="eyebrow">WHAT YOU CAN REQUEST</div><h2>Target the records that explain what happened.</h2><p className="workflowCopy">Depending on the agency and applicable law, a focused request can identify complaints, inspection reports, photographs or video, notices of violation, correction notices, citations, administrative orders, abatement records, permits, correspondence, and other identifiable enforcement records.</p></div><div className="workflowList">{['Complaints and service requests','Inspections and inspection reports','Photographs and video','Notices, citations and orders','Permits and correction records','Correspondence and enforcement communications'].map((item,index)=><div className="workflowItem" key={item}><span>{String(index+1).padStart(2,'0')}</span><strong>{item}</strong></div>)}</div></section>
      <section className="section workflowSection"><div><div className="eyebrow">MAKE THE REQUEST SEARCHABLE</div><h2>Address, parcel, case number, and dates matter.</h2><p className="workflowCopy">Many agencies ask for specific, identifiable records and useful search details. Government examples show code-enforcement systems commonly support searches by address, parcel number, case number, or date range, while public-records forms ask requesters to identify the records and timeframe. citeturn0search4turn0search5turn0search7</p></div><div className="workflowList"><div className="workflowItem"><span>01</span><strong>Property address</strong></div><div className="workflowItem"><span>02</span><strong>Parcel / APN</strong></div><div className="workflowItem"><span>03</span><strong>Case / violation number</strong></div><div className="workflowItem"><span>04</span><strong>Date range</strong></div></div></section>
      <section className="dark workflowSection"><div><div className="eyebrow">AFTER PRODUCTION</div><h2>Compare what you asked for with what you received.</h2><p>Preserve the original scope, organize the production, and review it for missing categories, referenced-but-unproduced records, duplicate files, gaps, identifier inconsistencies, and redaction or withholding language. A missing item in a production is a review finding—not proof that the record does not exist.</p></div><div className="auditGrid"><div>Request scope preserved</div><div>Agency response timeline</div><div>Production organization</div><div>Gap detection</div><div>Redaction review</div><div>Follow-up preparation</div></div></section>
      <section className="section workflowSection"><div><div className="eyebrow">HOW IT WORKS</div><h2>From search intent to mailed request.</h2><p className="workflowCopy">Enter what you know, select the records you want, review the generated request, and approve it before fulfillment. The case remains trackable after mailing so responses and follow-ups stay connected.</p></div><div className="workflowList"><div className="workflowItem"><span>01</span><strong>Describe the property or case</strong></div><div className="workflowItem"><span>02</span><strong>Select records and scope</strong></div><div className="workflowItem"><span>03</span><strong>Review and validate</strong></div><div className="workflowItem"><span>04</span><strong>Approve and mail</strong></div></div></section>
    </>}
    {faqs.length > 0 && <section className="section workflowSection"><div><div className="eyebrow">FREQUENTLY ASKED QUESTIONS</div><h2>Code Enforcement Records Request FAQ</h2></div><div className="workflowList">{faqs.map(faq => <div className="workflowItem" key={faq.question}><strong>{faq.question}</strong><p>{faq.answer}</p></div>)}</div></section>}
    <section className="final"><div className="eyebrow">READY TO BUILD IT</div><h2>Turn this search into an actual request.</h2><p>Start with the objective in plain English. The workspace handles the structure.</p><Link className="primary" href={builderPath}>{workflow.cta} →</Link></section>
  </main>
}
