import type { ProductionFinding } from './code-enforcement-analysis'

export type CodeEnforcementSearchTarget = {
  system: string
  custodian: string
  searchTerms: string[]
  identifiers: string[]
  rationale: string
  confidence: 'high' | 'medium' | 'low'
}

export type CodeEnforcementFollowUp = {
  findingId: string
  priority: 'critical' | 'high' | 'normal'
  category?: string
  requestLanguage: string
  reason: string
  searchTargets: CodeEnforcementSearchTarget[]
}

const TARGETS: Record<string, { system: string; custodian: string; terms: string[]; rationale: string }> = {
  MISSING_REQUESTED_CATEGORY: { system: 'code-enforcement case management system', custodian: 'code enforcement / neighborhood services records custodian', terms: ['case number', 'property address', 'parcel/APN', 'violation number'], rationale: 'A requested category is absent, so the matter index and case-management repository should be searched using every stable matter identifier.' },
  REFERENCED_RECORD_NOT_PRODUCED: { system: 'code-enforcement case file and document repository', custodian: 'code enforcement records custodian', terms: ['case number', 'document title', 'referenced record date'], rationale: 'A produced record points to another record that was not located; the referenced document should be searched directly and reconciled to the source record.' },
  MISSING_ATTACHMENT: { system: 'inspection/document repository and field-media system', custodian: 'inspection/code enforcement records custodian', terms: ['inspection date', 'case number', 'property address', 'attachment/exhibit name'], rationale: 'The production references supporting media or an attachment, so both the case document repository and field-media store should be checked.' },
  IDENTIFIER_MISMATCH: { system: 'case index / parcel and property records', custodian: 'code enforcement records custodian with parcel/property records access', terms: ['all case numbers', 'all APNs', 'all address variants', 'violation number'], rationale: 'Conflicting identifiers can indicate merged matters, transferred cases, address normalization, or records belonging to different files; reconcile them before concluding the production is complete.' },
  DATE_GAP: { system: 'case activity log and inspection/reinspection systems', custodian: 'code enforcement records custodian', terms: ['date immediately before gap', 'date immediately after gap', 'case number', 'property address'], rationale: 'A chronology gap should be checked against activity logs, inspections, correspondence, and status history before being treated as inactivity.' },
  UNEXPLAINED_REDACTION: { system: 'withholding/redaction log and source repository', custodian: 'records custodian / legal review contact', terms: ['record identifier', 'withholding basis', 'redaction log entry'], rationale: 'A redaction indicator requires reconciliation to the withholding log and the underlying responsive record; the workflow should not infer a legal basis that is not documented.' },
  PARTIAL_PRODUCTION: { system: 'case management and document repository', custodian: 'code enforcement records custodian', terms: ['case number', 'property address', 'missing category'], rationale: 'A partial production should be checked against the authoritative case index and repository inventory.' },
  UNRESPONSIVE_ITEM: { system: 'records request tracking and custodian work queue', custodian: 'records request coordinator / assigned custodian', terms: ['original request item', 'request date', 'matter identifiers'], rationale: 'An unanswered item should be traced to the assigned custodian and request-tracking record.' },
  PRODUCTION_AMBIGUITY: { system: 'case index and document inventory', custodian: 'records custodian', terms: ['filename', 'case number', 'property address'], rationale: 'Ambiguous production metadata should be reconciled against the authoritative index before relying on category matching.' },
}

export function buildCodeEnforcementSearchTargets(input: {
  finding: ProductionFinding
  identifiers: { caseNumbers: string[]; parcelNumbers: string[]; addresses: string[] }
  department?: string
  agency?: string
}): CodeEnforcementSearchTarget[] {
  const target = TARGETS[input.finding.type]
  if (!target) return []
  const identifiers = [...new Set([...input.identifiers.caseNumbers, ...input.identifiers.parcelNumbers, ...input.identifiers.addresses, ...(input.finding.recordIds ?? [])])]
  return [{ system: target.system, custodian: input.department || target.custodian, searchTerms: target.terms, identifiers, rationale: `${target.rationale}${input.agency ? ` Agency: ${input.agency}.` : ''}`, confidence: input.finding.type === 'IDENTIFIER_MISMATCH' || input.finding.type === 'MISSING_ATTACHMENT' ? 'high' : 'medium' }]
}

export function buildCodeEnforcementFollowUps(input: {
  findings: readonly ProductionFinding[]
  identifiers: { caseNumbers: string[]; parcelNumbers: string[]; addresses: string[] }
  department?: string
  agency?: string
}): CodeEnforcementFollowUp[] {
  return input.findings.filter((finding) => finding.severity !== 'info').map((finding) => {
    const searchTargets = buildCodeEnforcementSearchTargets({ finding, identifiers: input.identifiers, department: input.department, agency: input.agency })
    const label = finding.requestedCategoryId ? ` requested category “${finding.requestedCategoryId}”` : ''
    const priority = finding.severity === 'critical' ? 'critical' : 'high'
    return {
      findingId: finding.id,
      priority,
      category: finding.requestedCategoryId,
      requestLanguage: `Please provide the responsive records${label} identified by the matter identifiers already supplied. If the records are maintained in a separate system or by another custodian, please search that system or route this item to the appropriate custodian. If the referenced record or attachment does not exist, please state that explicitly and identify the relevant record index or withholding basis, if any.`,
      reason: finding.description,
      searchTargets,
    }
  })
}
