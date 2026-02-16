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

describe('/api/jobs/search POST - mock data URLs', () => {
  const mockUser = { id: 'user-123' }
  const mockSearch = { id: 'search-1' }

  let mockSupabaseClient: {
    auth: { getUser: Mock }
    from: Mock
  }

  function createInsertBuilder(resolveData: unknown, resolveError: unknown = null) {
    const builder: Record<string, Mock> = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
      then: vi.fn((resolve) => {
        resolve({ data: resolveData, error: resolveError })
      }),
    }

    builder.insert.mockReturnValue(builder)
    builder.select.mockReturnValue(builder)
    builder.single.mockReturnValue(builder)
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

    // Default mock for job_searches insert
    const searchBuilder = createInsertBuilder(mockSearch)
    // Default mock for job_matches insert and update
    const matchBuilder = createInsertBuilder(null)

    mockSupabaseClient.from
      .mockReturnValueOnce(searchBuilder)  // job_searches insert
      .mockReturnValueOnce(matchBuilder)   // job_searches update (status failed)
      .mockReturnValueOnce(matchBuilder)   // job_matches insert
      .mockReturnValueOnce(matchBuilder)   // job_searches update (status completed)

    ;(createClient as Mock).mockResolvedValue(mockSupabaseClient)
    ;(createAdminClient as Mock).mockReturnValue(mockSupabaseClient)

    // n8n fails so mock data is returned
    ;(triggerN8nWebhook as Mock).mockResolvedValue({ success: false, error: 'n8n unavailable' })
  })

  it('mock job data uses null URLs instead of "#"', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'react developer' }),
    })

    await POST(request)

    // Find the call that inserts job_matches
    const fromCalls = mockSupabaseClient.from.mock.calls
    const insertCalls: unknown[][] = []

    for (let i = 0; i < fromCalls.length; i++) {
      if (fromCalls[i][0] === 'job_matches') {
        // Get the builder and check its insert call
        const builder = mockSupabaseClient.from.mock.results[i]?.value
        if (builder?.insert?.mock?.calls?.length > 0) {
          insertCalls.push(...builder.insert.mock.calls)
        }
      }
    }

    // Verify that at least one insert call was made to job_matches
    expect(insertCalls.length).toBeGreaterThan(0)

    // Check each mock match has url: null, not url: '#'
    const mockMatches = insertCalls[0][0] as Array<{
      job_data: { url: string | null }
    }>

    for (const match of mockMatches) {
      expect(match.job_data.url).toBeNull()
      expect(match.job_data.url).not.toBe('#')
    }
  })
})
