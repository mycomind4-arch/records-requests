import { NextResponse } from 'next/server'
import { getRequestStateRepositoryAsync } from '../../../../src/runtime'
import { getMailMyPDFFulfillment } from '../../../../src/fulfillment-runtime'
import { attestRecordsRequestPdf, type RecordsDocumentInput } from '../../../../src/records-document'
import type { FulfillmentRequest } from '../../../../src/fulfillment'
import { canApproveWithRole, getApprovalPrincipal } from '../../../../src/authorization-runtime'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

type SubmitBody = {
  id?: string
  sender?: { name?: string; address?: string }
  recipient: { name: string; address1: string; address2?: string; city: string; state: string; postalCode: string }
  subject?: string
  body?: string
  mailingClass?: 'certified' | 'registered' | 'first_class'
}

type RequestRepository = NonNullable<Awaited<ReturnType<typeof getRequestStateRepositoryAsync>>>

async function reconcileFailure(repository: RequestRepository, id: string, actor: string, error: unknown) {
  const current = await repository.getRequest(id)
  if (current?.status === 'queued') {
    try { await repository.transition(id, 'queued', 'failed', actor) } catch { /* A provider callback may have reconciled state concurrently. */ }
  }
  return error instanceof Error ? error.message : String(error)
}

export async function POST(request: Request) {
  let body: SubmitBody
  try { body = (await request.json()) as SubmitBody } catch { return NextResponse.json({ ok: false, error: 'Request body must be valid JSON' }, { status: 400 }) }

  const id = body.id?.trim() ?? ''
  if (!id) return NextResponse.json({ ok: false, error: 'Request id is required' }, { status: 422 })
  if (!body.recipient?.name || !body.recipient?.address1 || !body.recipient?.city || !body.recipient?.state || !body.recipient?.postalCode) {
    return NextResponse.json({ ok: false, error: 'Complete recipient (name, address1, city, state, postalCode) is required' }, { status: 422 })
  }

  const repository = await getRequestStateRepositoryAsync()
  if (!repository) return NextResponse.json({ ok: false, error: 'persistence_not_configured', requestId: id }, { status: 503 })

  const principal = await getApprovalPrincipal()
  if (!principal) return NextResponse.json({ ok: false, error: 'approval_auth_not_configured', requestId: id }, { status: 503 })
  if (!canApproveWithRole(principal)) return NextResponse.json({ ok: false, error: 'submission_forbidden', requestId: id }, { status: 403 })

  const actor = principal.subject
  const requestRecord = await repository.getRequest(id)
  if (!requestRecord) return NextResponse.json({ ok: false, error: 'Request not found', requestId: id }, { status: 404 })
  if (requestRecord.ownerId !== actor && !principal.roles.includes('admin')) return NextResponse.json({ ok: false, error: 'submission_forbidden', requestId: id }, { status: 403 })
  if (requestRecord.status !== 'approved') return NextResponse.json({ ok: false, error: `Request must be in 'approved' status, got '${requestRecord.status}'`, requestId: id }, { status: 409 })

  const recipientAddress = [body.recipient.address1, body.recipient.address2, `${body.recipient.city}, ${body.recipient.state} ${body.recipient.postalCode}`].filter(Boolean).join('\n')
  const documentInput: RecordsDocumentInput = {
    senderName: body.sender?.name ?? 'MailMyPDF Records',
    senderAddress: body.sender?.address ?? 'PO Box 123\nHumboldt, CA 95521',
    recipientName: body.recipient.name,
    recipientAddress,
    agency: requestRecord.agency,
    subject: body.subject ?? `Public Records Request: ${requestRecord.title}`,
    body: body.body ?? `This is a public records request submitted under applicable public records law.\n\nRequest: ${requestRecord.title}\nAgency: ${requestRecord.agency}${requestRecord.jurisdiction ? `\nJurisdiction: ${requestRecord.jurisdiction}` : ''}${requestRecord.purpose ? `\nPurpose: ${requestRecord.purpose}` : ''}`,
    requestId: id,
  }

  const { bytes, sha256 } = await attestRecordsRequestPdf(documentInput)
  await repository.recordFulfillmentEvent({ requestId: id, eventType: 'document_attested', actor, payload: { sha256, byteLength: bytes.byteLength, filename: 'records-request.pdf' } })

  const fulfillmentRequest: FulfillmentRequest = {
    requestId: id,
    idempotencyKey: `${id}:${sha256}`,
    recipient: body.recipient,
    document: { filename: 'records-request.pdf', contentBase64: Buffer.from(bytes).toString('base64') },
    mailingClass: body.mailingClass ?? 'certified',
  }

  const provider = getMailMyPDFFulfillment()
  if (!provider) return NextResponse.json({ ok: false, error: 'fulfillment_not_configured', requestId: id }, { status: 503 })

  try {
    await repository.transition(id, 'approved', 'queued', actor)
    const result = await provider.submit(fulfillmentRequest)
    const afterProvider = await repository.getRequest(id)
    if (afterProvider?.status === 'queued') await repository.transition(id, 'queued', 'submitted', actor)
    const afterSubmit = await repository.getRequest(id)
    if (afterSubmit?.status === 'submitted') await repository.transition(id, 'submitted', 'tracking', actor)

    await repository.recordFulfillmentEvent({
      requestId: id,
      eventType: 'fulfillment_submitted',
      actor,
      payload: { provider: result.provider, submissionId: result.submissionId, trackingNumber: result.trackingNumber, proofId: result.proofId, documentSha256: sha256, idempotencyKey: fulfillmentRequest.idempotencyKey },
    })

    return NextResponse.json({ ok: true, request: await repository.getRequest(id), fulfillment: result, documentSha256: sha256, submittedBy: principal.subject })
  } catch (error) {
    const message = await reconcileFailure(repository, id, actor, error)
    await repository.recordFulfillmentEvent({ requestId: id, eventType: 'fulfillment_failed', actor, payload: { error: message, documentSha256: sha256, idempotencyKey: fulfillmentRequest.idempotencyKey } })
    return NextResponse.json({ ok: false, error: 'submission_failed', message, requestId: id, documentSha256: sha256 }, { status: 409 })
  }
}
