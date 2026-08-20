import { NextResponse } from 'next/server'
import { getRequestStateRepository } from '../../../../src/runtime'
import { verifyFulfillmentWebhook, type FulfillmentWebhook } from '../../../../src/fulfillment-webhook'
import type { RequestState } from '../../../../src/request-repository'

function processEnv(name: string): string {
  return typeof process !== 'undefined' ? process.env[name] ?? '' : ''
}

function targetState(event: FulfillmentWebhook): { from: RequestState; to: RequestState } | null {
  switch (event.status) {
    case 'delivered': return { from: 'tracking', to: 'completed' }
    case 'failed':
    case 'returned': return { from: 'tracking', to: 'failed' }
    default: return null
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-mailmypdf-signature') ?? ''
  const secret = processEnv('MAILMYPDF_WEBHOOK_SECRET')

  if (!secret) return NextResponse.json({ ok: false, error: 'webhook_secret_not_configured' }, { status: 503 })
  if (!(await verifyFulfillmentWebhook(secret, rawBody, signature))) {
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 })
  }

  let event: FulfillmentWebhook
  try {
    event = JSON.parse(rawBody) as FulfillmentWebhook
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  if (!event.eventId || !event.requestId || !event.status) {
    return NextResponse.json({ ok: false, error: 'invalid_event' }, { status: 422 })
  }

  const repository = getRequestStateRepository()
  if (!repository) return NextResponse.json({ ok: false, error: 'persistence_not_configured' }, { status: 503 })

  try {
    await repository.recordFulfillmentEvent({
      requestId: event.requestId,
      eventType: 'mailmypdf_webhook',
      actor: event.eventId,
      payload: event as unknown as Record<string, unknown>,
    })

    const transition = targetState(event)
    if (transition) {
      const requestState = await repository.getRequest(event.requestId)
      if (!requestState) return NextResponse.json({ ok: false, error: 'request_not_found' }, { status: 404 })
      if (requestState.status !== transition.from) {
        return NextResponse.json({ ok: true, ignored: true, reason: `request_already_${requestState.status}`, requestId: event.requestId })
      }
      const updated = await repository.transition(event.requestId, transition.from, transition.to, event.eventId)
      return NextResponse.json({ ok: true, request: updated })
    }

    return NextResponse.json({ ok: true, recorded: true, requestId: event.requestId })
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'webhook_processing_failed', message: error instanceof Error ? error.message : String(error) }, { status: 409 })
  }
}
