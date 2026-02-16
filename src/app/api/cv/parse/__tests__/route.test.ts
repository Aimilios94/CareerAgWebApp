import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/openai/client', () => ({ parseCV: vi.fn() }))
vi.mock('@/lib/openai/extract-text', () => ({ extractTextFromFile: vi.fn() }))

import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseCV } from '@/lib/openai/client'
import { extractTextFromFile } from '@/lib/openai/extract-text'

describe('POST /api/cv/parse', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }

  function createMockQueryBuilder(resolveData: unknown, resolveError: unknown = null) {
    const builder: Record<string, Mock> = {
      select: vi.fn(), eq: vi.fn(), single: vi.fn(), order: vi.fn(), limit: vi.fn(),
      update: vi.fn(),
      then: vi.fn((resolve) => { resolve({ data: resolveData, error: resolveError }) }),
    }
    builder.select.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)
    builder.single.mockReturnValue(builder)
    builder.order.mockReturnValue(builder)
    builder.limit.mockReturnValue(builder)
    builder.update.mockReturnValue(builder)
    return builder
  }

  let mockSupabaseClient: { auth: { getUser: Mock }; from: Mock; storage: { from: Mock } }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }) },
      from: vi.fn(),
      storage: {
        from: vi.fn().mockReturnValue({
          download: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        }),
      },
    }
    ;(createClient as Mock).mockResolvedValue(mockSupabaseClient)
  })

  function makeRequest(body: Record<string, unknown> = {}) {
    return new NextRequest('http://localhost:3000/api/cv/parse', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  it('returns 404 when no CV found', async () => {
    const cvBuilder = createMockQueryBuilder(null, { message: 'Not found' })
    mockSupabaseClient.from.mockReturnValue(cvBuilder)

    const response = await POST(makeRequest())
    const data = await response.json()
    expect(response.status).toBe(404)
    expect(data.error).toContain('No CV found')
  })

  it('returns 200 with mock data when no OpenAI key', async () => {
    const cvFetchBuilder = createMockQueryBuilder({ id: 'cv-1', storage_path: 'user/file.pdf', filename: 'resume.pdf' })
    const cvDetailBuilder = createMockQueryBuilder({ storage_path: 'user/file.pdf', filename: 'resume.pdf' })
    const updateBuilder = createMockQueryBuilder(null)

    let cvCallCount = 0
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'cvs') {
        cvCallCount++
        if (cvCallCount === 1) return cvFetchBuilder
        if (cvCallCount === 2) return cvDetailBuilder
        return updateBuilder
      }
      return createMockQueryBuilder(null)
    })

    // OpenAI fails (no key)
    ;(parseCV as Mock).mockRejectedValue(new Error('OPENAI_API_KEY is not set'))

    const response = await POST(makeRequest())
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.parsedData.skills).toBeDefined()
  })

  it('returns 200 with AI-parsed data when OpenAI succeeds', async () => {
    const aiResult = {
      skills: ['Python', 'Data Science'],
      experience: [{ role: 'Data Scientist', company: 'AI Corp', duration: '3y', description: 'ML work' }],
      education: [{ degree: 'MS CS', institution: 'MIT', year: '2019' }],
      summary: 'Data scientist with ML expertise',
    }

    const cvFetchBuilder = createMockQueryBuilder({ id: 'cv-1', storage_path: 'user/file.pdf', filename: 'resume.pdf' })
    const cvDetailBuilder = createMockQueryBuilder({ storage_path: 'user/file.pdf', filename: 'resume.pdf' })
    const updateBuilder = createMockQueryBuilder(null)

    let cvCallCount = 0
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'cvs') {
        cvCallCount++
        if (cvCallCount === 1) return cvFetchBuilder
        if (cvCallCount === 2) return cvDetailBuilder
        return updateBuilder
      }
      return createMockQueryBuilder(null)
    })

    // Mock storage download
    const mockBlob = { arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)) }
    mockSupabaseClient.storage.from.mockReturnValue({
      download: vi.fn().mockResolvedValue({ data: mockBlob, error: null }),
    })

    ;(extractTextFromFile as Mock).mockResolvedValue('John Doe, Data Scientist...')
    ;(parseCV as Mock).mockResolvedValue(aiResult)

    const response = await POST(makeRequest())
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.parsedData.skills).toEqual(['Python', 'Data Science'])
    expect(data.parsedData.summary).toBe('Data scientist with ML expertise')
  })

  it('falls back to mock when file download fails', async () => {
    const cvFetchBuilder = createMockQueryBuilder({ id: 'cv-1', storage_path: 'user/file.pdf', filename: 'resume.pdf' })
    const cvDetailBuilder = createMockQueryBuilder({ storage_path: 'user/file.pdf', filename: 'resume.pdf' })
    const updateBuilder = createMockQueryBuilder(null)

    let cvCallCount = 0
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'cvs') {
        cvCallCount++
        if (cvCallCount === 1) return cvFetchBuilder
        if (cvCallCount === 2) return cvDetailBuilder
        return updateBuilder
      }
      return createMockQueryBuilder(null)
    })

    // Storage download fails
    mockSupabaseClient.storage.from.mockReturnValue({
      download: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    })

    const response = await POST(makeRequest())
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    // Should get mock data since download failed
    expect(data.parsedData.skills).toBeDefined()
  })

  it('uses dev bypass with admin client when no user', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const mockAdminClient = {
      from: vi.fn(),
      storage: {
        from: vi.fn().mockReturnValue({
          download: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        }),
      },
    }
    const cvBuilder = createMockQueryBuilder({ id: 'cv-1', storage_path: 'user/file.pdf', filename: 'resume.pdf' })
    const updateBuilder = createMockQueryBuilder(null)

    let callCount = 0
    mockAdminClient.from.mockImplementation(() => {
      callCount++
      if (callCount <= 2) return cvBuilder
      return updateBuilder
    })

    ;(createAdminClient as Mock).mockReturnValue(mockAdminClient)

    const response = await POST(makeRequest())
    expect(response.status).toBe(200)
    expect(createAdminClient).toHaveBeenCalled()
  })
})
