'use client'

import { FileText, Briefcase, GraduationCap, Sparkles, Code } from 'lucide-react'

interface ParsedCVData {
  skills: string[]
  experience: Array<{ company: string; role: string; dates?: string; duration?: string }>
  education: Array<{ institution: string; degree: string; year: string }>
  summary: string
}

interface CVStatsPanelProps {
  parsedData: ParsedCVData | null | undefined
}

export function CVStatsPanel({ parsedData }: CVStatsPanelProps) {
  if (!parsedData) {
    return (
      <div className="h-full rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md">
        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
          <FileText className="h-12 w-12 text-zinc-500 mb-4" />
          <p className="text-zinc-400">Upload your CV</p>
          <p className="text-sm text-zinc-500 mt-1">
            to see your skills, experience, and education
          </p>
        </div>
      </div>
    )
  }

  const { skills, experience, education, summary } = parsedData

  return (
    <div className="space-y-4">
      {/* Summary */}
      {summary && (
        <div className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md p-5">
          <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Summary
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Skills */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Code className="h-4 w-4 text-accent" />
            Skills
          </h3>
          <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-full">
            {skills.length}
          </span>
        </div>
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-accent/10 text-accent border border-accent/20"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No skills found</p>
        )}
      </div>

      {/* Experience */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-emerald-400" />
            Experience
          </h3>
          {experience.length > 0 && (
            <span className="text-xs text-zinc-500">
              {experience.length} positions
            </span>
          )}
        </div>
        {experience.length > 0 ? (
          <div className="space-y-3">
            {experience.map((exp, index) => (
              <div
                key={index}
                className="relative pl-3 border-l-2 border-emerald-500/30"
              >
                <p className="font-medium text-sm text-white">{exp.company}</p>
                <p className="text-xs text-zinc-300">{exp.role}</p>
                {(exp.dates || exp.duration) && (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {exp.dates || exp.duration}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No experience listed</p>
        )}
      </div>

      {/* Education */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md p-5">
        <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-3">
          <GraduationCap className="h-4 w-4 text-purple-400" />
          Education
        </h3>
        {education.length > 0 ? (
          <div className="space-y-3">
            {education.map((edu, index) => (
              <div key={index}>
                <p className="font-medium text-sm text-white">{edu.institution}</p>
                <p className="text-xs text-zinc-300">{edu.degree}</p>
                {edu.year && (
                  <p className="text-xs text-zinc-400">{edu.year}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No education listed</p>
        )}
      </div>
    </div>
  )
}
