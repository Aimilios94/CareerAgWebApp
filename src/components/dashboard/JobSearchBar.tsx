'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobSearchBarProps {
  onSearch: (query: string) => void
  isLoading?: boolean
}

export function JobSearchBar({ onSearch, isLoading }: JobSearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative z-10">
        <div
          className={cn(
            "relative flex items-center bg-black/40 backdrop-blur-xl border-2 rounded-2xl transition-all duration-300 overflow-hidden",
            isFocused
              ? "border-accent shadow-[0_0_30px_-5px_hsl(var(--accent)/0.3)] scale-[1.01]"
              : "border-white/10 hover:border-white/20"
          )}
        >
          <div className="pl-6 text-zinc-400">
            <Search className={cn("w-6 h-6 transition-colors", isFocused ? "text-accent" : "text-zinc-500")} />
          </div>

          <input
            type="text"
            placeholder="Search for roles, skills, or companies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="flex-1 h-20 bg-transparent border-none text-xl md:text-2xl text-white placeholder:text-zinc-500 focus:ring-0 px-6 font-heading font-medium"
          />

          <div className="pr-3">
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className={cn(
                "h-14 px-8 rounded-xl font-heading font-semibold text-lg transition-all duration-300 flex items-center gap-2",
                query.trim() && !isLoading
                  ? "bg-accent text-white shadow-lg shadow-accent/25 hover:bg-accent/90 hover:scale-105"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="hidden sm:inline">Searching...</span>
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>

        {/* Decorative ambient glow */}
        {isFocused && (
          <div className="absolute inset-0 -z-10 bg-accent/20 blur-[100px] transition-all duration-700 pointer-events-none rounded-full" />
        )}
      </form>
    </div>
  )
}
