import { describe, expect, it } from 'vitest'
import { executeWithMultipleLlmProviders, type LlmProvider } from './multi-llm'

const provider = (id: string, output: string, confidence = 0.8): LlmProvider => ({
  id,
  async execute() {
    return { provider: id, model: `${id}-model`, output, confidence, warnings: [] }
  },
})

describe('multi-LLM orchestration', () => {
  it('uses consensus and retains every provider result', async () => {
    const result = await executeWithMultipleLlmProviders(
      [provider('provider-a', 'same'), provider('provider-b', 'same'), provider('provider-c', 'different')],
      { id: 'task', input: 'record', outputSchema: 'string' },
    )

    expect(result.selected.output).toBe('same')
    expect(result.candidates).toHaveLength(3)
    expect(result.agreement).toBeCloseTo(2 / 3)
    expect(result.warnings).toContain('LLM providers disagreed across 2 distinct outputs')
  })

  it('fails closed when fewer than the minimum providers succeed', async () => {
    const failing: LlmProvider = {
      id: 'failed',
      async execute() { throw new Error('provider unavailable') },
    }

    await expect(executeWithMultipleLlmProviders(
      [failing],
      { id: 'task', input: 'record', outputSchema: 'string' },
      { minProviders: 2 },
    )).rejects.toThrow('Insufficient LLM providers succeeded')
  })

  it('supports an explicit consensus quorum', async () => {
    const result = await executeWithMultipleLlmProviders(
      [provider('a', 'one'), provider('b', 'two')],
      { id: 'task', input: 'record', outputSchema: 'string' },
      { quorum: 0.75 },
    )

    expect(result.agreement).toBe(0.5)
    expect(result.warnings).toContain('LLM consensus below required quorum: 0.50 < 0.75')
  })
})
