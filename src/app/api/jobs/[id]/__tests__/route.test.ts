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

describe('/api/jobs/[id]', () => {
  const mockUser = { id: 'user-123' }
  const mockJob = {
    id: 'job-1',
    job_data: {
      title: 'Senior Developer',
      company: 'Tech Corp',
      location: 'Remote',
      salary: '$100k - $150k',
      url: 'https://example.com/job/1',
      postedDate: '2024-01-15',
      description: 'A great job opportunity with excellent benefits.',
    },
    match_score: 85,
    gap_analysis: {
      missingSkills: ['Kubernetes', 'AWS'],
      matchingSkills: ['React', 'TypeScript', 'Node.js'],
      recommendations: ['Consider getting AWS certification'],
    },
    created_at: '2024-01-16T10:00:00Z',
    search_id: 'search-1',
    job_searches: { query: 'developer' },
  }

  let mockSupabaseClient: {
    auth: { getUser: Mock }
    from: Mock
  }

  let mockQueryBuilder: Record<string, Mock>

  // Helper to create a chainable, thenable mock query builder with single result
  function createMockQueryBuilder(resolveData: unknown, resolveError: unknown = null) {
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

  beforeEach(() => {
    vi.clearAllMocks()

    mockQueryBuilder = createMockQueryBuilder(mockJob)

    mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    }

    ;(createClient as Mock).mockResolvedValue(mockSupabaseClient)
    ;(createAdminClient as Mock).mockReturnValue(mockSupabaseClient)
  })

  it('returns 404 for non-existent job', async () => {
    const notFoundBuilder = createMockQueryBuilder(null, { code: 'PGRST116' })
    mockSupabaseClient.from.mockReturnValue(notFoundBuilder)

    const request = new NextRequest('http://localhost:3000/api/jobs/non-existent-id')
    const params = Promise.resolve({ id: 'non-existent-id' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Job not found')
  })

  it('returns transformed job data with correct fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/job-1')
    const params = Promise.resolve({ id: 'job-1' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.job).toEqual({
      id: 'job-1',
      title: 'Senior Developer',
      company: 'Tech Corp',
      location: 'Remote',
      salary: '$100k - $150k',
      url: 'https://example.com/job/1',
      postedDate: '2024-01-15',
      description: 'A great job opportunity with excellent benefits.',
      matchScore: 85,
      gapAnalysis: {
        missingSkills: ['Kubernetes', 'AWS'],
        matchingSkills: ['React', 'TypeScript', 'Node.js'],
        recommendations: ['Consider getting AWS certification'],
      },
      createdAt: '2024-01-16T10:00:00Z',
      searchId: 'search-1',
      searchQuery: 'developer',
    })
  })

  it('includes gap analysis when available', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/job-1')
    const params = Promise.resolve({ id: 'job-1' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(data.job.gapAnalysis).toBeDefined()
    expect(data.job.gapAnalysis.missingSkills).toContain('Kubernetes')
    expect(data.job.gapAnalysis.matchingSkills).toContain('React')
  })

  it('handles job without gap analysis', async () => {
    const jobWithoutGap = { ...mockJob, gap_analysis: null }
    const noGapBuilder = createMockQueryBuilder(jobWithoutGap)
    mockSupabaseClient.from.mockReturnValue(noGapBuilder)

    const request = new NextRequest('http://localhost:3000/api/jobs/job-1')
    const params = Promise.resolve({ id: 'job-1' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.job.gapAnalysis).toBeNull()
  })

  it('handles missing job_data fields gracefully', async () => {
    const incompleteJob = {
      id: 'job-2',
      job_data: null,
      match_score: null,
      gap_analysis: null,
      created_at: '2024-01-16T10:00:00Z',
      search_id: 'search-1',
      job_searches: null,
    }

    const incompleteBuilder = createMockQueryBuilder(incompleteJob)
    mockSupabaseClient.from.mockReturnValue(incompleteBuilder)

    const request = new NextRequest('http://localhost:3000/api/jobs/job-2')
    const params = Promise.resolve({ id: 'job-2' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.job.title).toBe('Unknown Position')
    expect(data.job.company).toBe('Unknown Company')
    expect(data.job.location).toBe('Remote')
    expect(data.job.matchScore).toBe(0)
    expect(data.job.searchQuery).toBeNull()
  })

  it('queries by job id and user id', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/job-1')
    const params = Promise.resolve({ id: 'job-1' })

    await GET(request, { params })

    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'job-1')
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123')
  })

  it('uses admin client when no user is authenticated (dev mode)', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const request = new NextRequest('http://localhost:3000/api/jobs/job-1')
    const params = Promise.resolve({ id: 'job-1' })

    await GET(request, { params })

    expect(createAdminClient).toHaveBeenCalled()
  })

  it('returns 500 when database query fails unexpectedly', async () => {
    const errorBuilder = createMockQueryBuilder(null, { message: 'Database connection error' })
    mockSupabaseClient.from.mockReturnValue(errorBuilder)

    const request = new NextRequest('http://localhost:3000/api/jobs/job-1')
    const params = Promise.resolve({ id: 'job-1' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Job not found')
  })
})
