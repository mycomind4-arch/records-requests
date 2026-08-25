export const BUILDING_PERMIT_CATEGORIES = ['permit-file','applications-and-plans','inspections','correction-notices','certificates-of-occupancy','contractors-and-applicants','permit-fees-and-status','amendments-and-revisions','inspection-media','related-property-records'] as const
export type BuildingPermitCategory = typeof BUILDING_PERMIT_CATEGORIES[number]
export type BuildingPermitRecord = { id:string; filename:string; category:string; text?:string; date?:string }
export type BuildingPermitFinding = { type:string; severity:'info'|'warning'|'high'; message:string; recordIds:string[] }
export type BuildingPermitAnalysis = { recordsReviewed:number; findings:BuildingPermitFinding[]; coveredCategoryIds:string[]; missingCategoryIds:string[]; identifierReconciliation:{permitNumbers:string[];applicationNumbers:string[];parcelNumbers:string[];addresses:string[];conflicts:string[]} }
const idPatterns = { permit:/\b(?:permit|bldg|bp)[-\s#:]*[A-Z0-9][A-Z0-9._/-]{2,}\b/gi, application:/\b(?:application|app)[-\s#:]*[A-Z0-9][A-Z0-9._/-]{2,}\b/gi, parcel:/\b(?:APN|parcel)\s*[-#:]*\s*[A-Z0-9._/-]{4,}\b/gi }
const extract = (text:string, pattern:RegExp) => [...text.matchAll(pattern)].map(m=>m[0].trim()).filter((v,i,a)=>a.indexOf(v)===i)
export function analyzeBuildingPermitProduction(requested: readonly {id:string;label:string}[], records: readonly BuildingPermitRecord[]): BuildingPermitAnalysis {
  const covered = [...new Set(records.map(r=>r.category))]
  const missing = requested.map(r=>r.id).filter(id=>!covered.includes(id))
  const findings:BuildingPermitFinding[] = missing.map(id=>({type:'MISSING_REQUESTED_CATEGORY',severity:'warning',message:`No produced records were classified under requested category ${id}.`,recordIds:[]}))
  const permitNumbers:string[]=[]; const applicationNumbers:string[]=[]; const parcelNumbers:string[]=[]; const addresses:string[]=[]
  for(const r of records){ const text=r.text??''; permitNumbers.push(...extract(text,idPatterns.permit)); applicationNumbers.push(...extract(text,idPatterns.application)); parcelNumbers.push(...extract(text,idPatterns.parcel)); const address=text.match(/\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){1,5}\b/g)??[]; addresses.push(...address.slice(0,10)) }
  const uniq=(a:string[])=>[...new Set(a)]
  const conflicts:string[]=[]
  if(uniq(permitNumbers).length>1) conflicts.push('Multiple permit identifiers were found; confirm whether they represent revisions, related permits, or conflicting records.')
  if(uniq(applicationNumbers).length>1) conflicts.push('Multiple application identifiers were found; reconcile applications and amendments.')
  if(uniq(parcelNumbers).length>1) conflicts.push('Multiple parcel identifiers were found; reconcile the property identity before treating records as one permit matter.')
  if(conflicts.length) findings.push({type:'IDENTIFIER_MISMATCH',severity:'high',message:conflicts.join(' '),recordIds:records.map(r=>r.id)})
  for(const r of records){ const text=(r.text??'').toLowerCase(); if(/see attached|attached (plans|photos|documents)|see exhibit|enclosed/i.test(text) && !records.some(x=>x.id!==r.id && /attachment|exhibit|plan|photo|drawing/i.test(x.category))) findings.push({type:'REFERENCED_RECORD_NOT_PRODUCED',severity:'warning',message:`${r.filename} appears to reference an attachment, exhibit, plan, or photograph that was not separately identified in the production.`,recordIds:[r.id]}) }
  return {recordsReviewed:records.length,findings,coveredCategoryIds:covered,missingCategoryIds:missing,identifierReconciliation:{permitNumbers:uniq(permitNumbers),applicationNumbers:uniq(applicationNumbers),parcelNumbers:uniq(parcelNumbers),addresses:uniq(addresses),conflicts}}
}
