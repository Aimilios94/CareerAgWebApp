import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

// Mock Supabase admin client
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { createAdminClient } from '@/lib/supabase/admin'

describe('/api/webhooks/n8n', () => {
  const validSecret = 'test-webhook-secret'
  let mockSupabaseAdmin: Record<string, Mock>
  let mockQueryBuilder: Record<string, Mock>

  // Helper to create mock query builder
  function createMockQueryBuilder(resolveData: unknown = [], resolveError: unknown = null) {
    const builder: Record<string, Mock> = {
      insert: vi.fn().mockResolvedValue({ error: resolveError }),
      update: vi.fn(),
      select: vi.fn(),
      eq: vi.fn(),
      then: vi.fn((resolve) => {
        resolve({ data: resolveData, error: resolveError })
      }),
    }

    builder.update.mockReturnValue(builder)
    builder.select.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)

    return builder
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('N8N_WEBHOOK_SECRET', validSecret)

    mockQueryBuilder = createMockQueryBuilder()

    mockSupabaseAdmin = {
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    }

    ;(createAdminClient as Mock).mockReturnValue(mockSupabaseAdmin)
  })

  describe('Authorization', () => {
    it('rejects requests with missing webhook secret', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/n8n', {
        method: 'POST',
        body: JSON.stringify({ type: 'job-matches', payload: {} }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('rejects requests with wrong webhook secret', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/n8n', {
        method: 'POST',
        headers: { 'x-n8n-webhook-secret': 'wrong-secret' },
        body: JSON.stringify({ type: 'job-matches', payload: {} }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('accepts requests with valid webhook secret', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/n8n', {
        method: 'POST',
        headers: { 'x-n8n-webhook-secret': validSecret },
        body: JSON.stringify({
          type: 'job-matches',
          payload: {
            searchId: 'search-1',
            userId: 'user-1',
            matches: [],
          },
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('job-matches payload', () => {
    it('returns 400 for invalid job-matches payload (missing required fields)', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/n8n', {
        method: 'POST',
        headers: { 'x-n8n-webhook-secret': validSecret },
        body: JSON.stringify({
          type: 'job-matches',
          payload: {
            // Missing searchId, userId, matches
          },
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid payload')
    })

    it('inserts job matches into database', async () => {
      const jobMatches = [
        {
          title: 'Senior Developer',
          company: 'Tech Corp',
          location: 'Remote',
          salary: '$100k',
          matchScore: 85,
        },
        {
          title: 'Frontend Engineer',
          company: 'Startup Inc',
          location: 'New York',
        },
      ]

      const request = new NextRequest('http://localhost:3000/api/webhooks/n8n', {
        method: 'POST',
        headers: { 'x-n8n-webhook-secret': validSecret },
        body: JSON.stringify({
          type: 'job-matches',
          payload: {
            searchId: 'search-123',
            userId: 'user-456',
            matches: jobMatches,
          },
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify insert was called with transformed data
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('job_matches')
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([
        {
          user_id: 'user-456',
          search_id: 'search-123',
          job_data: {
            title: 'Senior Developer',
            company: 'Tech Corp',
            location: 'Remote',
            salary: '$100k',
            url: null,
            postedDate: null,
            description: null,
          },
          match_score: 85,
        },
        {
          user_id: 'user-456',
          search_id: 'search-123',
          job_data: {
            title: 'Frontend Engineer',
            company: 'Startup Inc',
            location: 'New York',
            salary: null,
            url: null,
            postedDate: null,
            description: null,
          },
          match_score: 90, // Default scoring: 95 - index * 5
        },
      ])
    })

    it('updates search status to completed after inserting matches', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/n8n', {
        method: 'POST',
        headers: { 'x-n8n-webhook-secret': validSecret },
        body: JSON.stringify({
          type: 'job-matches',
          payload: {
            searchId: 'search-123',
            userId: 'user-456',
            matches: [{ title: 'Dev', company: 'Corp', location: 'Remote' }],
          },
        }),
      })

      await POST(request)

      // Verify job_searches table was updated
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('job_searches')
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ status: 'completed' })
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'search-123')
    })
  })

  describe('cv-parsed payload', () => {
    it('updates CV with parsed data', async () => {
      const parsedCvData = {
        cvId: 'cv-123',
        skills: ['JavaScript', 'React', 'TypeScript'],
        experience: [
          {
            role: 'Software Engineer',
            company: 'Tech Co',
            duration: '2 years',
            description: 'Built web applications',
          },
        ],
        education: [
          {
            degree: 'B.S. Computer Science',
            institution: 'University',
            year: '2020',
          },
        ],
        summary: 'Experienced developer',
      }

      const request = new NextRequest('http://localhost:3000/api/webhooks/n8n', {
        method: 'POST',
        headers: { 'x-n8n-webhook-secret': validSecret },
        body: JSON.stringify({
          type: 'cv-parsed',
          payload: parsedCvData,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify CVs table was updated
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('cvs')
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        parsed_data: parsedCvData,
      })
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'cv-123')
    })
  })

  describe('Error handling', () => {
    it('returns 500 when database insert fails', async () => {
      mockQueryBuilder.insert.mockResolvedValue({ error: { message: 'Insert failed' } })

      const request = new NextRequest('http://localhost:3000/api/webhooks/n8n', {
        method: 'POST',
        headers: { 'x-n8n-webhook-secret': validSecret },
        body: JSON.stringify({
          type: 'job-matches',
          payload: {
            searchId: 'search-123',
            userId: 'user-456',
            matches: [{ title: 'Dev', company: 'Corp', location: 'Remote' }],
          },
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })

    it('returns 500 when update fails for cv-parsed', async () => {
      const errorBuilder = createMockQueryBuilder(null, { message: 'Update failed' })
      mockSupabaseAdmin.from.mockReturnValue(errorBuilder)

      const request = new NextRequest('http://localhost:3000/api/webhooks/n8n', {
        method: 'POST',
        headers: { 'x-n8n-webhook-secret': validSecret },
        body: JSON.stringify({
          type: 'cv-parsed',
          payload: {
            cvId: 'cv-123',
            skills: ['JS'],
            experience: [],
            education: [],
          },
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })
  })

  describe('Unknown payload types', () => {
    it('returns success for unhandled payload types (no-op)', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/n8n', {
        method: 'POST',
        headers: { 'x-n8n-webhook-secret': validSecret },
        body: JSON.stringify({
          type: 'unknown-type',
          payload: { some: 'data' },
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
