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

describe('/api/matches', () => {
  const mockUser = { id: 'user-123' }
  const mockMatches = [
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
      gap_analysis: { skills: ['React'] },
      created_at: '2024-01-16T10:00:00Z',
      search_id: 'search-1',
      job_searches: { query: 'developer' },
    },
  ]

  let mockSupabaseClient: {
    auth: { getUser: Mock }
    from: Mock
  }

  let mockQueryBuilder: Record<string, Mock>

  // Helper to create a chainable, thenable mock query builder
  function createMockQueryBuilder(resolveData: unknown, resolveError: unknown = null) {
    const builder: Record<string, Mock> = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      then: vi.fn((resolve) => {
        resolve({ data: resolveData, error: resolveError })
      }),
    }

    builder.select.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)
    builder.order.mockReturnValue(builder)
    builder.limit.mockReturnValue(builder)

    return builder
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockQueryBuilder = createMockQueryBuilder(mockMatches)

    mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    }

    ;(createClient as Mock).mockResolvedValue(mockSupabaseClient)
    ;(createAdminClient as Mock).mockReturnValue(mockSupabaseClient)
  })

  it('returns empty array when no matches exist', async () => {
    const emptyBuilder = createMockQueryBuilder([])
    mockSupabaseClient.from.mockReturnValue(emptyBuilder)

    const request = new NextRequest('http://localhost:3000/api/matches')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.matches).toEqual([])
  })

  it('returns transformed job data with correct fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/matches')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
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
      gapAnalysis: { skills: ['React'] },
      createdAt: '2024-01-16T10:00:00Z',
      searchId: 'search-1',
      searchQuery: 'developer',
    })
  })

  it('filters by searchId when provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/matches?searchId=search-1')
    await GET(request)

    // Verify eq was called with search_id filter
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123')
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('search_id', 'search-1')
  })

  it('respects limit parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/matches?limit=5')
    await GET(request)

    expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5)
  })

  it('uses default limit of 20 when not specified', async () => {
    const request = new NextRequest('http://localhost:3000/api/matches')
    await GET(request)

    expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20)
  })

  it('uses admin client when no user is authenticated (dev mode)', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const request = new NextRequest('http://localhost:3000/api/matches')
    await GET(request)

    expect(createAdminClient).toHaveBeenCalled()
  })

  it('returns 500 when database query fails', async () => {
    const errorBuilder = createMockQueryBuilder(null, { message: 'DB Error' })
    mockSupabaseClient.from.mockReturnValue(errorBuilder)

    const request = new NextRequest('http://localhost:3000/api/matches')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch matches')
  })

  it('filters out matches with missing job_data (no title/company)', async () => {
    const incompleteMatch = {
      id: 'match-2',
      job_data: null,
      match_score: null,
      gap_analysis: null,
      created_at: '2024-01-16T10:00:00Z',
      search_id: 'search-1',
      job_searches: null,
    }

    const incompleteBuilder = createMockQueryBuilder([incompleteMatch])
    mockSupabaseClient.from.mockReturnValue(incompleteBuilder)

    const request = new NextRequest('http://localhost:3000/api/matches')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.matches).toHaveLength(0)
  })
})
