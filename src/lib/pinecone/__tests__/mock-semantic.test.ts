import { describe, it, expect } from 'vitest'
import { mockSemanticScores } from '../mock-semantic'

describe('mock-semantic', () => {
  describe('mockSemanticScores', () => {
    it('returns higher score for jobs with more keyword overlap', () => {
      const jobs = [
        { id: 'job-1', description: 'Senior React developer with TypeScript experience' },
        { id: 'job-2', description: 'Marketing manager for social media campaigns' },
      ]
      const query = 'react typescript developer'

      const results = mockSemanticScores(jobs, query)

      expect(results).toHaveLength(2)
      expect(results[0].id).toBe('job-1')
      expect(results[1].id).toBe('job-2')
      expect(results[0].semanticScore).toBeGreaterThan(results[1].semanticScore)
    })

    it('returns 0 for jobs with no keyword overlap', () => {
      const jobs = [
        { id: 'job-1', description: 'Underwater basket weaving instructor' },
      ]
      const query = 'react developer'

      const results = mockSemanticScores(jobs, query)

      expect(results[0].semanticScore).toBe(0)
    })

    it('handles empty description gracefully', () => {
      const jobs = [{ id: 'job-1', description: '' }]
      const query = 'react developer'

      const results = mockSemanticScores(jobs, query)

      expect(results).toHaveLength(1)
      expect(results[0].semanticScore).toBe(0)
    })

    it('handles empty query gracefully', () => {
      const jobs = [{ id: 'job-1', description: 'React developer' }]
      const query = ''

      const results = mockSemanticScores(jobs, query)

      expect(results).toHaveLength(1)
      expect(results[0].semanticScore).toBe(0)
    })
  })
})
