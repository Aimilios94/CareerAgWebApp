'use client'

import { useMemo } from 'react'
import {
  TrendingUp,
  Flame,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  BarChart3,
  Zap,
  ArrowUpRight,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { useJobMatches } from '@/hooks/useJobMatches'
import { useCV } from '@/hooks/useCV'
import { getJobSkills, normalizeSkill, getVariations, type GapAnalysis } from '@/lib/skills'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface TrendingSkill {
  name: string
  demand: number // count of jobs requiring it
  demandPercent: number // % of total jobs
  status: 'matched' | 'partial' | 'missing'
  category: string
}

const SKILL_CATEGORIES: Record<string, string[]> = {
  'Frontend': ['react', 'vue', 'angular', 'nextjs', 'next.js', 'html', 'css', 'tailwind', 'sass', 'scss'],
  'Backend': ['nodejs', 'node.js', 'python', 'java', 'go', 'golang', 'rust', 'c#', '.net', 'django', 'flask', 'fastapi', 'spring'],
  'Database': ['sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'nosql'],
  'Cloud & DevOps': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'jenkins', 'github actions'],
  'Languages': ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++', 'kotlin'],
  'AI & Data': ['machine learning', 'ai', 'tensorflow', 'pytorch'],
  'Testing': ['jest', 'cypress', 'playwright', 'vitest', 'testing'],
  'Other': ['graphql', 'rest api', 'grpc', 'microservices', 'agile', 'scrum', 'git', 'linux', 'bash', 'figma'],
}

function getCategory(skill: string): string {
  const lower = skill.toLowerCase()
  for (const [cat, skills] of Object.entries(SKILL_CATEGORIES)) {
    if (skills.some(s => s === lower || lower.includes(s) || s.includes(lower))) {
      return cat
    }
  }
  return 'Other'
}

function getDemandColor(percent: number): string {
  if (percent >= 60) return 'text-red-400'
  if (percent >= 40) return 'text-orange-400'
  if (percent >= 20) return 'text-amber-400'
  return 'text-zinc-400'
}

function getDemandBarColor(percent: number): string {
  if (percent >= 60) return 'bg-red-500'
  if (percent >= 40) return 'bg-orange-500'
  if (percent >= 20) return 'bg-amber-500'
  return 'bg-zinc-600'
}

function getDemandLabel(percent: number): string {
  if (percent >= 60) return 'Very High'
  if (percent >= 40) return 'High'
  if (percent >= 20) return 'Moderate'
  return 'Low'
}

export default function TrendingPage() {
  const { matches, isLoading: matchesLoading, error: matchesError, refetch } = useJobMatches({ limit: 50 })
  const { latestCV, isLoading: cvLoading } = useCV()

  const isLoading = matchesLoading || cvLoading

  const parsedData = latestCV?.parsed_data as {
    skills: string[]
  } | null

  const userSkills = useMemo(() => {
    if (!parsedData?.skills) return []
    return parsedData.skills.map(s => ({
      original: s,
      variations: getVariations(s),
    }))
  }, [parsedData])

  const trendingSkills = useMemo(() => {
    if (!matches || matches.length === 0) return []

    // Count how many jobs require each skill
    const skillCounts: Record<string, { count: number; canonical: string }> = {}

    for (const match of matches) {
      const jobSkills = getJobSkills(match.gapAnalysis as GapAnalysis | null, match.description)
      const seen = new Set<string>()

      for (const skill of jobSkills) {
        const normalized = normalizeSkill(skill)
        if (seen.has(normalized)) continue
        seen.add(normalized)

        if (!skillCounts[normalized]) {
          skillCounts[normalized] = { count: 0, canonical: skill }
        }
        skillCounts[normalized].count++
      }
    }

    const totalJobs = matches.length

    // Build trending list with user's match status
    const trending: TrendingSkill[] = Object.entries(skillCounts)
      .map(([normalized, { count, canonical }]) => {
        // Check if user has this skill
        let status: 'matched' | 'partial' | 'missing' = 'missing'
        const skillVariations = getVariations(canonical)

        for (const uSkill of userSkills) {
          if (uSkill.variations.some(v => skillVariations.includes(v))) {
            status = 'matched'
            break
          }
          if (uSkill.variations.some(v => normalized.includes(v) || v.includes(normalized))) {
            status = 'partial'
          }
        }

        return {
          name: canonical,
          demand: count,
          demandPercent: Math.round((count / totalJobs) * 100),
          status,
          category: getCategory(canonical),
        }
      })
      .sort((a, b) => b.demand - a.demand)

    return trending
  }, [matches, userSkills])

  // Group by category
  const byCategory = useMemo(() => {
    const groups: Record<string, TrendingSkill[]> = {}
    for (const skill of trendingSkills) {
      if (!groups[skill.category]) groups[skill.category] = []
      groups[skill.category].push(skill)
    }
    // Sort categories by total demand
    return Object.entries(groups).sort((a, b) => {
      const totalA = a[1].reduce((sum, s) => sum + s.demand, 0)
      const totalB = b[1].reduce((sum, s) => sum + s.demand, 0)
      return totalB - totalA
    })
  }, [trendingSkills])

  // Stats
  const stats = useMemo(() => {
    const total = trendingSkills.length
    const matched = trendingSkills.filter(s => s.status === 'matched').length
    const partial = trendingSkills.filter(s => s.status === 'partial').length
    const missing = trendingSkills.filter(s => s.status === 'missing').length
    const coverage = total > 0 ? Math.round(((matched + partial * 0.5) / total) * 100) : 0
    return { total, matched, partial, missing, coverage }
  }, [trendingSkills])

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="relative">
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
            Skills Trending
          </h1>
          <p className="text-zinc-400 font-body mt-2 text-lg">
            Real-time market insights on high-demand technologies.
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-zinc-400">Analyzing market trends...</p>
          </div>
        </div>
      </div>
    )
  }

  if (matchesError) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="relative">
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
            Skills Trending
          </h1>
          <p className="text-zinc-400 font-body mt-2 text-lg">
            Real-time market insights on high-demand technologies.
          </p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 flex flex-col items-center text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to Load Trends</h3>
          <p className="text-zinc-400 text-sm mb-4">{matchesError}</p>
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
            Skills Trending
          </h1>
          <p className="text-zinc-400 font-body mt-2 text-lg">
            Real-time market insights on high-demand technologies.
          </p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-zinc-900/80 backdrop-blur-md p-12 flex flex-col items-center justify-center min-h-[400px] text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center mb-6 shadow-lg shadow-black/20">
            <TrendingUp className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-heading font-semibold text-white mb-3">No Data Yet</h2>
          <p className="text-zinc-300 max-w-md mx-auto leading-relaxed mb-6">
            Search for jobs first to see which skills are trending in your target market.
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
          Skills Trending
        </h1>
        <p className="text-zinc-400 font-body mt-2 text-lg">
          Market demand from <span className="text-white font-medium">{matches.length}</span> matched jobs in your search history.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Total Skills</span>
          </div>
          <p className="text-2xl font-heading font-bold text-white">{stats.total}</p>
          <p className="text-xs text-zinc-400 mt-1">across all jobs</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-zinc-900/80 backdrop-blur-md p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">You Have</span>
          </div>
          <p className="text-2xl font-heading font-bold text-emerald-400">{stats.matched}</p>
          <p className="text-xs text-zinc-400 mt-1">skills matched</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-zinc-900/80 backdrop-blur-md p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Gaps</span>
          </div>
          <p className="text-2xl font-heading font-bold text-amber-400">{stats.missing}</p>
          <p className="text-xs text-zinc-400 mt-1">skills to learn</p>
        </div>

        <div className="rounded-2xl border border-accent/20 bg-zinc-900/80 backdrop-blur-md p-5">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Coverage</span>
          </div>
          <p className="text-2xl font-heading font-bold text-accent">{stats.coverage}%</p>
          <p className="text-xs text-zinc-400 mt-1">market readiness</p>
        </div>
      </div>

      {/* Top Demanded Skills */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-semibold text-lg text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Most In-Demand Skills
          </h2>
          <span className="text-xs text-zinc-400">
            Based on {matches.length} job matches
          </span>
        </div>

        <div className="space-y-3">
          {trendingSkills.slice(0, 15).map((skill, index) => (
            <div key={skill.name} className="flex items-center gap-4 group">
              {/* Rank */}
              <span className={cn(
                "w-6 text-right text-sm font-mono font-bold shrink-0",
                index < 3 ? "text-orange-400" : "text-zinc-500"
              )}>
                {index + 1}
              </span>

              {/* Skill Name + Status */}
              <div className="flex items-center gap-2 w-40 shrink-0">
                {skill.status === 'matched' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                {skill.status === 'partial' && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                {skill.status === 'missing' && (
                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                )}
                <span className={cn(
                  "text-sm font-medium truncate",
                  skill.status === 'matched' ? "text-emerald-300" :
                  skill.status === 'partial' ? "text-amber-300" :
                  "text-zinc-300"
                )}>
                  {skill.name}
                </span>
              </div>

              {/* Bar */}
              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", getDemandBarColor(skill.demandPercent))}
                  style={{ width: `${Math.max(skill.demandPercent, 5)}%` }}
                />
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 shrink-0">
                <span className={cn("text-xs font-medium w-16 text-right", getDemandColor(skill.demandPercent))}>
                  {getDemandLabel(skill.demandPercent)}
                </span>
                <span className="text-xs text-zinc-500 w-14 text-right font-mono">
                  {skill.demandPercent}% jobs
                </span>
              </div>
            </div>
          ))}
        </div>

        {trendingSkills.length > 15 && (
          <p className="text-xs text-zinc-500 mt-4 text-center">
            + {trendingSkills.length - 15} more skills tracked
          </p>
        )}
      </div>

      {/* By Category */}
      <div className="grid md:grid-cols-2 gap-4">
        {byCategory.map(([category, skills]) => (
          <div key={category} className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md p-5">
            <h3 className="font-heading font-semibold text-white mb-4 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-accent" />
              {category}
              <span className="text-xs text-zinc-500 font-normal ml-auto">{skills.length} skills</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <span
                  key={skill.name}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    skill.status === 'matched'
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
                      : skill.status === 'partial'
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/20"
                      : "bg-red-500/10 text-red-300 border-red-500/20"
                  )}
                >
                  {skill.status === 'matched' && <CheckCircle2 className="w-3 h-3" />}
                  {skill.status === 'partial' && <AlertTriangle className="w-3 h-3" />}
                  {skill.status === 'missing' && <XCircle className="w-3 h-3" />}
                  {skill.name}
                  <span className="text-[10px] opacity-60">{skill.demandPercent}%</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> In your CV
        </span>
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-amber-400" /> Partial match
        </span>
        <span className="flex items-center gap-1.5">
          <XCircle className="w-3 h-3 text-red-400" /> Skill gap
        </span>
      </div>
    </div>
  )
}
