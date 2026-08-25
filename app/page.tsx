import Link from 'next/link'
import { workflows } from './workflows/workflow-data'
import { EcosystemFooter } from './components/EcosystemFooter'
import { MAILMYPDF_HOME } from './lib/ecosystem'

export const metadata = { title: 'Public Records Requests | Request, Track & Audit Government Records', description: 'Find the right public-records workflow, build a precise request, track agency responses, organize productions, and audit what you received.', openGraph: { title: 'Public Records Requests | Records Requests', description: 'A directory of focused workflows for requesting, tracking, and auditing government records.' } }

const groups = [
  { title: 'Start here', items: ['public-records-request', 'foia-request', 'public-information-request', 'open-records-request', 'agency-records-request', 'government-documents-request'], description: 'General public records, open records, FOIA, public information, agency, and government documents workflows.' },
  { title: 'Law enforcement & courts', items: ['police-records', 'police-report', 'police-report-copy', 'court-records', 'criminal-records', 'criminal-history', 'arrest-records', 'background-check-records'], description: 'Get the reports, filings, case materials, and history tied to an incident, case, or person.' },
  { title: 'Property & development', items: ['property-records', 'permit-inspection-records', 'code-enforcement-records', 'planning-records'], description: 'Request property, parcel, code, permit, inspection, zoning, and development records.' },
  { title: 'Vital records', items: ['birth-records', 'marriage-records', 'divorce-records', 'death-records'], description: 'Request birth, marriage, divorce, and death records from the appropriate vital records office.' },
  { title: 'Personal records', items: ['military-records', 'medical-records', 'employment-records', 'education-records'], description: 'Request military, medical, employment, and education records held by government agencies or institutions.' },
  { title: 'Communications & cases', items: ['government-communications-records', 'case-records'], description: 'Target agency communications or build a records request around a specific case.' },
  { title: 'Follow up & appeal', items: ['records-follow-up', 'records-denial-appeal'], description: 'Follow up on unanswered requests or appeal a records denial.' },
]

export default function Home() {
  return <main className="landing directoryPage">
    <header className="landingNav"><strong>My-CoMind <span>/ Records Requests</span></strong><nav><a href="#workflows">Workflows</a><a href="#how">How it works</a><a href={MAILMYPDF_HOME}>MailMyPDF →</a><Link href="/dashboard">Open workspace →</Link></nav></header>
    <section className="directoryHero">
      <div className="eyebrow">PUBLIC RECORDS · FOIA · OPEN RECORDS</div>
      <h1>Find the records workflow that matches what you need.</h1>
      <p className="lede">Choose a focused workflow, then turn the objective into a precise request you can track from submission through production and audit.</p>
      <div className="cta"><Link className="primary" href="/dashboard">Start with a plain-English request →</Link><a className="secondary" href="#workflows">Browse workflows</a></div>
      <div className="trust">Evidence-first · Deadline-aware · Source-linked · Production audit ready</div>
    </section>

    <section id="workflows" className="section directorySection"><div className="eyebrow">WORKFLOW DIRECTORY</div><h2>One master directory. Many specific records jobs.</h2><p className="directoryIntro">The broad term "public records request" is only the starting point. These workflows are organized around the actual record types and jobs people search for.</p>
      <div className="workflowGroups">{groups.map(group => <div className="workflowGroup" key={group.title}><div><h3>{group.title}</h3><p>{group.description}</p></div><div className="workflowCards">{group.items.map(slug => { const item = workflows.find(w => w.slug === slug); if (!item) return null; return <Link key={slug} href={`/workflows/${slug}`} className="workflowCard"><span className="workflowCategory">{item.category}</span><strong>{item.title}</strong><span>{item.description}</span><span className="workflowLink">Explore workflow →</span></Link> })}</div></div>)}</div>
    </section>

    <section id="how" className="section"><div className="eyebrow">ONE WORKSPACE</div><h2>Every workflow follows the same evidence-first lifecycle.</h2><div className="steps"><article><b>01</b><h3>Define</h3><p>Translate the objective into records, date ranges, custodians, identifiers, formats, and exclusions.</p></article><article><b>02</b><h3>Validate</h3><p>Check agency, jurisdiction, scope, and likely searchability before submission.</p></article><article><b>03</b><h3>Track</h3><p>Preserve acknowledgements, deadlines, extensions, fees, productions, denials, and communications.</p></article><article><b>04</b><h3>Audit</h3><p>Compare what was requested against what was produced and surface evidence-backed gaps.</p></article></div></section>

    <section className="dark"><div><div className="eyebrow">THE DIFFERENCE</div><h2>Receiving files is not the same as receiving a complete production.</h2><p>Records Requests keeps the original request, agency response, produced records, references, redactions, and unresolved categories together so you can see what still needs attention.</p></div><div className="auditGrid"><div>Unanswered categories</div><div>Referenced records not produced</div><div>Missing or duplicate pages</div><div>Redaction questions</div><div>Search or custodian gaps</div><div>Timeline anomalies</div></div></section>

    <section className="final"><div className="eyebrow">START ANYWHERE</div><h2>Know what you are looking for? There is a workflow for it.</h2><p>And when your records arrive, the same workspace helps you determine what you actually received.</p><Link className="primary" href="/dashboard">Open the Records workspace →</Link></section>

    <EcosystemFooter />
  </main>
}
