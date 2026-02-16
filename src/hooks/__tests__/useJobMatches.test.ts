import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { GapAnalysis } from '@/lib/skills'

// We need to test that the JobMatch interface properly types gapAnalysis
// as GapAnalysis | null instead of unknown

// Mock Supabase client with spied channel methods
const mockChannelOn = vi.fn().mockReturnThis()
const mockChannelSubscribe = vi.fn().mockReturnThis()
const mockRemoveChannel = vi.fn()

const mockChannel = {
  on: mockChannelOn,
  subscribe: mockChannelSubscribe,
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: () => mockChannel,
    removeChannel: mockRemoveChannel,
  }),
}))

// Mock useAuth to provide user ID for realtime filtering
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-abc-123' },
    loading: false,
  })),
}))

import { useAuth } from '@/hooks/useAuth'

describe('useJobMatches gapAnalysis typing', () => {
  const mockMatchWithGapAnalysis = {
    id: 'match-1',
    title: 'Senior React Developer',
    company: 'TechCo',
    location: 'Remote',
    salary: '$120k',
    url: 'https://example.com/job/1',
    postedDate: '2024-01-15',
    description: 'React developer needed',
    matchScore: 85,
    gapAnalysis: {
      requiredSkills: ['React', 'TypeScript', 'Node.js'],
      niceToHaveSkills: ['GraphQL'],
      matchedSkills: ['React', 'TypeScript'],
      missingSkills: ['Node.js'],
    } as GapAnalysis,
    createdAt: '2024-01-16T10:00:00Z',
    searchId: 'search-1',
    searchQuery: 'react developer',
  }

  const mockMatchWithNullGapAnalysis = {
    id: 'match-2',
    title: 'Junior Developer',
    company: 'StartupCo',
    location: 'NYC',
    salary: null,
    url: null,
    postedDate: null,
    description: null,
    matchScore: 60,
    gapAnalysis: null,
    createdAt: '2024-01-16T11:00:00Z',
    searchId: 'search-1',
    searchQuery: 'developer',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns matches with properly typed gapAnalysis (GapAnalysis | null)', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matches: [mockMatchWithGapAnalysis, mockMatchWithNullGapAnalysis],
      }),
    })
    global.fetch = mockFetch

    const { useJobMatches } = await import('../useJobMatches')
    const { result } = renderHook(() => useJobMatches({ limit: 10 }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.matches).toHaveLength(2)

    // Test that gapAnalysis with data is properly typed - can access properties directly
    const matchWithGap = result.current.matches[0]
    expect(matchWithGap.gapAnalysis).not.toBeNull()
    // This should compile without unsafe casts - accessing GapAnalysis properties directly
    const gap = matchWithGap.gapAnalysis
    if (gap) {
      expect(gap.requiredSkills).toEqual(['React', 'TypeScript', 'Node.js'])
      expect(gap.matchedSkills).toEqual(['React', 'TypeScript'])
      expect(gap.missingSkills).toEqual(['Node.js'])
      expect(gap.niceToHaveSkills).toEqual(['GraphQL'])
    }

    // Test that gapAnalysis with null is handled
    const matchWithNull = result.current.matches[1]
    expect(matchWithNull.gapAnalysis).toBeNull()
  })

  it('gapAnalysis typed fields are accessible without unsafe casting', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matches: [mockMatchWithGapAnalysis],
      }),
    })
    global.fetch = mockFetch

    const { useJobMatches } = await import('../useJobMatches')
    const { result } = renderHook(() => useJobMatches())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const match = result.current.matches[0]
    // Verify the type allows direct property access without `as unknown` or `as GapAnalysis`
    // If gapAnalysis were still typed as `unknown`, accessing .requiredSkills would be a type error
    if (match.gapAnalysis) {
      expect(match.gapAnalysis.requiredSkills).toBeDefined()
    }
  })
})

describe('useJobMatches realtime subscription filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset useAuth mock to default (authenticated user)
    ;(useAuth as Mock).mockReturnValue({
      user: { id: 'user-abc-123' },
      loading: false,
    })
  })

  it('subscribes to realtime changes filtered by user_id', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ matches: [] }),
    })
    global.fetch = mockFetch

    const { useJobMatches } = await import('../useJobMatches')
    renderHook(() => useJobMatches())

    // Verify .on was called with a filter including user_id
    expect(mockChannelOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        schema: 'public',
        table: 'job_matches',
        filter: 'user_id=eq.user-abc-123',
      }),
      expect.any(Function)
    )
  })

  it('uses DEV_USER_ID when no authenticated user', async () => {
    ;(useAuth as Mock).mockReturnValue({
      user: null,
      loading: false,
    })

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ matches: [] }),
    })
    global.fetch = mockFetch

    const { useJobMatches } = await import('../useJobMatches')
    renderHook(() => useJobMatches())

    expect(mockChannelOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        filter: 'user_id=eq.00000000-0000-0000-0000-000000000001',
      }),
      expect.any(Function)
    )
  })

  it('cleans up realtime subscription on unmount', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ matches: [] }),
    })
    global.fetch = mockFetch

    const { useJobMatches } = await import('../useJobMatches')
    const { unmount } = renderHook(() => useJobMatches())

    unmount()

    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel)
  })
})
