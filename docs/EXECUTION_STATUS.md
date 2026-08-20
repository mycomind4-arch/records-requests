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
- Submit API requires durable persistence plus an installed fulfillment adapter and records successful submission/tracking transitions.
- Cloudflare runtime contract defines the required `RECORDS_DB` D1 binding and fulfillment deployment control.
- Deployment script now fails closed when placeholder D1 IDs remain.
- Approved-document integrity attestation produces a stable SHA-256 and fulfillment metadata for approved PDFs.

## Still blocked for production certification

### Actual runtime D1 binding
The repository and runtime contract exist, but no real provisioned D1 database ID has been installed in this repository or exercised through a deployed Cloudflare/OpenNext runtime.

### Real MailMyPDF credentials and endpoint
The fulfillment adapter is implemented and tested against mocked HTTP responses, but no live MailMyPDF credential or endpoint is configured here. No real mailing call has been performed.

### PDF rendering
The fulfillment boundary now requires an approved PDF and stable content hash, but the application still needs the concrete renderer that produces the final correspondence PDF from approved workflow content.

### Tracking/proof ingestion
The submit path can record provider tracking/proof identifiers returned by fulfillment, but inbound carrier/provider webhook ingestion and proof-audit reconciliation are not yet wired.

### Integration certification
The domain/repository/fulfillment tests exist, but there is no verified deployed end-to-end test against a real D1 database plus the real MailMyPDF service. CI/status reporting is also not currently available through the GitHub connector for these commits.

## Required next implementation

1. Provision a real D1 database and bind it as `RECORDS_DB` in Cloudflare/OpenNext.
2. Apply the migration to the test database and run integration tests against D1.
3. Implement the concrete approved-correspondence PDF renderer and feed its bytes through the integrity attestation.
4. Configure authenticated MailMyPDF fulfillment in a non-production test environment and execute an authorized test.
5. Ingest tracking/proof callbacks into `communications`, `audit_events`, and the request state machine.
6. Run deployed end-to-end certification before calling the vertical Gold Standard.

## Certification rule

The vertical is not Gold Standard until durable persistence, human approval, real fulfillment, tracking/proof reconciliation, and deployed end-to-end verification all pass. UI completeness and mocked adapters are not sufficient evidence.
