'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Building2, MapPin, DollarSign, ArrowRight, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn, getScoreColor, getScoreRingColor } from '@/lib/utils'
import { SemanticScoreBadge } from './SemanticScoreBadge'

interface MatchCardProps {
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

export function MatchCard({
  id,
  title,
  company,
  location,
  salary,
  matchScore,
  postedDate,
  skillMatchCount,
  semanticScore,
}: MatchCardProps) {
  // SVG Circle calculation
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (matchScore / 100) * circumference

  // Determine if job is "new" (posted recently or within last 2 days)
  const isNew = postedDate.toLowerCase().includes('hour') ||
    postedDate.toLowerCase().includes('just now') ||
    postedDate.toLowerCase().includes('today')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="h-full"
    >
      <Link href={`/dashboard/jobs/${id}`} className="group block h-full">
        <Card className="relative h-full overflow-hidden bg-zinc-900/50 border-white/5 transition-all duration-300 hover:border-accent/40 hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.3)] group-active:scale-[0.99]">
          {/* Spotlight Effect Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* New Badge */}
          {isNew && (
            <div className="absolute top-0 right-0 z-20">
              <div className="bg-accent/20 backdrop-blur-md border-b border-l border-accent/20 text-accent text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg">
                NEW
              </div>
            </div>
          )}

          <CardContent className="relative p-6 flex flex-col h-full z-10">
            <div className="flex items-start justify-between gap-4 mb-5">
              {/* Score Ring */}
              <div className="relative group/ring flex items-center justify-center w-16 h-16 shrink-0">
                <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full opacity-0 group-hover/ring:opacity-40 transition-opacity duration-500" />
                <svg className="transform -rotate-90 w-full h-full relative z-10">
                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-zinc-800"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={cn("transition-all duration-1000 ease-out", getScoreRingColor(matchScore))}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col z-20">
                  <span className={cn("text-sm font-bold font-heading", getScoreColor(matchScore))}>
                    {matchScore}%
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] uppercase font-bold tracking-wider text-zinc-400 group-hover:text-white transition-colors">
                  match <Sparkles className="w-3 h-3 group-hover:text-accent group-hover:animate-pulse" />
                </span>
                <ArrowRight className="w-5 h-5 text-zinc-600 mt-3 group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="font-heading font-bold text-xl text-white mb-1 group-hover:text-accent transition-colors line-clamp-2">
                {title}
              </h3>
              <p className="font-heading font-medium text-zinc-400 text-sm mb-4 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" /> {company}
              </p>

              <div className="space-y-2 mt-auto">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-body truncate">{location}</span>
                </div>
                {salary && salary.toLowerCase() !== 'not listed' && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400/90 font-medium">
                    <DollarSign className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-body">{salary}</span>
                  </div>
                )}
                {skillMatchCount && skillMatchCount.total > 0 && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-accent" />
                    <span className="font-body">
                      <span className={getScoreColor(Math.round((skillMatchCount.matched / skillMatchCount.total) * 100))}>{skillMatchCount.matched}</span>/{skillMatchCount.total} skills matched
                    </span>
                  </div>
                )}
                {semanticScore != null && (
                  <SemanticScoreBadge score={semanticScore} />
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-zinc-400 font-medium">
              <span>Posted {postedDate}</span>
              <span className="group-hover:text-white transition-colors">View Details</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}
