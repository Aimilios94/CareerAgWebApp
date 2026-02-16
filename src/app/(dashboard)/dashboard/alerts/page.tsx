'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Bell,
  BellRing,
  Sparkles,
  Building2,
  MapPin,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { useJobMatches } from '@/hooks/useJobMatches'
import { cn, getScoreColor } from '@/lib/utils'

export default function AlertsPage() {
  const { matches, isLoading, error, refetch } = useJobMatches({ limit: 20 })

  // Split matches into "new" (high score) alerts and regular
  const { highScoreAlerts, recentMatches } = useMemo(() => {
    const highScore = matches.filter(m => m.matchScore >= 75)
    const recent = matches.filter(m => m.matchScore < 75)
    return { highScoreAlerts: highScore, recentMatches: recent }
  }, [matches])

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="relative">
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
            Job Alerts
          </h1>
          <p className="text-zinc-400 font-body mt-2 text-lg">
            Notifications for high-match opportunities.
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-zinc-400">Loading alerts...</p>
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
            Job Alerts
          </h1>
          <p className="text-zinc-400 font-body mt-2 text-lg">
            Notifications for high-match opportunities.
          </p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 flex flex-col items-center text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to Load Alerts</h3>
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
            Job Alerts
          </h1>
          <p className="text-zinc-400 font-body mt-2 text-lg">
            Notifications for high-match opportunities.
          </p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-zinc-900/80 backdrop-blur-md p-12 flex flex-col items-center justify-center min-h-[400px] text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center mb-6 shadow-lg shadow-black/20">
            <Bell className="w-10 h-10 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-heading font-semibold text-white mb-3">No Alerts Yet</h2>
          <p className="text-zinc-300 max-w-md mx-auto leading-relaxed mb-6">
            Search for jobs to start receiving match alerts. We'll notify you when we find high-scoring opportunities.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors"
          >
            Search Jobs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="relative">
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
          Job Alerts
        </h1>
        <p className="text-zinc-400 font-body mt-2 text-lg">
          <span className="text-white font-medium">{highScoreAlerts.length}</span> high-match alerts from your recent searches.
        </p>
      </div>

      {/* High Score Alerts */}
      {highScoreAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-heading font-semibold text-white flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-400" />
            Top Matches
            <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-xs font-medium">
              {highScoreAlerts.length} alerts
            </span>
          </h2>
          <div className="space-y-3">
            {highScoreAlerts.map(match => (
              <Link
                key={match.id}
                href={`/dashboard/jobs/${match.id}`}
                className="group block rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md p-5 hover:border-accent/30 hover:bg-zinc-900/90 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Score */}
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <span className={cn("text-lg font-bold font-heading", getScoreColor(match.matchScore))}>
                      {match.matchScore}%
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                      <h3 className="font-heading font-semibold text-white truncate group-hover:text-accent transition-colors">
                        {match.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {match.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {match.location}
                      </span>
                      {match.salary && match.salary.toLowerCase() !== 'not listed' && (
                        <span className="text-emerald-400">{match.salary}</span>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Other Matches */}
      {recentMatches.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-heading font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-zinc-400" />
            Other Matches
            <span className="ml-2 text-xs text-zinc-500 font-normal">{recentMatches.length} results</span>
          </h2>
          <div className="space-y-2">
            {recentMatches.map(match => (
              <Link
                key={match.id}
                href={`/dashboard/jobs/${match.id}`}
                className="group flex items-center gap-4 rounded-xl border border-white/5 bg-zinc-900/60 backdrop-blur-md p-4 hover:border-white/10 hover:bg-zinc-900/80 transition-all"
              >
                <span className={cn("text-sm font-bold font-heading w-10 text-center", getScoreColor(match.matchScore))}>
                  {match.matchScore}%
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-zinc-300 truncate group-hover:text-white transition-colors">
                    {match.title}
                  </h3>
                  <p className="text-xs text-zinc-500">{match.company} &middot; {match.location}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
