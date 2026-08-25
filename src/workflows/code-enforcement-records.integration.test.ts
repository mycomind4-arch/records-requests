import { describe, expect, it, vi } from 'vitest'
import type { LlmProvider } from '../ai/multi-llm-orchestrator'

const testProviders: LlmProvider[] = [
  {
    id: 'test-gemini',
    async complete<T>(task) {
      if (task !== 'strategy') throw new Error(`unexpected task: ${task}`)
      return { provider: 'gemini', model: 'test-gemini', confidence: 0.95, warnings: [], value: {
        likelyCustodians: ['Code Enforcement Department'], searchTerms: ['123 Main St', 'code enforcement case file'], scopeGaps: [], overbreadthRisks: [], identifiersToConfirm: ['case number', 'parcel/APN'], followUpPriorities: ['missing inspection records'],
      } as T }
    },
  },
  {
    id: 'test-openai',
    async complete<T>(task) {
      if (task !== 'strategy') throw new Error(`unexpected task: ${task}`)
      return { provider: 'openai', model: 'test-openai', confidence: 0.94, warnings: [], value: {
        likelyCustodians: ['Code Enforcement Department'], searchTerms: ['123 Main St', 'code enforcement case file'], scopeGaps: [], overbreadthRisks: [], identifiersToConfirm: ['case number', 'parcel/APN'], followUpPriorities: ['missing inspection records'],
      } as T }
    },
  },
]

vi.mock('../ai/records-llm-providers', () => ({ getConfiguredRecordsLlmProviders: () => testProviders }))

import { buildCodeEnforcementRequest, codeEnforcementRecordsWorkflow } from './code-enforcement-records'

describe('code enforcement workflow integration', () => {
  it('builds a complete identifier-rich request', () => {
    const request = buildCodeEnforcementRequest({ agency: 'Example City', department: 'Code Enforcement', propertyAddress: '123 Main St', parcelNumber: 'APN-123', caseNumber: 'CE-2026-10', violationNumber: 'V-22', relatedParty: 'Example LLC', dateStart: '2024-01-01', dateEnd: '2026-08-24', subjectMatter: 'unpermitted construction and property maintenance violations' })
    expect(request.items).toHaveLength(10)
    expect(request.items.every((item) => item.dateStart === '2024-01-01' && item.dateEnd === '2026-08-24')).toBe(true)
    expect(request.items.every((item) => item.description.includes('123 Main St'))).toBe(true)
    expect(request.items.every((item) => item.description.includes('CE-2026-10'))).toBe(true)
  })

  it('rejects a request that lacks a property or case identifier', () => {
    const request = buildCodeEnforcementRequest({ agency: 'Example City', dateStart: '2024-01-01', dateEnd: '2026-08-24', subjectMatter: 'code issue' })
    const issues = codeEnforcementRecordsWorkflow.validateRequest(request as never)
    expect(issues.some((issue) => issue.field === 'identifiers')).toBe(true)
  })

  it('runs real production analysis through the workflow contract', async () => {
    const request = buildCodeEnforcementRequest({ agency: 'Example City', propertyAddress: '123 Main St', dateStart: '2024-01-01', dateEnd: '2026-08-24', subjectMatter: 'code violation' })
    const result = await codeEnforcementRecordsWorkflow.responseAnalysis!.analyze({
      requestedItems: request.items,
      records: [{ id: 'r1', filename: 'inspection-report.pdf', category: 'inspection', text: 'Inspection report for 123 Main St' }],
    }) as { recordsReviewed: number; findings: unknown[]; aiProvenance: { providers: string[]; agreement: number } }
    expect(result.recordsReviewed).toBe(1)
    expect(result.findings.length).toBeGreaterThan(0)
    expect(result.aiProvenance.providers).toEqual(['gemini', 'openai'])
    expect(result.aiProvenance.agreement).toBeGreaterThanOrEqual(0.94)
  })
})
