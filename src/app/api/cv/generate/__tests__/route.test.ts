import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/n8n/client', () => ({
  triggerN8nWebhook: vi.fn(),
}))

vi.mock('@/lib/openai/client', () => ({
  generateTailoredCV: vi.fn(),
}))

import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { triggerN8nWebhook } from '@/lib/n8n/client'
import { generateTailoredCV } from '@/lib/openai/client'

describe('POST /api/cv/generate', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }

  function createMockQueryBuilder(resolveData: unknown, resolveError: unknown = null) {
    const builder: Record<string, Mock> = {
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      then: vi.fn((resolve) => {
        resolve({ data: resolveData, error: resolveError })
      }),
    }
    builder.select.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)
    builder.single.mockReturnValue(builder)
    builder.order.mockReturnValue(builder)
    builder.limit.mockReturnValue(builder)
    return builder
  }

  let mockSupabaseClient: { auth: { getUser: Mock }; from: Mock }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn(),
    }
    ;(createClient as Mock).mockResolvedValue(mockSupabaseClient)
  })

  function makeRequest(body: Record<string, unknown> = { jobId: 'job-123' }) {
    return new NextRequest('http://localhost:3000/api/cv/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  it('returns 401 when not authenticated and dev bypass not available', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const response = await POST(makeRequest())
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')

    process.env.NODE_ENV = originalEnv
  })

  it('returns 403 when user is not Pro', async () => {
    const subBuilder = createMockQueryBuilder({ plan_type: 'free', user_id: 'user-123' })
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'subscriptions') return subBuilder
      return createMockQueryBuilder(null)
    })

    const response = await POST(makeRequest())
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Pro subscription required')
  })

  it('returns 400 when jobId is missing from body', async () => {
    const subBuilder = createMockQueryBuilder({ plan_type: 'pro', user_id: 'user-123' })
    mockSupabaseClient.from.mockReturnValue(subBuilder)

    const response = await POST(makeRequest({}))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('jobId is required')
  })

  it('returns 404 when job match not found', async () => {
    const subBuilder = createMockQueryBuilder({ plan_type: 'pro', user_id: 'user-123' })
    const jobBuilder = createMockQueryBuilder(null, { message: 'Not found' })

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'subscriptions') return subBuilder
      if (table === 'job_matches') return jobBuilder
      return createMockQueryBuilder(null)
    })

    const response = await POST(makeRequest())
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Job match not found')
  })

  it('returns 200 with generated CV data when n8n succeeds', async () => {
    const subBuilder = createMockQueryBuilder({ plan_type: 'pro', user_id: 'user-123' })
    const jobBuilder = createMockQueryBuilder({
      id: 'job-123', user_id: 'user-123',
      job_data: { title: 'Software Engineer', company: 'Acme' },
    })
    const cvBuilder = createMockQueryBuilder({
      id: 'cv-1', user_id: 'user-123',
      parsed_data: { skills: ['JavaScript', 'React'] },
    })

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'subscriptions') return subBuilder
      if (table === 'job_matches') return jobBuilder
      if (table === 'cvs') return cvBuilder
      return createMockQueryBuilder(null)
    })

    ;(triggerN8nWebhook as Mock).mockResolvedValue({
      success: true,
      data: { summary: 'Tailored CV', skills: ['JS'], experience: [], atsScore: 92 },
    })

    const response = await POST(makeRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
  })

  it('returns 200 with mock fallback data when n8n fails', async () => {
    const subBuilder = createMockQueryBuilder({ plan_type: 'pro', user_id: 'user-123' })
    const jobBuilder = createMockQueryBuilder({
      id: 'job-123', user_id: 'user-123',
      job_data: { title: 'Software Engineer', company: 'Acme' },
    })
    const cvBuilder = createMockQueryBuilder({
      id: 'cv-1', user_id: 'user-123',
      parsed_data: { skills: ['JavaScript'] },
    })

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'subscriptions') return subBuilder
      if (table === 'job_matches') return jobBuilder
      if (table === 'cvs') return cvBuilder
      return createMockQueryBuilder(null)
    })

    ;(triggerN8nWebhook as Mock).mockResolvedValue({ success: false, error: 'n8n unreachable' })
    ;(generateTailoredCV as Mock).mockRejectedValue(new Error('OPENAI_API_KEY is not set'))

    const response = await POST(makeRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.atsScore).toBeDefined()
    expect(data.data.summary).toBeDefined()
    expect(data.data.skills).toBeDefined()
  })

  it('calls triggerN8nWebhook with correct workflow and payload', async () => {
    const subBuilder = createMockQueryBuilder({ plan_type: 'pro', user_id: 'user-123' })
    const jobBuilder = createMockQueryBuilder({
      id: 'job-123', user_id: 'user-123',
      job_data: { title: 'Software Engineer', company: 'Acme' },
    })
    const cvBuilder = createMockQueryBuilder({
      id: 'cv-1', user_id: 'user-123', parsed_data: { skills: ['JavaScript'] },
    })

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'subscriptions') return subBuilder
      if (table === 'job_matches') return jobBuilder
      if (table === 'cvs') return cvBuilder
      return createMockQueryBuilder(null)
    })

    ;(triggerN8nWebhook as Mock).mockResolvedValue({ success: true })

    await POST(makeRequest())

    expect(triggerN8nWebhook).toHaveBeenCalledWith('cv-generate', expect.objectContaining({
      userId: 'user-123',
      jobId: 'job-123',
    }))
  })

  it('fetches latest CV for the user', async () => {
    const subBuilder = createMockQueryBuilder({ plan_type: 'pro', user_id: 'user-123' })
    const jobBuilder = createMockQueryBuilder({
      id: 'job-123', user_id: 'user-123',
      job_data: { title: 'Engineer', company: 'Test' },
    })
    const cvBuilder = createMockQueryBuilder({ id: 'cv-1', parsed_data: { skills: ['JS'] } })

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'subscriptions') return subBuilder
      if (table === 'job_matches') return jobBuilder
      if (table === 'cvs') return cvBuilder
      return createMockQueryBuilder(null)
    })

    ;(triggerN8nWebhook as Mock).mockResolvedValue({ success: true })
    await POST(makeRequest())
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('cvs')
  })

  it('returns 200 with OpenAI-generated data when n8n fails but OpenAI succeeds', async () => {
    const subBuilder = createMockQueryBuilder({ plan_type: 'pro', user_id: 'user-123' })
    const jobBuilder = createMockQueryBuilder({
      id: 'job-123', user_id: 'user-123',
      job_data: { title: 'Software Engineer', company: 'Acme' },
    })
    const cvBuilder = createMockQueryBuilder({
      id: 'cv-1', user_id: 'user-123',
      parsed_data: { skills: ['JavaScript'], experience: [{ role: 'Dev', company: 'Co', duration: '2y', description: 'stuff' }] },
    })

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'subscriptions') return subBuilder
      if (table === 'job_matches') return jobBuilder
      if (table === 'cvs') return cvBuilder
      return createMockQueryBuilder(null)
    })

    ;(triggerN8nWebhook as Mock).mockResolvedValue({ success: false, error: 'n8n unreachable' })
    ;(generateTailoredCV as Mock).mockResolvedValue({
      summary: 'AI-generated tailored summary',
      skills: ['JavaScript', 'React'],
      experience: [{ role: 'Dev', company: 'Co', duration: '2y', highlights: ['Led team'] }],
      atsScore: 91,
    })

    const response = await POST(makeRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.summary).toBe('AI-generated tailored summary')
    expect(data.data.atsScore).toBe(91)
    expect(generateTailoredCV).toHaveBeenCalled()
  })

  it('falls back to mock when both n8n and OpenAI fail', async () => {
    const subBuilder = createMockQueryBuilder({ plan_type: 'pro', user_id: 'user-123' })
    const jobBuilder = createMockQueryBuilder({
      id: 'job-123', user_id: 'user-123',
      job_data: { title: 'Software Engineer', company: 'Acme' },
    })
    const cvBuilder = createMockQueryBuilder({
      id: 'cv-1', user_id: 'user-123',
      parsed_data: { skills: ['JavaScript'] },
    })

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'subscriptions') return subBuilder
      if (table === 'job_matches') return jobBuilder
      if (table === 'cvs') return cvBuilder
      return createMockQueryBuilder(null)
    })

    ;(triggerN8nWebhook as Mock).mockResolvedValue({ success: false, error: 'n8n unreachable' })
    ;(generateTailoredCV as Mock).mockRejectedValue(new Error('OPENAI_API_KEY is not set'))

    const response = await POST(makeRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.atsScore).toBeDefined()
    expect(data.data.summary).toBeDefined()
  })

  it('uses dev bypass with DEV_USER_ID and createAdminClient when auth fails', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null }, error: { message: 'Not authenticated' },
    })

    const mockAdminClient = { from: vi.fn() }
    const subBuilder = createMockQueryBuilder({ plan_type: 'pro', user_id: '00000000-0000-0000-0000-000000000001' })
    const jobBuilder = createMockQueryBuilder({
      id: 'job-123', user_id: '00000000-0000-0000-0000-000000000001',
      job_data: { title: 'Engineer', company: 'Test' },
    })
    const cvBuilder = createMockQueryBuilder({ id: 'cv-1', parsed_data: { skills: ['TS'] } })

    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === 'subscriptions') return subBuilder
      if (table === 'job_matches') return jobBuilder
      if (table === 'cvs') return cvBuilder
      return createMockQueryBuilder(null)
    })

    ;(createAdminClient as Mock).mockReturnValue(mockAdminClient)
    ;(triggerN8nWebhook as Mock).mockResolvedValue({ success: true })

    const response = await POST(makeRequest())
    expect(response.status).toBe(200)
    expect(createAdminClient).toHaveBeenCalled()
  })
})
