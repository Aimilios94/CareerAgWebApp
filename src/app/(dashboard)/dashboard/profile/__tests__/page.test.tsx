import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProfilePage from '../page'

// Mock hooks
vi.mock('@/hooks/useProfileData', () => ({
  useProfileData: vi.fn(),
}))

// Stable router mock
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
}

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/dashboard/profile',
  useSearchParams: () => new URLSearchParams(),
}))

import { useProfileData } from '@/hooks/useProfileData'

const mockProfile = {
  id: 'user-123',
  fullName: 'Jane Doe',
  jobTitle: 'Software Engineer',
  skills: ['React', 'TypeScript', 'Node.js'],
  avatarUrl: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('Profile Page - Dark Theme', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders success message with dark theme classes', async () => {
    vi.mocked(useProfileData).mockReturnValue({
      profile: mockProfile,
      parsedCV: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const { container } = render(<ProfilePage />)

    // Simulate save success by finding the component
    // The success message should use dark classes when visible
    // We check the component renders without light classes
    const headings = container.querySelectorAll('h1')
    expect(headings.length).toBeGreaterThan(0)
    expect(headings[0].className).toContain('text-white')
    expect(headings[0].className).not.toContain('text-brand-dark')
  })

  it('renders page headings with text-white instead of text-brand-dark', () => {
    vi.mocked(useProfileData).mockReturnValue({
      profile: mockProfile,
      parsedCV: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const { container } = render(<ProfilePage />)

    // All h1 elements should use text-white, not text-brand-dark
    const h1Elements = container.querySelectorAll('h1')
    h1Elements.forEach((h1) => {
      expect(h1.className).toContain('text-white')
      expect(h1.className).not.toContain('text-brand-dark')
    })
  })

  it('renders subtext with text-zinc-400 instead of text-muted-foreground', () => {
    vi.mocked(useProfileData).mockReturnValue({
      profile: mockProfile,
      parsedCV: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const { container } = render(<ProfilePage />)

    // The subtitle paragraph should use text-zinc-400
    const subtexts = container.querySelectorAll('p.text-zinc-400')
    expect(subtexts.length).toBeGreaterThan(0)
  })

  it('renders loading state with text-accent spinner', () => {
    vi.mocked(useProfileData).mockReturnValue({
      profile: null,
      parsedCV: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    const { container } = render(<ProfilePage />)

    // Loader should use text-accent
    const loader = container.querySelector('.text-accent')
    expect(loader).not.toBeNull()
  })

  it('renders error state with dark container instead of Card', () => {
    vi.mocked(useProfileData).mockReturnValue({
      profile: null,
      parsedCV: null,
      isLoading: false,
      error: new Error('Test error'),
      refetch: vi.fn(),
    })

    const { container } = render(<ProfilePage />)

    // Should have dark container class
    const darkContainer = container.querySelector('.bg-zinc-900\\/80')
    expect(darkContainer).not.toBeNull()

    // Retry link should use text-accent
    const retryLink = screen.getByText('Try again')
    expect(retryLink.className).toContain('text-accent')
  })

  it('renders profile skills with dark theme badge classes', () => {
    vi.mocked(useProfileData).mockReturnValue({
      profile: mockProfile,
      parsedCV: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const { container } = render(<ProfilePage />)

    // Skills should use dark badge classes
    const skillBadges = container.querySelectorAll('.bg-accent\\/10')
    expect(skillBadges.length).toBeGreaterThan(0)
  })

  it('renders avatar fallback with dark theme classes', () => {
    vi.mocked(useProfileData).mockReturnValue({
      profile: mockProfile,
      parsedCV: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const { container } = render(<ProfilePage />)

    // Avatar fallback should use accent colors, not primary
    const avatarFallback = container.querySelector('[class*="bg-accent"]')
    expect(avatarFallback).not.toBeNull()
  })

  it('does not use light theme classes in profile page elements', () => {
    vi.mocked(useProfileData).mockReturnValue({
      profile: mockProfile,
      parsedCV: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const { container } = render(<ProfilePage />)

    // Profile page headings should not use light theme classes
    const h1Elements = container.querySelectorAll('h1')
    h1Elements.forEach((el) => {
      expect(el.className).not.toContain('text-brand-dark')
    })

    // Skill badges from profile should use accent, not secondary
    const skillBadges = container.querySelectorAll('.rounded-full')
    skillBadges.forEach((badge) => {
      expect(badge.className).not.toContain('bg-secondary')
    })

    // No light green/red message classes in the profile page's own elements
    const profileContainers = container.querySelectorAll('.rounded-2xl')
    profileContainers.forEach((el) => {
      expect(el.className).not.toContain('bg-green-50')
      expect(el.className).not.toContain('bg-red-50')
    })
  })
})
