import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  useSavedSearches,
  useSaveSearch,
  useDeleteSavedSearch,
  useRerunSavedSearch,
} from '../useSavedSearches'

// Helper to create a fresh QueryClient wrapper for each test
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockFetch = vi.fn()

const mockSavedSearches = [
  {
    id: 'search-1',
    query: 'frontend developer',
    filters: { location: 'Remote' },
    status: 'completed',
    savedName: 'My Frontend Search',
    savedAt: '2024-01-16T12:00:00Z',
    createdAt: '2024-01-16T10:00:00Z',
    matchCount: 5,
  },
  {
    id: 'search-2',
    query: 'react engineer',
    filters: null,
    status: 'completed',
    savedName: null,
    savedAt: '2024-01-15T12:00:00Z',
    createdAt: '2024-01-15T10:00:00Z',
    matchCount: 3,
  },
]

describe('useSavedSearches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
  })

  it('fetches saved searches from GET /api/saved-searches', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ searches: mockSavedSearches }),
    })

    const { result } = renderHook(() => useSavedSearches(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].query).toBe('frontend developer')
    expect(mockFetch).toHaveBeenCalledWith('/api/saved-searches?')
  })

  it('passes limit parameter to the API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ searches: [mockSavedSearches[0]] }),
    })

    const { result } = renderHook(() => useSavedSearches(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/saved-searches?limit=1')
  })

  it('handles loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useSavedSearches(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('handles error state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useSavedSearches(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})

describe('useSaveSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
  })

  it('calls POST /api/saved-searches with searchId and name', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    const { result } = renderHook(() => useSaveSearch(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({ searchId: 'search-1', name: 'My Search' })
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/saved-searches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchId: 'search-1', name: 'My Search' }),
    })
  })
})

describe('useDeleteSavedSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
  })

  it('calls DELETE /api/saved-searches/[id]', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    const { result } = renderHook(() => useDeleteSavedSearch(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({ id: 'search-1' })
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/saved-searches/search-1', {
      method: 'DELETE',
    })
  })
})

describe('useRerunSavedSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
  })

  it('calls POST /api/saved-searches/[id]/rerun', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, searchId: 'search-new', status: 'pending' }),
    })

    const { result } = renderHook(() => useRerunSavedSearch(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const data = await result.current.mutateAsync({ id: 'search-1' })
      expect(data.searchId).toBe('search-new')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/saved-searches/search-1/rerun', {
      method: 'POST',
    })
  })
})
