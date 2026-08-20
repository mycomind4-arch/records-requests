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
- Cloudflare runtime binding contract now defines the required `RECORDS_DB` D1 binding and `MAILMYPDF_FULFILLMENT_ENABLED` deployment control.

## Still blocked for production certification

### Actual runtime D1 binding
The repository and runtime contract exist, but this repository does not contain a real provisioned D1 database ID or deployed Cloudflare/OpenNext binding. No production persistence is being claimed until that binding is installed and exercised.

### Real MailMyPDF credentials and endpoint
The fulfillment adapter is implemented and tested against mocked HTTP responses, but no live MailMyPDF credential or endpoint is configured here. No real mailing call has been performed.

### Final document rendering
Submission accepts the final document payload at the fulfillment boundary. A production renderer still needs to produce the approved correspondence PDF with stable content hashing before send.

### Tracking/proof ingestion
The submit path can record tracking/proof identifiers returned by fulfillment, but inbound carrier/provider webhook ingestion and proof-audit reconciliation are not yet wired.

### Integration certification
The domain/repository/fulfillment tests exist, but there is no verified deployed end-to-end test against a real D1 database plus the real MailMyPDF service. CI/status reporting is also not currently available through the GitHub connector for these commits.

## Required next implementation

1. Provision a real D1 database and bind it as `RECORDS_DB` in the Cloudflare/OpenNext runtime.
2. Apply `database/schema.sql` to the test database and run integration tests.
3. Add final approved-document rendering and stable content hashing.
4. Configure authenticated MailMyPDF fulfillment in a non-production test environment and execute an authorized test.
5. Ingest tracking/proof callbacks into `communications`, `audit_events`, and the request state machine.
6. Run deployed end-to-end certification before calling the vertical Gold Standard.

## Certification rule

The vertical is not Gold Standard until durable persistence, human approval, real fulfillment, tracking/proof reconciliation, and deployed end-to-end verification all pass. UI completeness and mocked adapters are not sufficient evidence.
