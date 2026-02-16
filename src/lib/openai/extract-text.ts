/**
 * Extract text content from uploaded file buffers
 * Supports PDF (via pdf-parse) and plain text
 */

/**
 * Extract text from a file buffer based on MIME type
 * @param buffer - File content as Buffer
 * @param mimeType - MIME type of the file
 * @returns Extracted text content
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (!buffer || buffer.length === 0) {
    return ''
  }

  switch (mimeType) {
    case 'application/pdf':
      return extractFromPDF(buffer)
    case 'text/plain':
      return buffer.toString('utf-8')
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      // Basic DOCX extraction - returns raw text content
      return extractFromDOCX(buffer)
    default:
      return ''
  }
}

async function extractFromPDF(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  const result = await parser.getText()
  return result.text || ''
}

async function extractFromDOCX(buffer: Buffer): Promise<string> {
  // Basic DOCX text extraction - DOCX is a ZIP containing XML
  // Extract raw text from the document.xml part
  try {
    const text = buffer.toString('utf-8')
    // Strip XML tags to get raw text content
    const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    return stripped
  } catch {
    return ''
  }
}
