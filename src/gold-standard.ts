export type RecordsGoldStage =
  | 'discover'
  | 'draft'
  | 'validate'
  | 'send'
  | 'track'
  | 'follow-up'
  | 'receive'
  | 'organize'
  | 'analyze'
  | 'escalate'
  | 'preserve'

export type RecordsGoldDependencies = Record<RecordsGoldStage, () => Promise<boolean>>

export async function runRecordsGoldWorkflow(dependencies: RecordsGoldDependencies) {
  const stages: { stage: RecordsGoldStage; status: 'passed' | 'blocked' | 'failed'; messages: string[] }[] = []
  const ordered: RecordsGoldStage[] = [
    'discover', 'draft', 'validate', 'send', 'track', 'follow-up',
    'receive', 'organize', 'analyze', 'escalate', 'preserve',
  ]

  for (const stage of ordered) {
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
