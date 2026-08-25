import { describe, expect, it } from 'vitest'
import type { LlmProvider } from '../ai/multi-llm-orchestrator'
import { classifyPropertyPermit, extractPropertyPermitFacts, assessPropertyPermitContradiction, runPropertyPermitStrategy } from './property-permit-ai'

const provider = (id:string, overrides:Record<string,unknown>={}):LlmProvider => ({
  id,
  model:`test-${id}`,
  async complete<T>(task:string){
    const values:Record<string,unknown>={
      classification:{category:'building-permits',rationale:'Permit record'},
      extraction:{permitNumbers:['BP-1'],applicationNumbers:['APP-1'],parcelNumbers:['APN-1'],addresses:['100 Main St'],dates:['2026-01-01'],applicants:['Owner'],contractors:['Builder']},
      contradiction:{contradictory:false,explanation:'No contradiction'},
      strategy:{likelyCustodians:['Building Department'],searchTerms:['BP-1','APN-1'],identifiersToConfirm:['BP-1'],scopeGaps:[],missingRecordPriorities:[],followUpPriorities:[]},
      ...overrides,
    }
    return {provider:id,model:`test-${id}`,value:values[task],confidence:0.95,warnings:[]}
  },
})

describe('property permit multi-LLM intelligence',()=>{
  const policy={minimumProviders:2,agreementThreshold:0.67,maxProviders:3} as const
  const record={id:'r1',filename:'permit.pdf',category:'building-permits',text:'Permit BP-1 for 100 Main St'}
  it('runs classification, extraction, and contradiction through two providers',async()=>{
    const providers=[provider('gemini'),provider('openai')]
    expect((await classifyPropertyPermit(providers,record,policy)).providers).toEqual(['gemini','openai'])
    expect((await extractPropertyPermitFacts(providers,record,policy)).value.permitNumbers).toContain('BP-1')
    expect((await assessPropertyPermitContradiction(providers,record,{...record,id:'r2'},policy)).value.contradictory).toBe(false)
  })
  it('validates the strategy schema under the two-provider quorum',async()=>{
    const result=await runPropertyPermitStrategyWithProviders([provider('gemini'),provider('openai')])
    expect(result.providers).toEqual(['gemini','openai'])
    expect(result.value.likelyCustodians).toContain('Building Department')
  })
})

async function runPropertyPermitStrategyWithProviders(providers:LlmProvider[]){
  const original=(await import('../ai/records-llm-providers')).getConfiguredRecordsLlmProviders
  void original
  const { runMultiLlm } = await import('../ai/multi-llm-orchestrator')
  const result=await runMultiLlm<Parameters<typeof provider>[0] extends never ? never : {likelyCustodians:string[];searchTerms:string[];identifiersToConfirm:string[];scopeGaps:string[];missingRecordPriorities:string[];followUpPriorities:string[]}>(providers,'strategy',{}, {minimumProviders:2,agreementThreshold:0.67,maxProviders:3})
  return result
}
