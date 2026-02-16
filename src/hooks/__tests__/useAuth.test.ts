import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'

// Mock next/navigation with a STABLE router object to avoid useEffect infinite loop
const stableRouter = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }
vi.mock('next/navigation', () => ({
  useRouter: () => stableRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useParams: () => ({}),
}))

// Mock supabase client
const mockFrom = vi.fn()
const mockGetSession = vi.fn()
const mockSignOut = vi.fn()
const mockOnAuthStateChange = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  }),
}))

describe('useAuth - refreshSubscription', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockSession = { user: mockUser }

  // Create a thenable query builder that properly resolves when awaited.
  // .then() returns a real Promise so Promise.all works correctly.
  function createMockQueryBuilder(resolveData: unknown, resolveError: unknown = null) {
    const result = { data: resolveData, error: resolveError }
    const builder: Record<string, unknown> = {}

    builder.then = (resolve: (value: unknown) => void, reject?: (reason: unknown) => void) => {
      return Promise.resolve(result).then(resolve, reject)
    }
    builder.select = vi.fn(() => builder)
    builder.eq = vi.fn(() => builder)
    builder.single = vi.fn(() => builder)
    builder.order = vi.fn(() => builder)
    builder.limit = vi.fn(() => builder)

    return builder
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockGetSession.mockResolvedValue({ data: { session: mockSession } })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })

    // Default: return profile and free subscription
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return createMockQueryBuilder({ id: 'user-123', full_name: 'Test User' })
      }
      if (table === 'subscriptions') {
        return createMockQueryBuilder({
          id: 'sub-1',
          user_id: 'user-123',
          plan_type: 'free',
        })
      }
      return createMockQueryBuilder(null)
    })
  })

  it('exposes refreshSubscription function', async () => {
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 5000 })

    expect(typeof result.current.refreshSubscription).toBe('function')
  }, 10000)

  it('refreshSubscription updates subscription state and isPro', async () => {
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 5000 })

    expect(result.current.isPro).toBe(false)
    expect(result.current.subscription?.plan_type).toBe('free')

    // Now simulate upgrading: mock returns pro subscription on next query
    mockFrom.mockImplementation((table: string) => {
      if (table === 'subscriptions') {
        return createMockQueryBuilder({
          id: 'sub-1',
          user_id: 'user-123',
          plan_type: 'pro',
          stripe_customer_id: 'cus_123',
          stripe_subscription_id: 'sub_123',
        })
      }
      return createMockQueryBuilder(null)
    })

    await act(async () => {
      await result.current.refreshSubscription()
    })

    expect(result.current.isPro).toBe(true)
    expect(result.current.subscription?.plan_type).toBe('pro')
  }, 10000)

  it('refreshSubscription does nothing when no user is logged in', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 5000 })

    expect(result.current.user).toBeNull()

    // Should not throw
    await act(async () => {
      await result.current.refreshSubscription()
    })

    expect(result.current.subscription).toBeNull()
  }, 10000)
})
