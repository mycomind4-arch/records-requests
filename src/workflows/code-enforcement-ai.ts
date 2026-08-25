import { runMultiLlm, type LlmProvider, type MultiLlmPolicy } from '../ai/multi-llm-orchestrator'
import type { ProductionRecord } from './code-enforcement-analysis'

export type ExtractedCodeEnforcementFacts = {
  caseNumbers: string[]
  parcelNumbers: string[]
  addresses: string[]
  dates: string[]
  people: string[]
}

export type Classification = {
  category: string
  rationale: string
}

export async function classifyProductionRecord(
  providers: readonly LlmProvider[],
  record: ProductionRecord,
  policy: MultiLlmPolicy,
) {
  return runMultiLlm<Classification>(providers, 'classification', {
    filename: record.filename,
    text: record.text ?? '',
  }, policy)
}

export async function extractCodeEnforcementFacts(
  providers: readonly LlmProvider[],
  record: ProductionRecord,
  policy: MultiLlmPolicy,
) {
  return runMultiLlm<ExtractedCodeEnforcementFacts>(providers, 'extraction', {
    filename: record.filename,
    text: record.text ?? '',
  }, policy)
}

export async function assessContradiction(
  providers: readonly LlmProvider[],
  left: ProductionRecord,
  right: ProductionRecord,
  policy: MultiLlmPolicy,
) {
  return runMultiLlm<{ contradictory: boolean; explanation: string }>(providers, 'contradiction', {
    left: { id: left.id, text: left.text ?? '' },
    right: { id: right.id, text: right.text ?? '' },
  }, policy)
}
