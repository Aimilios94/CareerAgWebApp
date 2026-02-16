'use client'

import { FileText, Loader2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CVQuickViewProps {
  cv: {
    id: string
    filename: string
    parsed_data: {
      skills: string[]
      experience: Array<{ company: string; role: string; duration?: string; dates?: string }>
      education: Array<{ institution: string; degree: string; year: string }>
      summary: string
    } | null
  } | null
}

export function CVQuickView({ cv }: CVQuickViewProps) {
  // Empty state: no CV uploaded
  if (!cv) {
    return (
      <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-white">
            <FileText className="h-4 w-4 text-zinc-400" />
            CV Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-10 w-10 text-zinc-600 mb-3" />
            <p className="text-zinc-400 text-sm">
              Upload your CV to see AI-powered insights
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Analyzing state: CV exists but not yet parsed
  if (!cv.parsed_data) {
    return (
      <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-white">
            <FileText className="h-4 w-4 text-zinc-400" />
            CV Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 className="h-8 w-8 text-accent animate-spin mb-3" />
            <p className="text-zinc-400 text-sm">
              Analyzing your CV...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { skills, experience, summary } = cv.parsed_data

  // Truncate summary to ~100 characters
  const truncateSummary = (text: string, maxLength: number = 100): string => {
    if (!text || text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  // Get display skills (first 6) and count remaining
  const displaySkills = skills.slice(0, 6)
  const remainingSkillsCount = skills.length - 6

  // Get most recent experience (first item)
  const currentExperience = experience.length > 0 ? experience[0] : null

  return (
    <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-white">
            <FileText className="h-4 w-4 text-zinc-400" />
            CV Analysis
          </CardTitle>
          <button className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
            View All
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Skills */}
        {displaySkills.length > 0 && (
          <div>
            <p className="text-xs text-zinc-400 mb-2">Skills:</p>
            <div className="flex flex-wrap gap-1.5">
              {displaySkills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/8 text-zinc-200 border border-white/15"
                >
                  {skill}
                </span>
              ))}
              {remainingSkillsCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                  +{remainingSkillsCount} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Current Experience */}
        {currentExperience && (
          <div>
            <p className="text-xs text-zinc-400 mb-1">Current:</p>
            <p className="text-sm text-zinc-300">
              {currentExperience.role} at {currentExperience.company}
            </p>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div>
            <p className="text-sm text-zinc-400 italic leading-relaxed">
              {truncateSummary(summary)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
