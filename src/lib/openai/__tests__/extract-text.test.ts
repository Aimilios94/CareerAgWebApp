import { describe, it, expect, vi } from 'vitest'

const mockGetText = vi.hoisted(() => vi.fn())

// Mock pdf-parse with class-based API
vi.mock('pdf-parse', () => {
  class MockPDFParse {
    getText = mockGetText
  }
  return { PDFParse: MockPDFParse }
})

import { extractTextFromFile } from '../extract-text'

describe('extractTextFromFile', () => {
  it('extracts text from PDF buffer', async () => {
    const mockBuffer = Buffer.from('fake pdf content')
    mockGetText.mockResolvedValue({
      text: 'Extracted PDF text content',
    })

    const result = await extractTextFromFile(mockBuffer, 'application/pdf')
    expect(result).toBe('Extracted PDF text content')
    expect(mockGetText).toHaveBeenCalled()
  })

  it('extracts text from plain text buffer', async () => {
    const mockBuffer = Buffer.from('Hello this is plain text')
    const result = await extractTextFromFile(mockBuffer, 'text/plain')
    expect(result).toBe('Hello this is plain text')
  })

  it('returns empty string for unsupported MIME types', async () => {
    const mockBuffer = Buffer.from('some data')
    const result = await extractTextFromFile(mockBuffer, 'image/png')
    expect(result).toBe('')
  })

  it('returns empty string for empty buffers', async () => {
    const emptyBuffer = Buffer.alloc(0)
    const result = await extractTextFromFile(emptyBuffer, 'application/pdf')
    expect(result).toBe('')
  })

  it('handles DOCX MIME type', async () => {
    const mockBuffer = Buffer.from('<w:t>Some DOCX text</w:t>')
    const result = await extractTextFromFile(
      mockBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    expect(result).toContain('Some DOCX text')
  })
})
