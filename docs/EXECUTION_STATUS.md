# Records Requests — Execution Status

Updated: 2026-08-20

## What is executable now

- Request payload validation through `POST /api/requests/validate`.
- Deterministic normalization of title, agency, scope, and request items.
- Validation failures return structured 422 issues.
- Domain-level audit payload generation for validated requests.
- Gold Standard lifecycle contract with explicit pre-send gate and full completion certification.

## What is not yet executable

### Durable request creation
The repository contains a SQL schema for `requests`, `request_items`, `communications`, `productions`, `evidence`, `findings`, `actions`, and `audit_events`, but the Next application does not currently expose a runtime database adapter. The API must not claim a request was persisted until a concrete `RequestRepository` implementation is configured.

### Send / fulfillment
No live MailMyPDF fulfillment call is wired into this repo yet. The intended boundary is:

`validated request → human review → human approval → render final correspondence → MailMyPDF API → tracking/proof event`

The application must preserve the request ID, document hash, idempotency key, and downstream fulfillment/proof identifiers.

### Tracking / productions
Tracking events, agency communications, uploaded productions, and audit findings should write through the same durable repository boundary. UI-only status counters are not certification evidence.

## Required next implementation

1. Add a concrete database adapter for the existing SQL schema.
2. Implement `createRequest` and immutable `audit_events` writes.
3. Add review/approval persistence and actor identity.
4. Add final-document generation boundary.
5. Connect approved send to MailMyPDF with idempotency and explicit failure handling.
6. Ingest tracking/proof events and attach them to the request timeline.
7. Add integration tests against a real test database and a mocked MailMyPDF boundary.

## Certification rule

The vertical is not Gold Standard until the complete lifecycle has passed with durable persistence and real end-to-end fulfillment/proof verification. UI completeness, static workflow pages, or a passing pure-function runner are insufficient.
