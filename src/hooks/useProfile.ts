'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'

type Profile = Tables<'profiles'>

interface UseProfileReturn {
  profile: Profile | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setProfile(null)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setProfile(data)
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    try {
      setError(null)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Refetch to get updated data
      await fetchProfile()
    } catch (err) {
      console.error('Failed to update profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      throw err
    }
  }, [fetchProfile])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
    updateProfile,
  }
}
