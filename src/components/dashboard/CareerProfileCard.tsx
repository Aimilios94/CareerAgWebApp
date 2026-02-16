'use client'

import { FileText, Upload, Calendar, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn, getScoreColor, getScoreRingColor } from '@/lib/utils'

interface CareerProfileCardProps {
  cvFileName?: string
  cvUploadDate?: string
  globalMatchScore: number
  onUploadClick: () => void
}

export function CareerProfileCard({
  cvFileName,
  cvUploadDate,
  globalMatchScore,
  onUploadClick,
}: CareerProfileCardProps) {
  const hasCV = !!cvFileName

  // Score Logic - use standardized thresholds (80/60/40)
  const scoreColor = getScoreColor(globalMatchScore)
  const strokeColor = getScoreRingColor(globalMatchScore)

  const circumference = 2 * Math.PI * 32
  const strokeDashoffset = circumference - (globalMatchScore / 100) * circumference

  return (
    <Card className="overflow-hidden border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-2xl relative group">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] rounded-full pointer-events-none" />

      <CardContent className="p-0">
        <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5">
          {/* CV Quick View */}
          <div className="p-8 flex items-center gap-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/[0.02] group-hover:bg-white/[0.04] transition-colors" />
            <div
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300 relative z-10',
                hasCV
                  ? 'bg-accent/10 border-accent/20 text-accent shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)]'
                  : 'bg-white/5 border-white/10 text-zinc-500'
              )}
            >
              <FileText className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0 relative z-10">
              <h3 className="font-heading font-semibold text-white mb-1.5 flex items-center gap-2">
                Active CV
                {hasCV && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              </h3>
              {hasCV ? (
                <>
                  <p className="text-zinc-300 font-body text-sm truncate font-medium">
                    {cvFileName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors bg-white/5 w-fit px-2 py-1 rounded-md">
                    <Calendar className="w-3 h-3" />
                    <span>Updated {cvUploadDate}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-zinc-400 font-body italic">
                  Upload your resume to unlock AI insights
                </p>
              )}
            </div>
          </div>

          {/* Upload Button */}
          <div className="p-8 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/[0.02] pointer-events-none" />
            <button
              onClick={onUploadClick}
              className="group/btn relative w-full h-14 bg-white text-black font-heading font-bold rounded-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 disabled:hidden" />
              <div className="flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" />
                <span>{hasCV ? 'Update Resume' : 'Upload Resume'}</span>
              </div>
            </button>
          </div>

          {/* Global Match Score */}
          <div className="p-8 flex items-center gap-6 relative">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  className="text-white/5"
                  strokeWidth="6"
                  stroke="currentColor"
                  fill="transparent"
                  r="32"
                  cx="40"
                  cy="40"
                />
                <circle
                  className={cn("transition-all duration-1000", strokeColor)}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="32"
                  cx="40"
                  cy="40"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className={cn('font-heading font-bold text-xl', scoreColor)}>
                  {globalMatchScore}
                </span>
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">AVG</span>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="font-heading font-semibold text-white flex items-center gap-2">
                Market Value <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              </h3>
              <p className="text-sm text-zinc-400 font-body mt-1 leading-snug">
                Your profile is performing in the top <strong className="text-white">18%</strong> of candidates.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
