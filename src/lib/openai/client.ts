import OpenAI from 'openai'
import type { ParsedCVData, GeneratedCoverLetter, GeneratedCV, InterviewQuestion } from './types'

let openaiClient: OpenAI | null = null

/**
 * Get or create singleton OpenAI client
 * Throws if OPENAI_API_KEY is not set
 */
export function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

/**
 * Reset the singleton client (for testing)
 */
export function resetOpenAIClient(): void {
  openaiClient = null
}

/**
 * Parse CV text into structured data using GPT-4o-mini
 */
export async function parseCV(text: string): Promise<ParsedCVData> {
  const client = getOpenAIClient()

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a CV/resume parser. Extract structured data from the CV text.
Return a JSON object with these fields:
- skills: array of skill strings
- experience: array of { role, company, duration, description }
- education: array of { degree, institution, year }
- summary: a brief professional summary (2-3 sentences)

Return ONLY valid JSON, no markdown or extra text.`,
      },
      {
        role: 'user',
        content: text,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  const parsed = JSON.parse(content)
  return {
    skills: parsed.skills || [],
    experience: parsed.experience || [],
    education: parsed.education || [],
    summary: parsed.summary || '',
  }
}

/**
 * Generate embedding vector for text using text-embedding-3-small
 * Returns a 1536-dimensional vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient()

  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  return response.data[0].embedding
}

/**
 * Generate a cover letter using GPT-4o-mini
 */
export async function generateCoverLetter(
  cvData: { skills?: string[]; summary?: string },
  jobData: { title?: string; company?: string },
  tone: string = 'professional'
): Promise<GeneratedCoverLetter> {
  const client = getOpenAIClient()

  const title = jobData.title || 'the position'
  const company = jobData.company || 'the company'
  const skills = cvData.skills?.join(', ') || 'various technical skills'
  const summary = cvData.summary || ''

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a professional cover letter writer. Generate a cover letter in JSON format with these fields:
- subject: email subject line for the application
- body: the full cover letter text
- tone: the tone used ("${tone}")

The tone should be: ${tone}. Return ONLY valid JSON.`,
      },
      {
        role: 'user',
        content: `Write a cover letter for the ${title} position at ${company}.

Candidate skills: ${skills}
Candidate summary: ${summary}

Tone: ${tone}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  const parsed = JSON.parse(content)
  return {
    subject: parsed.subject || `Application for ${title} at ${company}`,
    body: parsed.body || '',
    tone: parsed.tone || tone,
  }
}

/**
 * Generate a tailored CV using GPT-4o-mini
 */
export async function generateTailoredCV(
  cvData: { skills?: string[]; experience?: Array<{ role: string; company: string; duration: string; description: string }> },
  jobData: { title?: string; company?: string }
): Promise<GeneratedCV> {
  const client = getOpenAIClient()

  const title = jobData.title || 'the position'
  const company = jobData.company || 'the company'
  const skills = cvData.skills?.join(', ') || 'various skills'
  const experience = cvData.experience?.map(e => `${e.role} at ${e.company} (${e.duration}): ${e.description}`).join('\n') || ''

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a professional CV/resume writer. Generate a tailored CV in JSON format with these fields:
- summary: a tailored professional summary (2-3 sentences)
- skills: array of relevant skills (prioritized for the job)
- experience: array of { role, company, duration, highlights: string[] }
- atsScore: estimated ATS compatibility score (0-100)

Return ONLY valid JSON.`,
      },
      {
        role: 'user',
        content: `Tailor this CV for the ${title} position at ${company}.

Current skills: ${skills}
Current experience:
${experience}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  const parsed = JSON.parse(content)
  return {
    summary: parsed.summary || '',
    skills: parsed.skills || [],
    experience: parsed.experience || [],
    atsScore: parsed.atsScore || 75,
  }
}

/**
 * Generate interview preparation questions using GPT-4o-mini
 */
export async function generateInterviewQuestions(
  jobData: { title?: string; company?: string }
): Promise<InterviewQuestion[]> {
  const client = getOpenAIClient()

  const title = jobData.title || 'the position'
  const company = jobData.company || 'the company'

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an interview preparation expert. Generate 5 interview questions in JSON format.
Return a JSON object with a "questions" array. Each question has:
- question: the interview question text
- type: one of "behavioral", "technical", "situational", "role-specific", "cultural-fit"
- guidance: advice on how to answer (1-2 sentences)
- tip: a quick tip (1 sentence)

Return ONLY valid JSON.`,
      },
      {
        role: 'user',
        content: `Generate interview questions for the ${title} position at ${company}.`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  const parsed = JSON.parse(content)
  return parsed.questions || []
}
