'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  Building2,
  MapPin,
  DollarSign,
  ArrowRight,
  Loader2,
  SlidersHorizontal,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useJobMatches } from '@/hooks/useJobMatches'
import { cn, getScoreColor, getScoreRingColor } from '@/lib/utils'

export default function JobsPage() {
  const { matches, isLoading, error, refetch } = useJobMatches({ limit: 50 })
  const [filter, setFilter] = useState('')
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score')

  const filteredMatches = useMemo(() => {
    let result = [...matches]

    // Filter
    if (filter) {
      const lower = filter.toLowerCase()
      result = result.filter(m =>
        m.title.toLowerCase().includes(lower) ||
        m.company.toLowerCase().includes(lower) ||
        m.location.toLowerCase().includes(lower)
      )
    }

    // Sort
    if (sortBy === 'score') {
      result.sort((a, b) => b.matchScore - a.matchScore)
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return result
  }, [matches, filter, sortBy])

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="relative">
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
            Job Search
          </h1>
          <p className="text-zinc-400 font-body mt-2 text-lg">
            Explore opportunities matched to your unique profile.
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-zinc-400">Loading job matches...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="relative">
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
            Job Search
          </h1>
          <p className="text-zinc-400 font-body mt-2 text-lg">
            Explore opportunities matched to your unique profile.
          </p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 flex flex-col items-center text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to Load Jobs</h3>
          <p className="text-zinc-400 text-sm mb-4">{error}</p>
          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="relative">
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
            Job Search
          </h1>
          <p className="text-zinc-400 font-body mt-2 text-lg">
            Explore opportunities matched to your unique profile.
          </p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-zinc-900/80 backdrop-blur-md p-12 flex flex-col items-center justify-center min-h-[400px] text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-purple-500/20 border border-white/10 flex items-center justify-center mb-6 shadow-lg shadow-black/20">
            <Search className="w-10 h-10 text-accent" />
          </div>
          <h2 className="text-2xl font-heading font-semibold text-white mb-3">No Jobs Found</h2>
          <p className="text-zinc-300 max-w-md mx-auto leading-relaxed mb-6">
            Start by searching for jobs on the dashboard. Your matched results will appear here.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="relative">
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
          Job Search
        </h1>
        <p className="text-zinc-400 font-body mt-2 text-lg">
          <span className="text-white font-medium">{matches.length}</span> matched opportunities from your searches.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-30 pt-2 pb-4 bg-background/95 backdrop-blur-xl border-b border-white/5 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter by title, company, or location..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-900/50 border border-white/10 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'score' | 'date')}
              className="px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/10 text-zinc-300 text-sm focus:outline-none focus:border-accent/50 cursor-pointer shadow-sm hover:border-white/20 transition-colors"
            >
              <option value="score">Sort by Match Score</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      {filter && (
        <p className="text-sm text-zinc-400">
          Showing <span className="text-white">{filteredMatches.length}</span> of {matches.length} jobs
        </p>
      )}

      {/* Job List */}
      <div className="space-y-3 pb-8">
        {filteredMatches.map((match, index) => {
          const radius = 18
          const circumference = 2 * Math.PI * radius
          const strokeDashoffset = circumference - (match.matchScore / 100) * circumference

          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Link
                href={`/dashboard/jobs/${match.id}`}
                className="group block rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md hover:border-accent/30 hover:bg-zinc-900/60 hover:shadow-[0_0_20px_-5px_rgba(249,115,22,0.15)] transition-all relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="p-5 flex items-center gap-5 relative z-10">
                  {/* Score Ring */}
                  <div className="relative flex items-center justify-center w-12 h-12 shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <div className="absolute inset-0 bg-accent/20 blur-lg rounded-full opacity-0 group-hover:opacity-50 transition-opacity" />
                    <svg className="transform -rotate-90 w-full h-full relative z-10">
                      <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-zinc-800" />
                      <circle
                        cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent"
                        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                        className={cn("transition-all duration-1000 ease-out", getScoreRingColor(match.matchScore))}
                      />
                    </svg>
                    <span className={cn("absolute text-xs font-bold font-heading z-20", getScoreColor(match.matchScore))}>
                      {match.matchScore}%
                    </span>
                  </div>

                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-semibold text-white truncate group-hover:text-accent transition-colors">
                        {match.title}
                      </h3>
                      {match.matchScore >= 80 && (
                        <Sparkles className="w-3.5 h-3.5 text-accent shrink-0 animate-pulse" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {match.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {match.location}
                      </span>
                      {match.salary && match.salary.toLowerCase() !== 'not listed' && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <DollarSign className="w-3 h-3" /> {match.salary}
                        </span>
                      )}
                      {match.postedDate && (
                        <span className="text-zinc-500">Posted {match.postedDate}</span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {filteredMatches.length === 0 && filter && (
        <div className="text-center py-12">
          <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">No jobs match "{filter}"</p>
          <button
            onClick={() => setFilter('')}
            className="text-accent text-sm mt-2 hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  )
}
