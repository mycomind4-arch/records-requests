/**
 * Cryptographic audit chain.
 *
 * Each event's hash = SHA-256(canonical JSON of event fields + previous event hash).
 * The chain can detect modification, deletion, reordering, and invalid hashes.
 */

export type AuditEventInput = {
  requestId: string
  eventType: string
  actorType: 'system' | 'user' | 'admin' | 'scheduled_job' | 'api_call'
  actorId?: string | null
  payload: Record<string, unknown>
}

export type AuditEventRecord = AuditEventInput & {
  id: string
  seq: number
  previousHash: string | null
  eventHash: string
  createdAt: string
}

/**
 * Recursively sort object keys for deterministic JSON serialization.
 */
function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value
  }
  if (Array.isArray(value)) {
    return value.map(sortKeys)
  }
  const obj = value as Record<string, unknown>
  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortKeys(obj[key])
  }
  return sorted
}

/**
 * Canonicalize an event for hashing.
 * Keys are sorted recursively for deterministic output.
 * The previousHash is included to chain events together.
 */
export function canonicalizeEvent(
  event: Pick<AuditEventRecord, 'requestId' | 'eventType' | 'actorType' | 'actorId' | 'payload' | 'seq' | 'previousHash'>,
): string {
  const canonical = {
    requestId: event.requestId,
    eventType: event.eventType,
    actorType: event.actorType,
    actorId: event.actorId ?? null,
    seq: event.seq,
    previousHash: event.previousHash,
    payload: event.payload,
  }
  return JSON.stringify(sortKeys(canonical))
}

/**
 * Compute the SHA-256 hash of an audit event.
 */
export async function computeEventHash(
  event: Pick<AuditEventRecord, 'requestId' | 'eventType' | 'actorType' | 'actorId' | 'payload' | 'seq' | 'previousHash'>,
): Promise<string> {
  const canonical = canonicalizeEvent(event)
  const bytes = new TextEncoder().encode(canonical)
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify an audit chain is intact.
 *
 * Checks:
 * - Each event's hash matches the recomputed hash
 * - Each event's previousHash matches the prior event's hash
 * - Sequence numbers are contiguous starting from 1
 * - No events are missing, reordered, or inserted
 */
export type ChainVerificationResult =
  | { valid: true; eventCount: number }
  | { valid: false; reason: string; eventIndex?: number; eventCount: number }

export async function verifyAuditChain(events: AuditEventRecord[]): Promise<ChainVerificationResult> {
  if (!events.length) {
    return { valid: true, eventCount: 0 }
  }

  // Sort by sequence number
  const sorted = [...events].sort((a, b) => a.seq - b.seq)

  for (let i = 0; i < sorted.length; i++) {
    const event = sorted[i]
    const expectedSeq = i + 1

    // Check sequence contiguity
    if (event.seq !== expectedSeq) {
      return {
        valid: false,
        reason: `Sequence gap or reorder at position ${i}: expected seq ${expectedSeq}, got ${event.seq}`,
        eventIndex: i,
        eventCount: events.length,
      }
    }

    // Check previous hash linkage
    const expectedPreviousHash = i === 0 ? null : sorted[i - 1].eventHash
    if (event.previousHash !== expectedPreviousHash) {
      return {
        valid: false,
        reason: `Broken chain at event ${event.id} (seq ${event.seq}): expected previousHash ${expectedPreviousHash}, got ${event.previousHash}`,
        eventIndex: i,
        eventCount: events.length,
      }
    }

    // Recompute and verify hash
    const recomputedHash = await computeEventHash({
      requestId: event.requestId,
      eventType: event.eventType,
      actorType: event.actorType,
      actorId: event.actorId,
      payload: event.payload,
      seq: event.seq,
      previousHash: event.previousHash,
    })

    if (recomputedHash !== event.eventHash) {
      return {
        valid: false,
        reason: `Hash mismatch at event ${event.id} (seq ${event.seq}): stored hash does not match recomputed hash`,
        eventIndex: i,
        eventCount: events.length,
      }
    }
  }

  return { valid: true, eventCount: events.length }
}
