# Workflow Readiness Gate

## Status

**Foundation branch: workflow-development ready for the first flagship workflow, with deployment verification still required before production.**

## Green — engineering foundation

- [x] Real request creation API
- [x] Owner-scoped request persistence
- [x] Real request listing
- [x] `validated -> review` transition
- [x] Authenticated approval boundary
- [x] Transaction-capable D1 request creation
- [x] Cryptographic audit event hashing
- [x] Audit-chain verification primitive
- [x] MailMyPDF webhook signature verification retained
- [x] Durable fulfillment event deduplication
- [x] Dashboard reads persisted request data
- [x] Reusable workflow factory contract
- [x] Workflow contract tests
- [x] Generic request validation strengthened with date-range checks

## Yellow — external or deployment verification required

- [ ] Real identity provider installed
- [ ] Production D1 IDs provisioned
- [ ] D1 migrations applied in staging
- [ ] MailMyPDF production credentials configured
- [ ] MailMyPDF webhook configured against deployed endpoint
- [ ] Full Cloudflare E2E run

## Red — next engineering milestones

- [ ] Durable outbound fulfillment-attempt/idempotency record
- [ ] Repository-level ownership enforcement for every mutation
- [ ] Versioned jurisdiction policy packs
- [ ] Complete workflow factory runtime integration
- [ ] Production/evidence ingestion
- [ ] Evidence-backed findings/actions runtime
- [ ] Workflow-specific intake builders
- [ ] CI certification if not already enabled externally

## First workflow

The next workflow should be `code-enforcement-records`.

It should be implemented on top of this foundation rather than adding another parallel persistence, authorization, fulfillment, or audit system.
