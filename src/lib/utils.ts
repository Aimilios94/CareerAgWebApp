import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Standardized score color thresholds: 80+ excellent, 60+ good, 40+ fair, <40 poor
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-accent'
  if (score >= 40) return 'text-amber-400'
  return 'text-zinc-400'
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-accent'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-zinc-500'
}

export function getScoreRingColor(score: number): string {
  if (score >= 80) return 'stroke-emerald-500'
  if (score >= 60) return 'stroke-accent'
  if (score >= 40) return 'stroke-amber-500'
  return 'stroke-zinc-600'
}

export function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-emerald-500/20 to-emerald-500/5'
  if (score >= 60) return 'from-accent/20 to-accent/5'
  if (score >= 40) return 'from-amber-500/20 to-amber-500/5'
  return 'from-zinc-500/20 to-zinc-500/5'
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent Match'
  if (score >= 60) return 'Good Match'
  if (score >= 40) return 'Fair Match'
  return 'Low Match'
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`
  return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`
}
