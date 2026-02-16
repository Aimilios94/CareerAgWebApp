import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

// Mock semantic search functions
vi.mock('@/lib/pinecone/semantic-search', () => ({
  getCVEmbedding: vi.fn(),
  computeSemanticScores: vi.fn(),
  blendScores: vi.fn(),
}))

vi.mock('@/lib/pinecone/mock-semantic', () => ({
  mockSemanticScores: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCVEmbedding, computeSemanticScores, blendScores } from '@/lib/pinecone/semantic-search'
import { mockSemanticScores } from '@/lib/pinecone/mock-semantic'

describe('/api/jobs/semantic-rank', () => {
  const mockUser = { id: 'user-123' }
  const mockMatches = [
    {
      id: 'match-1',
      job_data: { title: 'React Dev', description: 'React developer role' },
      match_score: 85,
      semantic_score: null,
      search_id: 'search-1',
    },
    {
      id: 'match-2',
      job_data: { title: 'Python Dev', description: 'Python developer role' },
      match_score: 70,
      semantic_score: null,
      search_id: 'search-1',
    },
  ]

  let mockSupabaseClient: {
    auth: { getUser: Mock }
    from: Mock
  }

  // Helper to create a chainable, thenable mock query builder with array result
  function createListQueryBuilder(resolveData: unknown, resolveError: unknown = null) {
    const builder: Record<string, Mock> = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      then: vi.fn((resolve) => {
        resolve({ data: resolveData, error: resolveError })
      }),
    }

    builder.select.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)
    builder.order.mockReturnValue(builder)

    return builder
  }

  // Helper to create a chainable, thenable mock query builder for single result
  function createSingleQueryBuilder(resolveData: unknown, resolveError: unknown = null) {
    const builder: Record<string, Mock> = {
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      then: vi.fn((resolve) => {
        resolve({ data: resolveData, error: resolveError })
      }),
    }

    builder.select.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)
    builder.single.mockReturnValue(builder)
    builder.order.mockReturnValue(builder)
    builder.limit.mockReturnValue(builder)

    return builder
  }

  // Helper to create a mock update builder
  function createUpdateBuilder(resolveError: unknown = null) {
    const builder: Record<string, Mock> = {
      update: vi.fn(),
      eq: vi.fn(),
      then: vi.fn((resolve) => {
        resolve({ error: resolveError })
      }),
    }

    builder.update.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)

    return builder
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn(),
    }

    ;(createClient as Mock).mockResolvedValue(mockSupabaseClient)
    ;(createAdminClient as Mock).mockReturnValue(mockSupabaseClient)
  })

  it('returns 400 when searchId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/semantic-rank', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('searchId is required')
  })

  it('fetches job_matches for the given searchId', async () => {
    const matchesBuilder = createListQueryBuilder(mockMatches)
    const cvBuilder = createSingleQueryBuilder({ id: 'cv-1' })
    const updateBuilder = createUpdateBuilder()

    mockSupabaseClient.from
      .mockReturnValueOnce(matchesBuilder)   // job_matches fetch
      .mockReturnValueOnce(cvBuilder)        // cvs fetch
      .mockReturnValueOnce(updateBuilder)    // first update
      .mockReturnValueOnce(updateBuilder)    // second update

    vi.mocked(getCVEmbedding).mockResolvedValue([0.1, 0.2, 0.3])
    vi.mocked(computeSemanticScores).mockResolvedValue([
      { id: 'match-1', semanticScore: 0.9 },
      { id: 'match-2', semanticScore: 0.5 },
    ])
    vi.mocked(blendScores).mockReturnValue(80)

    const request = new NextRequest('http://localhost:3000/api/jobs/semantic-rank', {
      method: 'POST',
      body: JSON.stringify({ searchId: 'search-1' }),
    })

    await POST(request)

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('job_matches')
    expect(matchesBuilder.eq).toHaveBeenCalledWith('search_id', 'search-1')
  })

  it('uses Pinecone CV embedding and computes semantic scores', async () => {
    const cvEmbedding = [0.1, 0.2, 0.3]
    const matchesBuilder = createListQueryBuilder(mockMatches)
    const cvBuilder = createSingleQueryBuilder({ id: 'cv-1' })
    const updateBuilder = createUpdateBuilder()

    mockSupabaseClient.from
      .mockReturnValueOnce(matchesBuilder)
      .mockReturnValueOnce(cvBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(updateBuilder)

    vi.mocked(getCVEmbedding).mockResolvedValue(cvEmbedding)
    vi.mocked(computeSemanticScores).mockResolvedValue([
      { id: 'match-1', semanticScore: 0.9 },
      { id: 'match-2', semanticScore: 0.5 },
    ])
    vi.mocked(blendScores).mockReturnValue(80)

    const request = new NextRequest('http://localhost:3000/api/jobs/semantic-rank', {
      method: 'POST',
      body: JSON.stringify({ searchId: 'search-1' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(getCVEmbedding).toHaveBeenCalledWith('user-123', 'cv-1')
    expect(computeSemanticScores).toHaveBeenCalledWith(
      cvEmbedding,
      expect.arrayContaining([
        expect.objectContaining({ id: 'match-1' }),
        expect.objectContaining({ id: 'match-2' }),
      ])
    )
    expect(response.status).toBe(200)
    expect(data.method).toBe('pinecone')
  })

  it('falls back to mock scoring when CV embedding is not available', async () => {
    const matchesBuilder = createListQueryBuilder(mockMatches)
    const cvBuilder = createSingleQueryBuilder(null) // no CV
    const updateBuilder = createUpdateBuilder()

    mockSupabaseClient.from
      .mockReturnValueOnce(matchesBuilder)
      .mockReturnValueOnce(cvBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(updateBuilder)

    vi.mocked(getCVEmbedding).mockResolvedValue(null)
    vi.mocked(mockSemanticScores).mockReturnValue([
      { id: 'match-1', semanticScore: 0.8 },
      { id: 'match-2', semanticScore: 0.3 },
    ])
    vi.mocked(blendScores).mockReturnValue(75)

    const request = new NextRequest('http://localhost:3000/api/jobs/semantic-rank', {
      method: 'POST',
      body: JSON.stringify({ searchId: 'search-1', query: 'react developer' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(mockSemanticScores).toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(data.method).toBe('mock')
  })

  it('updates semantic_score column for each match', async () => {
    const matchesBuilder = createListQueryBuilder(mockMatches)
    const cvBuilder = createSingleQueryBuilder({ id: 'cv-1' })
    const updateBuilder1 = createUpdateBuilder()
    const updateBuilder2 = createUpdateBuilder()

    mockSupabaseClient.from
      .mockReturnValueOnce(matchesBuilder)
      .mockReturnValueOnce(cvBuilder)
      .mockReturnValueOnce(updateBuilder1)
      .mockReturnValueOnce(updateBuilder2)

    vi.mocked(getCVEmbedding).mockResolvedValue([0.1, 0.2])
    vi.mocked(computeSemanticScores).mockResolvedValue([
      { id: 'match-1', semanticScore: 0.9 },
      { id: 'match-2', semanticScore: 0.5 },
    ])
    vi.mocked(blendScores).mockReturnValueOnce(87).mockReturnValueOnce(62)

    const request = new NextRequest('http://localhost:3000/api/jobs/semantic-rank', {
      method: 'POST',
      body: JSON.stringify({ searchId: 'search-1' }),
    })

    await POST(request)

    // Should have called from('job_matches') for the update calls (calls 3 and 4)
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('job_matches')
    expect(updateBuilder1.update).toHaveBeenCalledWith(
      expect.objectContaining({ semantic_score: expect.any(Number) })
    )
    expect(updateBuilder1.eq).toHaveBeenCalledWith('id', 'match-1')
  })

  it('uses admin client when no authenticated user (dev mode)', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const matchesBuilder = createListQueryBuilder(mockMatches)
    const cvBuilder = createSingleQueryBuilder({ id: 'cv-1' })
    const updateBuilder = createUpdateBuilder()

    mockSupabaseClient.from
      .mockReturnValueOnce(matchesBuilder)
      .mockReturnValueOnce(cvBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(updateBuilder)

    vi.mocked(getCVEmbedding).mockResolvedValue([0.1, 0.2])
    vi.mocked(computeSemanticScores).mockResolvedValue([
      { id: 'match-1', semanticScore: 0.9 },
      { id: 'match-2', semanticScore: 0.5 },
    ])
    vi.mocked(blendScores).mockReturnValue(80)

    const request = new NextRequest('http://localhost:3000/api/jobs/semantic-rank', {
      method: 'POST',
      body: JSON.stringify({ searchId: 'search-1' }),
    })

    await POST(request)

    expect(createAdminClient).toHaveBeenCalled()
  })

  it('returns unchanged when no matches exist', async () => {
    const matchesBuilder = createListQueryBuilder([])

    mockSupabaseClient.from.mockReturnValueOnce(matchesBuilder)

    const request = new NextRequest('http://localhost:3000/api/jobs/semantic-rank', {
      method: 'POST',
      body: JSON.stringify({ searchId: 'search-1' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.method).toBe('unchanged')
    expect(data.updated).toBe(0)
  })

  it('returns 500 on internal server error', async () => {
    ;(createClient as Mock).mockRejectedValue(new Error('Connection failed'))

    const request = new NextRequest('http://localhost:3000/api/jobs/semantic-rank', {
      method: 'POST',
      body: JSON.stringify({ searchId: 'search-1' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal Server Error')
  })
})
