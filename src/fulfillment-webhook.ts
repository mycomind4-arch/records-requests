/**
 * Fulfillment webhook — HMAC-SHA256 signing and verification.
 *
 * Delegates the cryptographic operations to @mailmypdf/runtime's
 * signWebhook/verifyWebhook, keeping the local type aliases
 * for backward compatibility.
 */

export type FulfillmentWebhook = {
  eventId: string
  requestId: string
  status: 'delivered' | 'failed' | 'returned' | 'unknown'
  trackingNumber?: string
  proofId?: string
  occurredAt?: string
  payload?: Record<string, unknown>
}

import { signWebhook, verifyWebhook } from "@mailmypdf/runtime";

/** Sign a webhook body with HMAC-SHA256 (runtime contract). */
export async function signFulfillmentWebhook(secret: string, rawBody: string): Promise<string> {
  return signWebhook(secret, rawBody);
}

/** Verify a webhook signature in constant time (runtime contract). */
export async function verifyFulfillmentWebhook(secret: string, rawBody: string, signature: string): Promise<boolean> {
  return verifyWebhook(secret, rawBody, signature);
}
