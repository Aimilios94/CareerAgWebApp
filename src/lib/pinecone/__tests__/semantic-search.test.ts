import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing
vi.mock('@/lib/openai/client', () => ({
  generateEmbedding: vi.fn(),
}))

vi.mock('@/lib/pinecone/client', () => ({
  getPineconeIndex: vi.fn(),
}))

import { generateEmbedding } from '@/lib/openai/client'
import { getPineconeIndex } from '@/lib/pinecone/client'
import {
  cosineSimilarity,
  embedSearchQuery,
  getCVEmbedding,
  computeSemanticScores,
  blendScores,
} from '../semantic-search'

describe('semantic-search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('cosineSimilarity', () => {
    it('returns 1.0 for identical vectors', () => {
      const v = [1, 2, 3]
      expect(cosineSimilarity(v, v)).toBeCloseTo(1.0)
    })

    it('returns 0 when one vector is all zeros', () => {
      const a = [1, 2, 3]
      const b = [0, 0, 0]
      expect(cosineSimilarity(a, b)).toBe(0)
    })

    it('computes correct similarity for known vectors', () => {
      // [1,0] and [0,1] are orthogonal => similarity = 0
      const a = [1, 0]
      const b = [0, 1]
      expect(cosineSimilarity(a, b)).toBeCloseTo(0)
    })

    it('computes correct similarity for parallel vectors', () => {
      // [2,0] and [4,0] are parallel => similarity = 1
      const a = [2, 0]
      const b = [4, 0]
      expect(cosineSimilarity(a, b)).toBeCloseTo(1.0)
    })

    it('returns 0 for empty vectors', () => {
      expect(cosineSimilarity([], [])).toBe(0)
    })
  })

  describe('embedSearchQuery', () => {
    it('wraps generateEmbedding and returns the result', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3]
      vi.mocked(generateEmbedding).mockResolvedValue(mockEmbedding)

      const result = await embedSearchQuery('react developer')

      expect(generateEmbedding).toHaveBeenCalledWith('react developer')
      expect(result).toEqual(mockEmbedding)
    })

    it('returns null when generateEmbedding throws', async () => {
      vi.mocked(generateEmbedding).mockRejectedValue(new Error('API error'))

      const result = await embedSearchQuery('test query')

      expect(result).toBeNull()
    })
  })

  describe('getCVEmbedding', () => {
    it('fetches vector by ID from Pinecone namespace', async () => {
      const mockVector = [0.5, 0.6, 0.7]
      const mockFetch = vi.fn().mockResolvedValue({
        records: {
          'cv-1': { values: mockVector },
        },
      })
      const mockNamespace = vi.fn().mockReturnValue({ fetch: mockFetch })
      const mockIndex = { namespace: mockNamespace }
      vi.mocked(getPineconeIndex).mockReturnValue(mockIndex as never)

      const result = await getCVEmbedding('user-123', 'cv-1')

      expect(mockNamespace).toHaveBeenCalledWith('cv-user-123')
      expect(mockFetch).toHaveBeenCalledWith({ ids: ['cv-1'] })
      expect(result).toEqual(mockVector)
    })

    it('returns null when vector not found', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ records: {} })
      const mockNamespace = vi.fn().mockReturnValue({ fetch: mockFetch })
      const mockIndex = { namespace: mockNamespace }
      vi.mocked(getPineconeIndex).mockReturnValue(mockIndex as never)

      const result = await getCVEmbedding('user-123', 'cv-missing')

      expect(result).toBeNull()
    })

    it('returns null when Pinecone throws', async () => {
      vi.mocked(getPineconeIndex).mockImplementation(() => {
        throw new Error('PINECONE_API_KEY is not set')
      })

      const result = await getCVEmbedding('user-123', 'cv-1')

      expect(result).toBeNull()
    })
  })

  describe('computeSemanticScores', () => {
    it('embeds each job description and computes similarity', async () => {
      const cvEmbedding = [1, 0, 0]
      const jobs = [
        { id: 'job-1', description: 'React developer needed' },
        { id: 'job-2', description: 'Python engineer role' },
      ]

      // First call returns vector close to cvEmbedding, second returns orthogonal
      vi.mocked(generateEmbedding)
        .mockResolvedValueOnce([0.9, 0.1, 0])
        .mockResolvedValueOnce([0, 1, 0])

      const results = await computeSemanticScores(cvEmbedding, jobs)

      expect(generateEmbedding).toHaveBeenCalledTimes(2)
      expect(generateEmbedding).toHaveBeenCalledWith('React developer needed')
      expect(generateEmbedding).toHaveBeenCalledWith('Python engineer role')

      expect(results).toHaveLength(2)
      expect(results[0].id).toBe('job-1')
      expect(results[0].semanticScore).toBeGreaterThan(0.9)
      expect(results[1].id).toBe('job-2')
      expect(results[1].semanticScore).toBeCloseTo(0, 1)
    })

    it('returns 0 score when embedding fails for a job', async () => {
      const cvEmbedding = [1, 0]
      const jobs = [{ id: 'job-1', description: 'Some job' }]

      vi.mocked(generateEmbedding).mockRejectedValue(new Error('API error'))

      const results = await computeSemanticScores(cvEmbedding, jobs)

      expect(results).toHaveLength(1)
      expect(results[0].semanticScore).toBe(0)
    })

    it('handles jobs with no description', async () => {
      const cvEmbedding = [1, 0]
      const jobs = [{ id: 'job-1', description: '' }]

      const results = await computeSemanticScores(cvEmbedding, jobs)

      expect(results).toHaveLength(1)
      expect(results[0].semanticScore).toBe(0)
      expect(generateEmbedding).not.toHaveBeenCalled()
    })
  })

  describe('blendScores', () => {
    it('blends keyword and semantic scores with given weight', () => {
      // weight 0.3 => 70% keyword + 30% semantic
      const result = blendScores(80, 60, 0.3)
      expect(result).toBeCloseTo(74) // 0.7*80 + 0.3*60 = 56 + 18 = 74
    })

    it('returns keyword score when weight is 0', () => {
      const result = blendScores(80, 60, 0)
      expect(result).toBeCloseTo(80)
    })

    it('returns semantic score when weight is 1', () => {
      const result = blendScores(80, 60, 1)
      expect(result).toBeCloseTo(60)
    })
  })
})
