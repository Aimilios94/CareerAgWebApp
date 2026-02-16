import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { NextRequest } from 'next/server'
import { DELETE, PATCH } from '../route'

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

describe('/api/saved-searches/[id]', () => {
  const mockUser = { id: 'user-123' }

  let mockSupabaseClient: {
    auth: { getUser: Mock }
    from: Mock
  }

  function createMockQueryBuilder(resolveData: unknown, resolveError: unknown = null) {
    const builder: Record<string, Mock> = {
      select: vi.fn(),
      eq: vi.fn(),
      update: vi.fn(),
      single: vi.fn(),
      then: vi.fn((resolve) => {
        resolve({ data: resolveData, error: resolveError })
      }),
    }

    builder.select.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)
    builder.update.mockReturnValue(builder)
    builder.single.mockReturnValue(builder)

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

  describe('DELETE', () => {
    it('unsaves a search by setting is_saved=false and clearing saved_name and saved_at', async () => {
      const updateBuilder = createMockQueryBuilder({
        id: 'search-1',
        is_saved: false,
        saved_name: null,
        saved_at: null,
      })
      mockSupabaseClient.from.mockReturnValue(updateBuilder)

      const request = new NextRequest('http://localhost:3000/api/saved-searches/search-1', {
        method: 'DELETE',
      })
      const context: RouteContext = { params: Promise.resolve({ id: 'search-1' }) }
      const response = await DELETE(request, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(updateBuilder.update).toHaveBeenCalledWith({
        is_saved: false,
        saved_name: null,
        saved_at: null,
      })
      expect(updateBuilder.eq).toHaveBeenCalledWith('id', 'search-1')
      expect(updateBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('returns 404 if search not found', async () => {
      const notFoundBuilder = createMockQueryBuilder(null)
      mockSupabaseClient.from.mockReturnValue(notFoundBuilder)

      const request = new NextRequest('http://localhost:3000/api/saved-searches/nonexistent', {
        method: 'DELETE',
      })
      const context: RouteContext = { params: Promise.resolve({ id: 'nonexistent' }) }
      const response = await DELETE(request, context)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Saved search not found')
    })

    it('returns 500 on database error', async () => {
      const errorBuilder = createMockQueryBuilder(null, { message: 'DB Error' })
      mockSupabaseClient.from.mockReturnValue(errorBuilder)

      const request = new NextRequest('http://localhost:3000/api/saved-searches/search-1', {
        method: 'DELETE',
      })
      const context: RouteContext = { params: Promise.resolve({ id: 'search-1' }) }
      const response = await DELETE(request, context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to unsave search')
    })
  })

  describe('PATCH', () => {
    it('updates saved_name on a saved search', async () => {
      const updateBuilder = createMockQueryBuilder({
        id: 'search-1',
        saved_name: 'Updated Name',
      })
      mockSupabaseClient.from.mockReturnValue(updateBuilder)

      const request = new NextRequest('http://localhost:3000/api/saved-searches/search-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Name' }),
      })
      const context: RouteContext = { params: Promise.resolve({ id: 'search-1' }) }
      const response = await PATCH(request, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(updateBuilder.update).toHaveBeenCalledWith({ saved_name: 'Updated Name' })
      expect(updateBuilder.eq).toHaveBeenCalledWith('id', 'search-1')
      expect(updateBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('returns 400 if name is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/saved-searches/search-1', {
        method: 'PATCH',
        body: JSON.stringify({}),
      })
      const context: RouteContext = { params: Promise.resolve({ id: 'search-1' }) }
      const response = await PATCH(request, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('name is required')
    })

    it('returns 404 if search not found', async () => {
      const notFoundBuilder = createMockQueryBuilder(null)
      mockSupabaseClient.from.mockReturnValue(notFoundBuilder)

      const request = new NextRequest('http://localhost:3000/api/saved-searches/nonexistent', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Name' }),
      })
      const context: RouteContext = { params: Promise.resolve({ id: 'nonexistent' }) }
      const response = await PATCH(request, context)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Saved search not found')
    })

    it('returns 500 on database error', async () => {
      const errorBuilder = createMockQueryBuilder(null, { message: 'DB Error' })
      mockSupabaseClient.from.mockReturnValue(errorBuilder)

      const request = new NextRequest('http://localhost:3000/api/saved-searches/search-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Name' }),
      })
      const context: RouteContext = { params: Promise.resolve({ id: 'search-1' }) }
      const response = await PATCH(request, context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update saved search')
    })
  })
})
