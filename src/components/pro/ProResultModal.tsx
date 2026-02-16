'use client'

import { useState } from 'react'
import { X, Copy, Check, Loader2, AlertCircle, FileText, Mail, Mic, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProResultModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  type: 'cv' | 'cover-letter' | 'interview'
  data: any
  isLoading?: boolean
  error?: string | null
}

export function ProResultModal({
  isOpen, onClose, title, type, data,
  isLoading = false, error = null,
}: ProResultModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = async () => {
    let textToCopy = ''
    if (type === 'cv' && data) {
      textToCopy = `${data.summary || ''}\n\nSkills: ${(data.skills || []).join(', ')}\n\nATS Score: ${data.atsScore || 'N/A'}`
    } else if (type === 'cover-letter' && data) {
      textToCopy = `Subject: ${data.subject || ''}\n\n${data.body || ''}`
    } else if (type === 'interview' && data?.questions) {
      textToCopy = data.questions.map((q: any, i: number) =>
        `${i + 1}. [${q.type}] ${q.question}\n   Guidance: ${q.guidance}\n   Tip: ${q.tip}`
      ).join('\n\n')
    }
    await navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getIcon = () => {
    switch (type) {
      case 'cv': return <FileText className="w-5 h-5" />
      case 'cover-letter': return <Mail className="w-5 h-5" />
      case 'interview': return <Mic className="w-5 h-5" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-orange/10 rounded-xl flex items-center justify-center text-accent-orange">
              {getIcon()}
            </div>
            <h2 className="font-heading font-semibold text-lg text-white">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {data && !isLoading && !error && (
              <Button variant="outline" size="sm" onClick={handleCopy}
                className="border-white/10 hover:bg-white/5 gap-2" aria-label="Copy to clipboard">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}
              className="text-zinc-400 hover:text-white" aria-label="Close">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-accent-orange animate-spin mb-4" />
              <p className="text-zinc-400">Generating your content...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-red-400 font-medium mb-1">Generation Failed</p>
              <p className="text-zinc-400 text-sm">{error}</p>
            </div>
          )}

          {!isLoading && !error && data && type === 'cv' && <CVContent data={data} />}
          {!isLoading && !error && data && type === 'cover-letter' && <CoverLetterContent data={data} />}
          {!isLoading && !error && data && type === 'interview' && <InterviewContent data={data} />}
        </div>
      </div>
    </div>
  )
}

function CVContent({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {data.atsScore && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <Award className="w-6 h-6 text-emerald-400" />
          <div>
            <span className="text-emerald-400 font-bold text-lg">{data.atsScore}%</span>
            <span className="text-zinc-400 text-sm ml-2">ATS Compatibility Score</span>
          </div>
        </div>
      )}
      {data.summary && (
        <div>
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Summary</h3>
          <p className="text-zinc-200 leading-relaxed">{data.summary}</p>
        </div>
      )}
      {data.skills && data.skills.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-zinc-300">{skill}</span>
            ))}
          </div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Experience</h3>
          {data.experience.map((exp: any, i: number) => (
            <div key={i} className="p-4 bg-white/5 rounded-xl mb-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-white font-medium">{exp.role}</p>
                  <p className="text-zinc-400 text-sm">{exp.company}</p>
                </div>
                <span className="text-zinc-500 text-sm">{exp.duration}</span>
              </div>
              {exp.highlights && (
                <ul className="list-disc list-inside text-zinc-300 text-sm space-y-1">
                  {exp.highlights.map((h: string, j: number) => <li key={j}>{h}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CoverLetterContent({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.subject && (
        <div>
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-1">Subject</h3>
          <p className="text-white font-medium">{data.subject}</p>
        </div>
      )}
      {data.tone && (
        <span className={cn(
          "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
          data.tone === 'professional' && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
          data.tone === 'friendly' && "bg-green-500/10 text-green-400 border border-green-500/20",
          data.tone === 'enthusiastic' && "bg-orange-500/10 text-orange-400 border border-orange-500/20",
        )}>
          {data.tone}
        </span>
      )}
      {data.body && (
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">{data.body}</p>
        </div>
      )}
    </div>
  )
}

function InterviewContent({ data }: { data: any }) {
  const typeColors: Record<string, string> = {
    'behavioral': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'technical': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'situational': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'role-specific': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'cultural-fit': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  }

  return (
    <div className="space-y-4">
      {data.questions?.map((q: any, i: number) => (
        <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-accent-orange font-bold text-lg shrink-0">{i + 1}</span>
            <div className="flex-1">
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mb-2",
                typeColors[q.type] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
              )}>
                {q.type}
              </span>
              <p className="text-white font-medium">{q.question}</p>
            </div>
          </div>
          {q.guidance && (
            <div className="ml-8 mt-2 text-sm">
              <p className="text-zinc-400"><span className="text-zinc-500 font-medium">Guidance:</span> {q.guidance}</p>
            </div>
          )}
          {q.tip && (
            <div className="ml-8 mt-1 text-sm">
              <p className="text-amber-400/80"><span className="font-medium">Tip:</span> {q.tip}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
