import { NextResponse } from 'next/server'
import { getRequestStateRepository } from '../../../../src/runtime'

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
  const actor = body && typeof body === 'object' && typeof (body as Record<string, unknown>).actor === 'string'
    ? String((body as Record<string, unknown>).actor).trim()
    : ''

  if (!id) return NextResponse.json({ ok: false, error: 'Request id is required' }, { status: 422 })
  if (!actor) return NextResponse.json({ ok: false, error: 'Approving actor is required' }, { status: 422 })

  const repository = getRequestStateRepository()
  if (!repository) {
    return NextResponse.json({
      ok: false,
      error: 'persistence_not_configured',
      message: 'D1 is not injected into this runtime. Approval remains blocked until the deployment adapter installs the request database.',
      requestId: id,
    }, { status: 503 })
  }

  try {
    const requestRecord = await repository.transition(id, 'review', 'approved', actor)
    return NextResponse.json({ ok: true, request: requestRecord })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: 'approval_failed',
      message: error instanceof Error ? error.message : String(error),
      requestId: id,
    }, { status: 409 })
  }
}
