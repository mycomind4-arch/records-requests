/**
 * Audit chain — tamper-evident event recording for request lifecycle.
 *
 * The SHA-256 computation and chain verification are delegated to
 * @mailmypdf/runtime. The canonicalization of the audit payload is
 * records-requests-specific (deterministic JSON ordering) and is
 * kept locally for domain compatibility.
 */

import { GENESIS_HASH, verifyAuditChain, type AuditChainEntry } from "@mailmypdf/runtime";

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(',')}}`
}

export function canonicalAuditPayload(input: {
  requestId: string
  eventType: string
  actorType: string
  actorId?: string | null
  payload: unknown
  createdAt: string
  previousHash?: string | null
}): string {
  return canonicalize(input)
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function computeAuditEventHash(input: {
  requestId: string
  eventType: string
  actorType: string
  actorId?: string | null
  payload: unknown
  createdAt: string
  previousHash?: string | null
}): Promise<string> {
  return sha256Hex(canonicalAuditPayload(input))
}

// Re-export the runtime's chain verification for consumers that want
// to verify a full chain of AuditChainEntry records
export { GENESIS_HASH, verifyAuditChain, type AuditChainEntry };
