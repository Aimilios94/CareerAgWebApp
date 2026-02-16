import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PATCH } from '../route'

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/auth/dev-bypass', async () => {
  const actual = await vi.importActual('@/lib/auth/dev-bypass')
  return {
    ...actual,
  }
})

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

describe('/api/profile', () => {
  const mockUser = { id: 'user-123' }

  const mockProfile = {
    id: 'user-123',
    full_name: 'John Doe',
    job_title: 'Software Engineer',
    skills: ['React', 'TypeScript'],
    avatar_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockCV = {
    id: 'cv-123',
    user_id: 'user-123',
    filename: 'resume.pdf',
    storage_path: 'cvs/user-123/resume.pdf',
    parsed_data: {
      skills: ['React', 'Node.js', 'PostgreSQL'],
      experience: [
        { company: 'Tech Corp', role: 'Developer', dates: '2020-2024' },
      ],
      education: [{ institution: 'University', degree: 'CS', year: '2020' }],
      summary: 'Experienced developer...',
    },
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  }

  let mockSupabaseClient: {
    auth: { getUser: Mock }
    from: Mock
  }

  // Helper to create a chainable, thenable mock query builder
  function createMockQueryBuilder(
    resolveData: unknown,
    resolveError: unknown = null
  ) {
    const builder: Record<string, Mock> = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      single: vi.fn(),
      update: vi.fn(),
      then: vi.fn((resolve) => {
        resolve({ data: resolveData, error: resolveError })
      }),
    }

    // Make all methods return builder for chaining
    builder.select.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)
    builder.order.mockReturnValue(builder)
    builder.limit.mockReturnValue(builder)
    builder.single.mockReturnValue(builder)
    builder.update.mockReturnValue(builder)

    return builder
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabaseClient = {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn(),
    }

    ;(createClient as Mock).mockResolvedValue(mockSupabaseClient)
    ;(createAdminClient as Mock).mockReturnValue(mockSupabaseClient)
  })

  describe('GET /api/profile', () => {
    it('uses dev bypass and returns mock profile when not authenticated and profile not found', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      // Mock profile not found (PGRST116 error)
      const profileBuilder = createMockQueryBuilder(null, { code: 'PGRST116', message: 'No rows found' })
      mockSupabaseClient.from.mockReturnValue(profileBuilder)

      const request = new NextRequest('http://localhost:3000/api/profile')
      const response = await GET(request)
      const data = await response.json()

      // Dev bypass returns mock profile
      expect(response.status).toBe(200)
      expect(data.profile.id).toBe('00000000-0000-0000-0000-000000000001')
      expect(data.profile.fullName).toBe('Test User')
    })

    it('returns profile data with full_name, job_title, skills', async () => {
      const profileBuilder = createMockQueryBuilder(mockProfile)
      const cvBuilder = createMockQueryBuilder(null) // No CV

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') return profileBuilder
        if (table === 'cvs') return cvBuilder
        return createMockQueryBuilder(null)
      })

      const request = new NextRequest('http://localhost:3000/api/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.profile).toEqual({
        id: 'user-123',
        fullName: 'John Doe',
        jobTitle: 'Software Engineer',
        skills: ['React', 'TypeScript'],
        avatarUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })
    })

    it('returns latest CV with parsed_data when CV exists', async () => {
      const profileBuilder = createMockQueryBuilder(mockProfile)
      const cvBuilder = createMockQueryBuilder(mockCV)

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') return profileBuilder
        if (table === 'cvs') return cvBuilder
        return createMockQueryBuilder(null)
      })

      const request = new NextRequest('http://localhost:3000/api/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.parsedCV).toEqual({
        id: 'cv-123',
        filename: 'resume.pdf',
        parsedData: {
          skills: ['React', 'Node.js', 'PostgreSQL'],
          experience: [
            { company: 'Tech Corp', role: 'Developer', dates: '2020-2024' },
          ],
          education: [
            { institution: 'University', degree: 'CS', year: '2020' },
          ],
          summary: 'Experienced developer...',
        },
        createdAt: '2024-01-15T00:00:00Z',
      })
    })

    it('returns null parsedCV when no CV exists', async () => {
      const profileBuilder = createMockQueryBuilder(mockProfile)
      const cvBuilder = createMockQueryBuilder(null)

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') return profileBuilder
        if (table === 'cvs') return cvBuilder
        return createMockQueryBuilder(null)
      })

      const request = new NextRequest('http://localhost:3000/api/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.parsedCV).toBeNull()
    })

    it('returns 500 when database query fails', async () => {
      const errorBuilder = createMockQueryBuilder(null, {
        message: 'Database error',
      })

      mockSupabaseClient.from.mockReturnValue(errorBuilder)

      const request = new NextRequest('http://localhost:3000/api/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch profile')
    })

    it('queries profiles table with correct user_id', async () => {
      const profileBuilder = createMockQueryBuilder(mockProfile)
      const cvBuilder = createMockQueryBuilder(null)

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') return profileBuilder
        if (table === 'cvs') return cvBuilder
        return createMockQueryBuilder(null)
      })

      const request = new NextRequest('http://localhost:3000/api/profile')
      await GET(request)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(profileBuilder.select).toHaveBeenCalled()
      expect(profileBuilder.eq).toHaveBeenCalledWith('id', 'user-123')
      expect(profileBuilder.single).toHaveBeenCalled()
    })

    it('queries cvs table ordered by created_at desc with limit 1', async () => {
      const profileBuilder = createMockQueryBuilder(mockProfile)
      const cvBuilder = createMockQueryBuilder(mockCV)

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') return profileBuilder
        if (table === 'cvs') return cvBuilder
        return createMockQueryBuilder(null)
      })

      const request = new NextRequest('http://localhost:3000/api/profile')
      await GET(request)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('cvs')
      expect(cvBuilder.select).toHaveBeenCalled()
      expect(cvBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(cvBuilder.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      })
      expect(cvBuilder.limit).toHaveBeenCalledWith(1)
      expect(cvBuilder.single).toHaveBeenCalled()
    })
  })

  describe('PATCH /api/profile', () => {
    it('uses dev bypass when not authenticated and updates with admin client', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const updatedProfile = {
        id: '00000000-0000-0000-0000-000000000001',
        full_name: 'Jane Doe',
        job_title: null,
        skills: null,
        avatar_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      }

      const updateBuilder = createMockQueryBuilder(updatedProfile)
      mockSupabaseClient.from.mockReturnValue(updateBuilder)

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName: 'Jane Doe' }),
      })
      const response = await PATCH(request)
      const data = await response.json()

      // Dev bypass allows update with admin client
      expect(response.status).toBe(200)
      expect(data.profile.fullName).toBe('Jane Doe')
      // Verify admin client was used
      expect(createAdminClient).toHaveBeenCalled()
    })

    it('updates full_name and job_title successfully', async () => {
      const updatedProfile = {
        ...mockProfile,
        full_name: 'Jane Doe',
        job_title: 'Senior Engineer',
        updated_at: '2024-01-02T00:00:00Z',
      }

      const updateBuilder = createMockQueryBuilder(updatedProfile)
      mockSupabaseClient.from.mockReturnValue(updateBuilder)

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: 'Jane Doe',
          jobTitle: 'Senior Engineer',
        }),
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(updateBuilder.update).toHaveBeenCalledWith({
        full_name: 'Jane Doe',
        job_title: 'Senior Engineer',
      })
      expect(updateBuilder.eq).toHaveBeenCalledWith('id', 'user-123')
    })

    it('returns updated profile data', async () => {
      const updatedProfile = {
        ...mockProfile,
        full_name: 'Jane Doe',
        job_title: 'Senior Engineer',
        updated_at: '2024-01-02T00:00:00Z',
      }

      const updateBuilder = createMockQueryBuilder(updatedProfile)
      mockSupabaseClient.from.mockReturnValue(updateBuilder)

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: 'Jane Doe',
          jobTitle: 'Senior Engineer',
        }),
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.profile).toEqual({
        id: 'user-123',
        fullName: 'Jane Doe',
        jobTitle: 'Senior Engineer',
        skills: ['React', 'TypeScript'],
        avatarUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      })
    })

    it('returns 400 for invalid/empty body', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({}),
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No valid fields to update')
    })

    it('returns 400 for malformed JSON body', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        body: 'not valid json',
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request body')
    })

    it('returns 500 when update fails', async () => {
      const errorBuilder = createMockQueryBuilder(null, {
        message: 'Update failed',
      })
      mockSupabaseClient.from.mockReturnValue(errorBuilder)

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName: 'Jane Doe' }),
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update profile')
    })

    it('only updates provided fields', async () => {
      const updatedProfile = {
        ...mockProfile,
        full_name: 'Jane Doe',
        updated_at: '2024-01-02T00:00:00Z',
      }

      const updateBuilder = createMockQueryBuilder(updatedProfile)
      mockSupabaseClient.from.mockReturnValue(updateBuilder)

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName: 'Jane Doe' }),
      })
      await PATCH(request)

      // Should only include full_name, not job_title
      expect(updateBuilder.update).toHaveBeenCalledWith({
        full_name: 'Jane Doe',
      })
    })

    it('ignores fields that are not allowed to be updated', async () => {
      const updatedProfile = {
        ...mockProfile,
        full_name: 'Jane Doe',
        updated_at: '2024-01-02T00:00:00Z',
      }

      const updateBuilder = createMockQueryBuilder(updatedProfile)
      mockSupabaseClient.from.mockReturnValue(updateBuilder)

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: 'Jane Doe',
          id: 'hacker-id', // Should be ignored
          skills: ['Hacking'], // Should be ignored (not directly updatable)
          created_at: '1999-01-01', // Should be ignored
        }),
      })
      await PATCH(request)

      // Should only include full_name, ignoring dangerous fields
      expect(updateBuilder.update).toHaveBeenCalledWith({
        full_name: 'Jane Doe',
      })
    })

    it('uses select with single to return updated row', async () => {
      const updatedProfile = {
        ...mockProfile,
        full_name: 'Jane Doe',
      }

      const updateBuilder = createMockQueryBuilder(updatedProfile)
      mockSupabaseClient.from.mockReturnValue(updateBuilder)

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName: 'Jane Doe' }),
      })
      await PATCH(request)

      expect(updateBuilder.select).toHaveBeenCalled()
      expect(updateBuilder.single).toHaveBeenCalled()
    })
  })

  describe('Production mode (dev bypass gated)', () => {
    it('GET returns 401 when NODE_ENV=production and no authenticated user', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = new NextRequest('http://localhost:3000/api/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')

      process.env.NODE_ENV = originalEnv
    })

    it('PATCH returns 401 when NODE_ENV=production and no authenticated user', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName: 'Jane Doe' }),
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')

      process.env.NODE_ENV = originalEnv
    })

    it('GET still works in production when user is authenticated', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const profileBuilder = createMockQueryBuilder(mockProfile)
      const cvBuilder = createMockQueryBuilder(null)

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') return profileBuilder
        if (table === 'cvs') return cvBuilder
        return createMockQueryBuilder(null)
      })

      const request = new NextRequest('http://localhost:3000/api/profile')
      const response = await GET(request)

      expect(response.status).toBe(200)

      process.env.NODE_ENV = originalEnv
    })
  })
})
