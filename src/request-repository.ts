import type { CreateRequestInput, RequestRepository, ValidatedRequest } from './request-service'
import { computeAuditEventHash } from './audit-chain'

export type RequestState = 'draft' | 'validated' | 'review' | 'approved' | 'queued' | 'submitted' | 'tracking' | 'completed' | 'failed'

export type RequestRecord = {
  id: string
  title: string
  agency: string
  jurisdiction?: string
  purpose?: string
  scope?: string
  status: RequestState
  ownerId?: string
  createdAt: string
  updatedAt: string
}

export type RequestStateRepository = RequestRepository & {
  getRequest(id: string): Promise<RequestRecord | null>
  listRequests(ownerId?: string): Promise<RequestRecord[]>
  transition(id: string, from: RequestState, to: RequestState, actor: string): Promise<RequestRecord>
  recordFulfillmentEvent(input: { requestId: string; eventType: string; actor: string; payload: Record<string, unknown> }): Promise<void>
  recordProviderWebhookEvent(input: { requestId: string; eventId: string; status: string; actor: string; payload: Record<string, unknown> }): Promise<boolean>
  verifyAuditChain(requestId: string): Promise<{ valid: boolean; checked: number; error?: string }>
}

export type D1Result<T = unknown> = { results?: T[]; success?: boolean; meta?: { changes?: number } }

export type D1Statement = {
  bind(...values: unknown[]): D1Statement
  first<T = unknown>(): Promise<T | null>
  all<T = unknown>(): Promise<D1Result<T>>
  run(): Promise<D1Result>
}

export type D1DatabaseLike = {
  prepare(sql: string): D1Statement
  batch?: (statements: D1Statement[]) => Promise<D1Result[]>
}

const allowedTransitions: Record<RequestState, readonly RequestState[]> = {
  draft: ['validated'],
  validated: ['review'],
  review: ['approved'],
  approved: ['queued'],
  queued: ['submitted', 'failed'],
  submitted: ['tracking', 'failed'],
  tracking: ['completed', 'failed'],
  completed: [],
  failed: [],
}

const toRecord = (row: Record<string, unknown>): RequestRecord => ({
  id: String(row.id),
  title: String(row.title),
  agency: String(row.agency),
  jurisdiction: row.jurisdiction ? String(row.jurisdiction) : undefined,
  purpose: row.purpose ? String(row.purpose) : undefined,
  scope: row.scope_json ? String(row.scope_json) : undefined,
  status: String(row.status) as RequestState,
  ownerId: row.owner_id ? String(row.owner_id) : undefined,
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
})

export function canTransition(from: RequestState, to: RequestState): boolean {
  return allowedTransitions[from].includes(to)
}

async function latestAuditHash(db: D1DatabaseLike, requestId: string): Promise<string | null> {
  const row = await db.prepare(
    `SELECT event_hash FROM audit_events WHERE request_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1`,
  ).bind(requestId).first<{ event_hash: string }>()
  return row?.event_hash ?? null
}

async function createAuditStatement(
  db: D1DatabaseLike,
  input: { requestId: string; eventType: string; actorType: string; actorId?: string | null; payload: Record<string, unknown>; createdAt: string },
): Promise<D1Statement> {
  const previousHash = await latestAuditHash(db, input.requestId)
  const eventHash = await computeAuditEventHash({ ...input, previousHash })
  return db.prepare(
    `INSERT INTO audit_events (id, request_id, event_type, actor_type, actor_id, payload_json, previous_hash, event_hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    crypto.randomUUID(), input.requestId, input.eventType, input.actorType, input.actorId ?? null,
    JSON.stringify(input.payload), previousHash, eventHash, input.createdAt,
  )
}

export function createD1RequestRepository(db: D1DatabaseLike): RequestStateRepository {
  return {
    async createRequest(input: ValidatedRequest, ownerId?: string) {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const statements: D1Statement[] = [db.prepare(
        `INSERT INTO requests (id, title, agency, jurisdiction, purpose, scope_json, status, owner_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'validated', ?, ?, ?)`,
      ).bind(id, input.normalizedTitle, input.normalizedAgency, input.jurisdiction ?? null, input.purpose ?? null,
        JSON.stringify({ scope: input.scope ?? null, items: input.items }), ownerId ?? null, now, now)]

      for (const item of input.items) {
        statements.push(db.prepare(
          `INSERT INTO request_items (id, request_id, category, description, date_start, date_end, custodian, system_hint, format, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'unanswered')`,
        ).bind(crypto.randomUUID(), id, item.category, item.description, item.dateStart ?? null, item.dateEnd ?? null,
          item.custodian ?? null, item.systemHint ?? null, item.format ?? null))
      }

      statements.push(await createAuditStatement(db, {
        requestId: id,
        eventType: 'request_validated',
        actorType: 'user',
        actorId: ownerId ?? null,
        payload: { title: input.normalizedTitle, agency: input.normalizedAgency, itemCount: input.items.length },
        createdAt: now,
      }))

      if (db.batch) {
        const results = await db.batch(statements)
        if (results.some((result) => result.success === false)) throw new Error('Request creation transaction failed')
      } else {
        for (const statement of statements) await statement.run()
      }
      return { id }
    },

    async getRequest(id: string) {
      const row = await db.prepare(
        `SELECT id, title, agency, jurisdiction, purpose, scope_json, status, owner_id, created_at, updated_at
         FROM requests WHERE id = ?`,
      ).bind(id).first<Record<string, unknown>>()
      return row ? toRecord(row) : null
    },

    async listRequests(ownerId?: string) {
      const result = ownerId
        ? await db.prepare(`SELECT id, title, agency, jurisdiction, purpose, scope_json, status, owner_id, created_at, updated_at FROM requests WHERE owner_id = ? ORDER BY updated_at DESC LIMIT 100`).bind(ownerId).all<Record<string, unknown>>()
        : await db.prepare(`SELECT id, title, agency, jurisdiction, purpose, scope_json, status, owner_id, created_at, updated_at FROM requests ORDER BY updated_at DESC LIMIT 100`).all<Record<string, unknown>>()
      return (result.results ?? []).map(toRecord)
    },

    async transition(id: string, from: RequestState, to: RequestState, actor: string) {
      if (!canTransition(from, to)) throw new Error(`Invalid request transition: ${from} -> ${to}`)
      const now = new Date().toISOString()
      const result = await db.prepare(`UPDATE requests SET status = ?, updated_at = ? WHERE id = ? AND status = ?`).bind(to, now, id, from).run()
      if (!result.success || !(result.meta?.changes)) throw new Error('Request transition was not persisted; request may not exist or status changed concurrently')
      const audit = await createAuditStatement(db, { requestId: id, eventType: 'request_transition', actorType: 'user', actorId: actor, payload: { from, to }, createdAt: now })
      await audit.run()
      const record = await this.getRequest(id)
      if (!record) throw new Error('Request disappeared after transition')
      return record
    },

    async recordFulfillmentEvent({ requestId, eventType, actor, payload }) {
      const now = new Date().toISOString()
      const audit = await createAuditStatement(db, { requestId, eventType, actorType: 'system', actorId: actor, payload, createdAt: now })
      await audit.run()
    },

    async recordProviderWebhookEvent({ requestId, eventId, status, actor, payload }) {
      const event = db.prepare(`INSERT INTO fulfillment_events (id, provider, event_id, request_id, status, payload_json) VALUES (?, 'mailmypdf', ?, ?, ?, ?)`).bind(
        crypto.randomUUID(), eventId, requestId, status, JSON.stringify(payload),
      )
      try {
        const result = await event.run()
        if (!result.success || !(result.meta?.changes)) return false
      } catch (error) {
        if (error instanceof Error && /UNIQUE|constraint/i.test(error.message)) return false
        throw error
      }
      await this.recordFulfillmentEvent({ requestId, eventType: 'mailmypdf_webhook', actor: actor || eventId, payload })
      return true
    },

    async verifyAuditChain(requestId: string) {
      const result = await db.prepare(`SELECT request_id, event_type, actor_type, actor_id, payload_json, previous_hash, event_hash, created_at FROM audit_events WHERE request_id = ? ORDER BY created_at ASC, rowid ASC`).bind(requestId).all<Record<string, string | null>>()
      let previousHash: string | null = null
      let checked = 0
      for (const event of result.results ?? []) {
        const expected = await computeAuditEventHash({
          requestId: String(event.request_id), eventType: String(event.event_type), actorType: String(event.actor_type), actorId: event.actor_id,
          payload: JSON.parse(String(event.payload_json)), createdAt: String(event.created_at), previousHash,
        })
        checked += 1
        if (event.previous_hash !== previousHash || event.event_hash !== expected) return { valid: false, checked, error: `Audit chain mismatch at event ${checked}` }
        previousHash = event.event_hash
      }
      return { valid: true, checked }
    },
  }
}

export type _UnusedCreateRequestInput = CreateRequestInput
