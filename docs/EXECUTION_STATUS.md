# Records Requests — Execution Status

Updated: 2026-08-20

## Executable now

- Request payload validation through `POST /api/requests/validate`.
- Deterministic normalization of title, agency, scope, and request items.
- Domain-level audit payload generation for validated requests.
- Full Records Gold Standard lifecycle contract with explicit pre-send gating.
- D1-compatible `RequestStateRepository` with request, item, and immutable audit-event writes.
- Atomic lifecycle transitions: `draft → validated → review → approved → queued → submitted → tracking → completed|failed`.
- Approval API uses the repository when a deployment injects the D1 binding.
- Explicit MailMyPDF fulfillment adapter with authenticated request handling, provider-response validation, and tracking/proof identifiers.
- Submit API now requires both durable persistence and an installed fulfillment adapter and records successful submission/tracking transitions.

## Still blocked for production certification

### Runtime D1 wiring
The repository implementation exists, but the deployed Next/Cloudflare runtime has not yet installed the actual D1 binding. Until that runtime adapter is connected and exercised against the real database, durable persistence is not certified.

### Real MailMyPDF credentials and endpoint
The fulfillment adapter is implemented and tested against mocked HTTP responses, but no live MailMyPDF credential or endpoint is configured in this repository. No real mailing call has been performed.

### Final document rendering
Submission currently accepts the final document payload at the fulfillment boundary. A production renderer still needs to produce the approved correspondence PDF with stable content hashing before send.

### Tracking/proof ingestion
The submit path can record tracking/proof identifiers returned by fulfillment, but inbound carrier/provider webhook ingestion and proof-audit reconciliation are not yet wired.

### Integration certification
The pure domain/repository/fulfillment tests exist, but there is no verified deployed end-to-end test against D1 plus the real MailMyPDF service. CI/status reporting is also not currently available through the GitHub connector for these commits.

## Required next implementation

1. Add the Cloudflare/OpenNext runtime adapter that injects the actual D1 binding.
2. Apply the SQL schema to a real test database and run integration tests.
3. Add the final approved-document rendering and content-hash boundary.
4. Configure authenticated MailMyPDF fulfillment in a non-production test environment and execute a real dry-run/authorized test.
5. Ingest tracking and proof callbacks into `communications`, `audit_events`, and the request state machine.
6. Run deployed end-to-end certification before calling the vertical Gold Standard.

## Certification rule

The vertical is not Gold Standard until durable persistence, human approval, real fulfillment, tracking/proof reconciliation, and deployed end-to-end verification all pass. UI completeness and mocked adapters are not sufficient evidence.
