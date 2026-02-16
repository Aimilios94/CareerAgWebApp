'use client'

import { useState, useMemo } from 'react'
import { FileSearch, Search, Loader2, CheckCircle2, AlertTriangle, XCircle, Building2, AlertCircle, RefreshCw } from 'lucide-react'
import { CVStatsPanel } from '@/components/cv-analysis/CVStatsPanel'
import { useCV } from '@/hooks/useCV'
import { useJobMatches, JobMatch } from '@/hooks/useJobMatches'
import { cn, getScoreColor, getScoreRingColor } from '@/lib/utils'
import { compareSkills, getJobSkills, type SkillComparison } from '@/lib/skills'
import { SkillComparisonPanel } from '@/components/jobs/SkillComparisonPanel'
import Link from 'next/link'

export default function CVAnalysisPage() {
  const { latestCV, isLoading: cvLoading, error: cvError, refetch: refetchCV } = useCV()
  const { matches, isLoading: matchesLoading, error: matchesError, refetch: refetchMatches } = useJobMatches()
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null)

  const parsedData = latestCV?.parsed_data as {
    skills: string[]
    experience: Array<{ company: string; role: string; dates?: string; duration?: string }>
    education: Array<{ institution: string; degree: string; year: string }>
    summary: string
  } | null

  // Pre-calculate skill comparisons for ALL jobs so we can show counts in the selector
  const jobComparisons = useMemo(() => {
    if (!parsedData?.skills || matches.length === 0) return new Map<string, SkillComparison>()
    const map = new Map<string, SkillComparison>()
    for (const job of matches) {
      const jobSkills = getJobSkills(job.gapAnalysis, job.description)
      if (jobSkills.length > 0) {
        map.set(job.id, compareSkills(parsedData.skills, jobSkills))
      }
    }
    return map
  }, [parsedData, matches])

  // Get comparison for selected job
  const skillComparison = selectedJob ? jobComparisons.get(selectedJob.id) || null : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <FileSearch className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">CV Analysis</h1>
          <p className="text-sm text-zinc-400">
            Compare your skills against job requirements
          </p>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left Panel - CV Stats (40%) */}
        <div className="lg:col-span-2" data-testid="cv-stats-panel">
          {cvLoading ? (
            <div data-testid="cv-loading-skeleton" className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            </div>
          ) : cvError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white mb-2">Failed to Load CV</h3>
              <p className="text-zinc-400 text-sm mb-4">{cvError}</p>
              <button onClick={refetchCV} className="inline-flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          ) : (
            <CVStatsPanel parsedData={parsedData} />
          )}
        </div>

        {/* Right Panel - Job Comparison (60%) */}
        <div className="lg:col-span-3 space-y-4" data-testid="job-comparison-panel">
          {/* Job Selector */}
          {!parsedData ? (
            <div className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md">
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <FileSearch className="h-12 w-12 text-zinc-500 mb-4" />
                <p className="text-zinc-400">Upload your CV first</p>
                <p className="text-sm text-zinc-500 mt-1">
                  to start comparing against job requirements
                </p>
              </div>
            </div>
          ) : matchesError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white mb-2">Failed to Load Matches</h3>
              <p className="text-zinc-400 text-sm mb-4">{matchesError}</p>
              <button onClick={refetchMatches} className="inline-flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          ) : matchesLoading ? (
            <div className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            </div>
          ) : matches.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md">
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Search className="h-12 w-12 text-zinc-500 mb-4" />
                <p className="text-zinc-400">Search for jobs first</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Run a job search to compare your skills against openings
                </p>
                <Link
                  href="/dashboard/jobs"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Search Jobs
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Job Selector Cards */}
              <div data-testid="job-selector" className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md p-5">
                <h3 className="text-sm font-medium text-white mb-3">Select a Job to Compare</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {matches.map((job) => {
                    const comp = jobComparisons.get(job.id)
                    const isSelected = selectedJob?.id === job.id
                    return (
                      <button
                        key={job.id}
                        onClick={() => setSelectedJob(isSelected ? null : job)}
                        className={cn(
                          'w-full text-left p-3 rounded-xl border transition-all',
                          isSelected
                            ? 'bg-accent/10 border-accent/30'
                            : 'bg-zinc-800/60 border-white/5 hover:border-white/10 hover:bg-zinc-800'
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className={cn('font-medium text-sm truncate', isSelected ? 'text-accent' : 'text-white')}>
                              {job.title}
                            </p>
                            <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 shrink-0" />
                              <span className="truncate">{job.company}</span>
                            </p>
                          </div>
                          {/* Score ring mini */}
                          <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
                            <svg className="transform -rotate-90 w-full h-full">
                              <circle cx="20" cy="20" r={16} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-zinc-700" />
                              <circle cx="20" cy="20" r={16} stroke="currentColor" strokeWidth="3" fill="transparent"
                                strokeDasharray={2 * Math.PI * 16}
                                strokeDashoffset={2 * Math.PI * 16 - (job.matchScore / 100) * 2 * Math.PI * 16}
                                strokeLinecap="round"
                                className={cn('transition-all duration-700', getScoreRingColor(job.matchScore))}
                              />
                            </svg>
                            <span className={cn('absolute text-[10px] font-bold', getScoreColor(job.matchScore))}>
                              {job.matchScore}%
                            </span>
                          </div>
                        </div>
                        {/* Skill counts */}
                        {comp && (
                          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
                            <span className="flex items-center gap-1 text-xs text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              {comp.matched.length} matched
                            </span>
                            {comp.partial.length > 0 && (
                              <span className="flex items-center gap-1 text-xs text-amber-400">
                                <AlertTriangle className="w-3 h-3" />
                                {comp.partial.length} partial
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-red-400">
                              <XCircle className="w-3 h-3" />
                              {comp.missing.length} missing
                            </span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Skill Comparison Panel */}
              {selectedJob && skillComparison && (
                <div className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md overflow-hidden">
                  <div className="p-5 border-b border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-heading font-bold text-white">{selectedJob.title}</h3>
                        <p className="text-sm text-zinc-400">{selectedJob.company}</p>
                      </div>
                      {/* SVG Score Ring - matches MatchCard/Job Detail */}
                      <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
                        <svg className="transform -rotate-90 w-full h-full">
                          <circle
                            cx="32"
                            cy="32"
                            r={24}
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-zinc-800"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r={24}
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 24}
                            strokeDashoffset={2 * Math.PI * 24 - (skillComparison.matchPercentage / 100) * 2 * Math.PI * 24}
                            strokeLinecap="round"
                            className={cn("transition-all duration-1000 ease-out", getScoreRingColor(skillComparison.matchPercentage))}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={cn("text-sm font-bold font-heading", getScoreColor(skillComparison.matchPercentage))}>
                            {skillComparison.matchPercentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <SkillComparisonPanel comparison={skillComparison} showTips={true} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
