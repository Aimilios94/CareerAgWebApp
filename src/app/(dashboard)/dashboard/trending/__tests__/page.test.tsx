import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TrendingPage from '../page'

// Mock the hooks
vi.mock('@/hooks/useJobMatches', () => ({
  useJobMatches: vi.fn(() => ({
    matches: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

vi.mock('@/hooks/useCV', () => ({
  useCV: vi.fn(() => ({
    latestCV: null,
    cvs: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

// Mock the skills lib so we control its behavior
vi.mock('@/lib/skills', () => ({
  getJobSkills: vi.fn((_gap: unknown, _desc: unknown) => []),
  normalizeSkill: vi.fn((s: string) => s.toLowerCase().trim().replace(/[^a-z0-9+#]/g, '')),
  getVariations: vi.fn((s: string) => [s.toLowerCase().trim().replace(/[^a-z0-9+#]/g, '')]),
}))

function makeMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: (overrides.id as string) ?? 'match-1',
    title: (overrides.title as string) ?? 'Frontend Developer',
    company: (overrides.company as string) ?? 'Tech Corp',
    location: (overrides.location as string) ?? 'Remote',
    salary: (overrides.salary as string | null) ?? null,
    url: (overrides.url as string | null) ?? null,
    postedDate: (overrides.postedDate as string | null) ?? null,
    description: (overrides.description as string | null) ?? 'React and TypeScript needed',
    matchScore: (overrides.matchScore as number) ?? 75,
    gapAnalysis: (overrides.gapAnalysis as unknown) ?? null,
    createdAt: (overrides.createdAt as string) ?? new Date().toISOString(),
    searchId: (overrides.searchId as string | null) ?? null,
    searchQuery: (overrides.searchQuery as string | null) ?? null,
  }
}

// Import mocked modules for easy access
import { useJobMatches } from '@/hooks/useJobMatches'
import { useCV } from '@/hooks/useCV'
import { getJobSkills } from '@/lib/skills'

const mockedUseJobMatches = vi.mocked(useJobMatches)
const mockedUseCV = vi.mocked(useCV)
const mockedGetJobSkills = vi.mocked(getJobSkills)

describe('TrendingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset to default return values after clearAllMocks
    mockedUseJobMatches.mockReturnValue({
      matches: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    mockedUseCV.mockReturnValue({
      latestCV: null,
      cvs: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    mockedGetJobSkills.mockReturnValue([])
  })

  describe('Loading State', () => {
    it('shows loading spinner when matches are loading', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      })

      render(<TrendingPage />)

      expect(screen.getByText('Analyzing market trends...')).toBeInTheDocument()
    })

    it('shows loading spinner when CV is loading', () => {
      mockedUseCV.mockReturnValue({
        latestCV: null,
        cvs: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      })

      render(<TrendingPage />)

      expect(screen.getByText('Analyzing market trends...')).toBeInTheDocument()
    })

    it('renders the page title during loading', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      })

      render(<TrendingPage />)

      expect(screen.getByText('Skills Trending')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no matches exist', () => {
      render(<TrendingPage />)

      expect(screen.getByText('No Data Yet')).toBeInTheDocument()
    })

    it('shows instruction to search for jobs when empty', () => {
      render(<TrendingPage />)

      expect(
        screen.getByText(/search for jobs first to see which skills are trending/i)
      ).toBeInTheDocument()
    })

    it('provides a link back to dashboard when empty', () => {
      render(<TrendingPage />)

      const link = screen.getByRole('link', { name: /search jobs/i })
      expect(link).toHaveAttribute('href', '/dashboard')
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

      render(<TrendingPage />)

      expect(screen.getByText('Failed to fetch matches')).toBeInTheDocument()
    })

    it('shows retry button when there is an error', () => {
      mockedUseJobMatches.mockReturnValue({
        matches: [],
        isLoading: false,
        error: 'Failed to fetch matches',
        refetch: vi.fn(),
      })

      render(<TrendingPage />)

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

      render(<TrendingPage />)

      await user.click(screen.getByRole('button', { name: /try again/i }))

      expect(mockRefetch).toHaveBeenCalledOnce()
    })
  })

  describe('With Data', () => {
    it('displays matched jobs count in the header', () => {
      mockedGetJobSkills.mockReturnValue(['React', 'TypeScript'])

      mockedUseJobMatches.mockReturnValue({
        matches: [makeMatch({ id: '1' }), makeMatch({ id: '2' })],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<TrendingPage />)

      // The header has "Market demand from <span>2</span> matched jobs..."
      const headerText = screen.getByText(/matched jobs in your search history/i)
      expect(headerText).toBeInTheDocument()
      // The span with "2" is inside the header paragraph
      expect(headerText.querySelector('span')).toHaveTextContent('2')
    })

    it('displays stats overview cards when data is present', () => {
      mockedGetJobSkills.mockReturnValue(['React'])

      mockedUseJobMatches.mockReturnValue({
        matches: [makeMatch({ id: '1' })],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<TrendingPage />)

      expect(screen.getByText('Total Skills')).toBeInTheDocument()
      expect(screen.getByText('You Have')).toBeInTheDocument()
      expect(screen.getByText('Gaps')).toBeInTheDocument()
      expect(screen.getByText('Coverage')).toBeInTheDocument()
    })

    it('renders the Most In-Demand Skills section', () => {
      mockedGetJobSkills.mockReturnValue(['React', 'Node.js'])

      mockedUseJobMatches.mockReturnValue({
        matches: [makeMatch({ id: '1' }), makeMatch({ id: '2' })],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<TrendingPage />)

      expect(screen.getByText('Most In-Demand Skills')).toBeInTheDocument()
    })

    it('shows trending skill names from job matches', () => {
      mockedGetJobSkills.mockReturnValue(['React', 'TypeScript'])

      mockedUseJobMatches.mockReturnValue({
        matches: [makeMatch({ id: '1' })],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<TrendingPage />)

      // Skills appear in both the top-15 list and the category section
      const reactElements = screen.getAllByText('React')
      expect(reactElements.length).toBeGreaterThanOrEqual(1)
      const tsElements = screen.getAllByText('TypeScript')
      expect(tsElements.length).toBeGreaterThanOrEqual(1)
    })

    it('renders the legend with status labels', () => {
      mockedGetJobSkills.mockReturnValue(['React'])

      mockedUseJobMatches.mockReturnValue({
        matches: [makeMatch({ id: '1' })],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<TrendingPage />)

      expect(screen.getByText('In your CV')).toBeInTheDocument()
      expect(screen.getByText('Partial match')).toBeInTheDocument()
      expect(screen.getByText('Skill gap')).toBeInTheDocument()
    })

    it('shows "+N more skills tracked" when more than 15 skills exist', () => {
      // Generate 20 unique skills
      const manySkills = Array.from({ length: 20 }, (_, i) => `Skill${i}`)
      mockedGetJobSkills.mockReturnValue(manySkills)

      mockedUseJobMatches.mockReturnValue({
        matches: [makeMatch({ id: '1' })],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<TrendingPage />)

      expect(screen.getByText(/\+ 5 more skills tracked/)).toBeInTheDocument()
    })

    it('groups skills by category and shows category headings', () => {
      // Return skills that map to known categories
      // "React" lowercase "react" is in Frontend, "Python" lowercase "python" is in Backend
      mockedGetJobSkills.mockReturnValue(['React', 'Python'])

      mockedUseJobMatches.mockReturnValue({
        matches: [makeMatch({ id: '1' })],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<TrendingPage />)

      // The component uses getCategory which checks SKILL_CATEGORIES
      // "react" is in Frontend, "python" is in Backend and Languages
      expect(screen.getByText('Frontend')).toBeInTheDocument()
    })

    it('computes coverage percentage based on matched skills', () => {
      // Provide user skills via CV so some skills get "matched" status
      mockedUseCV.mockReturnValue({
        latestCV: {
          id: 'cv-1',
          user_id: 'user-1',
          filename: 'resume.pdf',
          file_path: '/cvs/resume.pdf',
          parsed_data: { skills: ['React'] },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        cvs: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      // getVariations is mocked to just return the lowercase, so matching
      // "React" in CV vs "React" in job skills should match
      mockedGetJobSkills.mockReturnValue(['React', 'TypeScript'])

      mockedUseJobMatches.mockReturnValue({
        matches: [makeMatch({ id: '1' })],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<TrendingPage />)

      // Coverage card should show some percentage
      expect(screen.getByText('Coverage')).toBeInTheDocument()
      // With 1 matched out of 2 skills: (1 + 0) / 2 * 100 = 50%
      expect(screen.getByText('50%')).toBeInTheDocument()
    })
  })
})
