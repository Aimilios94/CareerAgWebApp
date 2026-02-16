'use client'

import Link from 'next/link'
import { Play, Trash2, ExternalLink, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRerunSavedSearch, useDeleteSavedSearch } from '@/hooks/useSavedSearches'
import { formatDistanceToNow } from '@/lib/utils'

interface SavedSearchCardProps {
  id: string
  name: string
  query: string
  matchCount: number
  createdAt: string
  searchId: string
}

export function SavedSearchCard({ id, name, query, matchCount, createdAt, searchId }: SavedSearchCardProps) {
  const { mutateAsync: rerun, isPending: rerunning } = useRerunSavedSearch()
  const { mutateAsync: deleteSaved, isPending: deleting } = useDeleteSavedSearch()

  const timeAgo = formatDistanceToNow(new Date(createdAt))

  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-5 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-medium truncate">{name}</h3>
              <p className="text-zinc-500 text-sm">{query}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm text-zinc-400">
            <span>{matchCount} match{matchCount !== 1 ? 'es' : ''}</span>
            <span data-testid="saved-search-date">{timeAgo}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Re-run"
            onClick={() => rerun({ id })}
            disabled={rerunning}
            className="text-zinc-400 hover:text-white"
          >
            <Play className="w-4 h-4" />
          </Button>
          <Link
            href={`/dashboard?searchId=${searchId}`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="View results"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete"
            onClick={() => deleteSaved({ id })}
            disabled={deleting}
            className="text-zinc-400 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
