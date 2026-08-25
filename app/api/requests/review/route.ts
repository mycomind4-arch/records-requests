import { NextResponse } from 'next/server'
import { getRequestStateRepositoryAsync } from '../../../../src/runtime'
import { getApprovalPrincipal } from '../../../../src/authorization-runtime'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const principal = await getApprovalPrincipal()
  if (!principal) return NextResponse.json({ ok: false, error: 'authentication_required' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const id = body && typeof body === 'object' && typeof (body as Record<string, unknown>).id === 'string'
    ? String((body as Record<string, unknown>).id).trim()
    : ''
  if (!id) return NextResponse.json({ ok: false, error: 'request_id_required' }, { status: 422 })

  const repository = await getRequestStateRepositoryAsync()
  if (!repository) return NextResponse.json({ ok: false, error: 'persistence_not_configured' }, { status: 503 })

  const record = await repository.getRequest(id)
  if (!record) return NextResponse.json({ ok: false, error: 'request_not_found' }, { status: 404 })
  if (record.ownerId !== principal.subject) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  try {
    const reviewed = await repository.transition(id, 'validated', 'review', principal.subject)
    return NextResponse.json({ ok: true, request: reviewed })
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'review_failed', message: error instanceof Error ? error.message : String(error) }, { status: 409 })
  }
}
