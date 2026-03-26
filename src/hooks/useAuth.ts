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
  isDevBypass: boolean
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function isDevBypassActive(): boolean {
  const bypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true' || process.env.NODE_ENV !== 'production'
  return bypassEnabled && getCookie('dev_bypass') === 'true'
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
    isDevBypass: false,
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
          isDevBypass: false,
        })
      } else if (isDevBypassActive()) {
        // Dev bypass mode: provide mock user data for Sidebar and other components
        const devEmail = getCookie('dev_bypass_email') || 'testuser@test.com'
        const mockUser = {
          id: '00000000-0000-0000-0000-000000000001',
          email: devEmail,
          app_metadata: {},
          user_metadata: { full_name: devEmail.split('@')[0] },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as unknown as User

        const mockProfile = {
          id: '00000000-0000-0000-0000-000000000001',
          full_name: devEmail.split('@')[0],
          job_title: 'Developer (Test Mode)',
          skills: null,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Tables<'profiles'>

        const mockSubscription = {
          id: '00000000-0000-0000-0000-000000000002',
          user_id: '00000000-0000-0000-0000-000000000001',
          plan_type: 'free',
          stripe_customer_id: null,
          stripe_subscription_id: null,
          current_period_start: null,
          current_period_end: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Tables<'subscriptions'>

        setState({
          user: mockUser,
          session: null,
          profile: mockProfile,
          subscription: mockSubscription,
          loading: false,
          isPro: false,
          isDevBypass: true,
        })
      } else {
        setState({
          user: null,
          session: null,
          profile: null,
          subscription: null,
          loading: false,
          isPro: false,
          isDevBypass: false,
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
            isDevBypass: false,
          })
        } else if (isDevBypassActive()) {
          // Keep dev bypass state during auth state changes
          return
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            subscription: null,
            loading: false,
            isPro: false,
            isDevBypass: false,
          })
        }

        // Note: SIGNED_OUT redirect is handled by signOut() via window.location.replace
        // Using router.push here would cause an RSC fetch race condition
      }
    )

    return () => {
      authSubscription.unsubscribe()
    }
  }, [fetchUserData, router])

  const signOut = useCallback(async () => {
    // Clear dev bypass cookies
    document.cookie = 'dev_bypass=; path=/; max-age=0'
    document.cookie = 'dev_bypass_email=; path=/; max-age=0'

    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.replace('/login')
  }, [])

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
