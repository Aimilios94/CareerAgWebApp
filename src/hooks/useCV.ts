'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'

type CV = Tables<'cvs'>

interface UseCVReturn {
  cvs: CV[]
  latestCV: CV | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCV(): UseCVReturn {
  const [cvs, setCvs] = useState<CV[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCVs = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Use API endpoint which has dev bypass
      const response = await fetch('/api/cv/upload')

      if (!response.ok) {
        throw new Error('Failed to fetch CVs')
      }

      const data = await response.json()
      setCvs(data.cvs || [])
    } catch (err) {
      console.error('Failed to fetch CVs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch CVs')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCVs()
  }, [fetchCVs])

  // Subscribe to realtime updates for CV changes
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('cv-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cvs',
        },
        () => {
          // Refetch when any CV changes
          fetchCVs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchCVs])

  return {
    cvs,
    latestCV: cvs[0] || null,
    isLoading,
    error,
    refetch: fetchCVs,
  }
}
