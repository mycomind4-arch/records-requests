import { NextResponse } from 'next/server'

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

  return NextResponse.json({
    ok: false,
    error: 'approval_persistence_not_configured',
    message: 'Approval is an explicit lifecycle stage. Connect RequestStateRepository before a request can be durably approved.',
    requestId: id,
  }, { status: 503 })
}
