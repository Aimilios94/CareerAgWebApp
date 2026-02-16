import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSearchPolling } from '../useSearchPolling'

// Mock fetch globally
const mockFetch = vi.fn()

describe('useSearchPolling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    global.fetch = mockFetch
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with idle status and empty state', () => {
    const { result } = renderHook(() => useSearchPolling())

    expect(result.current.searchId).toBeNull()
    expect(result.current.status).toBe('idle')
    expect(result.current.matches).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('startSearch sets status to pending initially', async () => {
    // Mock the POST to /api/jobs/search - never resolves to keep pending state
    mockFetch.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useSearchPolling())

    // Start the search (don't await since fetch never resolves)
    act(() => {
      result.current.startSearch('react developer')
    })

    expect(result.current.status).toBe('pending')
    expect(result.current.matches).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('when search returns completed status, matches are set before status changes to completed', async () => {
    const mockMatches = [
      {
        id: 'match-1',
        title: 'Senior Developer',
        company: 'Tech Corp',
        location: 'Remote',
        salary: '$100k',
        url: 'https://example.com/job/1',
        postedDate: '2024-01-15',
        description: 'A great job',
        matchScore: 85,
        gapAnalysis: null,
        createdAt: '2024-01-16T10:00:00Z',
        searchId: 'search-1',
        searchQuery: 'react developer',
      },
    ]

    // Track the order of state updates
    const stateHistory: Array<{ status: string; matchCount: number }> = []

    // Mock POST /api/jobs/search - returns completed immediately (mock data path)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          searchId: 'search-1',
          status: 'completed',
        }),
      })
      // Mock GET /api/matches?searchId=search-1
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: mockMatches,
        }),
      })

    const { result } = renderHook(() => {
      const hookResult = useSearchPolling()

      // Record state after every render
      stateHistory.push({
        status: hookResult.status,
        matchCount: hookResult.matches.length,
      })

      return hookResult
    })

    await act(async () => {
      await result.current.startSearch('react developer')
    })

    // Verify final state has both matches and completed status
    expect(result.current.status).toBe('completed')
    expect(result.current.matches).toHaveLength(1)
    expect(result.current.matches[0].title).toBe('Senior Developer')
    expect(result.current.searchId).toBe('search-1')

    // Verify there was never a state where status=completed and matches=[]
    // (the fix ensures matches are set BEFORE status changes to completed)
    const completedStates = stateHistory.filter((s) => s.status === 'completed')
    for (const state of completedStates) {
      expect(state.matchCount).toBeGreaterThan(0)
    }
  })

  it('startSearch handles fetch errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useSearchPolling())

    await act(async () => {
      await result.current.startSearch('react developer')
    })

    expect(result.current.status).toBe('failed')
    expect(result.current.error).toBe('Network error')
  })

  it('startSearch handles non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useSearchPolling())

    await act(async () => {
      await result.current.startSearch('react developer')
    })

    expect(result.current.status).toBe('failed')
    expect(result.current.error).toBe('Failed to start search')
  })

  it('startSearch handles unsuccessful API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Rate limit exceeded',
      }),
    })

    const { result } = renderHook(() => useSearchPolling())

    await act(async () => {
      await result.current.startSearch('react developer')
    })

    expect(result.current.status).toBe('failed')
    expect(result.current.error).toBe('Rate limit exceeded')
  })

  it('reset clears all state', async () => {
    // Set up some state by starting a completed search
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          searchId: 'search-1',
          status: 'completed',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [
            {
              id: 'match-1',
              title: 'Dev',
              company: 'Corp',
              location: 'Remote',
              salary: null,
              url: null,
              postedDate: null,
              description: null,
              matchScore: 80,
              gapAnalysis: null,
              createdAt: '2024-01-16T10:00:00Z',
              searchId: 'search-1',
              searchQuery: 'developer',
            },
          ],
        }),
      })

    const { result } = renderHook(() => useSearchPolling())

    await act(async () => {
      await result.current.startSearch('developer')
    })

    // Verify state is populated
    expect(result.current.status).toBe('completed')
    expect(result.current.searchId).toBe('search-1')
    expect(result.current.matches).toHaveLength(1)

    // Reset
    act(() => {
      result.current.reset()
    })

    expect(result.current.searchId).toBeNull()
    expect(result.current.status).toBe('idle')
    expect(result.current.matches).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('starts polling for pending searches', async () => {
    // Mock POST /api/jobs/search - returns pending
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        searchId: 'search-1',
        status: 'pending',
      }),
    })

    // Mock first poll GET /api/jobs/search/search-1 - still pending
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        searchId: 'search-1',
        status: 'pending',
        query: 'react developer',
      }),
    })

    const { result } = renderHook(() => useSearchPolling())

    await act(async () => {
      await result.current.startSearch('react developer')
    })

    // Initial poll should have been triggered
    expect(mockFetch).toHaveBeenCalledTimes(2) // POST + initial poll

    // Mock second poll - still pending
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        searchId: 'search-1',
        status: 'pending',
        query: 'react developer',
      }),
    })

    // Advance timer for polling interval (3s)
    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(mockFetch).toHaveBeenCalledTimes(3) // POST + 2 polls

    // Clean up by resetting (stops the poll interval)
    act(() => {
      result.current.reset()
    })
  })

  it('stops polling when search completes via poll', async () => {
    // Mock POST /api/jobs/search - returns pending
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        searchId: 'search-1',
        status: 'pending',
      }),
    })

    // Mock initial poll - pending
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        searchId: 'search-1',
        status: 'pending',
        query: 'react developer',
      }),
    })

    const { result } = renderHook(() => useSearchPolling())

    await act(async () => {
      await result.current.startSearch('react developer')
    })

    // Mock second poll - completed with matches
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        searchId: 'search-1',
        status: 'completed',
        query: 'react developer',
        matches: [
          {
            id: 'match-1',
            title: 'Dev',
            company: 'Corp',
            location: 'Remote',
            salary: null,
            url: null,
            postedDate: null,
            description: null,
            matchScore: 90,
            gapAnalysis: null,
            createdAt: '2024-01-16T10:00:00Z',
            searchId: 'search-1',
          },
        ],
      }),
    })

    // Advance timer and flush microtasks so the poll callback resolves
    await act(async () => {
      vi.advanceTimersByTime(3000)
      // Flush all pending promises
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(result.current.status).toBe('completed')
    expect(result.current.matches).toHaveLength(1)

    // Further timer advances should NOT trigger more fetches
    const fetchCount = mockFetch.mock.calls.length
    await act(async () => {
      vi.advanceTimersByTime(6000)
    })

    expect(mockFetch).toHaveBeenCalledTimes(fetchCount) // No additional calls
  })

  it('handles failed search status from poll', async () => {
    // Mock POST - pending
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        searchId: 'search-1',
        status: 'pending',
      }),
    })

    // Mock initial poll - failed
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        searchId: 'search-1',
        status: 'failed',
        query: 'react developer',
      }),
    })

    const { result } = renderHook(() => useSearchPolling())

    await act(async () => {
      await result.current.startSearch('react developer')
    })

    // The initial poll is fire-and-forget, so we need to flush the promise
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(result.current.status).toBe('failed')
    expect(result.current.error).toBe('Search failed. Please try again.')
  })

  it('when completed search matches fetch fails, still sets completed status', async () => {
    // Mock POST - completed immediately
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        searchId: 'search-1',
        status: 'completed',
      }),
    })

    // Mock GET /api/matches - fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useSearchPolling())

    await act(async () => {
      await result.current.startSearch('react developer')
    })

    expect(result.current.status).toBe('completed')
    expect(result.current.matches).toEqual([])
  })

  it('exposes startSearch and reset as functions', () => {
    const { result } = renderHook(() => useSearchPolling())

    expect(typeof result.current.startSearch).toBe('function')
    expect(typeof result.current.reset).toBe('function')
  })
})
