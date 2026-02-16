'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Target, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // DEV BYPASS: Allow test login without real credentials (non-production only)
    if (process.env.NODE_ENV !== 'production' && email.toLowerCase().includes('test')) {
      await new Promise(resolve => setTimeout(resolve, 500))
      // Set a cookie to bypass middleware protection
      document.cookie = 'dev_bypass=true; path=/; max-age=86400'
      router.push(redirect)
      router.refresh()
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-xl border border-accent/20 mb-4 shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)]">
          <Target className="w-6 h-6 text-accent" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
          Welcome Back
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          Sign in to access your career command center
        </p>
      </div>

      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl">
        <form onSubmit={handleEmailLogin} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-zinc-300">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-black/20 border-white/10 text-white focus:border-accent focus:ring-accent/20 placeholder:text-zinc-600 h-11"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-zinc-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-accent hover:text-accent/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="bg-black/20 border-white/10 text-white focus:border-accent focus:ring-accent/20 placeholder:text-zinc-600 h-11"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-bold tracking-wide transition-all shadow-lg shadow-white/5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest">
            <span className="bg-zinc-900 px-4 text-zinc-500">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-11 bg-transparent border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all font-medium"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>
      </div>

      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-accent hover:text-accent/80 font-medium transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  )
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-800 rounded-xl mb-4" />
        <div className="h-8 w-48 bg-zinc-800 rounded mx-auto mb-2" />
        <div className="h-4 w-64 bg-zinc-800 rounded mx-auto" />
      </div>
      <div className="bg-zinc-900/40 border border-white/10 p-8 rounded-2xl">
        <div className="space-y-4">
          <div className="h-11 bg-zinc-800 rounded" />
          <div className="h-11 bg-zinc-800 rounded" />
          <div className="h-11 bg-zinc-800 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}
