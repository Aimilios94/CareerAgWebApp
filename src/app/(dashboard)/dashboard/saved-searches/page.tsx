'use client'

import { Bookmark, AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useSavedSearches } from '@/hooks/useSavedSearches'
import { SavedSearchCard } from '@/components/dashboard/SavedSearchCard'

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-5 animate-pulse"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800" />
              <div>
                <div className="h-5 w-48 bg-zinc-800 rounded mb-2" />
                <div className="h-4 w-24 bg-zinc-800 rounded" />
              </div>
            </div>
            <div className="h-6 w-20 bg-zinc-800 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-12 flex flex-col items-center justify-center min-h-[400px] text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center mb-6 shadow-lg shadow-black/20">
        <Bookmark className="w-10 h-10 text-purple-400" />
      </div>
      <h2 className="text-2xl font-heading font-semibold text-white mb-3">No Saved Searches Yet</h2>
      <p className="text-zinc-400 max-w-md mx-auto leading-relaxed">
        Save your job searches from the dashboard to quickly re-run them later.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity"
      >
        Start Searching
      </Link>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <h3 className="text-lg font-medium text-white mb-2">Failed to Load Saved Searches</h3>
      <p className="text-zinc-400 text-sm mb-4">{error.message}</p>
      {onRetry && (
        <button onClick={onRetry} className="inline-flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      )}
    </div>
  )
}

export default function SavedSearchesPage() {
  const { data: savedSearches, isLoading, error, refetch } = useSavedSearches()

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="relative">
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
          Saved Searches
        </h1>
        <p className="text-zinc-400 font-body mt-2 text-lg">
          Quickly re-run your favorite job searches.
        </p>
      </div>

      {isLoading && <LoadingState />}

      {error && <ErrorState error={error as Error} onRetry={refetch} />}

      {!isLoading && !error && savedSearches?.length === 0 && <EmptyState />}

      {!isLoading && !error && savedSearches && savedSearches.length > 0 && (
        <div className="space-y-4">
          {savedSearches.map((search) => (
            <SavedSearchCard
              key={search.id}
              id={search.id}
              name={search.name}
              query={search.query}
              matchCount={search.matchCount}
              createdAt={search.createdAt}
              searchId={search.searchId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
