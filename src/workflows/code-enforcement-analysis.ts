export type ProductionRecord = {
  id: string
  filename: string
  category?: string
  text?: string
  sha256?: string
}

export type RequestedCategory = {
  id: string
  label: string
  keywords: readonly string[]
}

export type ProductionFindingType =
  | 'MISSING_REQUESTED_CATEGORY'
  | 'REFERENCED_RECORD_NOT_PRODUCED'
  | 'IDENTIFIER_MISMATCH'
  | 'DATE_GAP'
  | 'DUPLICATE_RECORD'
  | 'MISSING_ATTACHMENT'
  | 'UNEXPLAINED_REDACTION'
  | 'PARTIAL_PRODUCTION'
  | 'UNRESPONSIVE_ITEM'
  | 'PRODUCTION_AMBIGUITY'

export type ProductionFinding = {
  id: string
  type: ProductionFindingType
  severity: 'info' | 'warning' | 'critical'
  description: string
  recordIds: string[]
  requestedCategoryId?: string
}

export type CodeEnforcementProductionAnalysis = {
  recordsReviewed: number
  findings: ProductionFinding[]
  coveredCategoryIds: string[]
  missingCategoryIds: string[]
}

const REFERENCE_PATTERNS = /(?:see|attached|enclosed|attachment|report|photo|photograph|exhibit|notice|citation|inspection)\b/i
const REDACTION_PATTERNS = /(?:redacted|withheld|exempt|privileged|confidential|blackout)/i

export function analyzeCodeEnforcementProduction(
  requested: readonly RequestedCategory[],
  records: readonly ProductionRecord[],
): CodeEnforcementProductionAnalysis {
  const findings: ProductionFinding[] = []
  const coveredCategoryIds: string[] = []

  for (const category of requested) {
    const matches = records.filter((record) => {
      const haystack = `${record.filename} ${record.category ?? ''} ${record.text ?? ''}`.toLowerCase()
      return category.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))
    })

    if (matches.length > 0) {
      coveredCategoryIds.push(category.id)
      continue
    }

    findings.push({
      id: `missing-${category.id}`,
      type: 'MISSING_REQUESTED_CATEGORY',
      severity: 'warning',
      description: `No produced record was matched to requested category: ${category.label}.`,
      recordIds: [],
      requestedCategoryId: category.id,
    })
  }

  const seenHashes = new Map<string, string>()
  for (const record of records) {
    if (record.sha256) {
      const prior = seenHashes.get(record.sha256)
      if (prior) {
        findings.push({
          id: `duplicate-${record.id}`,
          type: 'DUPLICATE_RECORD',
          severity: 'info',
          description: `Record appears to duplicate production record ${prior} by SHA-256.`,
          recordIds: [prior, record.id],
        })
      } else {
        seenHashes.set(record.sha256, record.id)
      }
    }

    if (record.text && REFERENCE_PATTERNS.test(record.text) && REDACTION_PATTERNS.test(record.text)) {
      findings.push({
        id: `redaction-${record.id}`,
        type: 'UNEXPLAINED_REDACTION',
        severity: 'warning',
        description: `Record ${record.filename} contains language indicating withholding or redaction; the production should be reviewed for the stated basis.`,
        recordIds: [record.id],
      })
    }
  }

  return {
    recordsReviewed: records.length,
    findings,
    coveredCategoryIds,
    missingCategoryIds: requested
      .filter((category) => !coveredCategoryIds.includes(category.id))
      .map((category) => category.id),
  }
}
