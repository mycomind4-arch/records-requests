/**
 * Document integrity — SHA-256 attestation for documents that cross
 * the approval boundary.
 *
 * Delegates to @mailmypdf/runtime's attestDocument/verifyDocumentIntegrity
 * for the canonical implementation. Keeps local type aliases for
 * backward compatibility with existing consumers.
 */

export type ApprovedDocument = {
  bytes: Uint8Array
  contentType: 'application/pdf'
  fileName: string
}

export type DocumentIntegrity = {
  sha256: string
  byteLength: number
  contentType: 'application/pdf'
  fileName: string
}

import { attestDocument, verifyDocumentIntegrity } from "@mailmypdf/runtime";

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource)
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('')
}

export async function attestApprovedDocument(document: ApprovedDocument): Promise<DocumentIntegrity> {
  // Delegate to the runtime's attestDocument (same validation + hash)
  return attestDocument({
    bytes: document.bytes,
    contentType: document.contentType,
    fileName: document.fileName,
  });
}

export async function verifyApprovedDocumentIntegrity(
  bytes: Uint8Array,
  expectedHash: string,
): Promise<boolean> {
  return verifyDocumentIntegrity(bytes, expectedHash);
}

export function buildFulfillmentDocumentMetadata(integrity: DocumentIntegrity) {
  return {
    documentHash: integrity.sha256,
    documentBytes: integrity.byteLength,
    contentType: integrity.contentType,
    fileName: integrity.fileName,
  }
}

// Re-export for consumers that want the runtime's types directly
export { verifyDocumentIntegrity };
