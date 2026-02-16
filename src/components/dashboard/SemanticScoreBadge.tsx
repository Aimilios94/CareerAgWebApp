'use client'

import { Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SemanticScoreBadgeProps {
  score: number | null
}

function getSemanticColor(score: number): string {
  if (score > 70) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
  if (score >= 40) return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
  return 'text-zinc-400 border-zinc-500/20 bg-zinc-500/10'
}

export function SemanticScoreBadge({ score }: SemanticScoreBadgeProps) {
  if (score === null || score === undefined) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm',
        getSemanticColor(score)
      )}
      data-testid="semantic-score-badge"
    >
      <Brain className="w-3 h-3" />
      {Math.round(score)}%
    </span>
  )
}
