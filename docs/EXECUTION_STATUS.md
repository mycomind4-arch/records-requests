# Records Requests — Execution Status

Updated: 2026-08-20

## Executable now

- Request payload validation through `POST /api/requests/validate`.
- Deterministic normalization of title, agency, scope, and request items.
- Domain-level audit payload generation for validated requests.
- Full Records Gold Standard lifecycle contract with explicit pre-send gating.
- D1-compatible `RequestStateRepository` with request, item, immutable audit-event, and fulfillment-event writes.
- Atomic lifecycle transitions: `draft → validated → review → approved → queued → submitted → tracking → completed|failed`.
- Database-level D1 status constraints now mirror the application lifecycle and prevent unsupported persisted states.
- Provider failures can terminate `queued` requests instead of leaving them stranded.
- Explicit MailMyPDF fulfillment adapter with authenticated request handling, provider-response validation, and tracking/proof identifiers.
- Signed MailMyPDF webhook verification using HMAC-SHA256.
- MailMyPDF callback endpoint that records fulfillment events and advances `tracking → completed|failed`.
- Deterministic approved-request PDF renderer with SHA-256 content attestation.
- Cloudflare/OpenNext runtime contract defining the required `RECORDS_DB` binding and fulfillment controls.
- Deployment script fails closed when placeholder D1 IDs remain.
- Repository now has an executable `npm test`/Vitest command for the domain, migration, repository, fulfillment, webhook, and Gold Standard regression suites.

## Still blocked for production certification

### Actual runtime D1 binding
The repository and runtime contract exist, but no real provisioned D1 database ID has been installed in this repository or exercised through a deployed Cloudflare/OpenNext runtime.

### Real MailMyPDF credentials and endpoint
The fulfillment adapter is implemented and tested against mocked HTTP responses, but no live MailMyPDF credential or endpoint is configured here. No real mailing call has been performed.

### Renderer integration
A deterministic PDF renderer now produces stable bytes and SHA-256 attestations. The approved request UI/service still needs to call it and persist the resulting document hash before fulfillment.

### Tracking/proof provider integration
The signed callback endpoint exists and records delivery/failure evidence, but the deployed MailMyPDF provider must be configured with the callback secret and actual callback URL, and its real payload schema must be verified.

### Dependency lock/install verification
`package.json` now includes Vitest, but this repository does not yet include a committed package lockfile generated after that dependency change. A normal networked install should generate and commit the chosen lockfile before deployment certification.

### Integration certification
There is no verified deployed end-to-end test against real D1 + real MailMyPDF. CI/status reporting is also not currently available through the GitHub connector for these commits.

## External-agent operations still required

1. Provision staging D1 and replace the placeholder IDs in `wrangler.jsonc`.
2. Apply the SQL migration/schema to staging and run the integration suite against D1.
3. Run a normal networked package install and commit the resulting lockfile for the new Vitest dependency.
4. Configure `MAILMYPDF_API_KEY` and the real fulfillment endpoint in a non-production environment.
5. Configure `MAILMYPDF_WEBHOOK_SECRET` and register the callback endpoint with MailMyPDF.
6. Wire the approved-request UI/service to `renderRecordsRequestPdf` + `attestRecordsRequestPdf`, persist the document hash, and send only that attested PDF.
7. Run one authorized staging transaction and verify `approved → queued → submitted → tracking → completed` plus proof reconciliation.
8. Promote infrastructure and credentials to production only after staging passes.

## Certification rule

The vertical is not Gold Standard until durable persistence, human approval, real fulfillment, tracking/proof reconciliation, and deployed end-to-end verification all pass. UI completeness and mocked adapters are not sufficient evidence.
