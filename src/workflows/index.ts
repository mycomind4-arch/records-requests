import { codeEnforcementRecordsWorkflow } from './code-enforcement-records'
import type { RecordsWorkflow } from '../workflow-factory'

export const recordsWorkflows: readonly RecordsWorkflow[] = [
  codeEnforcementRecordsWorkflow,
]

const workflowMap = new Map(recordsWorkflows.map((workflow) => [workflow.id, workflow]))

export function getRecordsWorkflow(id: string): RecordsWorkflow | null {
  return workflowMap.get(id) ?? null
}

export function listRecordsWorkflows(): readonly RecordsWorkflow[] {
  return recordsWorkflows
}
