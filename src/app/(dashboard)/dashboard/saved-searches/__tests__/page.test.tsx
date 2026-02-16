import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SavedSearchesPage from '../page'

// Mock useSavedSearches hook
const mockUseSavedSearches = vi.fn()
vi.mock('@/hooks/useSavedSearches', () => ({
  useSavedSearches: () => mockUseSavedSearches(),
  useRerunSavedSearch: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteSavedSearch: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

describe('SavedSearchesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title', () => {
    mockUseSavedSearches.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })

    render(<SavedSearchesPage />)
    expect(screen.getByText('Saved Searches')).toBeInTheDocument()
  })

  it('renders page description', () => {
    mockUseSavedSearches.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })

    render(<SavedSearchesPage />)
    expect(screen.getByText(/quickly re-run your favorite/i)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseSavedSearches.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    render(<SavedSearchesPage />)
    // Loading skeleton should render pulse elements
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows empty state when no saved searches', () => {
    mockUseSavedSearches.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })

    render(<SavedSearchesPage />)
    expect(screen.getByText(/no saved searches yet/i)).toBeInTheDocument()
  })

  it('shows link to dashboard in empty state', () => {
    mockUseSavedSearches.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })

    render(<SavedSearchesPage />)
    const link = screen.getByRole('link', { name: /start searching/i })
    expect(link).toHaveAttribute('href', '/dashboard')
  })

  it('renders saved search cards when data exists', () => {
    mockUseSavedSearches.mockReturnValue({
      data: [
        {
          id: 'saved-1',
          name: 'React Developer Jobs',
          query: 'react developer',
          matchCount: 5,
          createdAt: '2025-01-15T10:00:00Z',
          searchId: 'search-1',
        },
        {
          id: 'saved-2',
          name: 'Node.js Roles',
          query: 'node.js engineer',
          matchCount: 3,
          createdAt: '2025-01-14T10:00:00Z',
          searchId: 'search-2',
        },
      ],
      isLoading: false,
      error: null,
    })

    render(<SavedSearchesPage />)
    expect(screen.getByText('React Developer Jobs')).toBeInTheDocument()
    expect(screen.getByText('Node.js Roles')).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockUseSavedSearches.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    })

    render(<SavedSearchesPage />)
    expect(screen.getByText('Failed to load')).toBeInTheDocument()
  })

  it('does not show loading when data is loaded', () => {
    mockUseSavedSearches.mockReturnValue({
      data: [
        {
          id: 'saved-1',
          name: 'My Search',
          query: 'developer',
          matchCount: 2,
          createdAt: '2025-01-15T10:00:00Z',
          searchId: 'search-1',
        },
      ],
      isLoading: false,
      error: null,
    })

    render(<SavedSearchesPage />)
    // Should NOT have skeleton elements
    const pulseElements = document.querySelectorAll('.animate-pulse')
    expect(pulseElements.length).toBe(0)
  })

  it('does not show empty state when searches exist', () => {
    mockUseSavedSearches.mockReturnValue({
      data: [
        {
          id: 'saved-1',
          name: 'My Search',
          query: 'developer',
          matchCount: 2,
          createdAt: '2025-01-15T10:00:00Z',
          searchId: 'search-1',
        },
      ],
      isLoading: false,
      error: null,
    })

    render(<SavedSearchesPage />)
    expect(screen.queryByText(/no saved searches yet/i)).not.toBeInTheDocument()
  })

  it('does not show error state when no error', () => {
    mockUseSavedSearches.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })

    render(<SavedSearchesPage />)
    expect(screen.queryByText('Failed to load')).not.toBeInTheDocument()
  })

  it('shows retry button in error state', () => {
    mockUseSavedSearches.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch: vi.fn(),
    })

    render(<SavedSearchesPage />)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('calls refetch when retry button is clicked', async () => {
    const user = userEvent.setup()
    const mockRefetch = vi.fn()
    mockUseSavedSearches.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch: mockRefetch,
    })

    render(<SavedSearchesPage />)
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })
})
