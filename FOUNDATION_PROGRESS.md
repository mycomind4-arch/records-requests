# Foundation progress

The foundation pass is intentionally separate from workflow implementation.

## Completed on `foundation/workflow-ready`

- Real request persistence path
- Owner-aware request model and dashboard data path
- D1 runtime integration work
- Cryptographic audit-chain implementation and verification
- Per-request audit-tail compare-and-swap for concurrent lifecycle writers
- Transactional request creation with initial audit event
- Fulfillment webhook deduplication
- Document attestation path
- Workflow factory contract and tests
- Records domain-pack capability contract aligned to MailMyPDF Platform
- Versioned jurisdiction policy contract (fail-closed)
- Durable fulfillment-attempt schema and deterministic idempotency contract
- Production → evidence → finding → action domain boundary
- CI coverage for typecheck/test/build
- Explicit MailMyPDF Platform consumption boundary

## Current focus

- Integrate durable fulfillment attempts into the submission transaction
- Finish repository-level ownership enforcement on every mutation path
- Connect the workflow factory/domain pack to actual workflow routes
- Make MailMyPDF Platform packages directly consumable by vertical repositories
- Certify the foundation before starting the Code Enforcement flagship workflow
