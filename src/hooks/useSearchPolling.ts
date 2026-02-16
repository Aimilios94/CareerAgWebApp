'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { JobMatch } from './useJobMatches'

type SearchStatus = 'idle' | 'pending' | 'completed' | 'failed'

interface SearchResult {
  searchId: string
  status: SearchStatus
  query: string
  filters: unknown
  createdAt: string
  matches?: JobMatch[]
}

interface UseSearchPollingReturn {
  searchId: string | null
  status: SearchStatus
  matches: JobMatch[]
  error: string | null
  startSearch: (query: string, filters?: Record<string, unknown>) => Promise<void>
  reset: () => void
}

const POLL_INTERVAL = 3000 // 3 seconds

export function useSearchPolling(): UseSearchPollingReturn {
  const [searchId, setSearchId] = useState<string | null>(null)
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [matches, setMatches] = useState<JobMatch[]>([])
  const [error, setError] = useState<string | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  const pollStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/jobs/search/${id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch search status')
      }

      const data: SearchResult = await response.json()

      setStatus(data.status as SearchStatus)

      if (data.status === 'completed') {
        stopPolling()
        if (data.matches) {
          setMatches(data.matches)
        }
      } else if (data.status === 'failed') {
        stopPolling()
        setError('Search failed. Please try again.')
      }
    } catch (err) {
      console.error('Polling error:', err)
      setError(err instanceof Error ? err.message : 'Polling failed')
      stopPolling()
    }
  }, [stopPolling])

  const startPolling = useCallback((id: string) => {
    stopPolling() // Clear any existing interval

    // Initial poll
    pollStatus(id)

    // Set up interval for subsequent polls
    pollIntervalRef.current = setInterval(() => {
      pollStatus(id)
    }, POLL_INTERVAL)
  }, [pollStatus, stopPolling])

  const startSearch = useCallback(async (query: string, filters?: Record<string, unknown>) => {
    try {
      setError(null)
      setStatus('pending')
      setMatches([])

      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters }),
      })

      if (!response.ok) {
        throw new Error('Failed to start search')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Search failed')
      }

      setSearchId(data.searchId)

      // If already completed (mock data), fetch matches before updating status
      if (data.status === 'completed') {
        // Fetch matches first, then set both status and matches together
        // to avoid a render where status=completed but matches=[]
        const matchesResponse = await fetch(`/api/matches?searchId=${data.searchId}`)
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json()
          const fetchedMatches = matchesData.matches || []
          setMatches(fetchedMatches)
          setStatus('completed')
        } else {
          setStatus('completed')
        }
      } else {
        // Start polling for pending searches
        startPolling(data.searchId)
      }
    } catch (err) {
      console.error('Start search error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start search')
      setStatus('failed')
    }
  }, [startPolling])

  const reset = useCallback(() => {
    stopPolling()
    setSearchId(null)
    setStatus('idle')
    setMatches([])
    setError(null)
  }, [stopPolling])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    searchId,
    status,
    matches,
    error,
    startSearch,
    reset,
  }
}
