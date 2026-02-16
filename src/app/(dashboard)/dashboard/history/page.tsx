'use client'

import { History, Search, Clock, CheckCircle, AlertCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useSearchHistory, type SearchHistoryItem } from '@/hooks/useSearchHistory'
import { SaveSearchButton } from '@/components/dashboard/SaveSearchButton'
import { formatDistanceToNow } from '@/lib/utils'

function StatusBadge({ status }: { status: SearchHistoryItem['status'] }) {
  const statusConfig = {
    pending: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    },
    processing: {
      icon: Loader2,
      label: 'Processing',
      className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    completed: {
      icon: CheckCircle,
      label: 'Completed',
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    failed: {
      icon: AlertCircle,
      label: 'Failed',
      className: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  )
}

function SearchHistoryCard({ search }: { search: SearchHistoryItem }) {
  const timeAgo = formatDistanceToNow(new Date(search.createdAt))

  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-5 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-medium truncate">{search.query}</h3>
              <p className="text-zinc-500 text-sm">{timeAgo}</p>
            </div>
          </div>

          {search.filters && Object.keys(search.filters).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {Object.entries(search.filters).map(([key, value]) => {
                if (!value) return null
                return (
                  <span
                    key={key}
                    className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-xs"
                  >
                    {key}: {String(value)}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <StatusBadge status={search.status} />

          {search.status === 'completed' && search.matchCount > 0 && (
            <div className="flex items-center gap-2">
              <SaveSearchButton searchId={search.id} query={search.query} />
              <Link
                href={`/dashboard?searchId=${search.id}`}
                className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {search.matchCount} match{search.matchCount !== 1 ? 'es' : ''}
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {search.status === 'completed' && search.matchCount === 0 && (
            <span className="text-sm text-zinc-500">No matches</span>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-12 flex flex-col items-center justify-center min-h-[400px] text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center mb-6 shadow-lg shadow-black/20">
        <History className="w-10 h-10 text-blue-400" />
      </div>
      <h2 className="text-2xl font-heading font-semibold text-white mb-3">No Search History</h2>
      <p className="text-zinc-400 max-w-md mx-auto leading-relaxed">
        Your search history is empty. Start by searching for jobs on the dashboard to begin tracking your job hunt.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
      >
        Start Searching
      </Link>
    </div>
  )
}

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

function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <h3 className="text-lg font-medium text-white mb-2">Failed to Load History</h3>
      <p className="text-zinc-400 text-sm mb-4">{error.message}</p>
      {onRetry && (
        <button onClick={onRetry} className="inline-flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      )}
    </div>
  )
}

export default function HistoryPage() {
  const { data: searches, isLoading, error, refetch } = useSearchHistory()

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="relative">
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
          Search History
        </h1>
        <p className="text-zinc-400 font-body mt-2 text-lg">
          Track your past job searches and their results.
        </p>
      </div>

      {isLoading && <LoadingState />}

      {error && <ErrorState error={error as Error} onRetry={refetch} />}

      {!isLoading && !error && searches?.length === 0 && <EmptyState />}

      {!isLoading && !error && searches && searches.length > 0 && (
        <div className="space-y-4">
          {searches.map((search) => (
            <SearchHistoryCard key={search.id} search={search} />
          ))}
        </div>
      )}
    </div>
  )
}
