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

export type CodeEnforcementRequestStrategy = {
  likelyCustodians: string[]
  searchTerms: string[]
  scopeGaps: string[]
  overbreadthRisks: string[]
  identifiersToConfirm: string[]
  followUpPriorities: string[]
}

function assertStringArray(value: unknown, key: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) throw new Error(`CODE_ENFORCEMENT_AI_SCHEMA_INVALID:${key}`)
  return value
}

function validateStrategy(value: unknown): CodeEnforcementRequestStrategy {
  if (!value || typeof value !== 'object') throw new Error('CODE_ENFORCEMENT_AI_SCHEMA_INVALID:object')
  const candidate = value as Record<string, unknown>
  return {
    likelyCustodians: assertStringArray(candidate.likelyCustodians, 'likelyCustodians'),
    searchTerms: assertStringArray(candidate.searchTerms, 'searchTerms'),
    scopeGaps: assertStringArray(candidate.scopeGaps, 'scopeGaps'),
    overbreadthRisks: assertStringArray(candidate.overbreadthRisks, 'overbreadthRisks'),
    identifiersToConfirm: assertStringArray(candidate.identifiersToConfirm, 'identifiersToConfirm'),
    followUpPriorities: assertStringArray(candidate.followUpPriorities, 'followUpPriorities'),
  }
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

export async function buildCodeEnforcementRequestStrategy(
  providers: readonly LlmProvider[],
  input: unknown,
  policy: MultiLlmPolicy,
) {
  const result = await runMultiLlm<CodeEnforcementRequestStrategy>(providers, 'strategy', input, policy)
  return { ...result, value: validateStrategy(result.value) }
}
