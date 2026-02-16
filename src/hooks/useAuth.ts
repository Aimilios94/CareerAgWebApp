'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { Tables } from '@/types/database'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Tables<'profiles'> | null
  subscription: Tables<'subscriptions'> | null
  loading: boolean
  isPro: boolean
}

export function useAuth() {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    subscription: null,
    loading: true,
    isPro: false,
  })

  const fetchUserData = useCallback(async (userId: string) => {
    const supabase = createClient()

    const [profileResult, subscriptionResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('subscriptions').select('*').eq('user_id', userId).single(),
    ])

    return {
      profile: profileResult.data,
      subscription: subscriptionResult.data,
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { profile, subscription } = await fetchUserData(session.user.id)
        setState({
          user: session.user,
          session,
          profile,
          subscription,
          loading: false,
          isPro: subscription?.plan_type === 'pro',
        })
      } else {
        setState({
          user: null,
          session: null,
          profile: null,
          subscription: null,
          loading: false,
          isPro: false,
        })
      }
    }

    initAuth()

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { profile, subscription } = await fetchUserData(session.user.id)
          setState({
            user: session.user,
            session,
            profile,
            subscription,
            loading: false,
            isPro: subscription?.plan_type === 'pro',
          })
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            subscription: null,
            loading: false,
            isPro: false,
          })
        }

        if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
    )

    return () => {
      authSubscription.unsubscribe()
    }
  }, [fetchUserData, router])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }, [router])

  const refreshProfile = useCallback(async () => {
    if (!state.user) return

    const supabase = createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', state.user.id)
      .single()

    setState((prev) => ({ ...prev, profile }))
  }, [state.user])

  const refreshSubscription = useCallback(async () => {
    if (!state.user) return

    const supabase = createClient()
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', state.user.id)
      .single()

    setState((prev) => ({
      ...prev,
      subscription,
      isPro: subscription?.plan_type === 'pro',
    }))
  }, [state.user])

  return {
    ...state,
    signOut,
    refreshProfile,
    refreshSubscription,
  }
}
