'use client'

import { Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { MatchCard } from './MatchCard'
import { Button } from '@/components/ui/button'

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary?: string
  matchScore: number
  postedDate: string
  skillMatchCount?: { matched: number; total: number }
  semanticScore?: number
}

interface RecentMatchesGridProps {
  matches: Job[]
}

export function RecentMatchesGrid({ matches }: RecentMatchesGridProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-zinc-500" />
        </div>
        <h3 className="font-heading font-semibold text-lg text-white mb-2">
          No recent matches yet
        </h3>
        <p className="text-zinc-400 font-body max-w-md mx-auto mb-6">
          Start by uploading your CV and searching for jobs. Your matches will appear here.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {matches.map((job) => (
          <MatchCard
            key={job.id}
            id={job.id}
            title={job.title}
            company={job.company}
            location={job.location}
            salary={job.salary}
            matchScore={job.matchScore}
            postedDate={job.postedDate}
            skillMatchCount={job.skillMatchCount}
            semanticScore={job.semanticScore}
          />
        ))}
      </div>
    </div>
  )
}
