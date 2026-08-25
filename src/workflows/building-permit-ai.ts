import { runMultiLlm, type LlmProvider, type MultiLlmPolicy } from '../ai/multi-llm-orchestrator'
import { getConfiguredRecordsLlmProviders } from '../ai/records-llm-providers'
import type { BuildingPermitRecord } from './building-permit-analysis'

export type BuildingPermitFacts = {
  permitNumbers: string[]
  applicationNumbers: string[]
  parcelNumbers: string[]
  addresses: string[]
  dates: string[]
  applicants: string[]
  contractors: string[]
}

export type BuildingPermitClassification = { category: string; rationale: string }
export type BuildingPermitStrategy = {
  likelyCustodians: string[]
  searchTerms: string[]
  identifiersToConfirm: string[]
  scopeGaps: string[]
  missingRecordPriorities: string[]
  followUpPriorities: string[]
}

const strings = (value: unknown, key: string) => {
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) throw new Error(`BUILDING_PERMIT_AI_SCHEMA_INVALID:${key}`)
  return value as string[]
}
function validateStrategy(value: unknown): BuildingPermitStrategy {
  if (!value || typeof value !== 'object') throw new Error('BUILDING_PERMIT_AI_SCHEMA_INVALID:object')
  const c = value as Record<string, unknown>
  return {
    likelyCustodians: strings(c.likelyCustodians, 'likelyCustodians'), searchTerms: strings(c.searchTerms, 'searchTerms'),
    identifiersToConfirm: strings(c.identifiersToConfirm, 'identifiersToConfirm'), scopeGaps: strings(c.scopeGaps, 'scopeGaps'),
    missingRecordPriorities: strings(c.missingRecordPriorities, 'missingRecordPriorities'), followUpPriorities: strings(c.followUpPriorities, 'followUpPriorities'),
  }
}
export function classifyBuildingPermit(providers: readonly LlmProvider[], record: BuildingPermitRecord, policy: MultiLlmPolicy) {
  return runMultiLlm<BuildingPermitClassification>(providers, 'classification', { filename: record.filename, text: record.text ?? '', category: record.category }, policy)
}
export function extractBuildingPermitFacts(providers: readonly LlmProvider[], record: BuildingPermitRecord, policy: MultiLlmPolicy) {
  return runMultiLlm<BuildingPermitFacts>(providers, 'extraction', { filename: record.filename, text: record.text ?? '', category: record.category }, policy)
}
export function assessBuildingPermitContradiction(providers: readonly LlmProvider[], left: BuildingPermitRecord, right: BuildingPermitRecord, policy: MultiLlmPolicy) {
  return runMultiLlm<{ contradictory: boolean; explanation: string }>(providers, 'contradiction', { left: { id: left.id, text: left.text ?? '' }, right: { id: right.id, text: right.text ?? '' } }, policy)
}
export async function runBuildingPermitStrategy(input: unknown) {
  const providers = getConfiguredRecordsLlmProviders()
  if (providers.length < 2) throw new Error(`BUILDING_PERMIT_LLM_QUORUM_NOT_MET:${providers.length}/2`)
  const result = await runMultiLlm<BuildingPermitStrategy>(providers, 'strategy', input, { minimumProviders: 2, agreementThreshold: 0.67, maxProviders: 3 })
  return { ...result, value: validateStrategy(result.value) }
}
