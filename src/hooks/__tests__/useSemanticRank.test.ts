import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSemanticRank } from '../useSemanticRank'

const mockFetch = vi.fn()

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useSemanticRank', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
  })

  it('calls POST /api/jobs/semantic-rank with searchId', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, updatedCount: 5 }),
    })

    const { result } = renderHook(() => useSemanticRank(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({ searchId: 'search-123' })
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/jobs/semantic-rank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchId: 'search-123' }),
    })
  })

  it('returns success data on successful mutation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, updatedCount: 3 }),
    })

    const { result } = renderHook(() => useSemanticRank(), {
      wrapper: createWrapper(),
    })

    let data: unknown
    await act(async () => {
      data = await result.current.mutateAsync({ searchId: 'search-123' })
    })

    expect(data).toEqual({ success: true, updatedCount: 3 })
  })

  it('handles error when API returns non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useSemanticRank(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({ searchId: 'search-123' })
      } catch {
        // Expected to throw
      }
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('exposes isLoading state during mutation', async () => {
    let resolvePromise!: (value: unknown) => void
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve
      })
    )

    const { result } = renderHook(() => useSemanticRank(), {
      wrapper: createWrapper(),
    })

    // Start mutation without awaiting
    act(() => {
      result.current.mutate({ searchId: 'search-123' })
    })

    // Should be pending
    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    // Resolve
    await act(async () => {
      resolvePromise({
        ok: true,
        json: async () => ({ success: true, updatedCount: 1 }),
      })
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })
})
