import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/openai/client', () => ({ generateEmbedding: vi.fn() }))
vi.mock('@/lib/pinecone/client', () => ({ upsertCVEmbedding: vi.fn() }))

import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbedding } from '@/lib/openai/client'
import { upsertCVEmbedding } from '@/lib/pinecone/client'

describe('POST /api/cv/embed', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }

  function createMockQueryBuilder(resolveData: unknown, resolveError: unknown = null) {
    const builder: Record<string, Mock> = {
      select: vi.fn(), eq: vi.fn(), single: vi.fn(), order: vi.fn(), limit: vi.fn(),
      delete: vi.fn(), insert: vi.fn(),
      then: vi.fn((resolve) => { resolve({ data: resolveData, error: resolveError }) }),
    }
    builder.select.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)
    builder.single.mockReturnValue(builder)
    builder.order.mockReturnValue(builder)
    builder.limit.mockReturnValue(builder)
    builder.delete.mockReturnValue(builder)
    builder.insert.mockReturnValue(builder)
    return builder
  }

  let mockSupabaseClient: { auth: { getUser: Mock }; from: Mock }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }) },
      from: vi.fn(),
    }
    ;(createClient as Mock).mockResolvedValue(mockSupabaseClient)
  })

  it('returns 401 when not authenticated and dev bypass not available', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } })

    const response = await POST()
    const data = await response.json()
    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')

    process.env.NODE_ENV = originalEnv
  })

  it('returns 404 when no CV found', async () => {
    const cvBuilder = createMockQueryBuilder(null, { message: 'Not found' })
    mockSupabaseClient.from.mockReturnValue(cvBuilder)

    const response = await POST()
    const data = await response.json()
    expect(response.status).toBe(404)
    expect(data.error).toContain('No CV found')
  })

  it('returns 400 when CV has no parsed data', async () => {
    const cvBuilder = createMockQueryBuilder({ id: 'cv-1', parsed_data: null })
    mockSupabaseClient.from.mockReturnValue(cvBuilder)

    const response = await POST()
    const data = await response.json()
    expect(response.status).toBe(400)
    expect(data.error).toContain('not been parsed')
  })

  it('calls generateEmbedding with CV text', async () => {
    const cvData = {
      id: 'cv-1',
      parsed_data: {
        summary: 'Experienced developer',
        skills: ['JavaScript', 'React'],
        experience: [{ role: 'Dev', description: 'Built apps' }],
      },
    }

    // First call for cv fetch, subsequent calls for delete/insert
    const cvBuilder = createMockQueryBuilder(cvData)
    const deleteBuilder = createMockQueryBuilder(null)
    const insertBuilder = createMockQueryBuilder(null)
    let fromCallCount = 0

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'cvs') return cvBuilder
      if (table === 'cv_embeddings') {
        fromCallCount++
        return fromCallCount === 1 ? deleteBuilder : insertBuilder
      }
      return createMockQueryBuilder(null)
    })

    ;(generateEmbedding as Mock).mockResolvedValue(new Array(1536).fill(0.1))
    ;(upsertCVEmbedding as Mock).mockResolvedValue(undefined)

    await POST()

    expect(generateEmbedding).toHaveBeenCalledWith(
      expect.stringContaining('Experienced developer')
    )
  })

  it('saves embedding reference in cv_embeddings table', async () => {
    const cvData = {
      id: 'cv-1',
      parsed_data: {
        summary: 'Dev',
        skills: ['JS'],
        experience: [],
      },
    }

    const cvBuilder = createMockQueryBuilder(cvData)
    const deleteBuilder = createMockQueryBuilder(null)
    const insertBuilder = createMockQueryBuilder(null)

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'cvs') return cvBuilder
      if (table === 'cv_embeddings') {
        // Alternate between delete and insert
        return deleteBuilder
      }
      return createMockQueryBuilder(null)
    })

    ;(generateEmbedding as Mock).mockResolvedValue(new Array(1536).fill(0.1))
    ;(upsertCVEmbedding as Mock).mockResolvedValue(undefined)

    await POST()

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('cv_embeddings')
  })

  it('returns 200 on success with embeddingDimensions', async () => {
    const cvData = {
      id: 'cv-1',
      parsed_data: {
        summary: 'Dev',
        skills: ['JS'],
        experience: [],
      },
    }

    const cvBuilder = createMockQueryBuilder(cvData)
    const embeddingBuilder = createMockQueryBuilder(null)

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'cvs') return cvBuilder
      return embeddingBuilder
    })

    ;(generateEmbedding as Mock).mockResolvedValue(new Array(1536).fill(0.1))
    ;(upsertCVEmbedding as Mock).mockResolvedValue(undefined)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.cvId).toBe('cv-1')
    expect(data.embeddingDimensions).toBe(1536)
  })

  it('returns 500 when OpenAI/Pinecone fails', async () => {
    const cvData = {
      id: 'cv-1',
      parsed_data: { summary: 'Dev', skills: ['JS'], experience: [] },
    }
    const cvBuilder = createMockQueryBuilder(cvData)
    mockSupabaseClient.from.mockReturnValue(cvBuilder)

    ;(generateEmbedding as Mock).mockRejectedValue(new Error('OpenAI error'))

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('Failed to generate embedding')
  })

  it('uses dev bypass when not authenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const mockAdminClient = { from: vi.fn() }
    const cvBuilder = createMockQueryBuilder({
      id: 'cv-1',
      parsed_data: { summary: 'Dev', skills: ['JS'], experience: [] },
    })
    const embeddingBuilder = createMockQueryBuilder(null)

    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === 'cvs') return cvBuilder
      return embeddingBuilder
    })

    ;(createAdminClient as Mock).mockReturnValue(mockAdminClient)
    ;(generateEmbedding as Mock).mockResolvedValue(new Array(1536).fill(0.1))
    ;(upsertCVEmbedding as Mock).mockResolvedValue(undefined)

    const response = await POST()
    expect(response.status).toBe(200)
    expect(createAdminClient).toHaveBeenCalled()
  })
})
