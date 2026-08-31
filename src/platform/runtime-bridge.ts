/**
 * Bridge between records-requests and @mailmypdf/runtime.
 *
 * Records-requests is the source-of-truth repo — the runtime contracts
 * were originally extracted from here. This bridge delegates to the
 * shared runtime so there is one canonical implementation, while
 * preserving records-requests' domain-specific extensions (e.g. the
 * "blocked" status).
 */

import {
  computeEventHash,
  createAuditEntry,
  verifyAuditChain,
  GENESIS_HASH,
  type AuditChainEntry,
} from "@mailmypdf/runtime";
import {
  canTransition,
  isTerminal,
  isPreApproval,
  isPostApproval,
  type CaseState,
} from "@mailmypdf/runtime";
import {
  createMemoryIdempotencyStore,
  fulfillmentKey,
  webhookKey,
  paymentKey,
  type IdempotencyStore,
} from "@mailmypdf/runtime";
import {
  signWebhook,
  verifyWebhook,
  processFulfillmentWebhook,
} from "@mailmypdf/runtime";
import {
  attestDocument,
  verifyDocumentIntegrity,
  type DocumentIntegrity,
} from "@mailmypdf/runtime";

/* Re-export all contracts */
export {
  computeEventHash,
  createAuditEntry,
  verifyAuditChain,
  GENESIS_HASH,
  type AuditChainEntry,
};
export { canTransition, isTerminal, isPreApproval, isPostApproval, type CaseState };
export { fulfillmentKey, webhookKey, paymentKey, type IdempotencyStore };
export { signWebhook, verifyWebhook, processFulfillmentWebhook };
export { attestDocument, verifyDocumentIntegrity, type DocumentIntegrity };

/* Shared idempotency store singleton */
export const idempotencyStore = createMemoryIdempotencyStore();

/* ── Records-requests domain extension ──
 * "blocked" status extends the runtime's CaseState.
 */
export type RequestStatus = CaseState | "blocked";

export function canTransitionExtended(from: RequestStatus, to: RequestStatus): boolean {
  if (from === "blocked") return to === "draft" || to === "failed";
  if (to === "blocked") return from === "review" || from === "validated";
  return canTransition(from as CaseState, to as CaseState);
}
