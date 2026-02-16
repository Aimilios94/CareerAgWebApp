import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import DashboardPage from '../page'

// Track mock return values so we can change them per test
const mockUseJobMatches = vi.fn()
const mockUseCV = vi.fn()
const mockUseProfile = vi.fn()
const mockUseSearchPolling = vi.fn()

vi.mock('@/hooks/useCV', () => ({
  useCV: (...args: unknown[]) => mockUseCV(...args),
}))

vi.mock('@/hooks/useJobMatches', () => ({
  useJobMatches: (...args: unknown[]) => mockUseJobMatches(...args),
}))

vi.mock('@/hooks/useProfile', () => ({
  useProfile: (...args: unknown[]) => mockUseProfile(...args),
}))

vi.mock('@/hooks/useSearchPolling', () => ({
  useSearchPolling: (...args: unknown[]) => mockUseSearchPolling(...args),
}))

vi.mock('@/hooks/useSemanticRank', () => ({
  useSemanticRank: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })),
}))

vi.mock('@/hooks/useSavedSearches', () => ({
  useSaveSearch: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}))

const { mockToast } = vi.hoisted(() => ({
  mockToast: vi.fn(),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: mockToast,
    toasts: [],
    dismiss: vi.fn(),
  })),
  toast: mockToast,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
  useParams: () => ({}),
}))

describe('Dashboard match error toast', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: all hooks return non-error states
    mockUseCV.mockReturnValue({
      latestCV: null,
      cvs: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    mockUseProfile.mockReturnValue({
      profile: { full_name: 'Test User' },
      isLoading: false,
      error: null,
    })

    mockUseSearchPolling.mockReturnValue({
      searchId: null,
      status: 'idle',
      matches: [],
      error: null,
      startSearch: vi.fn(),
      reset: vi.fn(),
    })

    mockUseJobMatches.mockReturnValue({
      matches: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  it('shows a destructive toast when useJobMatches returns an error', async () => {
    mockUseJobMatches.mockReturnValue({
      matches: [],
      isLoading: false,
      error: 'Failed to fetch matches',
      refetch: vi.fn(),
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
        })
      )
    })
  })

  it('includes the error message in the toast description', async () => {
    mockUseJobMatches.mockReturnValue({
      matches: [],
      isLoading: false,
      error: 'Failed to fetch matches',
      refetch: vi.fn(),
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringMatching(/match|error|failed/i),
          description: expect.stringContaining('Failed to fetch matches'),
          variant: 'destructive',
        })
      )
    })
  })

  it('does not show a toast when there is no error', () => {
    mockUseJobMatches.mockReturnValue({
      matches: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<DashboardPage />)

    expect(mockToast).not.toHaveBeenCalled()
  })

  it('does not show a toast while matches are still loading', () => {
    mockUseJobMatches.mockReturnValue({
      matches: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(<DashboardPage />)

    expect(mockToast).not.toHaveBeenCalled()
  })
})
