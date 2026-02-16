'use client'

import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'

type SkillStatus = 'matched' | 'partial' | 'missing'

interface SkillBadgeProps {
  skill: string
  status: SkillStatus
  onClick?: () => void
}

const statusConfig = {
  matched: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    icon: '✓',
    label: 'Matched',
  },
  partial: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    icon: '🟡',
    label: 'Partial',
  },
  missing: {
    bg: 'bg-red-500/15',
    text: 'text-red-300',
    border: 'border-red-500/30',
    icon: '🔴',
    label: 'Missing',
  },
}

export function SkillBadge({ skill, status, onClick }: SkillBadgeProps) {
  const config = statusConfig[status]
  const isClickable = status === 'missing' || status === 'partial'

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-body transition-all',
        config.bg,
        config.text,
        config.border,
        isClickable && 'hover:shadow-md cursor-pointer hover:scale-105',
        !isClickable && 'cursor-default'
      )}
    >
      {config.icon && <span>{config.icon}</span>}
      <span>{skill}</span>
      {isClickable && <Info className="w-3.5 h-3.5 opacity-60" />}
    </button>
  )
}
