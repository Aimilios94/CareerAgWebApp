import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SavedSearchCard } from '../SavedSearchCard'

// Mock useSavedSearches hook
const mockRerun = vi.fn()
const mockDelete = vi.fn()
vi.mock('@/hooks/useSavedSearches', () => ({
  useRerunSavedSearch: () => ({
    mutateAsync: mockRerun,
    isPending: false,
  }),
  useDeleteSavedSearch: () => ({
    mutateAsync: mockDelete,
    isPending: false,
  }),
}))

const defaultProps = {
  id: 'saved-1',
  name: 'My React Search',
  query: 'react developer',
  matchCount: 12,
  createdAt: '2025-01-15T10:00:00Z',
  searchId: 'search-1',
}

describe('SavedSearchCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRerun.mockResolvedValue({ success: true })
    mockDelete.mockResolvedValue({ success: true })
  })

  it('renders saved search name', () => {
    render(<SavedSearchCard {...defaultProps} />)
    expect(screen.getByText('My React Search')).toBeInTheDocument()
  })

  it('renders search query', () => {
    render(<SavedSearchCard {...defaultProps} />)
    expect(screen.getByText('react developer')).toBeInTheDocument()
  })

  it('renders match count', () => {
    render(<SavedSearchCard {...defaultProps} />)
    expect(screen.getByText(/12 matches/i)).toBeInTheDocument()
  })

  it('renders saved date', () => {
    render(<SavedSearchCard {...defaultProps} />)
    // The component will use formatDistanceToNow or similar
    // Just check that a date-related element exists
    expect(screen.getByTestId('saved-search-date')).toBeInTheDocument()
  })

  it('re-run button calls rerun mutation', async () => {
    const user = userEvent.setup()
    render(<SavedSearchCard {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /re-run/i }))

    expect(mockRerun).toHaveBeenCalledWith({ id: 'saved-1' })
  })

  it('delete button calls delete mutation', async () => {
    const user = userEvent.setup()
    render(<SavedSearchCard {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(mockDelete).toHaveBeenCalledWith({ id: 'saved-1' })
  })

  it('has view results link pointing to correct URL', () => {
    render(<SavedSearchCard {...defaultProps} />)
    // The next/link mock renders a plain <a> with href and children
    const links = screen.getAllByRole('link')
    const viewLink = links.find((l) => l.getAttribute('href') === '/dashboard?searchId=search-1')
    expect(viewLink).toBeTruthy()
  })

  it('renders singular match text for 1 match', () => {
    render(<SavedSearchCard {...defaultProps} matchCount={1} />)
    expect(screen.getByText(/1 match$/i)).toBeInTheDocument()
  })
})
