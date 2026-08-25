import { NextResponse } from 'next/server'
import { getApprovalPrincipal } from '../../../../../src/authorization-runtime'
import { getRequestStateRepositoryAsync } from '../../../../../src/runtime'
import { validateCreateRequest } from '../../../../../src/request-service'
import { getRecordsWorkflow } from '../../../../../src/workflows/registry'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const principal = await getApprovalPrincipal()
  if (!principal) return NextResponse.json({ ok: false, error: 'authentication_required' }, { status: 401 })

  const { slug } = await context.params
  const workflow = getRecordsWorkflow(slug)
  if (!workflow) return NextResponse.json({ ok: false, error: 'workflow_not_found', slug }, { status: 404 })

  let input: unknown
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  if (!input || typeof input !== 'object') return NextResponse.json({ ok: false, error: 'workflow_input_required' }, { status: 422 })
  const built = workflow.request.build(input as Record<string, unknown>)
  const generic = validateCreateRequest(built)
  if (!generic.ok) return NextResponse.json({ ok: false, stage: 'generic_validation', issues: generic.issues }, { status: 422 })

  const workflowIssues = workflow.validateRequest(generic.value)
  if (workflowIssues.length) return NextResponse.json({ ok: false, stage: 'workflow_validation', issues: workflowIssues }, { status: 422 })

  const repository = await getRequestStateRepositoryAsync()
  if (!repository) return NextResponse.json({ ok: false, error: 'persistence_not_configured' }, { status: 503 })

  try {
    const created = await repository.createRequest(generic.value, principal.subject)
    const record = await repository.getRequest(created.id)
    return NextResponse.json({ ok: true, workflow: workflow.id, request: record }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'workflow_request_creation_failed', message: error instanceof Error ? error.message : String(error) }, { status: 409 })
  }
}
