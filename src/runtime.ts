import { createD1RequestRepository, type D1DatabaseLike, type RequestStateRepository } from './request-repository'

const runtimeKey = '__MAILMYPDF_RECORDS_D1__'

type RuntimeGlobal = typeof globalThis & {
  [runtimeKey]?: D1DatabaseLike
}

export function getRequestStateRepository(): RequestStateRepository | null {
  const db = (globalThis as RuntimeGlobal)[runtimeKey]
  return db ? createD1RequestRepository(db) : null
}

export function installD1RequestDatabase(db: D1DatabaseLike): void {
  ;(globalThis as RuntimeGlobal)[runtimeKey] = db
}
