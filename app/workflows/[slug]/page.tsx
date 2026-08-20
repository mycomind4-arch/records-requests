import Link from 'next/link'
import { notFound } from 'next/navigation'
import { workflows } from '../workflow-data'

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
