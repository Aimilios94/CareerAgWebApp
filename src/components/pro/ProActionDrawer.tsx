'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  FileText,
  Mail,
  Mic,
  Crown,
  ChevronUp,
  ChevronDown,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProActionDrawerProps {
  isPro?: boolean
  jobId: string
  onAutoFixCV: () => void
  onDraftCoverLetter: () => void
  onInterviewPrep: () => void
}

export function ProActionDrawer({
  isPro = false,
  jobId,
  onAutoFixCV,
  onDraftCoverLetter,
  onInterviewPrep,
}: ProActionDrawerProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(true)

  const actions = [
    {
      id: 'auto-fix-cv',
      icon: FileText,
      label: 'Auto-Fix My CV',
      description: 'Generate a tailored CV for this job',
      onClick: onAutoFixCV,
      emoji: '✨',
    },
    {
      id: 'cover-letter',
      icon: Mail,
      label: 'Draft Cover Letter',
      description: 'AI-written cover letter you can edit',
      onClick: onDraftCoverLetter,
      emoji: '✉️',
    },
    {
      id: 'interview-prep',
      icon: Mic,
      label: 'Interview Prep',
      description: 'Practice with top 5 likely questions',
      onClick: onInterviewPrep,
      emoji: '🎤',
    },
  ]

  if (!isPro) {
    return (
      <Card className="border-accent-orange/30 bg-gradient-to-r from-accent-orange/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-accent-orange/10 rounded-xl flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6 text-accent-orange" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-brand-dark mb-1">
                Unlock Pro Features
              </h3>
              <p className="text-sm text-brand-mid-gray font-body mb-4">
                Get AI-powered tools to supercharge your job applications: tailored CVs,
                cover letters, and interview preparation.
              </p>
              <Button className="gap-2" onClick={() => router.push('/dashboard/pro')}>
                <Crown className="w-4 h-4" />
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-brand-light-gray/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Crown className="w-5 h-5 text-accent-orange" />
          <span className="font-heading font-semibold text-brand-dark">
            Pro Actions
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-brand-mid-gray" />
        ) : (
          <ChevronUp className="w-5 h-5 text-brand-mid-gray" />
        )}
      </button>

      {isExpanded && (
        <CardContent className="pt-0 pb-6 px-6">
          <div className="grid sm:grid-cols-3 gap-4">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                className="flex flex-col items-center text-center p-4 rounded-xl border border-brand-light-gray hover:border-accent-orange/30 hover:bg-accent-orange/5 transition-all group"
              >
                <span className="text-2xl mb-2">{action.emoji}</span>
                <span className="font-heading font-medium text-brand-dark group-hover:text-accent-orange transition-colors">
                  {action.label}
                </span>
                <span className="text-xs text-brand-mid-gray font-body mt-1">
                  {action.description}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
