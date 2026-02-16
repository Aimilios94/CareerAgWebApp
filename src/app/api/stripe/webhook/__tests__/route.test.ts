import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/stripe/config', () => ({
  stripe: {
    webhooks: { constructEvent: vi.fn() },
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { POST } from '../route'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/config'

describe('POST /api/stripe/webhook', () => {
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

  let mockAdminClient: { from: Mock }

  beforeEach(() => {
    vi.clearAllMocks()
    mockAdminClient = { from: vi.fn() }
    ;(createAdminClient as Mock).mockReturnValue(mockAdminClient)
  })

  function createWebhookRequest(body: string = '{}') {
    return new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body,
      headers: { 'stripe-signature': 'sig_test_123' },
    })
  }

  it('rejects request with invalid Stripe signature', async () => {
    ;(stripe.webhooks.constructEvent as Mock).mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const request = createWebhookRequest()
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid signature')
  })

  it('rejects request with missing Stripe signature', async () => {
    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      // No stripe-signature header
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing stripe-signature header')
  })

  it('handles checkout.session.completed: updates subscription to pro', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_123',
          subscription: 'sub_stripe_123',
          metadata: { userId: 'user-123' },
        },
      },
    }

    ;(stripe.webhooks.constructEvent as Mock).mockReturnValue(event)

    const updateBuilder = createMockQueryBuilder({ id: 'sub-1' })
    mockAdminClient.from.mockReturnValue(updateBuilder)

    const request = createWebhookRequest(JSON.stringify(event))
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(updateBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_type: 'pro',
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_stripe_123',
      })
    )
    expect(updateBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123')
  })

  it('handles customer.subscription.updated: updates plan based on status', async () => {
    const event = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_stripe_123',
          customer: 'cus_123',
          status: 'active',
          current_period_end: 1700000000,
          metadata: { userId: 'user-123' },
        },
      },
    }

    ;(stripe.webhooks.constructEvent as Mock).mockReturnValue(event)

    const updateBuilder = createMockQueryBuilder({ id: 'sub-1' })
    mockAdminClient.from.mockReturnValue(updateBuilder)

    const request = createWebhookRequest(JSON.stringify(event))
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(updateBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_type: 'pro',
        current_period_end: new Date(1700000000 * 1000).toISOString(),
      })
    )
  })

  it('handles customer.subscription.deleted: resets to free', async () => {
    const event = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_stripe_123',
          customer: 'cus_123',
          metadata: { userId: 'user-123' },
        },
      },
    }

    ;(stripe.webhooks.constructEvent as Mock).mockReturnValue(event)

    const updateBuilder = createMockQueryBuilder({ id: 'sub-1' })
    mockAdminClient.from.mockReturnValue(updateBuilder)

    const request = createWebhookRequest(JSON.stringify(event))
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(updateBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_type: 'free',
        stripe_subscription_id: null,
        current_period_end: null,
      })
    )
  })

  it('handles invoice.payment_failed: returns 200 with no DB change', async () => {
    const event = {
      type: 'invoice.payment_failed',
      data: {
        object: {
          customer: 'cus_123',
          subscription: 'sub_stripe_123',
        },
      },
    }

    ;(stripe.webhooks.constructEvent as Mock).mockReturnValue(event)

    const request = createWebhookRequest(JSON.stringify(event))
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockAdminClient.from).not.toHaveBeenCalled()
  })

  it('handles unknown event type: returns 200', async () => {
    const event = {
      type: 'some.unknown.event',
      data: { object: {} },
    }

    ;(stripe.webhooks.constructEvent as Mock).mockReturnValue(event)

    const request = createWebhookRequest(JSON.stringify(event))
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockAdminClient.from).not.toHaveBeenCalled()
  })

  it('returns 500 when database update fails', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_123',
          subscription: 'sub_stripe_123',
          metadata: { userId: 'user-123' },
        },
      },
    }

    ;(stripe.webhooks.constructEvent as Mock).mockReturnValue(event)

    const errorBuilder = createMockQueryBuilder(null, { message: 'DB error' })
    mockAdminClient.from.mockReturnValue(errorBuilder)

    const request = createWebhookRequest(JSON.stringify(event))
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Webhook handler failed')
  })
})
