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

describe('/api/searches', () => {
  const mockUser = { id: 'user-123' }
  const mockSearches = [
    {
      id: 'search-1',
      query: 'frontend developer',
      filters: { location: 'Remote', remote: true },
      status: 'completed',
      created_at: '2024-01-16T10:00:00Z',
      job_matches: [{ count: 5 }],
    },
    {
      id: 'search-2',
      query: 'react engineer',
      filters: null,
      status: 'pending',
      created_at: '2024-01-15T10:00:00Z',
      job_matches: [{ count: 0 }],
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

    mockQueryBuilder = createMockQueryBuilder(mockSearches)

    mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    }

    ;(createClient as Mock).mockResolvedValue(mockSupabaseClient)
    ;(createAdminClient as Mock).mockReturnValue(mockSupabaseClient)
  })

  it('returns empty array when no searches exist', async () => {
    const emptyBuilder = createMockQueryBuilder([])
    mockSupabaseClient.from.mockReturnValue(emptyBuilder)

    const request = new NextRequest('http://localhost:3000/api/searches')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.searches).toEqual([])
  })

  it('returns transformed search data with correct fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/searches')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.searches).toHaveLength(2)

    const search = data.searches[0]
    expect(search).toEqual({
      id: 'search-1',
      query: 'frontend developer',
      filters: { location: 'Remote', remote: true },
      status: 'completed',
      createdAt: '2024-01-16T10:00:00Z',
      matchCount: 5,
    })
  })

  it('correctly calculates match count from aggregation', async () => {
    const request = new NextRequest('http://localhost:3000/api/searches')
    const response = await GET(request)
    const data = await response.json()

    expect(data.searches[0].matchCount).toBe(5)
    expect(data.searches[1].matchCount).toBe(0)
  })

  it('respects limit parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/searches?limit=5')
    await GET(request)

    expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5)
  })

  it('uses default limit of 20 when not specified', async () => {
    const request = new NextRequest('http://localhost:3000/api/searches')
    await GET(request)

    expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20)
  })

  it('orders by created_at descending', async () => {
    const request = new NextRequest('http://localhost:3000/api/searches')
    await GET(request)

    expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('filters by user_id', async () => {
    const request = new NextRequest('http://localhost:3000/api/searches')
    await GET(request)

    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123')
  })

  it('uses admin client when no user is authenticated (dev mode)', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const request = new NextRequest('http://localhost:3000/api/searches')
    await GET(request)

    expect(createAdminClient).toHaveBeenCalled()
  })

  it('returns 500 when database query fails', async () => {
    const errorBuilder = createMockQueryBuilder(null, { message: 'DB Error' })
    mockSupabaseClient.from.mockReturnValue(errorBuilder)

    const request = new NextRequest('http://localhost:3000/api/searches')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch searches')
  })

  it('handles null filters gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/searches')
    const response = await GET(request)
    const data = await response.json()

    expect(data.searches[1].filters).toBeNull()
  })
})
