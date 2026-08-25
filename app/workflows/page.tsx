import Link from 'next/link'
import { workflows } from './workflow-data'
import WorkflowDirectory from '@/app/components/WorkflowDirectory'

export const metadata = {
  title: 'Records Request Workflows | Public Records, FOIA, Police, Property & More',
  description: 'Search and explore focused public-records workflows for FOIA, police, property, permits, code enforcement, planning, court records, and more.',
}

const groups = [
  { title: 'Start here', items: ['public-records-request', 'foia-request', 'public-information-request', 'open-records-request', 'agency-records-request', 'government-documents-request'], description: 'General public records, open records, FOIA, public information, agency, and government documents workflows.' },
  { title: 'Law enforcement & courts', items: ['police-records', 'police-report', 'police-report-copy', 'court-records', 'criminal-records', 'criminal-history', 'arrest-records', 'background-check-records'], description: 'Get reports, filings, case materials, and history tied to an incident, case, or person.' },
  { title: 'Property & development', items: ['property-records', 'permit-inspection-records', 'code-enforcement-records', 'planning-records'], description: 'Request property, parcel, code, permit, inspection, zoning, and development records.' },
  { title: 'Vital records', items: ['birth-records', 'marriage-records', 'divorce-records', 'death-records'], description: 'Request birth, marriage, divorce, and death records from the appropriate records custodian.' },
  { title: 'Personal records', items: ['military-records', 'medical-records', 'employment-records', 'education-records'], description: 'Request military, medical, employment, and education records held by agencies or institutions.' },
  { title: 'Communications & cases', items: ['government-communications-records', 'case-records'], description: 'Target government communications or build a records request around a specific case.' },
  { title: 'Follow up & appeal', items: ['records-follow-up', 'records-denial-appeal'], description: 'Follow up on unanswered requests or respond to a records denial.' },
]

export default function WorkflowsPage() {
  const items = workflows.map(({ slug, title, description, category }) => ({ slug, title, description, category }))
  return <main className="landing directoryPage">
    <section className="directoryHero">
      <div className="eyebrow">RECORDS REQUEST WORKFLOWS</div>
      <h1>Find the records workflow that matches what you need.</h1>
      <p className="lede">Search by records job, subject, or plain-English objective. Explore the full library and open the workflow that best fits your request.</p>
      <div className="cta"><Link className="primary" href="/dashboard">Start with a plain-English request →</Link><Link className="secondary" href="/">Back to Records Requests</Link></div>
    </section>
    <section className="section directorySection"><div className="eyebrow">FULL WORKFLOW LIBRARY</div><h2>Search the complete records-request catalog.</h2><p className="directoryIntro">Use the search box or browse by category. This is the full discovery surface; the homepage only features a curated set of common starting points.</p><WorkflowDirectory workflows={items} groups={groups} /></section>
  </main>
}
