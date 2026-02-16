'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Target, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SignupPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (!acceptTerms) {
      setError('Please accept the terms and conditions')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-xl border border-accent/20 mb-4 shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)]">
            <Target className="w-6 h-6 text-accent" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
            Check Your Email
          </h1>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl text-center">
          <p className="text-zinc-300 mb-6 font-body leading-relaxed">
            We&apos;ve sent a confirmation link to <strong className="text-white">{email}</strong>.
            <br />Please check your inbox and click the link to activate your account.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full h-11 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 hover:text-white">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-xl border border-accent/20 mb-4 shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)]">
          <Target className="w-6 h-6 text-accent" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
          Create Account
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          Start your journey with Career Agent
        </p>
      </div>

      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl">
        <form onSubmit={handleEmailSignup} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium text-zinc-300">
              Full Name
            </label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
              className="bg-black/20 border-white/10 text-white focus:border-accent focus:ring-accent/20 placeholder:text-zinc-600 h-11"
            />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-zinc-300">
                Password
              </label>
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

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-300">
                Confirm
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-black/20 border-white/10 text-white focus:border-accent focus:ring-accent/20 placeholder:text-zinc-600 h-11"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              id="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 rounded bg-black/40 border-white/20 text-accent focus:ring-accent/40"
              disabled={loading}
            />
            <label htmlFor="terms" className="text-sm text-zinc-400">
              I agree to the{' '}
              <Link href="/terms" className="text-accent hover:text-accent/80 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-accent hover:text-accent/80 hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-bold tracking-wide transition-all shadow-lg shadow-white/5 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...
              </>
            ) : (
              'Create Account'
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
          onClick={handleGoogleSignup}
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
        Already have an account?{' '}
        <Link href="/login" className="text-accent hover:text-accent/80 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
