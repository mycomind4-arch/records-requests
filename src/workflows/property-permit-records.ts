import type { ValidatedRequest } from '../request-service'
import { createRecordsWorkflow, type RecordsWorkflow } from '../workflow-factory'
import type { RecordsDomainCapability } from './domain-pack'

export const PROPERTY_PERMIT_RECORD_CATEGORIES = [
  'building-permits','permit-applications','inspection-records','approved-plans','site-plans','plan-review-comments','correction-notices','certificate-of-occupancy','permit-history','correspondence-and-notes',
] as const

export const PROPERTY_PERMIT_CAPABILITIES: readonly RecordsDomainCapability[] = ['classification','extraction','deadline','contradiction','findings','evidence','research','risk','strategy','draft','draftProvenance','validation','review','approval','mailing','tracking','proofAudit']

export const PROPERTY_PERMIT_INTAKE = [
  { id:'agency', label:'Agency / jurisdiction', required:true, helpText:'City, county, or other permitting authority.' },
  { id:'department', label:'Likely department / custodian', helpText:'Building, planning, permits, inspections, or records unit.' },
  { id:'address', label:'Property address', helpText:'Street address or other site identifier.' },
  { id:'parcelNumber', label:'Parcel / APN', helpText:'Parcel, APN, property ID, or assessor identifier when known.' },
  { id:'permitNumber', label:'Permit number', helpText:'Permit or application number when known.' },
  { id:'owner', label:'Owner / applicant', helpText:'Owner, applicant, contractor, architect, or other associated party.' },
  { id:'dateStart', label:'Record start date', required:true, helpText:'Beginning of the requested record period.' },
  { id:'dateEnd', label:'Record end date', required:true, helpText:'End of the requested record period.' },
  { id:'projectDescription', label:'Project / subject matter', required:true, helpText:'Plain-English description of the construction, alteration, occupancy, or permit matter.' },
] as const

function text(input: Record<string, unknown>, key: string): string | undefined {
  const raw = input[key]
  if (typeof raw !== 'string') return undefined
  const value = raw.trim()
  return value || undefined
}

function categories(input: Record<string, unknown>): string[] {
  const raw = input.categories
  if (!Array.isArray(raw)) return [...PROPERTY_PERMIT_RECORD_CATEGORIES]
  const known = new Set(PROPERTY_PERMIT_RECORD_CATEGORIES)
  const selected = raw.filter((entry): entry is string => typeof entry === 'string' && known.has(entry as typeof PROPERTY_PERMIT_RECORD_CATEGORIES[number]))
  return selected.length ? selected : [...PROPERTY_PERMIT_RECORD_CATEGORIES]
}

function describe(category: string, input: Record<string, unknown>): string {
  const identifiers = [
    text(input,'permitNumber') && `permit number ${text(input,'permitNumber')}`,
    text(input,'address') && `property address ${text(input,'address')}`,
    text(input,'parcelNumber') && `parcel/APN ${text(input,'parcelNumber')}`,
    text(input,'owner') && `owner/applicant ${text(input,'owner')}`,
  ].filter(Boolean)
  const dates = text(input,'dateStart') && text(input,'dateEnd') ? ` Cover ${text(input,'dateStart')} through ${text(input,'dateEnd')}.` : ''
  const scope = identifiers.length ? ` Search using these identifiers: ${identifiers.join('; ')}.` : ''
  const project = text(input,'projectDescription') ? ` The project concerns: ${text(input,'projectDescription')}.` : ''
  const descriptions: Record<string,string> = {
    'building-permits': `Building permits, issued permits, permit revisions, and final permit records associated with the identified property or project.${scope}${dates}`,
    'permit-applications': `Permit applications, intake records, applicant submissions, and application metadata associated with the identified property or project.${scope}${dates}`,
    'inspection-records': `Inspection requests, inspection reports, inspection results, reinspection records, and related field notes.${scope}${dates}`,
    'approved-plans': `Approved construction plans, drawings, specifications, plan sets, and revisions retained by the agency.${scope}${dates}`,
    'site-plans': `Site plans, plot plans, grading/site documentation, and related approved exhibits.${scope}${dates}`,
    'plan-review-comments': `Plan review comments, correction cycles, review notes, deficiency lists, and responses.${scope}${dates}`,
    'correction-notices': `Correction notices, deficiency notices, stop-work or compliance notices, and related enforcement correspondence.${scope}${dates}`,
    'certificate-of-occupancy': `Certificates of occupancy, temporary occupancy records, final approvals, and related issuance records.${scope}${dates}`,
    'permit-history': `Permit history and status records showing applications, issuance, revisions, inspections, expiration, finalization, and closure.${scope}${dates}`,
    'correspondence-and-notes': `Correspondence, emails, case notes, referrals, and documented communications concerning the property or permit matter.${scope}${dates}`,
  }
  return `${descriptions[category] ?? `Records concerning ${category}.${scope}${dates}`}${project}`
}

function validatePropertyPermit(request: ValidatedRequest): readonly {field:string; message:string}[] {
  const issues: {field:string; message:string}[] = []
  const descriptions = request.items.map((item) => item.description.toLowerCase()).join(' ')
  if (!descriptions.includes('property address') && !descriptions.includes('permit number') && !descriptions.includes('parcel/apn')) {
    issues.push({ field:'identifiers', message:'Provide a property address, parcel/APN, or permit number so the agency can identify the correct project or property.' })
  }
  if (!descriptions.includes('project concerns')) issues.push({ field:'projectDescription', message:'Describe the project, construction, alteration, occupancy, or permit matter.' })
  return issues
}

export function buildPropertyPermitRecordsRequest(input: Record<string, unknown>) {
  const address = text(input,'address')
  const permitNumber = text(input,'permitNumber')
  const subject = text(input,'projectDescription')
  const start = text(input,'dateStart')
  const end = text(input,'dateEnd')
  const selected = categories(input)
  return {
    title:`Property & Permit Records — ${permitNumber ?? address ?? subject ?? 'Property'}`,
    agency:text(input,'agency') ?? '',
    jurisdiction:text(input,'jurisdiction'),
    purpose:text(input,'purpose') ?? 'Identify and document the permitting, inspection, plan-review, approval, and occupancy records associated with the specified property or project.',
    scope:JSON.stringify({ workflow:'property-permit-records', address, parcelNumber:text(input,'parcelNumber'), permitNumber, owner:text(input,'owner'), department:text(input,'department'), dateStart:start, dateEnd:end, projectDescription:subject }),
    items:selected.map((category) => ({ category, description:describe(category,input), dateStart:start, dateEnd:end, custodian:text(input,'department'), systemHint:category==='inspection-records'?'inspection / permit management system':category==='approved-plans'?'plan review / document management system':undefined, format:category==='approved-plans'||category==='site-plans'?'native digital files or original plan format where available':undefined })),
  }
}

export const PROPERTY_PERMIT_FINDINGS = ['MISSING_REQUESTED_CATEGORY','REFERENCED_RECORD_NOT_PRODUCED','PROPERTY_IDENTIFIER_MISMATCH','PERMIT_IDENTIFIER_MISMATCH','DATE_GAP','DUPLICATE_RECORD','MISSING_ATTACHMENT','UNEXPLAINED_WITHHOLDING','REDACTION_REVIEW','PARTIAL_PRODUCTION','UNRESPONSIVE_ITEM'] as const

export const propertyPermitRecordsWorkflow: RecordsWorkflow = createRecordsWorkflow({
  id:'property-permit-records',
  name:'Property & Permit Records Request',
  description:'Build a targeted property and permit records request covering permits, applications, inspections, approved plans, plan review, occupancy, history, and related correspondence.',
  searchIntent:'property permit records request',
  seo:{ title:'Property Permit Records Request — Permits, Inspections & Plans', description:'Build a targeted property permit records request using an address, parcel/APN, permit number, owner, project, and date range.', canonicalPath:'/workflows/property-permit-records' },
  intakeVersion:'1.0.0',
  intake:PROPERTY_PERMIT_INTAKE,
  capabilities:PROPERTY_PERMIT_CAPABILITIES,
  request:{ categories:PROPERTY_PERMIT_RECORD_CATEGORIES, build:buildPropertyPermitRecordsRequest },
  validate:validatePropertyPermit,
  responseAnalysis:{ findingTypes:PROPERTY_PERMIT_FINDINGS, async analyze(input:unknown){ if (!input || typeof input !== 'object') throw new Error('PROPERTY_PERMIT_PRODUCTION_ANALYSIS_INPUT_INVALID'); return { status:'analysis-ready', input } } },
})
