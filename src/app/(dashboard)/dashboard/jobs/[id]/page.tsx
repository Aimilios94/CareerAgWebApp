'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  ExternalLink,
  Calendar,
  Loader2,
  AlertCircle,
  Sparkles,
  Target,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, getScoreColor, getScoreRingColor, getScoreGradient, getScoreLabel, getScoreBgColor } from '@/lib/utils'
import { useCV } from '@/hooks/useCV'
import { compareSkills, getJobSkills, type GapAnalysis } from '@/lib/skills'
import { SkillComparisonPanel } from '@/components/jobs/SkillComparisonPanel'
import { ProActionDrawer } from '@/components/pro/ProActionDrawer'
import { ProResultModal } from '@/components/pro/ProResultModal'
import { useAuth } from '@/hooks/useAuth'

interface JobDetails {
  id: string
  title: string
  company: string
  location: string
  salary: string | null
  url: string | null
  postedDate: string | null
  description: string | null
  matchScore: number
  gapAnalysis: GapAnalysis | null
  createdAt: string
  searchQuery: string | null
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState<JobDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch CV data for skill comparison
  const { latestCV, isLoading: cvLoading } = useCV()
  const { isPro } = useAuth()

  const parsedData = latestCV?.parsed_data as {
    skills: string[]
    experience: Array<{ company: string; role: string; dates?: string; duration?: string }>
    education: Array<{ institution: string; degree: string; year: string }>
    summary: string
  } | null

  const [proModal, setProModal] = useState<{
    isOpen: boolean
    type: 'cv' | 'cover-letter' | 'interview'
    title: string
    data: any
    isLoading: boolean
    error: string | null
  }>({
    isOpen: false,
    type: 'cv',
    title: '',
    data: null,
    isLoading: false,
    error: null,
  })

  useEffect(() => {
    async function fetchJob() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/jobs/${params.id}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError('Job not found')
          } else {
            throw new Error('Failed to fetch job')
          }
          return
        }

        const data = await response.json()
        setJob(data.job)
      } catch (err) {
        console.error('Error fetching job:', err)
        setError('Failed to load job details')
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchJob()
    }
  }, [params.id])

  // Calculate skill comparison
  const skillComparison = useMemo(() => {
    if (!job || !parsedData?.skills) return null

    const jobSkills = getJobSkills(job.gapAnalysis, job.description)
    if (jobSkills.length === 0) return null

    return compareSkills(parsedData.skills, jobSkills)
  }, [job, parsedData])

  const handleAutoFixCV = async () => {
    setProModal({ isOpen: true, type: 'cv', title: 'AI-Tailored CV', data: null, isLoading: true, error: null })
    try {
      const res = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: params.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to generate CV')
      setProModal(prev => ({ ...prev, isLoading: false, data: json.data }))
    } catch (err) {
      setProModal(prev => ({ ...prev, isLoading: false, error: err instanceof Error ? err.message : 'Unknown error' }))
    }
  }

  const handleDraftCoverLetter = async () => {
    setProModal({ isOpen: true, type: 'cover-letter', title: 'Cover Letter', data: null, isLoading: true, error: null })
    try {
      const res = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: params.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to generate cover letter')
      setProModal(prev => ({ ...prev, isLoading: false, data: json.data }))
    } catch (err) {
      setProModal(prev => ({ ...prev, isLoading: false, error: err instanceof Error ? err.message : 'Unknown error' }))
    }
  }

  const handleInterviewPrep = async () => {
    setProModal({ isOpen: true, type: 'interview', title: 'Interview Prep', data: null, isLoading: true, error: null })
    try {
      const res = await fetch('/api/interview/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: params.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to generate questions')
      setProModal(prev => ({ ...prev, isLoading: false, data: json.data }))
    } catch (err) {
      setProModal(prev => ({ ...prev, isLoading: false, error: err instanceof Error ? err.message : 'Unknown error' }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-zinc-400">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-heading font-semibold text-white mb-2">
            {error || 'Job Not Found'}
          </h2>
          <p className="text-zinc-400 mb-6">
            This job may have been removed or is no longer available.
          </p>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // SVG Circle calculation for score ring
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (job.matchScore / 100) * circumference

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Back Navigation */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      {/* Job Header Card */}
      <div className="rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
        <div className={cn("p-8 bg-gradient-to-br", getScoreGradient(job.matchScore))}>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Score Ring */}
            <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
              <svg className="transform -rotate-90 w-full h-full">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-zinc-800"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={cn("transition-all duration-1000 ease-out", getScoreRingColor(job.matchScore))}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className={cn("text-2xl font-bold font-heading", getScoreColor(job.matchScore))}>
                  {job.matchScore}%
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">match</span>
              </div>
            </div>

            {/* Job Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs uppercase font-bold tracking-wider text-zinc-400">
                  <Sparkles className="w-3 h-3 text-accent" />
                  {getScoreLabel(job.matchScore)}
                </span>
              </div>
              <h1 className="font-heading text-3xl font-bold text-white mb-2">
                {job.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-zinc-300">
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {job.company}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
                {job.salary && job.salary.toLowerCase() !== 'not listed' && (
                  <span className="flex items-center gap-2 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                    {job.salary}
                  </span>
                )}
                {job.postedDate && (
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Posted {job.postedDate}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-white/5 flex flex-wrap gap-3">
          {job.url ? (
            <Button asChild className="bg-accent hover:bg-accent/90 text-white">
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Apply Now
              </a>
            </Button>
          ) : (
            <Button disabled className="bg-zinc-800 text-zinc-500">
              <ExternalLink className="w-4 h-4 mr-2" />
              No Link Available
            </Button>
          )}
        </div>
      </div>

      {/* Pro Actions */}
      <ProActionDrawer
        isPro={isPro}
        jobId={params.id as string}
        onAutoFixCV={handleAutoFixCV}
        onDraftCoverLetter={handleDraftCoverLetter}
        onInterviewPrep={handleInterviewPrep}
      />

      {/* Skills Analysis Section */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-lg text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Skills Analysis
          </h2>
          {skillComparison && (
            <div className={cn(
              "px-3 py-1 rounded-full text-sm font-medium text-white",
              getScoreBgColor(skillComparison.matchPercentage)
            )}>
              {skillComparison.matchPercentage}% Match
            </div>
          )}
        </div>

        {cvLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        ) : skillComparison ? (
          <SkillComparisonPanel comparison={skillComparison} showTips={true} />
        ) : !parsedData ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-zinc-500" />
            </div>
            <p className="text-zinc-400 text-sm">
              Upload your CV to see skill matching
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              We'll compare your skills against this job's requirements
            </p>
            <Link href="/dashboard" className="inline-block mt-4">
              <Button variant="outline" size="sm" className="border-white/10">
                Upload CV
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-zinc-500" />
            </div>
            <p className="text-zinc-400 text-sm">
              No skill requirements found for this job
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              The job description doesn't contain identifiable skills
            </p>
          </div>
        )}
      </div>

      {/* Job Description */}
      {job.description && (
        <div className="rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6">
          <h2 className="font-heading font-semibold text-lg text-white mb-4 flex items-center gap-2">
            Job Description
          </h2>
          <div className="prose prose-invert prose-zinc max-w-none">
            <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {job.description}
            </p>
          </div>
        </div>
      )}

      {/* Search Context */}
      {job.searchQuery && (
        <div className="text-center text-sm text-zinc-400">
          Found via search: <span className="text-zinc-300">"{job.searchQuery}"</span>
        </div>
      )}

      {/* Pro Result Modal */}
      <ProResultModal
        isOpen={proModal.isOpen}
        onClose={() => setProModal(prev => ({ ...prev, isOpen: false }))}
        title={proModal.title}
        type={proModal.type}
        data={proModal.data}
        isLoading={proModal.isLoading}
        error={proModal.error}
      />
    </div>
  )
}
