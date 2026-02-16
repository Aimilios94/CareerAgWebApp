/**
 * Available n8n webhook workflows
 */
export type N8nWorkflow =
  | 'job-search'
  | 'cv-parse'
  | 'cv-generate'
  | 'cover-letter-generate'
  | 'skill-gap-analysis'
  | 'interview-prep'

/**
 * Payload types for each webhook workflow
 */
export interface N8nWebhookPayload {
  'job-search': JobSearchPayload
  'cv-parse': CVParsePayload
  'cv-generate': CVGeneratePayload
  'cover-letter-generate': CoverLetterPayload
  'skill-gap-analysis': SkillGapPayload
  'interview-prep': InterviewPrepPayload
}

/**
 * Job search workflow payload
 */
export interface JobSearchPayload {
  userId: string
  searchId: string
  query: string
  filters?: {
    location?: string
    remote?: boolean
    salaryMin?: number
    salaryMax?: number
    experienceLevel?: string
    jobType?: string
  }
}

/**
 * CV parsing workflow payload
 */
export interface CVParsePayload {
  userId: string
  cvId: string
  storagePath: string
  signedUrl?: string  // Signed URL for n8n to download the file
  filename: string
}

/**
 * CV generation workflow payload
 */
export interface CVGeneratePayload {
  userId: string
  jobId: string
  templateId?: string
  customizations?: {
    highlightSkills?: string[]
    experienceOrder?: string[]
    format?: 'pdf' | 'docx'
  }
}

/**
 * Cover letter generation workflow payload
 */
export interface CoverLetterPayload {
  userId: string
  jobId: string
  cvId: string
  tone?: 'professional' | 'friendly' | 'enthusiastic'
  length?: 'short' | 'medium' | 'long'
}

/**
 * Skill gap analysis workflow payload
 */
export interface SkillGapPayload {
  userId: string
  cvId: string
  jobId?: string
  targetRole?: string
}

/**
 * Interview prep workflow payload
 */
export interface InterviewPrepPayload {
  userId: string
  jobId: string
  jobTitle?: string
  company?: string
}

/**
 * Callback payload types (from n8n back to the app)
 */
export interface N8nCallbackPayload {
  type: 'job-matches' | 'cv-parsed' | 'search-status' | 'document-generated'
  payload: CVAnalysisResult | unknown
}

export interface CVAnalysisResult {
  cvId: string;
  skills: string[];
  experience: {
    role: string;
    company: string;
    duration: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  score?: number;
  summary?: string;
}
