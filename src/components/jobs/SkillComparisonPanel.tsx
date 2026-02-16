'use client'

import { SkillBadge } from './SkillBadge'
import type { SkillComparison } from '@/lib/skills'

interface SkillComparisonPanelProps {
  comparison: SkillComparison
  showTips?: boolean
}

export function SkillComparisonPanel({ comparison, showTips = true }: SkillComparisonPanelProps) {
  const { matched, partial, missing } = comparison

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        {/* Matched Skills */}
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✅</span>
            <h4 className="font-medium text-emerald-400">
              Matched ({matched.length})
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {matched.map((skill) => (
              <SkillBadge key={skill} skill={skill} status="matched" />
            ))}
            {matched.length === 0 && (
              <p className="text-sm text-emerald-400/70">No matched skills</p>
            )}
          </div>
        </div>

        {/* Partial Skills */}
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🟡</span>
            <h4 className="font-medium text-amber-400">
              Partial ({partial.length})
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {partial.map((skill) => (
              <SkillBadge key={skill} skill={skill} status="partial" />
            ))}
            {partial.length === 0 && (
              <p className="text-sm text-amber-400/70">No partial matches</p>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">❌</span>
            <h4 className="font-medium text-red-400">
              Missing ({missing.length})
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {missing.map((skill) => (
              <SkillBadge key={skill} skill={skill} status="missing" />
            ))}
            {missing.length === 0 && (
              <p className="text-sm text-red-400/70">No missing skills!</p>
            )}
          </div>
        </div>
      </div>

      {/* Tips Section */}
      {showTips && missing.length > 0 && (
        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
          <h4 className="font-medium text-accent mb-2">💡 Improvement Tips</h4>
          <ul className="text-sm text-zinc-300 space-y-1">
            <li>• Consider taking online courses for {missing.slice(0, 2).join(' and ')}</li>
            <li>• Highlight transferable skills in your application</li>
            <li>• Add relevant projects to your portfolio</li>
          </ul>
        </div>
      )}
    </div>
  )
}
