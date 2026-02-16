'use client'

import { useState } from 'react'
import { SkillBadge } from './SkillBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, getScoreColor, getScoreBgColor } from '@/lib/utils'
import { X, Lightbulb, ExternalLink } from 'lucide-react'

interface Skill {
  name: string
  status: 'matched' | 'partial' | 'missing'
  tip?: string
  resources?: { title: string; url: string }[]
}

interface GapAnalysisTabProps {
  matchScore: number
  skillMatchScore: number
  experienceMatchScore: number
  educationMatchScore: number
  skills: Skill[]
}

export function GapAnalysisTab({
  matchScore,
  skillMatchScore,
  experienceMatchScore,
  educationMatchScore,
  skills,
}: GapAnalysisTabProps) {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)

  const matchedSkills = skills.filter((s) => s.status === 'matched')
  const partialSkills = skills.filter((s) => s.status === 'partial')
  const missingSkills = skills.filter((s) => s.status === 'missing')

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Match Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-4 gap-6">
            {/* Overall Score */}
            <div className="text-center">
              <div
                className={cn(
                  'inline-flex items-center justify-center w-20 h-20 rounded-full text-white font-heading font-bold text-2xl mb-2',
                  getScoreBgColor(matchScore)
                )}
              >
                {matchScore}
              </div>
              <p className="font-heading font-medium text-brand-dark">
                Overall Match
              </p>
            </div>

            {/* Skill Score */}
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-2">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    className="text-brand-light-gray"
                    strokeWidth="6"
                    stroke="currentColor"
                    fill="transparent"
                    r="34"
                    cx="40"
                    cy="40"
                  />
                  <circle
                    className={getScoreColor(skillMatchScore)}
                    strokeWidth="6"
                    strokeDasharray={`${skillMatchScore * 2.14} 214`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="34"
                    cx="40"
                    cy="40"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={cn(
                      'font-heading font-bold text-lg',
                      getScoreColor(skillMatchScore)
                    )}
                  >
                    {skillMatchScore}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-brand-mid-gray font-body">Skills</p>
            </div>

            {/* Experience Score */}
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-2">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    className="text-brand-light-gray"
                    strokeWidth="6"
                    stroke="currentColor"
                    fill="transparent"
                    r="34"
                    cx="40"
                    cy="40"
                  />
                  <circle
                    className={getScoreColor(experienceMatchScore)}
                    strokeWidth="6"
                    strokeDasharray={`${experienceMatchScore * 2.14} 214`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="34"
                    cx="40"
                    cy="40"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={cn(
                      'font-heading font-bold text-lg',
                      getScoreColor(experienceMatchScore)
                    )}
                  >
                    {experienceMatchScore}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-brand-mid-gray font-body">Experience</p>
            </div>

            {/* Education Score */}
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-2">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    className="text-brand-light-gray"
                    strokeWidth="6"
                    stroke="currentColor"
                    fill="transparent"
                    r="34"
                    cx="40"
                    cy="40"
                  />
                  <circle
                    className={getScoreColor(educationMatchScore)}
                    strokeWidth="6"
                    strokeDasharray={`${educationMatchScore * 2.14} 214`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="34"
                    cx="40"
                    cy="40"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={cn(
                      'font-heading font-bold text-lg',
                      getScoreColor(educationMatchScore)
                    )}
                  >
                    {educationMatchScore}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-brand-mid-gray font-body">Education</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Analysis */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Missing Skills */}
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔴</span>
              <CardTitle className="text-red-800">
                Missing Skills ({missingSkills.length})
              </CardTitle>
            </div>
            <p className="text-sm text-brand-mid-gray font-body">
              Skills you need to develop
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill) => (
                <SkillBadge
                  key={skill.name}
                  skill={skill.name}
                  status="missing"
                  onClick={() => setSelectedSkill(skill)}
                />
              ))}
              {missingSkills.length === 0 && (
                <p className="text-sm text-brand-mid-gray font-body">
                  No missing skills!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Partial Skills */}
        <Card className="border-yellow-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🟡</span>
              <CardTitle className="text-yellow-800">
                Partial Gaps ({partialSkills.length})
              </CardTitle>
            </div>
            <p className="text-sm text-brand-mid-gray font-body">
              Skills you have but need to improve
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {partialSkills.map((skill) => (
                <SkillBadge
                  key={skill.name}
                  skill={skill.name}
                  status="partial"
                  onClick={() => setSelectedSkill(skill)}
                />
              ))}
              {partialSkills.length === 0 && (
                <p className="text-sm text-brand-mid-gray font-body">
                  No partial gaps!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Matched Skills */}
        <Card className="border-brand-mid-gray/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚪</span>
              <CardTitle className="text-brand-dark">
                Matched Skills ({matchedSkills.length})
              </CardTitle>
            </div>
            <p className="text-sm text-brand-mid-gray font-body">
              Skills you already have
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((skill) => (
                <SkillBadge
                  key={skill.name}
                  skill={skill.name}
                  status="matched"
                />
              ))}
              {matchedSkills.length === 0 && (
                <p className="text-sm text-brand-mid-gray font-body">
                  No matched skills yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skill Tip Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-brand-dark/50"
            onClick={() => setSelectedSkill(null)}
          />
          <Card className="relative z-10 w-full max-w-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-accent-orange" />
                  <CardTitle>{selectedSkill.name}</CardTitle>
                </div>
                <button
                  onClick={() => setSelectedSkill(null)}
                  className="p-1 hover:bg-brand-light-gray rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-brand-mid-gray" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-brand-mid-gray font-body mb-4">
                {selectedSkill.tip ||
                  'Consider taking online courses or working on personal projects to develop this skill.'}
              </p>
              {selectedSkill.resources && selectedSkill.resources.length > 0 && (
                <div>
                  <p className="font-heading font-medium text-sm text-brand-dark mb-2">
                    Recommended Resources:
                  </p>
                  <ul className="space-y-2">
                    {selectedSkill.resources.map((resource, idx) => (
                      <li key={idx}>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-accent-blue hover:underline font-body text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {resource.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
