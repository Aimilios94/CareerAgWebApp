'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ArrowRight } from 'lucide-react'
import { cn, getScoreColor, getScoreBgColor } from '@/lib/utils'

interface SuggestedJob {
  id: string
  title: string
  company: string
  matchScore: number
}

interface SuitabilityTabProps {
  currentJobTitle: string
  currentMatchScore: number
  aiAnalysis: string
  suggestedJobs: SuggestedJob[]
}

export function SuitabilityTab({
  currentJobTitle,
  currentMatchScore,
  aiAnalysis,
  suggestedJobs,
}: SuitabilityTabProps) {
  return (
    <div className="space-y-6">
      {/* AI Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-orange" />
            <CardTitle>AI Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-brand-mid-gray font-body leading-relaxed">
            {aiAnalysis}
          </p>
        </CardContent>
      </Card>

      {/* Better Matches */}
      {suggestedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Jobs That Might Suit You Better</CardTitle>
            <p className="text-sm text-brand-mid-gray font-body">
              Based on your profile, these jobs have higher match scores
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestedJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-brand-light-gray hover:border-accent-orange/30 hover:bg-brand-light transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'px-3 py-1 rounded-lg text-white font-heading font-semibold',
                        getScoreBgColor(job.matchScore)
                      )}
                    >
                      {job.matchScore}
                    </div>
                    <div>
                      <p className="font-heading font-medium text-brand-dark group-hover:text-accent-orange transition-colors">
                        {job.title}
                      </p>
                      <p className="text-sm text-brand-mid-gray font-body">
                        {job.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-accent-green font-medium">
                    <span>+{job.matchScore - currentMatchScore}%</span>
                    <ArrowRight className="w-4 h-4 text-brand-mid-gray group-hover:text-accent-orange transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
