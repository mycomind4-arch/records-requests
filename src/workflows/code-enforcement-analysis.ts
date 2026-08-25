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

export type ExtractedProductionIdentifiers = {
  recordId: string
  caseNumbers: string[]
  parcelNumbers: string[]
  addresses: string[]
  dates: string[]
  people: string[]
}

export type IdentifierReconciliation = {
  caseNumbers: string[]
  parcelNumbers: string[]
  addresses: string[]
  conflicts: Array<{ field: 'caseNumbers' | 'parcelNumbers' | 'addresses'; values: string[]; recordIds: string[] }>
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
  identifierReconciliation: IdentifierReconciliation
  extractedIdentifiers: ExtractedProductionIdentifiers[]
}

const REFERENCE_PATTERNS = /(?:see|attached|enclosed|attachment|report|photo|photograph|exhibit|notice|citation|inspection)\b/i
const REDACTION_PATTERNS = /(?:redacted|withheld|exempt|privileged|confidential|blackout)/i
const CASE_PATTERNS = /\b(?:case|complaint|file|enforcement)[\s#:-]*(?:no\.?|number)?[\s#:-]*([A-Z]{0,6}[- ]?\d{2,}(?:[-/][A-Z0-9]+)*)\b/gi
const PARCEL_PATTERNS = /\b(?:APN|parcel(?: number| no\.?| #)?)[:\s#-]*([A-Z0-9][A-Z0-9 -]{3,})\b/gi
const ADDRESS_PATTERN = /\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,5}\s+(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Drive|Dr\.?|Lane|Ln\.?|Boulevard|Blvd\.?|Court|Ct\.?|Way|Place|Pl\.?|Circle|Cir\.?|Highway|Hwy\.?)\b/gi
const DATE_PATTERN = /\b(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4})\b/gi

function unique(values: string[]): string[] { return [...new Set(values.map((v) => v.trim()).filter(Boolean))] }
function matches(text: string, pattern: RegExp): string[] { return [...text.matchAll(pattern)].map((m) => (m[1] ?? m[0]).replace(/\s+/g, ' ').trim()) }

export function extractProductionIdentifiers(record: ProductionRecord): ExtractedProductionIdentifiers {
  const text = `${record.filename} ${record.text ?? ''}`
  return {
    recordId: record.id,
    caseNumbers: unique(matches(text, CASE_PATTERNS)),
    parcelNumbers: unique(matches(text, PARCEL_PATTERNS)),
    addresses: unique(matches(text, ADDRESS_PATTERN)),
    dates: unique(matches(text, DATE_PATTERN)),
    people: [],
  }
}

export function reconcileProductionIdentifiers(extracted: readonly ExtractedProductionIdentifiers[]): IdentifierReconciliation {
  const fields = ['caseNumbers', 'parcelNumbers', 'addresses'] as const
  const conflicts: IdentifierReconciliation['conflicts'] = []
  for (const field of fields) {
    const occurrences = extracted.filter((item) => item[field].length > 0)
    const values = unique(occurrences.flatMap((item) => item[field]))
    if (values.length > 1) conflicts.push({ field, values, recordIds: occurrences.map((item) => item.recordId) })
  }
  return {
    caseNumbers: unique(extracted.flatMap((item) => item.caseNumbers)),
    parcelNumbers: unique(extracted.flatMap((item) => item.parcelNumbers)),
    addresses: unique(extracted.flatMap((item) => item.addresses)),
    conflicts,
  }
}

export function analyzeCodeEnforcementProduction(
  requested: readonly RequestedCategory[],
  records: readonly ProductionRecord[],
): CodeEnforcementProductionAnalysis {
  const findings: ProductionFinding[] = []
  const coveredCategoryIds: string[] = []
  const extractedIdentifiers = records.map(extractProductionIdentifiers)
  const identifierReconciliation = reconcileProductionIdentifiers(extractedIdentifiers)

  for (const category of requested) {
    const matches = records.filter((record) => {
      const haystack = `${record.filename} ${record.category ?? ''} ${record.text ?? ''}`.toLowerCase()
      return category.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))
    })
    if (matches.length > 0) coveredCategoryIds.push(category.id)
    else findings.push({ id: `missing-${category.id}`, type: 'MISSING_REQUESTED_CATEGORY', severity: 'warning', description: `No produced record was matched to requested category: ${category.label}.`, recordIds: [], requestedCategoryId: category.id })
  }

  for (const conflict of identifierReconciliation.conflicts) {
    findings.push({ id: `identifier-${conflict.field}`, type: 'IDENTIFIER_MISMATCH', severity: 'critical', description: `Produced records contain multiple ${conflict.field} values: ${conflict.values.join(', ')}. Confirm which identifier controls the matter before treating the production as complete.`, recordIds: conflict.recordIds })
  }

  const seenHashes = new Map<string, string>()
  for (const record of records) {
    if (record.sha256) {
      const prior = seenHashes.get(record.sha256)
      if (prior) findings.push({ id: `duplicate-${record.id}`, type: 'DUPLICATE_RECORD', severity: 'info', description: `Record appears to duplicate production record ${prior} by SHA-256.`, recordIds: [prior, record.id])
      else seenHashes.set(record.sha256, record.id)
    }
    if (record.text && REFERENCE_PATTERNS.test(record.text) && REDACTION_PATTERNS.test(record.text)) findings.push({ id: `redaction-${record.id}`, type: 'UNEXPLAINED_REDACTION', severity: 'warning', description: `Record ${record.filename} contains language indicating withholding or redaction; review the stated basis and whether the underlying record is fully accounted for.`, recordIds: [record.id] })
  }

  return { recordsReviewed: records.length, findings, coveredCategoryIds, missingCategoryIds: requested.filter((category) => !coveredCategoryIds.includes(category.id)).map((category) => category.id), identifierReconciliation, extractedIdentifiers }
}
