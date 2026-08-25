import { getRequestStateRepositoryAsync } from '../../src/runtime'
import { getApprovalPrincipal } from '../../src/authorization-runtime'
import type { RequestState } from '../../src/request-repository'

const activeStates: RequestState[] = ['draft', 'validated', 'review', 'approved', 'queued', 'submitted', 'tracking']

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const principal = await getApprovalPrincipal()
  const repository = principal ? await getRequestStateRepositoryAsync() : null
  const requests = principal && repository ? await repository.listRequests(principal.subject) : []
  const active = requests.filter((request) => activeStates.includes(request.status))
  const attention = requests.filter((request) => ['review', 'failed'].includes(request.status)).length
  const completed = requests.filter((request) => request.status === 'completed').length

  return <div className="shell">
    <aside className="side">
      <div className="brand">My-CoMind <span>/ Records</span></div>
      <nav className="nav">
        <a className="active" href="#">Command Center</a><a href="#requests">Requests</a><a href="#draft">Request Builder</a><a href="#productions">Productions</a><a href="#analysis">Production Audit</a><a href="#agencies">Agencies</a><a href="#timeline">Timeline</a><a href="#communications">Communications</a>
      </nav>
      <div style={{ marginTop: 'auto' }} className="muted">Evidence-first records workflow<br />v0.2 foundation</div>
    </aside>
    <main className="main">
      <div className="top"><div><div className="eyebrow">Records intelligence</div><h1 className="title">Request Command Center</h1><div className="muted">Track requests, deadlines, productions and unresolved records gaps.</div></div><div className="actions"><a className="btn primary" href="/workflows/public-records-request">New request</a></div></div>

      {!principal && <section className="composer"><h2>Sign in to access your requests</h2><div className="muted">Your records cases are owner-scoped. Authentication is required before private request data is shown.</div></section>}
      {principal && !repository && <section className="composer"><h2>Records storage is not configured</h2><div className="muted">The application is deployed, but the Cloudflare D1 binding is not available in this runtime.</div></section>}

      {principal && repository && <>
        <section className="composer"><h2>What records are you looking for?</h2><div className="muted">Start in plain English. A workflow will turn your objective into precise record categories, dates and custodians.</div><div className="composer-row"><input placeholder="e.g. Everything the county has about code enforcement at a property"/><a className="btn primary" href="/workflows/public-records-request">Build request</a></div></section>
        <div className="grid">
          <div className="card"><div className="label">Active requests</div><div className="metric">{active.length}</div><div className="muted">{attention} need attention</div></div>
          <div className="card"><div className="label">Awaiting review</div><div className="metric">{requests.filter((r) => r.status === 'review').length}</div><div className="muted">Owner review gate</div></div>
          <div className="card"><div className="label">Completed</div><div className="metric">{completed}</div><div className="muted">Persisted request records</div></div>
          <div className="card"><div className="label">Failed</div><div className="metric">{requests.filter((r) => r.status === 'failed').length}</div><div className="muted">Requires intervention</div></div>
        </div>
        <div className="layout">
          <section className="card" id="requests"><div className="head"><span>Your requests</span><span className="pill">Live</span></div>
            {requests.length === 0 ? <div className="request"><h3>No requests yet</h3><p>Create your first records request through a workflow and it will appear here.</p></div> : requests.map((r) => <div className="request" key={r.id}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><h3>{r.title}</h3><span className="pill">{r.status}</span></div><p>{r.agency} · {r.id}</p><p style={{ marginTop: 6 }}>Updated: <b>{new Date(r.updatedAt).toLocaleString()}</b></p></div>)}
          </section>
          <aside className="card" id="analysis"><div className="head"><span>Integrity</span><span className="pill">Evidence first</span></div><div className="issue"><b>Audit trail</b><p>Every lifecycle transition is recorded with a cryptographic event hash and previous-event link.</p></div><div className="issue"><b>Fulfillment</b><p>MailMyPDF events are authenticated and deduplicated before changing request state.</p></div></aside>
        </div>
      </>}

      <div className="card" style={{ marginTop: 14 }} id="draft"><div className="head"><span>Workflow foundation</span><span className="muted">Built for reusable domain workflows</span></div><div className="steps"><div className="step"><span className="num">1</span><div><b>Define</b><div className="muted">Turn the user's goal into precise record categories, dates and custodians.</div></div></div><div className="step"><span className="num">2</span><div><b>Validate</b><div className="muted">Apply generic validation first, then workflow and jurisdiction-specific policy.</div></div></div><div className="step"><span className="num">3</span><div><b>Send and track</b><div className="muted">Preserve approval, document attestation, fulfillment, provider events and communications.</div></div></div><div className="step"><span className="num">4</span><div><b>Audit</b><div className="muted">Compare requested records against productions using evidence-backed findings and actions.</div></div></div></div></div>
    </main>
  </div>
}
