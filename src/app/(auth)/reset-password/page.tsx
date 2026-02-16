'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Target, Loader2, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
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

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  // Success state UI
  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-xl border border-green-500/20 mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
            Password Updated
          </h1>
          <p className="text-zinc-400 text-sm mt-2">
            Your password has been successfully updated.
          </p>
          <p className="text-zinc-500 text-xs mt-4">
            Redirecting to your dashboard...
          </p>
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
          Set New Password
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          Enter your new password below
        </p>
      </div>

      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl">
        <form onSubmit={handleResetPassword} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-zinc-300">
              New Password
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
              Confirm New Password
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-bold tracking-wide transition-all shadow-lg shadow-white/5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...
              </>
            ) : (
              'Update Password'
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
