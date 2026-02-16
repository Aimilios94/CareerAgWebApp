import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JobsPage from '../page'

// Mock the hooks
vi.mock('@/hooks/useJobMatches', () => ({
  useJobMatches: vi.fn(() => ({
    matches: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

import { useJobMatches } from '@/hooks/useJobMatches'

const mockedUseJobMatches = vi.mocked(useJobMatches)

function makeMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: (overrides.id as string) ?? 'match-1',
    title: (overrides.title as string) ?? 'Frontend Developer',
    company: (overrides.company as string) ?? 'Tech Corp',
    location: (overrides.location as string) ?? 'Remote',
    salary: (overrides.salary as string | null) ?? null,
    url: (overrides.url as string | null) ?? null,
    postedDate: (overrides.postedDate as string | null) ?? null,
    description: (overrides.description as string | null) ?? 'React developer needed',
    matchScore: (overrides.matchScore as number) ?? 75,
    gapAnalysis: (overrides.gapAnalysis as unknown) ?? null,
    createdAt: (overrides.createdAt as string) ?? new Date().toISOString(),
    searchId: (overrides.searchId as string | null) ?? null,
    searchQuery: (overrides.searchQuery as string | null) ?? null,
  }
}

describe('JobsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockedUseJobMatches.mockReturnValue({
      matches: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner when matches are loading', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      expect(screen.getByText('Loading job matches...')).toBeInTheDocument()
    })

    it('renders the page title during loading', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      expect(screen.getByText('Job Search')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no matches exist', () => {
      render(<JobsPage />)

      expect(screen.getByText('No Jobs Found')).toBeInTheDocument()
    })

    it('shows instruction text when empty', () => {
      render(<JobsPage />)

      expect(
        screen.getByText(/start by searching for jobs on the dashboard/i)
      ).toBeInTheDocument()
    })

    it('provides a link to the dashboard when empty', () => {
      render(<JobsPage />)

      const link = screen.getByRole('link', { name: /go to dashboard/i })
      expect(link).toHaveAttribute('href', '/dashboard')
    })
  })

  describe('With Data', () => {
    it('displays total match count in the header', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1' }),
          makeMatch({ id: '2' }),
          makeMatch({ id: '3' }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      expect(screen.getByText(/matched opportunities from your searches/i)).toBeInTheDocument()
    })

    it('renders job cards with title, company, and location', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({
            id: '1',
            title: 'React Developer',
            company: 'Acme Inc',
            location: 'Berlin',
            matchScore: 70,
          }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      expect(screen.getByText('React Developer')).toBeInTheDocument()
      expect(screen.getByText('Acme Inc')).toBeInTheDocument()
      expect(screen.getByText('Berlin')).toBeInTheDocument()
    })

    it('renders match score percentage for each job', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', matchScore: 82 }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      expect(screen.getByText('82%')).toBeInTheDocument()
    })

    it('links each job card to the job detail page', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: 'job-99', title: 'DevOps Engineer', matchScore: 70 }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      const link = screen.getByRole('link', { name: /devops engineer/i })
      expect(link).toHaveAttribute('href', '/dashboard/jobs/job-99')
    })

    it('shows salary when available and not "not listed"', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', salary: '$90k - $130k', matchScore: 70 }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      expect(screen.getByText('$90k - $130k')).toBeInTheDocument()
    })

    it('hides salary when it is "Not listed"', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', salary: 'Not listed', matchScore: 70 }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      expect(screen.queryByText('Not listed')).not.toBeInTheDocument()
    })

    it('shows posted date when available', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', postedDate: '3 days ago', matchScore: 70 }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      expect(screen.getByText('Posted 3 days ago')).toBeInTheDocument()
    })
  })

  describe('Filtering', () => {
    it('renders the filter input', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [makeMatch({ id: '1' })],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      expect(
        screen.getByPlaceholderText(/filter by title, company, or location/i)
      ).toBeInTheDocument()
    })

    it('filters jobs by title', async () => {
      const user = userEvent.setup()

      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', title: 'React Developer', matchScore: 80 }),
          makeMatch({ id: '2', title: 'Python Engineer', matchScore: 70 }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      const filterInput = screen.getByPlaceholderText(/filter by title, company, or location/i)
      await user.type(filterInput, 'React')

      expect(screen.getByText('React Developer')).toBeInTheDocument()
      expect(screen.queryByText('Python Engineer')).not.toBeInTheDocument()
    })

    it('filters jobs by company name', async () => {
      const user = userEvent.setup()

      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', company: 'Google', matchScore: 80 }),
          makeMatch({ id: '2', company: 'Meta', matchScore: 70 }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      const filterInput = screen.getByPlaceholderText(/filter by title, company, or location/i)
      await user.type(filterInput, 'Google')

      expect(screen.getByText('Google')).toBeInTheDocument()
      expect(screen.queryByText('Meta')).not.toBeInTheDocument()
    })

    it('shows "no jobs match" message when filter yields no results', async () => {
      const user = userEvent.setup()

      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', title: 'React Dev', matchScore: 70 }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      const filterInput = screen.getByPlaceholderText(/filter by title, company, or location/i)
      await user.type(filterInput, 'xyz_nonexistent')

      expect(screen.getByText(/no jobs match/i)).toBeInTheDocument()
    })

    it('shows "Clear filter" button when filter yields no results', async () => {
      const user = userEvent.setup()

      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', title: 'React Dev', matchScore: 70 }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      const filterInput = screen.getByPlaceholderText(/filter by title, company, or location/i)
      await user.type(filterInput, 'xyz_nonexistent')

      const clearButton = screen.getByRole('button', { name: /clear filter/i })
      expect(clearButton).toBeInTheDocument()
    })

    it('shows filter result count when filtering', async () => {
      const user = userEvent.setup()

      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', title: 'React Dev', matchScore: 80 }),
          makeMatch({ id: '2', title: 'React Engineer', matchScore: 70 }),
          makeMatch({ id: '3', title: 'Python Dev', matchScore: 60 }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      const filterInput = screen.getByPlaceholderText(/filter by title, company, or location/i)
      await user.type(filterInput, 'React')

      // "Showing 2 of 3 jobs"
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText(/of 3 jobs/i)).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('renders the sort dropdown with default "Sort by Match Score"', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [makeMatch({ id: '1' })],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      const sortSelect = screen.getByDisplayValue('Sort by Match Score')
      expect(sortSelect).toBeInTheDocument()
    })

    it('sorts jobs by score by default (highest first)', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', title: 'Low Score Job', matchScore: 40 }),
          makeMatch({ id: '2', title: 'High Score Job', matchScore: 95 }),
          makeMatch({ id: '3', title: 'Mid Score Job', matchScore: 70 }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      const links = screen.getAllByRole('link')
      // First link should be the highest score
      expect(links[0]).toHaveTextContent('High Score Job')
    })
  })

  describe('Error State', () => {
    it('shows error message when job matches fail to load', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [],
        isLoading: false,
        error: 'Failed to fetch matches',
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      expect(screen.getByText('Failed to fetch matches')).toBeInTheDocument()
    })

    it('shows retry button when there is an error', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [],
        isLoading: false,
        error: 'Failed to fetch matches',
        refetch: vi.fn(),
      })

      render(<JobsPage />)

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('calls refetch when retry button is clicked', async () => {
      const user = userEvent.setup()
      const mockRefetch = vi.fn()

      mockedUseJobMatches.mockReturnValue({
        matches: [],
        isLoading: false,
        error: 'Failed to fetch matches',
        refetch: mockRefetch,
      })

      render(<JobsPage />)

      await user.click(screen.getByRole('button', { name: /try again/i }))

      expect(mockRefetch).toHaveBeenCalledOnce()
    })
  })

  describe('High Score Indicator', () => {
    it('does not show sparkle icon for jobs below 80%', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', title: 'Regular Job', matchScore: 70 }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      const { container } = render(<JobsPage />)

      // Sparkles icon should not be rendered for 70% match
      const sparkles = container.querySelectorAll('.lucide-sparkles')
      expect(sparkles.length).toBe(0)
    })

    it('shows sparkle icon for jobs with 80%+ score', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', title: 'Great Match', matchScore: 85 }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      const { container } = render(<JobsPage />)

      // Sparkles icon should be rendered for 85% match
      const sparkles = container.querySelectorAll('.lucide-sparkles')
      expect(sparkles.length).toBe(1)
    })
  })
})
