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
    error: 'fulfillment_not_configured',
    message: 'Submission is blocked until durable state and an authenticated MailMyPDF fulfillment adapter are configured.',
    requestId: id,
  }, { status: 503 })
}
