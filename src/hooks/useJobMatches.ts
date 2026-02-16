'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import type { GapAnalysis } from '@/lib/skills'

const DEV_USER_ID = process.env.NODE_ENV !== 'production' ? '00000000-0000-0000-0000-000000000001' : null

export interface JobMatch {
  id: string
  title: string
  company: string
  location: string
  salary: string | null
  url: string | null
  postedDate: string | null
  description: string | null
  matchScore: number
  semanticScore: number | null
  gapAnalysis: GapAnalysis | null
  createdAt: string
  searchId: string | null
  searchQuery: string | null
}

interface UseJobMatchesOptions {
  searchId?: string
  limit?: number
}

interface UseJobMatchesReturn {
  matches: JobMatch[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useJobMatches(options: UseJobMatchesOptions = {}): UseJobMatchesReturn {
  const { searchId, limit = 20 } = options
  const { user } = useAuth()
  const userId = user?.id || DEV_USER_ID || ''
  const [matches, setMatches] = useState<JobMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchId) params.set('searchId', searchId)
      if (limit) params.set('limit', limit.toString())

      const response = await fetch(`/api/matches?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }

      const data = await response.json()
      setMatches(data.matches || [])
    } catch (err) {
      console.error('Failed to fetch matches:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch matches')
    } finally {
      setIsLoading(false)
    }
  }, [searchId, limit])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  // Subscribe to realtime updates for job_matches changes filtered by user_id
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('job-matches-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_matches',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch when new matches are inserted for this user
          fetchMatches()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchMatches, userId])

  return {
    matches,
    isLoading,
    error,
    refetch: fetchMatches,
  }
}
