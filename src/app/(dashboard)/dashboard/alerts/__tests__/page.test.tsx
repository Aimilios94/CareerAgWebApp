import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AlertsPage from '../page'

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

describe('AlertsPage', () => {
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

      render(<AlertsPage />)

      expect(screen.getByText('Loading alerts...')).toBeInTheDocument()
    })

    it('renders the page title during loading', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      })

      render(<AlertsPage />)

      expect(screen.getByText('Job Alerts')).toBeInTheDocument()
    })

    it('shows the subtitle during loading', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      })

      render(<AlertsPage />)

      expect(screen.getByText('Notifications for high-match opportunities.')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no matches exist', () => {
      render(<AlertsPage />)

      expect(screen.getByText('No Alerts Yet')).toBeInTheDocument()
    })

    it('shows instruction text when empty', () => {
      render(<AlertsPage />)

      expect(
        screen.getByText(/search for jobs to start receiving match alerts/i)
      ).toBeInTheDocument()
    })

    it('provides a link to search jobs when empty', () => {
      render(<AlertsPage />)

      const link = screen.getByRole('link', { name: /search jobs/i })
      expect(link).toHaveAttribute('href', '/dashboard')
    })
  })

  describe('High Score Alerts', () => {
    it('shows "Top Matches" section for 75%+ matches', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', matchScore: 90, title: 'Senior React Dev' }),
          makeMatch({ id: '2', matchScore: 80, title: 'Full Stack Engineer' }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<AlertsPage />)

      expect(screen.getByText('Top Matches')).toBeInTheDocument()
    })

    it('displays the alert count badge', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', matchScore: 90 }),
          makeMatch({ id: '2', matchScore: 85 }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<AlertsPage />)

      expect(screen.getByText('2 alerts')).toBeInTheDocument()
    })

    it('renders high-score match cards with score, title, company, and location', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({
            id: '1',
            matchScore: 85,
            title: 'React Developer',
            company: 'Acme Inc',
            location: 'New York',
          }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<AlertsPage />)

      expect(screen.getByText('85%')).toBeInTheDocument()
      expect(screen.getByText('React Developer')).toBeInTheDocument()
      expect(screen.getByText('Acme Inc')).toBeInTheDocument()
      expect(screen.getByText('New York')).toBeInTheDocument()
    })

    it('links high-score alert cards to the job detail page', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: 'job-42', matchScore: 90, title: 'Engineer' }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<AlertsPage />)

      const link = screen.getByRole('link', { name: /engineer/i })
      expect(link).toHaveAttribute('href', '/dashboard/jobs/job-42')
    })

    it('shows salary for high-score alerts when available and not "not listed"', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', matchScore: 90, salary: '$120k - $160k' }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<AlertsPage />)

      expect(screen.getByText('$120k - $160k')).toBeInTheDocument()
    })

    it('hides salary when it is "Not listed"', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', matchScore: 90, salary: 'Not listed' }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<AlertsPage />)

      expect(screen.queryByText('Not listed')).not.toBeInTheDocument()
    })
  })

  describe('Other Matches (below 75%)', () => {
    it('shows "Other Matches" section for sub-75% matches', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', matchScore: 60, title: 'Junior Dev' }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<AlertsPage />)

      expect(screen.getByText('Other Matches')).toBeInTheDocument()
    })

    it('displays the count of other matches', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', matchScore: 50 }),
          makeMatch({ id: '2', matchScore: 60 }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<AlertsPage />)

      expect(screen.getByText('2 results')).toBeInTheDocument()
    })

    it('shows other match titles and companies', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({
            id: '1',
            matchScore: 50,
            title: 'Data Analyst',
            company: 'DataCo',
            location: 'Berlin',
          }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<AlertsPage />)

      expect(screen.getByText('Data Analyst')).toBeInTheDocument()
      // Company and location are joined with middot in the same element
      expect(screen.getByText(/DataCo/)).toBeInTheDocument()
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

      render(<AlertsPage />)

      expect(screen.getByText('Failed to fetch matches')).toBeInTheDocument()
    })

    it('shows retry button when there is an error', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [],
        isLoading: false,
        error: 'Failed to fetch matches',
        refetch: vi.fn(),
      })

      render(<AlertsPage />)

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

      render(<AlertsPage />)

      await user.click(screen.getByRole('button', { name: /try again/i }))

      expect(mockRefetch).toHaveBeenCalledOnce()
    })
  })

  describe('Mixed Scores', () => {
    it('splits matches correctly into high-score alerts and other matches', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', matchScore: 90, title: 'Senior Eng' }),
          makeMatch({ id: '2', matchScore: 75, title: 'Mid Eng' }),
          makeMatch({ id: '3', matchScore: 60, title: 'Junior Eng' }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<AlertsPage />)

      // 2 high-score alerts (90% and 75%)
      expect(screen.getByText('2 alerts')).toBeInTheDocument()
      // 1 other match (60%)
      expect(screen.getByText('1 results')).toBeInTheDocument()
    })

    it('shows high-score alert count in header subtitle', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [
          makeMatch({ id: '1', matchScore: 80 }),
          makeMatch({ id: '2', matchScore: 85 }),
          makeMatch({ id: '3', matchScore: 50 }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<AlertsPage />)

      // Header shows "2 high-match alerts from your recent searches."
      expect(screen.getByText(/high-match alerts from your recent searches/i)).toBeInTheDocument()
    })
  })
})
