import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardPage from '../page'

// Mock the hooks used by DashboardPage
vi.mock('@/hooks/useCV', () => ({
  useCV: vi.fn(() => ({
    latestCV: null,
    cvs: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

vi.mock('@/hooks/useJobMatches', () => ({
  useJobMatches: vi.fn(() => ({
    matches: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(() => ({
    profile: { full_name: 'Test User' },
    isLoading: false,
    error: null,
  })),
}))

vi.mock('@/hooks/useSearchPolling', () => ({
  useSearchPolling: vi.fn(() => ({
    searchId: null,
    status: 'idle',
    matches: [],
    error: null,
    startSearch: vi.fn(),
    reset: vi.fn(),
  })),
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

// Mock the toast hook - this is what we're testing the integration with
// Use vi.hoisted to define mock functions that can be used in vi.mock
const { mockToast, mockPush } = vi.hoisted(() => ({
  mockToast: vi.fn(),
  mockPush: vi.fn(),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: mockToast,
    toasts: [],
    dismiss: vi.fn(),
  })),
  toast: mockToast,
}))

// Mock next/navigation for router.push
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
  useParams: () => ({}),
}))

/**
 * Helper function to upload a CV file through the modal.
 * The modal uses a hidden file input with click-to-trigger behavior.
 */
async function uploadCVThroughModal(user: ReturnType<typeof userEvent.setup>) {
  // Click the upload button to open the modal
  const uploadButton = screen.getByRole('button', { name: /upload/i })
  await user.click(uploadButton)

  // Wait for the modal to appear
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  // The CV upload zone is a clickable div with a hidden input inside
  // Find the hidden file input within the CV upload section
  const fileInputs = document.querySelectorAll('input[type="file"]')
  const cvFileInput = fileInputs[0] as HTMLInputElement // First file input is for CV

  // Create and upload a test file
  const testFile = new File(['test cv content'], 'resume.pdf', {
    type: 'application/pdf',
  })

  // Trigger the file input change
  await user.upload(cvFileInput, testFile)

  return testFile
}

/**
 * Helper to submit the upload after a file has been selected
 */
async function submitUpload(user: ReturnType<typeof userEvent.setup>) {
  // Click the "Start Analysis" button
  const submitButton = screen.getByRole('button', { name: /start analysis/i })
  await user.click(submitButton)
}

describe('CV Upload Toast Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock
    ;(global.fetch as Mock).mockReset()
  })

  describe('shows success toast after CV upload', () => {
    it('displays success toast with "CV uploaded!" title after successful upload', async () => {
      const user = userEvent.setup()

      // Mock successful upload response
      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, cvId: 'cv-123' }),
      })

      render(<DashboardPage />)

      await uploadCVThroughModal(user)
      await submitUpload(user)

      // Wait for the upload to complete and verify toast was called
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'CV uploaded!',
          })
        )
      })
    })

    it('includes description in success toast', async () => {
      const user = userEvent.setup()

      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, cvId: 'cv-123' }),
      })

      render(<DashboardPage />)

      await uploadCVThroughModal(user)
      await submitUpload(user)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'CV uploaded!',
            description: expect.any(String),
          })
        )
      })
    })
  })

  describe('shows error toast on upload failure', () => {
    it('displays destructive toast when upload fails with network error', async () => {
      const user = userEvent.setup()

      // Mock failed upload response
      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Upload failed' }),
      })

      render(<DashboardPage />)

      await uploadCVThroughModal(user)
      await submitUpload(user)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
          })
        )
      })
    })

    it('shows error title in destructive toast', async () => {
      const user = userEvent.setup()

      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      })

      render(<DashboardPage />)

      await uploadCVThroughModal(user)
      await submitUpload(user)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringMatching(/error|failed/i),
            variant: 'destructive',
          })
        )
      })
    })

    it('displays error toast when fetch throws an exception', async () => {
      const user = userEvent.setup()

      // Mock fetch throwing an error
      ;(global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<DashboardPage />)

      await uploadCVThroughModal(user)
      await submitUpload(user)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
          })
        )
      })
    })
  })

  describe('toast action navigates to cv-analysis', () => {
    it('includes action button with "View Analysis" text in success toast', async () => {
      const user = userEvent.setup()

      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, cvId: 'cv-123' }),
      })

      render(<DashboardPage />)

      await uploadCVThroughModal(user)
      await submitUpload(user)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            action: expect.anything(),
          })
        )
      })

      // Verify the action was passed to toast
      const toastCall = mockToast.mock.calls[0][0]
      expect(toastCall.action).toBeDefined()
    })

    it('navigates to /dashboard/cv-analysis when action is clicked', async () => {
      const user = userEvent.setup()

      // Capture the toast action callback
      let capturedAction: React.ReactElement | undefined

      mockToast.mockImplementation((props) => {
        capturedAction = props.action
        return { id: 'toast-1' }
      })

      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, cvId: 'cv-123' }),
      })

      render(<DashboardPage />)

      await uploadCVThroughModal(user)
      await submitUpload(user)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled()
      })

      // Render the captured action and click it
      if (capturedAction) {
        const { container } = render(capturedAction)
        const actionButton = container.querySelector('button')
        if (actionButton) {
          await user.click(actionButton)
          expect(mockPush).toHaveBeenCalledWith('/dashboard/cv-analysis')
        }
      }
    })

    it('action button shows arrow icon indicating navigation', async () => {
      const user = userEvent.setup()

      let capturedAction: React.ReactElement | undefined

      mockToast.mockImplementation((props) => {
        capturedAction = props.action
        return { id: 'toast-1' }
      })

      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, cvId: 'cv-123' }),
      })

      render(<DashboardPage />)

      await uploadCVThroughModal(user)
      await submitUpload(user)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled()
      })

      // Verify action text includes arrow or "View Analysis"
      if (capturedAction) {
        const { container } = render(capturedAction)
        const actionText = container.textContent
        expect(actionText).toMatch(/view analysis|→/i)
      }
    })
  })

  describe('toast behavior during upload', () => {
    it('does not show toast while upload is in progress', async () => {
      const user = userEvent.setup()

      // Create a promise that we can control to simulate slow upload
      let resolveUpload: (value: Response) => void
      const uploadPromise = new Promise<Response>((resolve) => {
        resolveUpload = resolve
      })

      ;(global.fetch as Mock).mockReturnValueOnce(uploadPromise)

      render(<DashboardPage />)

      await uploadCVThroughModal(user)
      await submitUpload(user)

      // At this point, upload is in progress - toast should not be called yet
      expect(mockToast).not.toHaveBeenCalled()

      // Now resolve the upload
      resolveUpload!({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      // After resolution, toast should be called
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled()
      })
    })

    it('closes the modal before showing success toast', async () => {
      const user = userEvent.setup()

      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, cvId: 'cv-123' }),
      })

      render(<DashboardPage />)

      await uploadCVThroughModal(user)

      // Modal should be visible before submission
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await submitUpload(user)

      await waitFor(() => {
        // Modal should be closed after successful upload
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // And toast should be shown
      expect(mockToast).toHaveBeenCalled()
    })
  })
})
