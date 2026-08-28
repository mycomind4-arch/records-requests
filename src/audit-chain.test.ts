import { describe, it, expect } from 'vitest'
import assert from 'node:assert/strict'
import { canonicalizeEvent, computeEventHash, verifyAuditChain, type AuditEventRecord } from './audit-chain'

function makeEvent(
  overrides: Partial<AuditEventRecord> & { requestId: string; seq: number },
): AuditEventRecord {
  return {
    id: overrides.id ?? `evt-${overrides.seq}`,
    requestId: overrides.requestId,
    eventType: overrides.eventType ?? 'request_created',
    actorType: overrides.actorType ?? 'system',
    actorId: overrides.actorId ?? null,
    payload: overrides.payload ?? {},
    seq: overrides.seq,
    previousHash: overrides.previousHash ?? null,
    eventHash: overrides.eventHash ?? '',
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    ...overrides,
  }
}

describe('audit chain — canonicalization', () => {
  it('produces deterministic canonical JSON regardless of key insertion order', () => {
    const a = canonicalizeEvent({
      requestId: 'r1',
      eventType: 'created',
      actorType: 'system',
      actorId: 'u1',
      payload: { z: 1, a: 2 },
      seq: 1,
      previousHash: null,
    })

    const b = canonicalizeEvent({
      requestId: 'r1',
      eventType: 'created',
      actorType: 'system',
      actorId: 'u1',
      payload: { a: 2, z: 1 },
      seq: 1,
      previousHash: null,
    })

    assert.equal(a, b, 'Canonical JSON must be deterministic regardless of key order')
  })

  it('null actorId is included in canonical form', () => {
    const c = canonicalizeEvent({
      requestId: 'r1',
      eventType: 'created',
      actorType: 'system',
      actorId: null,
      payload: {},
      seq: 1,
      previousHash: null,
    })
    assert.ok(c.includes('"actorId":null'))
  })
})

describe('audit chain — hash computation', () => {
  it('produces a 64-char hex SHA-256', async () => {
    const hash = await computeEventHash({
      requestId: 'r1',
      eventType: 'created',
      actorType: 'system',
      actorId: null,
      payload: { count: 1 },
      seq: 1,
      previousHash: null,
    })
    assert.equal(hash.length, 64)
    assert.match(hash, /^[0-9a-f]+$/)
  })

  it('changes hash when payload changes', async () => {
    const a = await computeEventHash({
      requestId: 'r1', eventType: 'e', actorType: 'system', actorId: null, payload: { v: 1 }, seq: 1, previousHash: null,
    })
    const b = await computeEventHash({
      requestId: 'r1', eventType: 'e', actorType: 'system', actorId: null, payload: { v: 2 }, seq: 1, previousHash: null,
    })
    assert.notEqual(a, b)
  })

  it('changes hash when previousHash changes (chain linkage)', async () => {
    const a = await computeEventHash({
      requestId: 'r1', eventType: 'e', actorType: 'system', actorId: null, payload: {}, seq: 2, previousHash: null,
    })
    const b = await computeEventHash({
      requestId: 'r1', eventType: 'e', actorType: 'system', actorId: null, payload: {}, seq: 2, previousHash: 'abc123',
    })
    assert.notEqual(a, b)
  })
})

describe('audit chain — verification', () => {
  it('validates an intact chain of 3 events', async () => {
    const h1 = await computeEventHash({ requestId: 'r1', eventType: 'request_created', actorType: 'system', actorId: null, payload: { n: 1 }, seq: 1, previousHash: null })
    const h2 = await computeEventHash({ requestId: 'r1', eventType: 'request_transition', actorType: 'user', actorId: 'u1', payload: { from: 'draft', to: 'validated' }, seq: 2, previousHash: h1 })
    const h3 = await computeEventHash({ requestId: 'r1', eventType: 'request_approved', actorType: 'admin', actorId: 'a1', payload: {}, seq: 3, previousHash: h2 })

    const events = [
      makeEvent({ requestId: 'r1', seq: 1, previousHash: null, eventHash: h1, eventType: 'request_created', payload: { n: 1 } }),
      makeEvent({ requestId: 'r1', seq: 2, previousHash: h1, eventHash: h2, eventType: 'request_transition', actorType: 'user', actorId: 'u1', payload: { from: 'draft', to: 'validated' } }),
      makeEvent({ requestId: 'r1', seq: 3, previousHash: h2, eventHash: h3, eventType: 'request_approved', actorType: 'admin', actorId: 'a1' }),
    ]

    const result = await verifyAuditChain(events)
    assert.equal(result.valid, true)
    assert.equal(result.eventCount, 3)
  })

  it('detects a modified event payload', async () => {
    const h1 = await computeEventHash({ requestId: 'r1', eventType: 'request_created', actorType: 'system', actorId: null, payload: { n: 1 }, seq: 1, previousHash: null })
    const h2 = await computeEventHash({ requestId: 'r1', eventType: 'request_transition', actorType: 'user', actorId: 'u1', payload: { from: 'draft', to: 'validated' }, seq: 2, previousHash: h1 })

    // Tamper: change event 1's payload but keep old hash
    const events = [
      makeEvent({ requestId: 'r1', seq: 1, previousHash: null, eventHash: h1, eventType: 'request_created', payload: { n: 999 } }),
      makeEvent({ requestId: 'r1', seq: 2, previousHash: h1, eventHash: h2, eventType: 'request_transition', actorType: 'user', actorId: 'u1', payload: { from: 'draft', to: 'validated' } }),
    ]

    const result = await verifyAuditChain(events)
    assert.equal(result.valid, false)
    assert.match(result.reason, /Hash mismatch/)
  })

  it('detects a deleted event (broken chain)', async () => {
    const h1 = await computeEventHash({ requestId: 'r1', eventType: 'request_created', actorType: 'system', actorId: null, payload: {}, seq: 1, previousHash: null })
    const h2 = await computeEventHash({ requestId: 'r1', eventType: 'request_transition', actorType: 'user', actorId: 'u1', payload: {}, seq: 2, previousHash: h1 })
    const h3 = await computeEventHash({ requestId: 'r1', eventType: 'request_approved', actorType: 'admin', actorId: 'a1', payload: {}, seq: 3, previousHash: h2 })

    // Event 2 is missing — event 3's previousHash points to a non-existent event
    const events = [
      makeEvent({ requestId: 'r1', seq: 1, previousHash: null, eventHash: h1, eventType: 'request_created' }),
      makeEvent({ requestId: 'r1', seq: 3, previousHash: h2, eventHash: h3, eventType: 'request_approved', actorType: 'admin', actorId: 'a1' }),
    ]

    const result = await verifyAuditChain(events)
    assert.equal(result.valid, false)
    assert.match(result.reason, /Sequence gap/)
  })

  it('detects a reordered event', async () => {
    const h1 = await computeEventHash({ requestId: 'r1', eventType: 'request_created', actorType: 'system', actorId: null, payload: {}, seq: 1, previousHash: null })
    const h2 = await computeEventHash({ requestId: 'r1', eventType: 'request_transition', actorType: 'user', actorId: 'u1', payload: {}, seq: 2, previousHash: h1 })

    // Swap order: event 2 first, then event 1
    const events = [
      makeEvent({ requestId: 'r1', seq: 2, previousHash: h1, eventHash: h2, eventType: 'request_transition', actorType: 'user', actorId: 'u1' }),
      makeEvent({ requestId: 'r1', seq: 1, previousHash: null, eventHash: h1, eventType: 'request_created' }),
    ]

    const result = await verifyAuditChain(events)
    assert.equal(result.valid, false)
    assert.match(result.reason, /Sequence gap/)
  })

  it('accepts an empty chain as valid', async () => {
    const result = await verifyAuditChain([])
    assert.equal(result.valid, true)
    assert.equal(result.eventCount, 0)
  })

  it('detects incorrect previous hash', async () => {
    const h1 = await computeEventHash({ requestId: 'r1', eventType: 'request_created', actorType: 'system', actorId: null, payload: {}, seq: 1, previousHash: null })
    const h2 = await computeEventHash({ requestId: 'r1', eventType: 'request_approved', actorType: 'admin', actorId: 'a1', payload: {}, seq: 2, previousHash: 'wrong-hash' })

    const events = [
      makeEvent({ requestId: 'r1', seq: 1, previousHash: null, eventHash: h1, eventType: 'request_created' }),
      makeEvent({ requestId: 'r1', seq: 2, previousHash: 'wrong-hash', eventHash: h2, eventType: 'request_approved', actorType: 'admin', actorId: 'a1' }),
    ]

    const result = await verifyAuditChain(events)
    assert.equal(result.valid, false)
    assert.match(result.reason, /Broken chain/)
  })
})
