'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CareerProfileCard } from '@/components/dashboard/CareerProfileCard'
import { CVQuickView } from '@/components/dashboard/CVQuickView'
import { JobSearchBar } from '@/components/dashboard/JobSearchBar'
import { RecentMatchesGrid } from '@/components/dashboard/RecentMatchesGrid'
import { AnalysisModal } from '@/components/dashboard/AnalysisModal'
import { useCV } from '@/hooks/useCV'
import { useJobMatches } from '@/hooks/useJobMatches'
import { useProfile } from '@/hooks/useProfile'
import { useSearchPolling } from '@/hooks/useSearchPolling'
import { useToast } from '@/hooks/use-toast'
import { compareSkills, getJobSkills, type GapAnalysis } from '@/lib/skills'
import { ToastAction } from '@/components/ui/toast'
import { SaveSearchButton } from '@/components/dashboard/SaveSearchButton'
import { useSemanticRank } from '@/hooks/useSemanticRank'
import { Loader2, AlertCircle, RefreshCw, ArrowRight, Brain } from 'lucide-react'

// Skeleton Components
function CareerProfileSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md overflow-hidden animate-pulse">
      <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5">
        <div className="p-8 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-white/5 rounded" />
            <div className="h-3 w-32 bg-white/5 rounded" />
          </div>
        </div>
        <div className="p-8 flex items-center justify-center">
          <div className="w-full h-14 bg-white/10 rounded-xl" />
        </div>
        <div className="p-8 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 bg-white/5 rounded" />
            <div className="h-3 w-40 bg-white/5 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

function MatchGridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 animate-pulse">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-white/5" />
            <div className="w-16 h-6 bg-white/5 rounded-full" />
          </div>
          <div className="space-y-3">
            <div className="h-5 w-3/4 bg-white/5 rounded" />
            <div className="h-4 w-1/2 bg-white/5 rounded" />
            <div className="h-3 w-2/3 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchingIndicator({ query }: { query?: string }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
      <h3 className="font-heading font-semibold text-lg text-white mb-2">
        Searching for jobs...
      </h3>
      <p className="text-zinc-400 font-body max-w-md mx-auto">
        {query ? `Finding the best matches for "${query}"` : 'Processing your search request'}
      </p>
      <p className="text-xs text-zinc-400 mt-4">This may take a moment while we scan multiple job boards</p>
    </div>
  )
}

function SearchError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="font-heading font-semibold text-lg text-white mb-2">
        Search Failed
      </h3>
      <p className="text-zinc-400 font-body max-w-md mx-auto mb-6">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  )
}

export default function DashboardPage() {
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('')
  const [lastSearchId, setLastSearchId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const semanticRank = useSemanticRank()

  // Hooks for real data
  const { latestCV, isLoading: cvLoading, refetch: refetchCVs } = useCV()
  const { matches: recentMatches, isLoading: matchesLoading, error: matchesError, refetch: refetchMatches } = useJobMatches({ limit: 8 })
  const { profile, isLoading: profileLoading } = useProfile()
  const {
    searchId: currentSearchId,
    status: searchStatus,
    matches: searchMatches,
    error: searchError,
    startSearch,
    reset: resetSearch
  } = useSearchPolling()

  // Get user skills from CV for skill matching on cards
  const userSkills = useMemo(() => {
    const parsedData = latestCV?.parsed_data as { skills?: string[] } | null
    return parsedData?.skills || []
  }, [latestCV])

  // Calculate skill match count for a job match
  const getSkillMatchCount = useCallback((m: { gapAnalysis: GapAnalysis | null; description: string | null }) => {
    if (userSkills.length === 0) return undefined
    const jobSkills = getJobSkills(m.gapAnalysis, m.description)
    if (jobSkills.length === 0) return undefined
    const comparison = compareSkills(userSkills, jobSkills)
    return { matched: comparison.matched.length + Math.round(comparison.partial.length * 0.5), total: jobSkills.length }
  }, [userSkills])

  // Determine which matches to show - search results take priority
  const displayMatches = useMemo(() => {
    if (searchStatus === 'completed' && searchMatches.length > 0) {
      return searchMatches.map(m => ({
        id: m.id,
        title: m.title,
        company: m.company,
        location: m.location,
        salary: m.salary || undefined,
        matchScore: m.matchScore,
        postedDate: m.postedDate || 'Recently',
        skillMatchCount: getSkillMatchCount(m),
        semanticScore: m.semanticScore ?? undefined,
      }))
    }
    return recentMatches.map(m => ({
      id: m.id,
      title: m.title,
      company: m.company,
      location: m.location,
      salary: m.salary || undefined,
      matchScore: m.matchScore,
      postedDate: m.postedDate || 'Recently',
      skillMatchCount: getSkillMatchCount(m),
      semanticScore: m.semanticScore ?? undefined,
    }))
  }, [searchStatus, searchMatches, recentMatches, getSkillMatchCount])

  // Calculate global match score from real matches
  const globalMatchScore = useMemo(() => {
    if (displayMatches.length === 0) return 0
    const sum = displayMatches.reduce((acc, m) => acc + m.matchScore, 0)
    return Math.round(sum / displayMatches.length)
  }, [displayMatches])

  // Format CV data
  const cvFileName = latestCV?.filename
  const cvUploadDate = latestCV?.created_at
    ? new Date(latestCV.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : undefined

  // Transform latestCV for CVQuickView component
  const cvQuickViewData = useMemo(() => {
    if (!latestCV) return null
    return {
      id: latestCV.id,
      filename: latestCV.filename,
      parsed_data: latestCV.parsed_data as {
        skills: string[]
        experience: Array<{ company: string; role: string; duration?: string; dates?: string }>
        education: Array<{ institution: string; degree: string; year: string }>
        summary: string
      } | null,
    }
  }, [latestCV])

  // Get user's first name from profile
  const firstName = useMemo(() => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0]
    }
    return 'there'
  }, [profile])

  // Show error toast when match fetching fails
  useEffect(() => {
    if (matchesError) {
      toast({
        title: 'Failed to load matches',
        description: matchesError,
        variant: 'destructive',
      })
    }
  }, [matchesError, toast])

  // Refetch matches when search completes
  useEffect(() => {
    if (searchStatus === 'completed') {
      refetchMatches()
    }
  }, [searchStatus, refetchMatches])

  const handleSearch = async (query: string) => {
    setLastSearchQuery(query)
    await startSearch(query)
  }

  const handleUploadClick = () => {
    setShowAnalysisModal(true)
  }

  const handleAnalysisStart = async (data: { cv: File; coverLetter?: File; githubUrl?: string }) => {
    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', data.cv)
      if (data.coverLetter) {
        formData.append('coverLetter', data.coverLetter)
      }
      if (data.githubUrl) {
        formData.append('githubUrl', data.githubUrl)
      }

      const response = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      // Refetch CVs to update the display
      await refetchCVs()

      setShowAnalysisModal(false)

      // Show success toast with action to view analysis
      toast({
        title: 'CV uploaded!',
        description: 'Your resume is being analyzed.',
        action: (
          <ToastAction
            altText="View Analysis"
            onClick={() => router.push('/dashboard/cv-analysis')}
          >
            View Analysis <ArrowRight className="ml-1 h-3 w-3" />
          </ToastAction>
        ),
      })
    } catch (error) {
      console.error('Error uploading CV:', error)
      toast({
        title: 'Upload failed',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRetrySearch = () => {
    if (lastSearchQuery) {
      startSearch(lastSearchQuery)
    } else {
      resetSearch()
    }
  }

  const isLoading = cvLoading || profileLoading
  const isSearching = searchStatus === 'pending'

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <AnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        onAnalyze={handleAnalysisStart}
        isAnalyzing={isUploading}
      />

      {/* Page header */}
      <div className="relative">
        <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white tracking-tight">
          Welcome back,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
            {profileLoading ? '...' : firstName}!
          </span>
        </h1>
        <p className="text-zinc-400 font-body mt-2 text-lg">
          Your career command center is ready. System status:{' '}
          <span className="text-emerald-400 font-mono text-sm">ONLINE</span>
        </p>
      </div>

      {/* Section 1: Career Profile */}
      <section className="relative z-10">
        <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-purple-600/20 blur-xl opacity-50 -z-10 rounded-3xl" />
        {isLoading ? (
          <CareerProfileSkeleton />
        ) : (
          <CareerProfileCard
            cvFileName={cvFileName}
            cvUploadDate={cvUploadDate}
            globalMatchScore={globalMatchScore}
            onUploadClick={handleUploadClick}
          />
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl border border-white/10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-white font-heading font-medium tracking-wide">Uploading & Analyzing...</span>
            </div>
          </div>
        )}
      </section>

      {/* Section 1.5: CV Quick View */}
      <section>
        <CVQuickView cv={cvQuickViewData} />
      </section>

      {/* Section 2: Job Search */}
      <section>
        <JobSearchBar onSearch={handleSearch} isLoading={isSearching} />
      </section>

      {/* Section 3: Recent Matches */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
            {searchStatus === 'completed' && searchMatches.length > 0 ? 'Search Results' : 'Recent Matches'}
            <span className="text-xs font-normal text-zinc-400 bg-white/5 px-2 py-1 rounded-full border border-white/5">
              {isSearching ? 'Searching...' : 'Auto-Synced'}
            </span>
          </h2>
          {searchStatus === 'completed' && searchMatches.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (currentSearchId) {
                    semanticRank.mutate({ searchId: currentSearchId }, {
                      onSuccess: () => refetchMatches(),
                    })
                  }
                }}
                disabled={semanticRank.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all text-sm disabled:opacity-50"
              >
                <Brain className="w-4 h-4" />
                {semanticRank.isPending ? 'Ranking...' : 'Smart Rank'}
              </button>
              {currentSearchId && (
                <SaveSearchButton searchId={currentSearchId} query={lastSearchQuery} />
              )}
              <button
                onClick={resetSearch}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Clear search results
              </button>
            </div>
          )}
        </div>

        {/* Show different states based on status */}
        {isSearching ? (
          <SearchingIndicator query={lastSearchQuery} />
        ) : searchError ? (
          <SearchError error={searchError} onRetry={handleRetrySearch} />
        ) : matchesLoading ? (
          <MatchGridSkeleton />
        ) : (
          <RecentMatchesGrid matches={displayMatches} />
        )}
      </section>
    </div>
  )
}
