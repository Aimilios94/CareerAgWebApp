import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { NextRequest } from 'next/server'

// Mock stripe BEFORE importing route
vi.mock('@/lib/stripe/config', () => ({
  stripe: {
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
  },
  PLANS: {
    pro: { priceId: 'price_test_123' },
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'

describe('POST /api/stripe/checkout', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }

  // Helper to create chainable thenable mock query builder
  function createMockQueryBuilder(resolveData: unknown, resolveError: unknown = null) {
    const builder: Record<string, Mock> = {
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
      update: vi.fn(),
      then: vi.fn((resolve) => {
        resolve({ data: resolveData, error: resolveError })
      }),
    }
    builder.select.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)
    builder.single.mockReturnValue(builder)
    builder.update.mockReturnValue(builder)
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

  it('returns checkout URL for authenticated user with no existing stripe customer', async () => {
    // Subscription has no stripe_customer_id
    const subBuilder = createMockQueryBuilder({
      id: 'sub-1',
      user_id: 'user-123',
      stripe_customer_id: null,
    })
    // After update
    const updateBuilder = createMockQueryBuilder({ id: 'sub-1' })

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'subscriptions') {
        // First call is select, second is update
        return subBuilder
      }
      return createMockQueryBuilder(null)
    })

    // Stripe creates customer
    ;(stripe.customers.create as Mock).mockResolvedValue({ id: 'cus_new_123' })
    // Stripe creates checkout session
    ;(stripe.checkout.sessions.create as Mock).mockResolvedValue({
      url: 'https://checkout.stripe.com/session_123',
    })

    const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.url).toBe('https://checkout.stripe.com/session_123')
    expect(stripe.customers.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      metadata: { userId: 'user-123' },
    })
  })

  it('reuses existing stripe customer when stripe_customer_id exists', async () => {
    const subBuilder = createMockQueryBuilder({
      id: 'sub-1',
      user_id: 'user-123',
      stripe_customer_id: 'cus_existing_456',
    })

    mockSupabaseClient.from.mockReturnValue(subBuilder)

    ;(stripe.checkout.sessions.create as Mock).mockResolvedValue({
      url: 'https://checkout.stripe.com/session_456',
    })

    const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.url).toBe('https://checkout.stripe.com/session_456')
    expect(stripe.customers.create).not.toHaveBeenCalled()
  })

  it('creates checkout session with correct params', async () => {
    const subBuilder = createMockQueryBuilder({
      id: 'sub-1',
      user_id: 'user-123',
      stripe_customer_id: 'cus_existing_456',
    })

    mockSupabaseClient.from.mockReturnValue(subBuilder)

    ;(stripe.checkout.sessions.create as Mock).mockResolvedValue({
      url: 'https://checkout.stripe.com/session_789',
    })

    const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
    })
    await POST(request)

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        customer: 'cus_existing_456',
        line_items: [{ price: 'price_test_123', quantity: 1 }],
        success_url: expect.stringContaining('/dashboard/pro?success=true'),
        cancel_url: expect.stringContaining('/dashboard/pro?canceled=true'),
      })
    )
  })

  it('updates subscription with new stripe_customer_id when customer is created', async () => {
    const subBuilder = createMockQueryBuilder({
      id: 'sub-1',
      user_id: 'user-123',
      stripe_customer_id: null,
    })

    let updateCalled = false
    mockSupabaseClient.from.mockImplementation(() => {
      if (!updateCalled) {
        updateCalled = true
        return subBuilder
      }
      // Second call is for update
      const updateBuilder = createMockQueryBuilder({ id: 'sub-1' })
      return updateBuilder
    })

    ;(stripe.customers.create as Mock).mockResolvedValue({ id: 'cus_new_789' })
    ;(stripe.checkout.sessions.create as Mock).mockResolvedValue({
      url: 'https://checkout.stripe.com/session_new',
    })

    const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
    })
    await POST(request)

    // Verify from('subscriptions') was called for update
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('subscriptions')
  })

  it('uses dev bypass when not authenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const subBuilder = createMockQueryBuilder({
      id: 'sub-1',
      user_id: '00000000-0000-0000-0000-000000000001',
      stripe_customer_id: null,
    })

    mockSupabaseClient.from.mockReturnValue(subBuilder)

    ;(stripe.customers.create as Mock).mockResolvedValue({ id: 'cus_dev_123' })
    ;(stripe.checkout.sessions.create as Mock).mockResolvedValue({
      url: 'https://checkout.stripe.com/dev_session',
    })

    const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.url).toBe('https://checkout.stripe.com/dev_session')
  })

  it('returns 500 when Stripe checkout session creation fails', async () => {
    const subBuilder = createMockQueryBuilder({
      id: 'sub-1',
      user_id: 'user-123',
      stripe_customer_id: 'cus_existing',
    })

    mockSupabaseClient.from.mockReturnValue(subBuilder)

    ;(stripe.checkout.sessions.create as Mock).mockRejectedValue(
      new Error('Stripe error')
    )

    const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create checkout session')
  })

  it('returns 500 when subscription fetch fails', async () => {
    const subBuilder = createMockQueryBuilder(null, { message: 'DB error' })
    mockSupabaseClient.from.mockReturnValue(subBuilder)

    const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create checkout session')
  })
})
