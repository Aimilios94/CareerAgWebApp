import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockChatCreate, mockEmbeddingsCreate } = vi.hoisted(() => {
  const mockChatCreate = vi.fn()
  const mockEmbeddingsCreate = vi.fn()
  return { mockChatCreate, mockEmbeddingsCreate }
})

vi.mock('openai', () => {
  class MockOpenAI {
    chat = { completions: { create: mockChatCreate } }
    embeddings = { create: mockEmbeddingsCreate }
  }
  return { default: MockOpenAI }
})

import {
  getOpenAIClient,
  resetOpenAIClient,
  parseCV,
  generateEmbedding,
  generateCoverLetter,
  generateTailoredCV,
  generateInterviewQuestions,
} from '../client'

describe('OpenAI Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetOpenAIClient()
    process.env.OPENAI_API_KEY = 'test-key'
  })

  afterEach(() => {
    delete process.env.OPENAI_API_KEY
  })

  describe('getOpenAIClient', () => {
    it('throws when OPENAI_API_KEY is not set', () => {
      delete process.env.OPENAI_API_KEY
      expect(() => getOpenAIClient()).toThrow('OPENAI_API_KEY is not set')
    })

    it('returns an OpenAI client when key is set', () => {
      const client = getOpenAIClient()
      expect(client).toBeDefined()
      expect(client.chat).toBeDefined()
    })

    it('returns the same singleton instance on subsequent calls', () => {
      const client1 = getOpenAIClient()
      const client2 = getOpenAIClient()
      expect(client1).toBe(client2)
    })
  })

  describe('parseCV', () => {
    it('returns structured data matching ParsedCVData', async () => {
      const mockResult = {
        skills: ['JavaScript', 'React'],
        experience: [{ role: 'Dev', company: 'Co', duration: '2y', description: 'Built stuff' }],
        education: [{ degree: 'BS CS', institution: 'Uni', year: '2020' }],
        summary: 'Experienced dev',
      }

      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResult) } }],
      })

      const result = await parseCV('some CV text')

      expect(result.skills).toEqual(['JavaScript', 'React'])
      expect(result.experience).toHaveLength(1)
      expect(result.experience[0].role).toBe('Dev')
      expect(result.education).toHaveLength(1)
      expect(result.summary).toBe('Experienced dev')
    })

    it('throws when OPENAI_API_KEY is not set', async () => {
      delete process.env.OPENAI_API_KEY
      resetOpenAIClient()
      await expect(parseCV('text')).rejects.toThrow('OPENAI_API_KEY is not set')
    })

    it('throws when OpenAI returns no content', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      })

      await expect(parseCV('text')).rejects.toThrow('No response from OpenAI')
    })

    it('handles missing fields gracefully with defaults', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({}) } }],
      })

      const result = await parseCV('text')
      expect(result.skills).toEqual([])
      expect(result.experience).toEqual([])
      expect(result.education).toEqual([])
      expect(result.summary).toBe('')
    })
  })

  describe('generateEmbedding', () => {
    it('returns array of numbers', async () => {
      const mockEmbedding = Array.from({ length: 1536 }, (_, i) => i * 0.001)
      mockEmbeddingsCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      })

      const result = await generateEmbedding('some text')
      expect(result).toHaveLength(1536)
      expect(typeof result[0]).toBe('number')
    })

    it('calls embeddings API with text-embedding-3-small model', async () => {
      mockEmbeddingsCreate.mockResolvedValue({
        data: [{ embedding: [0.1, 0.2] }],
      })

      await generateEmbedding('test text')
      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'test text',
      })
    })
  })

  describe('generateCoverLetter', () => {
    it('returns subject, body, and tone', async () => {
      const mockResult = {
        subject: 'Application for Developer at Acme',
        body: 'Dear Hiring Manager...',
        tone: 'professional',
      }

      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResult) } }],
      })

      const result = await generateCoverLetter(
        { skills: ['JS'], summary: 'Dev' },
        { title: 'Developer', company: 'Acme' },
        'professional'
      )

      expect(result.subject).toBe('Application for Developer at Acme')
      expect(result.body).toBe('Dear Hiring Manager...')
      expect(result.tone).toBe('professional')
    })

    it('provides defaults for missing response fields', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({}) } }],
      })

      const result = await generateCoverLetter(
        {},
        { title: 'Dev', company: 'Co' },
        'friendly'
      )

      expect(result.subject).toContain('Dev')
      expect(result.tone).toBe('friendly')
    })
  })

  describe('generateTailoredCV', () => {
    it('returns summary, skills, experience, and atsScore', async () => {
      const mockResult = {
        summary: 'Tailored summary',
        skills: ['React', 'Node.js'],
        experience: [{ role: 'Dev', company: 'Co', duration: '2y', highlights: ['Built app'] }],
        atsScore: 92,
      }

      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResult) } }],
      })

      const result = await generateTailoredCV(
        { skills: ['React'], experience: [{ role: 'Dev', company: 'Co', duration: '2y', description: 'stuff' }] },
        { title: 'Engineer', company: 'Acme' }
      )

      expect(result.summary).toBe('Tailored summary')
      expect(result.skills).toContain('React')
      expect(result.atsScore).toBe(92)
      expect(result.experience).toHaveLength(1)
    })

    it('provides default atsScore when missing', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ summary: 'test' }) } }],
      })

      const result = await generateTailoredCV({}, { title: 'Dev' })
      expect(result.atsScore).toBe(75)
    })
  })

  describe('generateInterviewQuestions', () => {
    it('returns array of questions with correct structure', async () => {
      const mockQuestions = [
        { question: 'Tell me about yourself', type: 'behavioral', guidance: 'Use STAR', tip: 'Be concise' },
        { question: 'Why this role?', type: 'role-specific', guidance: 'Research company', tip: 'Be specific' },
      ]

      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ questions: mockQuestions }) } }],
      })

      const result = await generateInterviewQuestions({ title: 'Dev', company: 'Acme' })
      expect(result).toHaveLength(2)
      expect(result[0].question).toBe('Tell me about yourself')
      expect(result[0].type).toBe('behavioral')
      expect(result[0].guidance).toBeDefined()
      expect(result[0].tip).toBeDefined()
    })

    it('returns empty array when response has no questions', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({}) } }],
      })

      const result = await generateInterviewQuestions({ title: 'Dev' })
      expect(result).toEqual([])
    })
  })
})
