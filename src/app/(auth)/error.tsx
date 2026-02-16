'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Auth Error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900/80 border border-white/10 p-8 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold text-white mb-2">
            Authentication Error
          </h2>
          <p className="text-zinc-400 text-sm">
            Something went wrong. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-zinc-600 mt-2 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
