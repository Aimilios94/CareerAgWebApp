'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Target, Loader2, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?type=recovery`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-xl border border-green-500/20 mb-4">
            <Mail className="w-6 h-6 text-green-500" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
            Check Your Email
          </h1>
          <p className="text-zinc-400 text-sm mt-2">
            We&apos;ve sent password reset instructions to
          </p>
          <p className="text-white font-medium mt-1">{email}</p>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl text-center">
          <p className="text-zinc-400 text-sm mb-6">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>
          <Link href="/login">
            <Button
              variant="outline"
              className="bg-transparent border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all"
            >
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
          Reset Password
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          Enter your email to receive reset instructions
        </p>
      </div>

      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl">
        <form onSubmit={handleResetRequest} className="space-y-4">
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-bold tracking-wide transition-all shadow-lg shadow-white/5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-zinc-500">
        Remember your password?{' '}
        <Link href="/login" className="text-accent hover:text-accent/80 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
