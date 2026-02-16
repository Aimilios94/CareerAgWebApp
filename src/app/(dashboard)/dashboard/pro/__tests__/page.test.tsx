import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProPage from '../page'

// Stable router object to prevent useEffect infinite loops
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
}

// We need to override the global next/navigation mock from setup.tsx
// to control useSearchParams per-test
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/dashboard/pro',
  useParams: () => ({}),
}))

const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    session: null,
    profile: null,
    subscription: null,
    loading: false,
    isPro: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
    refreshSubscription: vi.fn(),
  })),
}))

import { useAuth } from '@/hooks/useAuth'

const mockedUseAuth = vi.mocked(useAuth)

describe('ProPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    mockToast.mockClear()

    mockedUseAuth.mockReturnValue({
      user: null,
      session: null,
      profile: null,
      subscription: null,
      loading: false,
      isPro: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
      refreshSubscription: vi.fn(),
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner when auth is loading', () => {
      mockedUseAuth.mockReturnValue({
        user: null,
        session: null,
        profile: null,
        subscription: null,
        loading: true,
        isPro: false,
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        refreshSubscription: vi.fn(),
      })

      render(<ProPage />)

      // The auth loading state shows a Loader2 icon
      // There's a Suspense fallback too, but the inner content should show loading
      const container = document.querySelector('.animate-spin')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Free User View', () => {
    it('shows "Upgrade to Pro" heading for free users', () => {
      render(<ProPage />)

      expect(
        screen.getByRole('heading', { name: /upgrade to pro/i })
      ).toBeInTheDocument()
    })

    it('shows the free plan description subtitle', () => {
      render(<ProPage />)

      expect(
        screen.getByText('Unlock powerful AI tools to supercharge your job search.')
      ).toBeInTheDocument()
    })

    it('renders the Free plan card with $0 price', () => {
      render(<ProPage />)

      expect(screen.getByText('Free')).toBeInTheDocument()
      expect(screen.getByText('$0')).toBeInTheDocument()
    })

    it('renders the Pro plan card with price', () => {
      render(<ProPage />)

      // Pro card title
      expect(screen.getByText('Pro')).toBeInTheDocument()
      // Pro price - $19.99
      expect(screen.getByText('$19.99')).toBeInTheDocument()
    })

    it('renders free plan features', () => {
      render(<ProPage />)

      expect(screen.getByText('Upload & parse CV')).toBeInTheDocument()
      expect(screen.getByText('Job search (5 per day)')).toBeInTheDocument()
      expect(screen.getByText('Basic match scores')).toBeInTheDocument()
      expect(screen.getByText('Skill gap analysis')).toBeInTheDocument()
    })

    it('renders pro plan features', () => {
      render(<ProPage />)

      expect(screen.getByText('Everything in Free')).toBeInTheDocument()
      expect(screen.getByText('Unlimited job searches')).toBeInTheDocument()
      expect(screen.getByText('Auto-Fix CV for each job')).toBeInTheDocument()
      expect(screen.getByText('AI cover letter drafts')).toBeInTheDocument()
      expect(screen.getByText('Interview prep questions')).toBeInTheDocument()
      expect(screen.getByText('Priority support')).toBeInTheDocument()
    })

    it('shows "Current Plan" button (disabled) on Free card', () => {
      render(<ProPage />)

      const currentPlanButton = screen.getByRole('button', { name: /current plan/i })
      expect(currentPlanButton).toBeDisabled()
    })

    it('shows "Upgrade to Pro" button on Pro card', () => {
      render(<ProPage />)

      const upgradeButton = screen.getByRole('button', { name: /upgrade to pro/i })
      expect(upgradeButton).toBeInTheDocument()
      expect(upgradeButton).not.toBeDisabled()
    })

    it('shows RECOMMENDED badge on Pro card', () => {
      render(<ProPage />)

      expect(screen.getByText('RECOMMENDED')).toBeInTheDocument()
    })

    it('calls checkout API when Upgrade button is clicked', async () => {
      const user = userEvent.setup()

      // Mock fetch for the checkout API
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/test' }),
      })
      global.fetch = mockFetch

      // Mock window.location.href setter
      const originalLocation = window.location
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, href: '' },
      })

      render(<ProPage />)

      const upgradeButton = screen.getByRole('button', { name: /upgrade to pro/i })
      await user.click(upgradeButton)

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/checkout', { method: 'POST' })

      // Restore
      Object.defineProperty(window, 'location', {
        writable: true,
        value: originalLocation,
      })
    })
  })

  describe('Pro User View', () => {
    it('shows "Your Subscription" heading for pro users', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: 'user-1' } as any,
        session: null,
        profile: null,
        subscription: {
          id: 'sub-1',
          user_id: 'user-1',
          plan_type: 'pro',
          stripe_customer_id: 'cus_123',
          stripe_subscription_id: 'sub_123',
          current_period_end: '2025-03-01T00:00:00Z',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any,
        loading: false,
        isPro: true,
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        refreshSubscription: vi.fn(),
      })

      render(<ProPage />)

      expect(screen.getByText('Your Subscription')).toBeInTheDocument()
    })

    it('shows "Pro Member" card title', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: 'user-1' } as any,
        session: null,
        profile: null,
        subscription: {
          id: 'sub-1',
          user_id: 'user-1',
          plan_type: 'pro',
          stripe_customer_id: 'cus_123',
          stripe_subscription_id: 'sub_123',
          current_period_end: '2025-03-01T00:00:00Z',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any,
        loading: false,
        isPro: true,
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        refreshSubscription: vi.fn(),
      })

      render(<ProPage />)

      expect(screen.getByText('Pro Member')).toBeInTheDocument()
    })

    it('shows the subscription management subtitle', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: 'user-1' } as any,
        session: null,
        profile: null,
        subscription: null,
        loading: false,
        isPro: true,
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        refreshSubscription: vi.fn(),
      })

      render(<ProPage />)

      expect(
        screen.getByText('Manage your Pro subscription and billing.')
      ).toBeInTheDocument()
    })

    it('shows "Manage Subscription" button for pro users', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: 'user-1' } as any,
        session: null,
        profile: null,
        subscription: null,
        loading: false,
        isPro: true,
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        refreshSubscription: vi.fn(),
      })

      render(<ProPage />)

      expect(
        screen.getByRole('button', { name: /manage subscription/i })
      ).toBeInTheDocument()
    })

    it('shows renewal date when subscription has period end', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: 'user-1' } as any,
        session: null,
        profile: null,
        subscription: {
          id: 'sub-1',
          user_id: 'user-1',
          plan_type: 'pro',
          stripe_customer_id: 'cus_123',
          stripe_subscription_id: 'sub_123',
          current_period_end: '2025-03-01T00:00:00Z',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any,
        loading: false,
        isPro: true,
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        refreshSubscription: vi.fn(),
      })

      render(<ProPage />)

      expect(screen.getByText('Renews on')).toBeInTheDocument()
      // The actual formatted date depends on locale, just check it exists
      expect(screen.getByText(/3\/1\/2025|2025/)).toBeInTheDocument()
    })
  })

  describe('Success Banner', () => {
    it('shows success banner when success=true in query params', () => {
      mockSearchParams = new URLSearchParams('success=true')

      render(<ProPage />)

      expect(
        screen.getByText(/welcome to pro.*your subscription is now active/i)
      ).toBeInTheDocument()
    })
  })

  describe('Canceled Banner', () => {
    it('shows canceled banner when canceled=true in query params', () => {
      mockSearchParams = new URLSearchParams('canceled=true')

      render(<ProPage />)

      expect(
        screen.getByText(/checkout was canceled.*no charges were made/i)
      ).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('shows error toast when checkout fails', async () => {
      const user = userEvent.setup()
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

      render(<ProPage />)
      const upgradeButton = screen.getByRole('button', { name: /upgrade to pro/i })
      await user.click(upgradeButton)

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Checkout failed',
          variant: 'destructive',
        })
      )
    })

    it('shows error toast when portal fails', async () => {
      const user = userEvent.setup()
      mockedUseAuth.mockReturnValue({
        user: { id: 'user-1' } as any,
        session: null,
        profile: null,
        subscription: { current_period_end: '2026-03-01' } as any,
        loading: false,
        isPro: true,
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        refreshSubscription: vi.fn(),
      })

      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Portal error'))

      render(<ProPage />)
      const manageButton = screen.getByRole('button', { name: /manage subscription/i })
      await user.click(manageButton)

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Portal unavailable',
          variant: 'destructive',
        })
      )
    })
  })
})
