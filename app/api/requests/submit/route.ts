import { NextResponse } from 'next/server'
import { getRequestStateRepository } from '../../../../src/runtime'
import { getMailMyPDFFulfillment } from '../../../../src/fulfillment-runtime'
import { attestRecordsRequestPdf, type RecordsDocumentInput } from '../../../../src/records-document'
import type { FulfillmentRequest } from '../../../../src/fulfillment'

export const runtime = 'edge'

type SubmitBody = {
  id?: string
  actor?: string
  sender?: { name?: string; address?: string }
  recipient: {
    name: string
    address1: string
    address2?: string
    city: string
    state: string
    postalCode: string
  }
  subject?: string
  body?: string
  mailingClass?: 'certified' | 'registered' | 'first_class'
}

export async function POST(request: Request) {
  let body: SubmitBody
  try {
    body = (await request.json()) as SubmitBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Request body must be valid JSON' }, { status: 400 })
  }

  const id = body.id?.trim() ?? ''
  const actor = body.actor?.trim() ?? ''

  if (!id) return NextResponse.json({ ok: false, error: 'Request id is required' }, { status: 422 })
  if (!actor) return NextResponse.json({ ok: false, error: 'Submitting actor is required' }, { status: 422 })
  if (!body.recipient?.name || !body.recipient?.address1 || !body.recipient?.city || !body.recipient?.state || !body.recipient?.postalCode) {
    return NextResponse.json({ ok: false, error: 'Complete recipient (name, address1, city, state, postalCode) is required' }, { status: 422 })
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

  // 1. Fetch the approved request record to build the document from it.
  const requestRecord = await repository.getRequest(id)
  if (!requestRecord) {
    return NextResponse.json({ ok: false, error: 'Request not found', requestId: id }, { status: 404 })
  }
  if (requestRecord.status !== 'approved') {
    return NextResponse.json({ ok: false, error: `Request must be in 'approved' status, got '${requestRecord.status}'`, requestId: id }, { status: 409 })
  }

  // 2. Build the PDF document input from the request record.
  const recipientAddress = [body.recipient.address1, body.recipient.address2, `${body.recipient.city}, ${body.recipient.state} ${body.recipient.postalCode}`]
    .filter(Boolean)
    .join('\n')

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

  // 3. Render and attest the PDF (SHA-256).
  const { bytes, sha256 } = await attestRecordsRequestPdf(documentInput)

  // 4. Record the attestation as an audit event.
  await repository.recordFulfillmentEvent({
    requestId: id,
    eventType: 'document_attested',
    actor,
    payload: { sha256, byteLength: bytes.byteLength, filename: 'records-request.pdf' },
  })

  // 5. Build the fulfillment request with only the attested PDF.
  const fulfillmentRequest: FulfillmentRequest = {
    requestId: id,
    recipient: body.recipient,
    document: {
      filename: 'records-request.pdf',
      contentBase64: Buffer.from(bytes).toString('base64'),
    },
    mailingClass: body.mailingClass ?? 'certified',
  }

  // 6. Submit to MailMyPDF fulfillment.
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
    const result = await provider.submit(fulfillmentRequest)
    await repository.transition(id, 'queued', 'submitted', actor)
    await repository.transition(id, 'submitted', 'tracking', actor)

    // 7. Record the fulfillment result with tracking/proof.
    await repository.recordFulfillmentEvent({
      requestId: id,
      eventType: 'fulfillment_submitted',
      actor,
      payload: {
        provider: result.provider,
        submissionId: result.submissionId,
        trackingNumber: result.trackingNumber,
        proofId: result.proofId,
        documentSha256: sha256,
      },
    })

    const updated = await repository.getRequest(id)
    return NextResponse.json({ ok: true, request: updated, fulfillment: result, documentSha256: sha256 })
  } catch (error) {
    // Record the failure.
    await repository.recordFulfillmentEvent({
      requestId: id,
      eventType: 'fulfillment_failed',
      actor,
      payload: { error: error instanceof Error ? error.message : String(error), documentSha256: sha256 },
    })
    return NextResponse.json({
      ok: false,
      error: 'submission_failed',
      message: error instanceof Error ? error.message : String(error),
      requestId: id,
      documentSha256: sha256,
    }, { status: 409 })
  }
}
