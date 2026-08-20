import type { CreateRequestInput, RequestRepository, ValidatedRequest } from './request-service'

export type RequestState = 'draft' | 'validated' | 'review' | 'approved' | 'queued' | 'submitted' | 'tracking' | 'completed' | 'failed'

export type RequestRecord = {
  id: string
  title: string
  agency: string
  jurisdiction?: string
  purpose?: string
  scope?: string
  status: RequestState
  createdAt: string
  updatedAt: string
}

export type RequestStateRepository = RequestRepository & {
  getRequest(id: string): Promise<RequestRecord | null>
  transition(id: string, from: RequestState, to: RequestState, actor: string): Promise<RequestRecord>
}

export type D1Result<T = unknown> = { results?: T[]; success?: boolean }

export type D1Statement = {
  bind(...values: unknown[]): D1Statement
  first<T = unknown>(): Promise<T | null>
  all<T = unknown>(): Promise<D1Result<T>>
  run(): Promise<D1Result>
}

export type D1DatabaseLike = {
  prepare(sql: string): D1Statement
}

const allowedTransitions: Record<RequestState, readonly RequestState[]> = {
  draft: ['validated'],
  validated: ['review'],
  review: ['approved'],
  approved: ['queued'],
  queued: ['submitted'],
  submitted: ['tracking'],
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
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
})

export function canTransition(from: RequestState, to: RequestState): boolean {
  return allowedTransitions[from].includes(to)
}

export function createD1RequestRepository(db: D1DatabaseLike): RequestStateRepository {
  return {
    async createRequest(input: ValidatedRequest) {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      await db.prepare(
        `INSERT INTO requests (id, title, agency, jurisdiction, purpose, scope_json, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'validated', ?, ?)`,
      ).bind(
        id,
        input.normalizedTitle,
        input.normalizedAgency,
        input.jurisdiction ?? null,
        input.purpose ?? null,
        JSON.stringify({ scope: input.scope ?? null, items: input.items }),
        now,
        now,
      ).run()

      for (const item of input.items) {
        await db.prepare(
          `INSERT INTO request_items (id, request_id, category, description, date_start, date_end, custodian, system_hint, format, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'unanswered')`,
        ).bind(
          crypto.randomUUID(),
          id,
          item.category,
          item.description,
          item.dateStart ?? null,
          item.dateEnd ?? null,
          item.custodian ?? null,
          item.systemHint ?? null,
          item.format ?? null,
        ).run()
      }

      await db.prepare(
        `INSERT INTO audit_events (id, request_id, event_type, actor_type, payload_json, event_hash)
         VALUES (?, ?, 'request_validated', 'system', ?, ?)`
      ).bind(
        crypto.randomUUID(),
        id,
        JSON.stringify({ title: input.normalizedTitle, agency: input.normalizedAgency, itemCount: input.items.length }),
        `${id}:request_validated:${now}`,
      ).run()

      return { id }
    },

    async getRequest(id: string) {
      const row = await db.prepare(
        `SELECT id, title, agency, jurisdiction, purpose, scope_json, status, created_at, updated_at
         FROM requests WHERE id = ?`,
      ).bind(id).first<Record<string, unknown>>()
      return row ? toRecord(row) : null
    },

    async transition(id: string, from: RequestState, to: RequestState, actor: string) {
      if (!canTransition(from, to)) {
        throw new Error(`Invalid request transition: ${from} -> ${to}`)
      }

      const now = new Date().toISOString()
      const result = await db.prepare(
        `UPDATE requests SET status = ?, updated_at = ? WHERE id = ? AND status = ?`,
      ).bind(to, now, id, from).run()

      if (!result.success && !(result as { meta?: { changes?: number } }).meta?.changes) {
        throw new Error('Request transition was not persisted; request may not exist or status changed concurrently')
      }

      await db.prepare(
        `INSERT INTO audit_events (id, request_id, event_type, actor_type, actor_id, payload_json, event_hash)
         VALUES (?, ?, 'request_transition', 'user', ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        id,
        actor,
        JSON.stringify({ from, to }),
        `${id}:${from}:${to}:${now}`,
      ).run()

      const record = await this.getRequest(id)
      if (!record) throw new Error('Request disappeared after transition')
      return record
    },
  }
}
