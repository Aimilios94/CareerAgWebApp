/**
 * TypeScript types for OpenAI integration
 * Reuses CVAnalysisResult from n8n/types.ts where applicable
 */

export interface ParsedCVData {
  skills: string[]
  experience: {
    role: string
    company: string
    duration: string
    description: string
  }[]
  education: {
    degree: string
    institution: string
    year: string
  }[]
  summary: string
}

export interface GeneratedCoverLetter {
  subject: string
  body: string
  tone: string
}

export interface GeneratedCV {
  summary: string
  skills: string[]
  experience: {
    role: string
    company: string
    duration: string
    highlights: string[]
  }[]
  atsScore: number
}

export interface InterviewQuestion {
  question: string
  type: 'behavioral' | 'technical' | 'situational' | 'role-specific' | 'cultural-fit'
  guidance: string
  tip: string
}
