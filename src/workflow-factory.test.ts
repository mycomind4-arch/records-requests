import { describe, expect, it } from 'vitest'
import { createRecordsWorkflow } from './workflow-factory'
import type { ValidatedRequest } from './request-service'

describe('records workflow factory', () => {
  const base = {
    id: 'code-enforcement-records',
    name: 'Code Enforcement Records',
    description: 'Request code enforcement records.',
    searchIntent: 'code enforcement records request',
    seo: {
      title: 'Code Enforcement Records Request',
      description: 'Build a targeted code enforcement records request.',
      canonicalPath: '/workflows/code-enforcement-records',
    },
    intake: [{ id: 'property', label: 'Property', required: true }],
    request: {
      categories: ['violations'],
      build: (_input: Record<string, unknown>) => ({ title: 'Code enforcement', agency: 'County', items: [{ category: 'violations', description: 'Violation records' }] }),
    },
  }

  it('creates a versioned workflow contract', () => {
    const workflow = createRecordsWorkflow(base)
    const validated = {
      ...base.request.build({}),
      normalizedTitle: 'Code enforcement',
      normalizedAgency: 'County',
    } satisfies ValidatedRequest
    expect(workflow.contractVersion).toBe(1)
    expect(workflow.validateRequest(validated)).toEqual([])
  })

  it('rejects invalid workflow definitions', () => {
    expect(() => createRecordsWorkflow({ ...base, id: '' })).toThrow()
    expect(() => createRecordsWorkflow({ ...base, request: { ...base.request, categories: [] } })).toThrow()
    expect(() => createRecordsWorkflow({ ...base, seo: { ...base.seo, canonicalPath: '/wrong' } })).toThrow()
  })
})
