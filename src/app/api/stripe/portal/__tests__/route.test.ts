import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/stripe/config', () => ({
  stripe: {
    billingPortal: { sessions: { create: vi.fn() } },
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'

describe('POST /api/stripe/portal', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }

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

  it('returns portal URL when user has stripe_customer_id', async () => {
    const subBuilder = createMockQueryBuilder({
      id: 'sub-1',
      user_id: 'user-123',
      stripe_customer_id: 'cus_123',
    })
    mockSupabaseClient.from.mockReturnValue(subBuilder)

    ;(stripe.billingPortal.sessions.create as Mock).mockResolvedValue({
      url: 'https://billing.stripe.com/portal_123',
    })

    const request = new NextRequest('http://localhost:3000/api/stripe/portal', {
      method: 'POST',
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.url).toBe('https://billing.stripe.com/portal_123')
  })

  it('passes correct return_url to portal session', async () => {
    const subBuilder = createMockQueryBuilder({
      id: 'sub-1',
      user_id: 'user-123',
      stripe_customer_id: 'cus_123',
    })
    mockSupabaseClient.from.mockReturnValue(subBuilder)

    ;(stripe.billingPortal.sessions.create as Mock).mockResolvedValue({
      url: 'https://billing.stripe.com/portal_123',
    })

    const request = new NextRequest('http://localhost:3000/api/stripe/portal', {
      method: 'POST',
    })
    await POST(request)

    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_123',
      return_url: expect.stringContaining('/dashboard/pro'),
    })
  })

  it('returns 400 when no stripe_customer_id exists', async () => {
    const subBuilder = createMockQueryBuilder({
      id: 'sub-1',
      user_id: 'user-123',
      stripe_customer_id: null,
    })
    mockSupabaseClient.from.mockReturnValue(subBuilder)

    const request = new NextRequest('http://localhost:3000/api/stripe/portal', {
      method: 'POST',
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('No Stripe customer found')
  })

  it('uses dev bypass when not authenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const subBuilder = createMockQueryBuilder({
      id: 'sub-1',
      user_id: '00000000-0000-0000-0000-000000000001',
      stripe_customer_id: 'cus_dev_123',
    })
    mockSupabaseClient.from.mockReturnValue(subBuilder)

    ;(stripe.billingPortal.sessions.create as Mock).mockResolvedValue({
      url: 'https://billing.stripe.com/dev_portal',
    })

    const request = new NextRequest('http://localhost:3000/api/stripe/portal', {
      method: 'POST',
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.url).toBe('https://billing.stripe.com/dev_portal')
  })

  it('returns 500 when Stripe portal session creation fails', async () => {
    const subBuilder = createMockQueryBuilder({
      id: 'sub-1',
      user_id: 'user-123',
      stripe_customer_id: 'cus_123',
    })
    mockSupabaseClient.from.mockReturnValue(subBuilder)

    ;(stripe.billingPortal.sessions.create as Mock).mockRejectedValue(
      new Error('Stripe error')
    )

    const request = new NextRequest('http://localhost:3000/api/stripe/portal', {
      method: 'POST',
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create portal session')
  })
})
