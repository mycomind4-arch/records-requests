import { codeEnforcementRecordsWorkflow } from './code-enforcement-records'
import type { RecordsWorkflow } from '../workflow-factory'

export const recordsWorkflows: readonly RecordsWorkflow[] = [codeEnforcementRecordsWorkflow]

const byId = new Map(recordsWorkflows.map((workflow) => [workflow.id, workflow]))

export function getRecordsWorkflow(id: string): RecordsWorkflow | null {
  return byId.get(id) ?? null
}
