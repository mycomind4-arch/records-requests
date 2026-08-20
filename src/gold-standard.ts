export const RECORDS_GOLD_STAGES = [
  'discover',
  'draft',
  'validate',
  'send',
  'track',
  'follow-up',
  'receive',
  'organize',
  'analyze',
  'escalate',
  'preserve',
] as const

export type RecordsGoldStage = (typeof RECORDS_GOLD_STAGES)[number]
export type RecordsGoldStatus = 'completed' | 'blocked' | 'failed'

export type RecordsGoldStageResult = {
  stage: RecordsGoldStage
  status: 'passed' | 'blocked' | 'failed'
  messages: string[]
}

export type RecordsGoldDependencies = Record<RecordsGoldStage, () => Promise<boolean>>

export async function runRecordsGoldWorkflow(
  dependencies: RecordsGoldDependencies,
) {
  const stages: RecordsGoldStageResult[] = []

  for (const stage of RECORDS_GOLD_STAGES) {
    try {
      const passed = await dependencies[stage]()
      stages.push({
        stage,
        status: passed ? 'passed' : 'blocked',
        messages: passed ? [] : [`${stage} gate did not pass`],
      })
      if (!passed) return { status: 'blocked' as const, stages }
    } catch (error) {
      stages.push({
        stage,
        status: 'failed',
        messages: [error instanceof Error ? error.message : String(error)],
      })
      return { status: 'failed' as const, stages }
    }
  }

  return { status: 'completed' as const, stages }
}

export function isRecordsGoldResult(
  result: { status: RecordsGoldStatus; stages: readonly RecordsGoldStageResult[] },
): boolean {
  return result.status === 'completed'
    && RECORDS_GOLD_STAGES.every((stage) =>
      result.stages.some((candidate) => candidate.stage === stage && candidate.status === 'passed'),
    )
}

export function hasRecordsPreSendGate(
  result: { stages: readonly RecordsGoldStageResult[] },
): boolean {
  const required = ['discover', 'draft', 'validate'] as const
  return required.every((stage) =>
    result.stages.some((candidate) => candidate.stage === stage && candidate.status === 'passed'),
  )
}
