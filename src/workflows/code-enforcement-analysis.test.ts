import { describe, expect, it } from 'vitest'
import { analyzeCodeEnforcementProduction } from './code-enforcement-analysis'

describe('code enforcement production analysis', () => {
  const requested = [
    { id: 'complaints', label: 'Complaints', keywords: ['complaint'] },
    { id: 'inspections', label: 'Inspections', keywords: ['inspection'] },
    { id: 'photographs', label: 'Photographs', keywords: ['photo', 'photograph'] },
  ] as const

  it('detects requested categories not located in a production', () => {
    const result = analyzeCodeEnforcementProduction(requested, [
      { id: 'r1', filename: 'inspection-report.pdf', category: 'Inspection' },
    ])

    expect(result.recordsReviewed).toBe(1)
    expect(result.coveredCategoryIds).toEqual(['inspections'])
    expect(result.missingCategoryIds).toEqual(['complaints', 'photographs'])
    expect(result.findings.filter((f) => f.type === 'MISSING_REQUESTED_CATEGORY')).toHaveLength(2)
  })

  it('detects duplicate records using content hashes', () => {
    const result = analyzeCodeEnforcementProduction([], [
      { id: 'r1', filename: 'a.pdf', sha256: 'same' },
      { id: 'r2', filename: 'b.pdf', sha256: 'same' },
    ])

    expect(result.findings).toContainEqual(expect.objectContaining({
      type: 'DUPLICATE_RECORD',
      recordIds: ['r1', 'r2'],
    }))
  })

  it('flags records containing withholding or redaction language for review', () => {
    const result = analyzeCodeEnforcementProduction([], [{
      id: 'r1',
      filename: 'response.pdf',
      text: 'See attached inspection report. Portions are redacted as exempt.',
    }])

    expect(result.findings).toContainEqual(expect.objectContaining({
      type: 'UNEXPLAINED_REDACTION',
      severity: 'warning',
    }))
  })
})
