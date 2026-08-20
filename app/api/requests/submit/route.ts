import { NextResponse } from 'next/server'
import { getRequestStateRepository } from '../../../../src/runtime'
import { getMailMyPDFFulfillment } from '../../../../src/fulfillment-runtime'
import type { FulfillmentRequest } from '../../../../src/fulfillment'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Request body must be valid JSON' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'Request body must be an object' }, { status: 422 })
  }

  const value = body as Record<string, unknown>
  const id = typeof value.id === 'string' ? value.id.trim() : ''
  const actor = typeof value.actor === 'string' ? value.actor.trim() : ''
  const fulfillment = value.fulfillment as Partial<FulfillmentRequest> | undefined

  if (!id) return NextResponse.json({ ok: false, error: 'Request id is required' }, { status: 422 })
  if (!actor) return NextResponse.json({ ok: false, error: 'Submitting actor is required' }, { status: 422 })
  if (!fulfillment?.recipient || !fulfillment.document) {
    return NextResponse.json({ ok: false, error: 'Approved submission requires recipient and document data' }, { status: 422 })
  }

  const repository = getRequestStateRepository()
  if (!repository) {
    return NextResponse.json({
      ok: false,
      error: 'persistence_not_configured',
      message: 'D1 is not injected into this runtime. Submission remains blocked.',
      requestId: id,
    }, { status: 503 })
  }

  const provider = getMailMyPDFFulfillment()
  if (!provider) {
    return NextResponse.json({
      ok: false,
      error: 'fulfillment_not_configured',
      message: 'An authenticated MailMyPDF fulfillment adapter is not installed.',
      requestId: id,
    }, { status: 503 })
  }

  try {
    await repository.transition(id, 'approved', 'queued', actor)
    const result = await provider.submit({
      ...(fulfillment as FulfillmentRequest),
      requestId: id,
    })
    await repository.transition(id, 'queued', 'submitted', actor)
    const tracking = await repository.transition(id, 'submitted', 'tracking', actor)

    return NextResponse.json({ ok: true, request: tracking, fulfillment: result })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: 'submission_failed',
      message: error instanceof Error ? error.message : String(error),
      requestId: id,
    }, { status: 409 })
  }
}
