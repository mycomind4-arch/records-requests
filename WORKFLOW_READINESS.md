# Records Requests — Workflow Readiness

## Status

**Engineering foundation: workflow-development ready. Production deployment verification remains an external gate.**

## Green — engineering foundation

- [x] Real request creation API
- [x] Owner-scoped request persistence and listing
- [x] `validated -> review` transition
- [x] Authenticated approval boundary
- [x] Transaction-capable D1 request creation
- [x] Cryptographic audit event hashing and verification
- [x] Per-request audit-tail compare-and-swap for concurrent lifecycle writers
- [x] MailMyPDF webhook signature verification
- [x] Durable fulfillment event deduplication
- [x] Durable outbound fulfillment-attempt reservation
- [x] Deterministic fulfillment idempotency key
- [x] Exact-document SHA-256 attestation before fulfillment
- [x] Dashboard reads persisted request data
- [x] Reusable workflow factory contract
- [x] Capability-aware Records domain-pack contract
- [x] Workflow contract tests
- [x] Generic request validation with date-range checks
- [x] Versioned jurisdiction-policy extension point (fail-closed)
- [x] Production/evidence/finding/action domain boundary
- [x] Explicit MailMyPDF Platform consumption boundary

## Yellow — external/deployment verification required

- [ ] Real identity provider installed
- [ ] Production D1 IDs provisioned
- [ ] D1 migrations applied in staging
- [ ] MailMyPDF production credentials configured
- [ ] MailMyPDF webhook configured against deployed endpoint
- [ ] Full Cloudflare E2E run
- [ ] MailMyPDF Platform packages published for direct vertical consumption

These are deployment/ecosystem gates, not reasons to create a parallel Records Requests architecture.

## Workflow boundary

The first flagship workflow is `code-enforcement-records`.

It should provide Records-specific domain intelligence for property/case identification, violations, inspections, complaints, photographs, notices, correspondence, enforcement actions, permits, custodians, date ranges, production completeness, contradictions, evidence-backed findings, and escalation strategy.

It inherits generic persistence, authorization, lifecycle, proof, fulfillment, and audit semantics from the shared ecosystem contracts.
