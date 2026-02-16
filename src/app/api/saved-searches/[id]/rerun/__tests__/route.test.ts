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

vi.mock('@/lib/n8n/client', () => ({
  triggerN8nWebhook: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { triggerN8nWebhook } from '@/lib/n8n/client'

interface RouteContext {
  params: Promise<{ id: string }>
}

describe('/api/saved-searches/[id]/rerun', () => {
  const mockUser = { id: 'user-123' }
  const mockSavedSearch = {
    id: 'search-1',
    query: 'frontend developer',
    filters: { location: 'Remote' },
    user_id: 'user-123',
    is_saved: true,
  }

  let mockSupabaseClient: {
    auth: { getUser: Mock }
    from: Mock
  }

  function createMockQueryBuilder(resolveData: unknown, resolveError: unknown = null) {
    const builder: Record<string, Mock> = {
      select: vi.fn(),
      eq: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      single: vi.fn(),
      then: vi.fn((resolve) => {
        resolve({ data: resolveData, error: resolveError })
      }),
    }

    builder.select.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)
    builder.insert.mockReturnValue(builder)
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

  it('reads original query/filters from saved search and creates new search record', async () => {
    // First call: fetch the saved search
    const fetchBuilder = createMockQueryBuilder(mockSavedSearch)
    // Second call: insert new search record
    const newSearch = { id: 'search-new' }
    const insertBuilder = createMockQueryBuilder(newSearch)
    // Remaining calls: for n8n fallback operations (update + insert + update)
    const updateBuilder = createMockQueryBuilder(null)

    mockSupabaseClient.from
      .mockReturnValueOnce(fetchBuilder)
      .mockReturnValueOnce(insertBuilder)
      .mockReturnValueOnce(updateBuilder) // update status to failed
      .mockReturnValueOnce(updateBuilder) // insert mock matches
      .mockReturnValueOnce(updateBuilder) // update status to completed

    ;(triggerN8nWebhook as Mock).mockResolvedValue({ success: false, error: 'n8n unavailable' })

    const request = new NextRequest('http://localhost:3000/api/saved-searches/search-1/rerun', {
      method: 'POST',
    })
    const context: RouteContext = { params: Promise.resolve({ id: 'search-1' }) }
    const response = await POST(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.searchId).toBe('search-new')

    // Verify it fetched the saved search
    expect(fetchBuilder.eq).toHaveBeenCalledWith('id', 'search-1')
    expect(fetchBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123')

    // Verify it created a new search with the original query and filters
    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        query: 'frontend developer',
        filters: { location: 'Remote' },
        status: 'pending',
      })
    )
  })

  it('triggers n8n webhook with the search data', async () => {
    const fetchBuilder = createMockQueryBuilder(mockSavedSearch)
    const newSearch = { id: 'search-new' }
    const insertBuilder = createMockQueryBuilder(newSearch)
    const updateBuilder = createMockQueryBuilder(null)

    mockSupabaseClient.from
      .mockReturnValueOnce(fetchBuilder)
      .mockReturnValueOnce(insertBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(updateBuilder)

    ;(triggerN8nWebhook as Mock).mockResolvedValue({ success: true })

    const request = new NextRequest('http://localhost:3000/api/saved-searches/search-1/rerun', {
      method: 'POST',
    })
    const context: RouteContext = { params: Promise.resolve({ id: 'search-1' }) }
    await POST(request, context)

    expect(triggerN8nWebhook).toHaveBeenCalledWith('job-search', {
      userId: 'user-123',
      searchId: 'search-new',
      query: 'frontend developer',
      filters: { location: 'Remote' },
    })
  })

  it('returns new searchId on success', async () => {
    const fetchBuilder = createMockQueryBuilder(mockSavedSearch)
    const newSearch = { id: 'search-new' }
    const insertBuilder = createMockQueryBuilder(newSearch)

    mockSupabaseClient.from
      .mockReturnValueOnce(fetchBuilder)
      .mockReturnValueOnce(insertBuilder)

    ;(triggerN8nWebhook as Mock).mockResolvedValue({ success: true })

    const request = new NextRequest('http://localhost:3000/api/saved-searches/search-1/rerun', {
      method: 'POST',
    })
    const context: RouteContext = { params: Promise.resolve({ id: 'search-1' }) }
    const response = await POST(request, context)
    const data = await response.json()

    expect(data.searchId).toBe('search-new')
    expect(data.status).toBe('pending')
  })

  it('returns 404 if saved search not found', async () => {
    const notFoundBuilder = createMockQueryBuilder(null)
    mockSupabaseClient.from.mockReturnValue(notFoundBuilder)

    const request = new NextRequest('http://localhost:3000/api/saved-searches/nonexistent/rerun', {
      method: 'POST',
    })
    const context: RouteContext = { params: Promise.resolve({ id: 'nonexistent' }) }
    const response = await POST(request, context)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Saved search not found')
  })

  it('falls back to mock data when n8n fails', async () => {
    const fetchBuilder = createMockQueryBuilder(mockSavedSearch)
    const newSearch = { id: 'search-new' }
    const insertBuilder = createMockQueryBuilder(newSearch)
    const updateBuilder = createMockQueryBuilder(null)

    mockSupabaseClient.from
      .mockReturnValueOnce(fetchBuilder)
      .mockReturnValueOnce(insertBuilder)
      .mockReturnValueOnce(updateBuilder) // update status to failed
      .mockReturnValueOnce(updateBuilder) // insert mock matches
      .mockReturnValueOnce(updateBuilder) // update status to completed

    ;(triggerN8nWebhook as Mock).mockResolvedValue({ success: false, error: 'n8n unavailable' })

    const request = new NextRequest('http://localhost:3000/api/saved-searches/search-1/rerun', {
      method: 'POST',
    })
    const context: RouteContext = { params: Promise.resolve({ id: 'search-1' }) }
    const response = await POST(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.status).toBe('completed')
  })

  it('returns 500 when insert of new search fails', async () => {
    const fetchBuilder = createMockQueryBuilder(mockSavedSearch)
    const errorInsertBuilder = createMockQueryBuilder(null, { message: 'Insert failed' })

    mockSupabaseClient.from
      .mockReturnValueOnce(fetchBuilder)
      .mockReturnValueOnce(errorInsertBuilder)

    const request = new NextRequest('http://localhost:3000/api/saved-searches/search-1/rerun', {
      method: 'POST',
    })
    const context: RouteContext = { params: Promise.resolve({ id: 'search-1' }) }
    const response = await POST(request, context)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create new search')
  })
})
