import type { CreateRequestInput, ValidatedRequest } from './request-service'

export type WorkflowField = {
  id: string
  label: string
  required?: boolean
  helpText?: string
}

export type WorkflowPolicy = {
  jurisdiction: string
  version: string
  rules: Record<string, unknown>
}

export type RecordsWorkflowDefinition = {
  id: string
  name: string
  description: string
  searchIntent: string
  seo: {
    title: string
    description: string
    canonicalPath: string
  }
  intake: readonly WorkflowField[]
  request: {
    categories: readonly string[]
    build(input: Record<string, unknown>): CreateRequestInput
  }
  validate?: (request: ValidatedRequest) => readonly { field: string; message: string }[]
  policies?: readonly WorkflowPolicy[]
  responseAnalysis?: {
    findingTypes: readonly string[]
    analyze: (input: unknown) => Promise<unknown>
  }
}

export type RecordsWorkflow = RecordsWorkflowDefinition & {
  readonly contractVersion: 1
  validateRequest(request: ValidatedRequest): readonly { field: string; message: string }[]
}

export function createRecordsWorkflow(definition: RecordsWorkflowDefinition): RecordsWorkflow {
  if (!definition.id.trim()) throw new Error('Workflow id is required')
  if (!definition.name.trim()) throw new Error('Workflow name is required')
  if (!definition.request.categories.length) throw new Error(`Workflow ${definition.id} must define record categories`)
  if (!definition.seo.canonicalPath.startsWith('/workflows/')) {
    throw new Error(`Workflow ${definition.id} canonicalPath must be under /workflows/`)
  }

  const ids = new Set<string>()
  for (const field of definition.intake) {
    if (!field.id.trim() || ids.has(field.id)) throw new Error(`Workflow ${definition.id} has duplicate intake field: ${field.id}`)
    ids.add(field.id)
  }

  return {
    ...definition,
    contractVersion: 1,
    validateRequest(request) {
      return definition.validate?.(request) ?? []
    },
  }
}
