import { NextResponse } from 'next/server'
import { getRequestStateRepositoryAsync } from '../../../../src/runtime'
import { canApproveWithRole, getApprovalPrincipal } from '../../../../src/authorization-runtime'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Request body must be valid JSON' }, { status: 400 })
  }

  const id = body && typeof body === 'object' && typeof (body as Record<string, unknown>).id === 'string'
    ? String((body as Record<string, unknown>).id).trim()
    : ''
  if (!id) return NextResponse.json({ ok: false, error: 'Request id is required' }, { status: 422 })

  const repository = await getRequestStateRepositoryAsync()
  if (!repository) return NextResponse.json({ ok: false, error: 'persistence_not_configured' }, { status: 503 })

  const principal = await getApprovalPrincipal()
  if (!principal) return NextResponse.json({ ok: false, error: 'approval_auth_not_configured' }, { status: 503 })
  if (!canApproveWithRole(principal)) return NextResponse.json({ ok: false, error: 'approval_forbidden' }, { status: 403 })

  const requestRecord = await repository.getRequest(id)
  if (!requestRecord) return NextResponse.json({ ok: false, error: 'request_not_found' }, { status: 404 })
  if (requestRecord.ownerId !== principal.subject && !principal.roles.includes('admin')) {
    return NextResponse.json({ ok: false, error: 'approval_forbidden' }, { status: 403 })
  }

  try {
    const approved = await repository.transition(id, 'review', 'approved', principal.subject)
    return NextResponse.json({ ok: true, request: approved, approvedBy: principal.subject })
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'approval_failed', message: error instanceof Error ? error.message : String(error), requestId: id }, { status: 409 })
  }
}
