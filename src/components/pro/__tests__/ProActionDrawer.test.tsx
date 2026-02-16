import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProActionDrawer } from '../ProActionDrawer'

// Mock next/navigation - need to override global mock to capture push calls
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useParams: () => ({}),
}))

describe('ProActionDrawer', () => {
  const defaultProps = {
    isPro: false,
    jobId: 'job-123',
    onAutoFixCV: vi.fn(),
    onDraftCoverLetter: vi.fn(),
    onInterviewPrep: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('navigates to /dashboard/pro when "Upgrade to Pro" button is clicked', () => {
    render(<ProActionDrawer {...defaultProps} isPro={false} />)

    // Verify push wasn't called before click
    expect(mockPush).not.toHaveBeenCalled()

    const upgradeButton = screen.getByRole('button', { name: /upgrade to pro/i })
    fireEvent.click(upgradeButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard/pro')
  })

  it('renders upgrade CTA when isPro is false', () => {
    render(<ProActionDrawer {...defaultProps} isPro={false} />)

    expect(screen.getByText('Unlock Pro Features')).toBeTruthy()
    expect(screen.getByRole('button', { name: /upgrade to pro/i })).toBeTruthy()
  })

  it('renders pro actions when isPro is true', () => {
    render(<ProActionDrawer {...defaultProps} isPro={true} />)

    expect(screen.getByText('Auto-Fix My CV')).toBeTruthy()
    expect(screen.getByText('Draft Cover Letter')).toBeTruthy()
    expect(screen.getByText('Interview Prep')).toBeTruthy()
  })

  it('calls onAutoFixCV when Auto-Fix button is clicked', () => {
    render(<ProActionDrawer {...defaultProps} isPro={true} />)

    fireEvent.click(screen.getByText('Auto-Fix My CV'))
    expect(defaultProps.onAutoFixCV).toHaveBeenCalled()
  })
})
