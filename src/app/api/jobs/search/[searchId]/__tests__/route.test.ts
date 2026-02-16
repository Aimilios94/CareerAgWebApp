import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

describe('/api/jobs/search/[searchId]', () => {
  const mockUser = { id: 'user-123' }
  const mockSearch = {
    id: 'search-1',
    status: 'pending',
    query: 'react developer',
    filters: { location: 'Remote' },
    created_at: '2024-01-16T10:00:00Z',
  }

  const mockMatchesRaw = [
    {
      id: 'match-1',
      job_data: {
        title: 'Senior Developer',
        company: 'Tech Corp',
        location: 'Remote',
        salary: '$100k - $150k',
        url: 'https://example.com/job/1',
        postedDate: '2024-01-15',
        description: 'A great job opportunity',
      },
      match_score: 85,
      semantic_score: 78,
      gap_analysis: { skills: ['React'] },
      created_at: '2024-01-16T10:00:00Z',
      search_id: 'search-1',
    },
  ]

  let mockSupabaseClient: {
    auth: { getUser: Mock }
    from: Mock
  }

  // Helper to create a chainable, thenable mock query builder with single result
  function createSingleQueryBuilder(resolveData: unknown, resolveError: unknown = null) {
    const builder: Record<string, Mock> = {
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
      then: vi.fn((resolve) => {
        resolve({ data: resolveData, error: resolveError })
      }),
    }

    builder.select.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)
    builder.single.mockReturnValue(builder)

    return builder
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

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn(),
    }

    // Default: job_searches returns mockSearch (pending status)
    const searchBuilder = createSingleQueryBuilder(mockSearch)
    mockSupabaseClient.from.mockReturnValue(searchBuilder)

    ;(createClient as Mock).mockResolvedValue(mockSupabaseClient)
    ;(createAdminClient as Mock).mockReturnValue(mockSupabaseClient)
  })

  it('returns search status for a valid search ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/search/search-1')
    const params = Promise.resolve({ searchId: 'search-1' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.searchId).toBe('search-1')
    expect(data.status).toBe('pending')
    expect(data.query).toBe('react developer')
    expect(data.filters).toEqual({ location: 'Remote' })
    expect(data.createdAt).toBe('2024-01-16T10:00:00Z')
  })

  it('uses admin client when no authenticated user (dev mode)', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const request = new NextRequest('http://localhost:3000/api/jobs/search/search-1')
    const params = Promise.resolve({ searchId: 'search-1' })

    await GET(request, { params })

    expect(createAdminClient).toHaveBeenCalled()
  })

  it('uses authenticated supabase client when user exists', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/search/search-1')
    const params = Promise.resolve({ searchId: 'search-1' })

    await GET(request, { params })

    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('returns 404 for non-existent search', async () => {
    const notFoundBuilder = createSingleQueryBuilder(null, { code: 'PGRST116' })
    mockSupabaseClient.from.mockReturnValue(notFoundBuilder)

    const request = new NextRequest('http://localhost:3000/api/jobs/search/non-existent')
    const params = Promise.resolve({ searchId: 'non-existent' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Search not found')
  })

  it('returns normalized match data when search is completed', async () => {
    const completedSearch = { ...mockSearch, status: 'completed' }
    const searchBuilder = createSingleQueryBuilder(completedSearch)
    const matchesBuilder = createListQueryBuilder(mockMatchesRaw)

    // First call (job_searches) returns search, second call (job_matches) returns matches
    mockSupabaseClient.from
      .mockReturnValueOnce(searchBuilder)
      .mockReturnValueOnce(matchesBuilder)

    const request = new NextRequest('http://localhost:3000/api/jobs/search/search-1')
    const params = Promise.resolve({ searchId: 'search-1' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('completed')
    expect(data.matches).toHaveLength(1)

    const match = data.matches[0]
    expect(match).toEqual({
      id: 'match-1',
      title: 'Senior Developer',
      company: 'Tech Corp',
      location: 'Remote',
      salary: '$100k - $150k',
      url: 'https://example.com/job/1',
      postedDate: '2024-01-15',
      description: 'A great job opportunity',
      matchScore: 85,
      semanticScore: 78,
      gapAnalysis: { skills: ['React'] },
      createdAt: '2024-01-16T10:00:00Z',
      searchId: 'search-1',
    })
  })

  it('filters out matches with empty title from polling response', async () => {
    const completedSearch = { ...mockSearch, status: 'completed' }
    const matchWithEmptyTitle = {
      id: 'match-2',
      job_data: { title: '', company: 'Some Corp', location: 'Remote' },
      match_score: 70,
      gap_analysis: null,
      created_at: '2024-01-16T10:00:00Z',
      search_id: 'search-1',
    }
    const searchBuilder = createSingleQueryBuilder(completedSearch)
    const matchesBuilder = createListQueryBuilder([...mockMatchesRaw, matchWithEmptyTitle])

    mockSupabaseClient.from
      .mockReturnValueOnce(searchBuilder)
      .mockReturnValueOnce(matchesBuilder)

    const request = new NextRequest('http://localhost:3000/api/jobs/search/search-1')
    const params = Promise.resolve({ searchId: 'search-1' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(data.matches).toHaveLength(1)
    expect(data.matches[0].title).toBe('Senior Developer')
  })

  it('filters out matches with empty company from polling response', async () => {
    const completedSearch = { ...mockSearch, status: 'completed' }
    const matchWithEmptyCompany = {
      id: 'match-3',
      job_data: { title: 'Designer', company: '', location: 'NYC' },
      match_score: 60,
      gap_analysis: null,
      created_at: '2024-01-16T10:00:00Z',
      search_id: 'search-1',
    }
    const searchBuilder = createSingleQueryBuilder(completedSearch)
    const matchesBuilder = createListQueryBuilder([matchWithEmptyCompany])

    mockSupabaseClient.from
      .mockReturnValueOnce(searchBuilder)
      .mockReturnValueOnce(matchesBuilder)

    const request = new NextRequest('http://localhost:3000/api/jobs/search/search-1')
    const params = Promise.resolve({ searchId: 'search-1' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(data.matches).toHaveLength(0)
  })

  it('filters out matches with null job_data from polling response', async () => {
    const completedSearch = { ...mockSearch, status: 'completed' }
    const matchWithNullJobData = {
      id: 'match-4',
      job_data: null,
      match_score: 50,
      gap_analysis: null,
      created_at: '2024-01-16T10:00:00Z',
      search_id: 'search-1',
    }
    const searchBuilder = createSingleQueryBuilder(completedSearch)
    const matchesBuilder = createListQueryBuilder([matchWithNullJobData])

    mockSupabaseClient.from
      .mockReturnValueOnce(searchBuilder)
      .mockReturnValueOnce(matchesBuilder)

    const request = new NextRequest('http://localhost:3000/api/jobs/search/search-1')
    const params = Promise.resolve({ searchId: 'search-1' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(data.matches).toHaveLength(0)
  })

  it('does not include matches key when search is still pending', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/search/search-1')
    const params = Promise.resolve({ searchId: 'search-1' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(data.status).toBe('pending')
    expect(data.matches).toBeUndefined()
  })

  it('returns 500 for internal server errors', async () => {
    ;(createClient as Mock).mockRejectedValue(new Error('Connection failed'))

    const request = new NextRequest('http://localhost:3000/api/jobs/search/search-1')
    const params = Promise.resolve({ searchId: 'search-1' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal Server Error')
  })

  it('queries with correct user_id and search_id', async () => {
    const searchBuilder = createSingleQueryBuilder(mockSearch)
    mockSupabaseClient.from.mockReturnValue(searchBuilder)

    const request = new NextRequest('http://localhost:3000/api/jobs/search/search-1')
    const params = Promise.resolve({ searchId: 'search-1' })

    await GET(request, { params })

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('job_searches')
    expect(searchBuilder.eq).toHaveBeenCalledWith('id', 'search-1')
    expect(searchBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123')
  })

  it('uses dev fallback user ID when no authenticated user', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const searchBuilder = createSingleQueryBuilder(mockSearch)
    mockSupabaseClient.from.mockReturnValue(searchBuilder)

    const request = new NextRequest('http://localhost:3000/api/jobs/search/search-1')
    const params = Promise.resolve({ searchId: 'search-1' })

    await GET(request, { params })

    expect(searchBuilder.eq).toHaveBeenCalledWith('user_id', '00000000-0000-0000-0000-000000000001')
  })
})
