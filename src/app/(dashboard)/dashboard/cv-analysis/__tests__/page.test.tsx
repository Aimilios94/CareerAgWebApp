import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import CVAnalysisPage from '../page'

// Mock the hooks
vi.mock('@/hooks/useCV', () => ({
  useCV: vi.fn(() => ({
    latestCV: null,
    isLoading: false,
    error: null,
  })),
}))

vi.mock('@/hooks/useJobMatches', () => ({
  useJobMatches: vi.fn(() => ({
    matches: [],
    isLoading: false,
    error: null,
  })),
}))

describe('CVAnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Layout', () => {
    it('renders the page header', () => {
      render(<CVAnalysisPage />)

      expect(screen.getByRole('heading', { name: /cv analysis/i })).toBeInTheDocument()
    })

    it('renders two main panels (CV stats and job comparison)', () => {
      render(<CVAnalysisPage />)

      // Should have a split layout
      expect(screen.getByTestId('cv-stats-panel')).toBeInTheDocument()
      expect(screen.getByTestId('job-comparison-panel')).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('shows upload prompt when no CV exists', async () => {
      const { useCV } = await import('@/hooks/useCV')
      vi.mocked(useCV).mockReturnValue({
        latestCV: null,
        cvs: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<CVAnalysisPage />)

      // Both panels show upload prompts when no CV exists
      // CV stats panel shows "Upload your CV" and job comparison shows "Upload your CV first"
      const uploadPrompts = screen.getAllByText(/upload your cv/i)
      expect(uploadPrompts.length).toBeGreaterThanOrEqual(1)
    })

    it('shows job search prompt when no job matches exist', async () => {
      const { useCV } = await import('@/hooks/useCV')
      const { useJobMatches } = await import('@/hooks/useJobMatches')

      vi.mocked(useCV).mockReturnValue({
        latestCV: {
          id: 'cv-123',
          user_id: 'user-123',
          filename: 'resume.pdf',
          file_path: '/cvs/resume.pdf',
          parsed_data: { skills: ['React'], experience: [], education: [], summary: '' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        cvs: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(useJobMatches).mockReturnValue({
        matches: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<CVAnalysisPage />)

      expect(screen.getByText(/search for jobs/i)).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('shows loading skeleton while CV is loading', async () => {
      const { useCV } = await import('@/hooks/useCV')
      vi.mocked(useCV).mockReturnValue({
        latestCV: null,
        cvs: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      })

      render(<CVAnalysisPage />)

      expect(screen.getByTestId('cv-loading-skeleton')).toBeInTheDocument()
    })
  })

  describe('With Data', () => {
    it('renders CVStatsPanel with parsed data', async () => {
      const { useCV } = await import('@/hooks/useCV')
      vi.mocked(useCV).mockReturnValue({
        latestCV: {
          id: 'cv-123',
          user_id: 'user-123',
          filename: 'resume.pdf',
          file_path: '/cvs/resume.pdf',
          parsed_data: {
            skills: ['React', 'TypeScript', 'Node.js'],
            experience: [{ company: 'Tech Corp', role: 'Developer', dates: '2022-2024' }],
            education: [{ institution: 'MIT', degree: 'CS', year: '2020' }],
            summary: 'Skilled developer.',
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        cvs: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<CVAnalysisPage />)

      // Skills should be displayed
      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.getByText('Node.js')).toBeInTheDocument()
    })

    it('renders JobSelector when job matches exist', async () => {
      const { useCV } = await import('@/hooks/useCV')
      const { useJobMatches } = await import('@/hooks/useJobMatches')

      vi.mocked(useCV).mockReturnValue({
        latestCV: {
          id: 'cv-123',
          user_id: 'user-123',
          filename: 'resume.pdf',
          file_path: '/cvs/resume.pdf',
          parsed_data: { skills: ['React'], experience: [], education: [], summary: '' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        cvs: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(useJobMatches).mockReturnValue({
        matches: [
          {
            id: 'match-1',
            title: 'Frontend Developer',
            company: 'Tech Corp',
            location: 'Remote',
            salary: '$100k',
            url: null,
            postedDate: null,
            description: 'React developer needed',
            matchScore: 85,
            gapAnalysis: null,
            createdAt: new Date().toISOString(),
            searchId: null,
            searchQuery: null,
          },
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<CVAnalysisPage />)

      expect(screen.getByTestId('job-selector')).toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    it('shows error when CV fails to load', async () => {
      const { useCV } = await import('@/hooks/useCV')
      vi.mocked(useCV).mockReturnValue({
        latestCV: null,
        cvs: [],
        isLoading: false,
        error: 'Failed to fetch CVs',
        refetch: vi.fn(),
      })

      render(<CVAnalysisPage />)
      expect(screen.getByText('Failed to Load CV')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch CVs')).toBeInTheDocument()
    })

    it('shows error when job matches fail to load', async () => {
      const { useCV } = await import('@/hooks/useCV')
      const { useJobMatches } = await import('@/hooks/useJobMatches')

      vi.mocked(useCV).mockReturnValue({
        latestCV: {
          id: 'cv-1',
          user_id: 'u-1',
          filename: 'cv.pdf',
          file_path: '/cv.pdf',
          parsed_data: { skills: ['React'], experience: [], education: [], summary: '' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any,
        cvs: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(useJobMatches).mockReturnValue({
        matches: [],
        isLoading: false,
        error: 'Failed to fetch matches',
        refetch: vi.fn(),
      })

      render(<CVAnalysisPage />)
      expect(screen.getByText('Failed to Load Matches')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch matches')).toBeInTheDocument()
    })
  })
})
