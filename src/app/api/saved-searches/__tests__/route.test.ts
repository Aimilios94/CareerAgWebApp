import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

describe('/api/saved-searches', () => {
  const mockUser = { id: 'user-123' }
  const mockSavedSearches = [
    {
      id: 'search-1',
      query: 'frontend developer',
      filters: { location: 'Remote', remote: true },
      status: 'completed',
      saved_name: 'My Frontend Search',
      saved_at: '2024-01-16T12:00:00Z',
      created_at: '2024-01-16T10:00:00Z',
      job_matches: [{ count: 5 }],
    },
    {
      id: 'search-2',
      query: 'react engineer',
      filters: null,
      status: 'completed',
      saved_name: null,
      saved_at: '2024-01-15T12:00:00Z',
      created_at: '2024-01-15T10:00:00Z',
      job_matches: [{ count: 3 }],
    },
  ]

  let mockSupabaseClient: {
    auth: { getUser: Mock }
    from: Mock
  }

  let mockQueryBuilder: Record<string, Mock>

  function createMockQueryBuilder(resolveData: unknown, resolveError: unknown = null) {
    const builder: Record<string, Mock> = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      update: vi.fn(),
      single: vi.fn(),
      then: vi.fn((resolve) => {
        resolve({ data: resolveData, error: resolveError })
      }),
    }

    builder.select.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)
    builder.order.mockReturnValue(builder)
    builder.limit.mockReturnValue(builder)
    builder.update.mockReturnValue(builder)
    builder.single.mockReturnValue(builder)

    return builder
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockQueryBuilder = createMockQueryBuilder(mockSavedSearches)

    mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    }

    ;(createClient as Mock).mockResolvedValue(mockSupabaseClient)
    ;(createAdminClient as Mock).mockReturnValue(mockSupabaseClient)
  })

  describe('GET', () => {
    it('returns saved searches with is_saved=true for the user', async () => {
      const request = new NextRequest('http://localhost:3000/api/saved-searches')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.searches).toHaveLength(2)
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_saved', true)
    })

    it('returns transformed search data with correct fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/saved-searches')
      const response = await GET(request)
      const data = await response.json()

      const search = data.searches[0]
      expect(search).toEqual({
        id: 'search-1',
        query: 'frontend developer',
        filters: { location: 'Remote', remote: true },
        status: 'completed',
        savedName: 'My Frontend Search',
        savedAt: '2024-01-16T12:00:00Z',
        createdAt: '2024-01-16T10:00:00Z',
        matchCount: 5,
      })
    })

    it('returns empty array when no saved searches exist', async () => {
      const emptyBuilder = createMockQueryBuilder([])
      mockSupabaseClient.from.mockReturnValue(emptyBuilder)

      const request = new NextRequest('http://localhost:3000/api/saved-searches')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.searches).toEqual([])
    })

    it('respects limit parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/saved-searches?limit=5')
      await GET(request)

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5)
    })

    it('uses admin client when no user is authenticated (dev mode)', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const request = new NextRequest('http://localhost:3000/api/saved-searches')
      await GET(request)

      expect(createAdminClient).toHaveBeenCalled()
    })

    it('returns 500 when database query fails', async () => {
      const errorBuilder = createMockQueryBuilder(null, { message: 'DB Error' })
      mockSupabaseClient.from.mockReturnValue(errorBuilder)

      const request = new NextRequest('http://localhost:3000/api/saved-searches')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch saved searches')
    })
  })

  describe('POST', () => {
    it('saves a search by setting is_saved=true, saved_name, and saved_at', async () => {
      const updateBuilder = createMockQueryBuilder({
        id: 'search-1',
        is_saved: true,
        saved_name: 'My Search',
        saved_at: '2024-01-16T12:00:00Z',
      })
      mockSupabaseClient.from.mockReturnValue(updateBuilder)

      const request = new NextRequest('http://localhost:3000/api/saved-searches', {
        method: 'POST',
        body: JSON.stringify({ searchId: 'search-1', name: 'My Search' }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(updateBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_saved: true,
          saved_name: 'My Search',
          saved_at: expect.any(String),
        })
      )
      expect(updateBuilder.eq).toHaveBeenCalledWith('id', 'search-1')
      expect(updateBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('returns 400 if searchId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/saved-searches', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('searchId is required')
    })

    it('returns 404 if search not found', async () => {
      const notFoundBuilder = createMockQueryBuilder(null)
      mockSupabaseClient.from.mockReturnValue(notFoundBuilder)

      const request = new NextRequest('http://localhost:3000/api/saved-searches', {
        method: 'POST',
        body: JSON.stringify({ searchId: 'nonexistent' }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Search not found')
    })

    it('returns 500 on update error', async () => {
      const errorBuilder = createMockQueryBuilder(null, { message: 'Update failed' })
      mockSupabaseClient.from.mockReturnValue(errorBuilder)

      const request = new NextRequest('http://localhost:3000/api/saved-searches', {
        method: 'POST',
        body: JSON.stringify({ searchId: 'search-1' }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save search')
    })
  })
})
