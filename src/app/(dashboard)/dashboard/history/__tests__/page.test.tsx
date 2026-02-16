import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HistoryPage from '../page'

// Mock hooks
const mockUseSearchHistory = vi.fn()
vi.mock('@/hooks/useSearchHistory', () => ({
  useSearchHistory: () => mockUseSearchHistory(),
}))

vi.mock('@/components/dashboard/SaveSearchButton', () => ({
  SaveSearchButton: () => <div data-testid="save-search-button" />,
}))

vi.mock('@/lib/utils', () => ({
  formatDistanceToNow: () => '2 hours ago',
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' '),
}))

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSearchHistory.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  it('renders page title', () => {
    render(<HistoryPage />)
    expect(screen.getByText('Search History')).toBeInTheDocument()
  })

  it('shows loading skeleton when loading', () => {
    mockUseSearchHistory.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })
    render(<HistoryPage />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows empty state when no searches', () => {
    render(<HistoryPage />)
    expect(screen.getByText('No Search History')).toBeInTheDocument()
  })

  it('shows error state with message', () => {
    mockUseSearchHistory.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load history'),
      refetch: vi.fn(),
    })
    render(<HistoryPage />)
    expect(screen.getByText('Failed to Load History')).toBeInTheDocument()
    expect(screen.getByText('Failed to load history')).toBeInTheDocument()
  })

  it('shows retry button in error state', () => {
    mockUseSearchHistory.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: vi.fn(),
    })
    render(<HistoryPage />)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('calls refetch when retry button is clicked', async () => {
    const user = userEvent.setup()
    const mockRefetch = vi.fn()
    mockUseSearchHistory.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    })
    render(<HistoryPage />)
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('renders search history cards when data exists', () => {
    mockUseSearchHistory.mockReturnValue({
      data: [
        {
          id: 'search-1',
          query: 'React Developer',
          status: 'completed',
          matchCount: 5,
          createdAt: new Date().toISOString(),
          filters: {},
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    render(<HistoryPage />)
    expect(screen.getByText('React Developer')).toBeInTheDocument()
  })
})
