import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Must use vi.hoisted to make mocks available in vi.mock factory
const { mockUpsert, mockQuery, mockDeleteOne, mockNamespace, mockIndex } = vi.hoisted(() => {
  const mockUpsert = vi.fn()
  const mockQuery = vi.fn()
  const mockDeleteOne = vi.fn()
  const mockNamespace = vi.fn()
  const mockIndex = vi.fn()
  return { mockUpsert, mockQuery, mockDeleteOne, mockNamespace, mockIndex }
})

vi.mock('@pinecone-database/pinecone', () => {
  class MockPinecone {
    index = mockIndex
  }
  return { Pinecone: MockPinecone }
})

import {
  getPineconeClient,
  resetPineconeClient,
  getPineconeIndex,
  upsertCVEmbedding,
  querySimilar,
  deleteCVEmbedding,
} from '../client'

describe('Pinecone Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetPineconeClient()
    process.env.PINECONE_API_KEY = 'test-pinecone-key'
    process.env.PINECONE_INDEX_NAME = 'test-index'

    // Set up mock chain
    mockNamespace.mockReturnValue({
      upsert: mockUpsert,
      query: mockQuery,
      deleteOne: mockDeleteOne,
    })
    mockIndex.mockReturnValue({
      namespace: mockNamespace,
      query: mockQuery,
    })
  })

  afterEach(() => {
    delete process.env.PINECONE_API_KEY
    delete process.env.PINECONE_INDEX_NAME
  })

  describe('getPineconeClient', () => {
    it('throws when PINECONE_API_KEY is not set', () => {
      delete process.env.PINECONE_API_KEY
      expect(() => getPineconeClient()).toThrow('PINECONE_API_KEY is not set')
    })

    it('returns a client when key is set', () => {
      const client = getPineconeClient()
      expect(client).toBeDefined()
    })

    it('returns the same singleton on subsequent calls', () => {
      const client1 = getPineconeClient()
      const client2 = getPineconeClient()
      expect(client1).toBe(client2)
    })
  })

  describe('getPineconeIndex', () => {
    it('throws when PINECONE_INDEX_NAME is not set', () => {
      delete process.env.PINECONE_INDEX_NAME
      expect(() => getPineconeIndex()).toThrow('PINECONE_INDEX_NAME is not set')
    })

    it('returns an index when configured', () => {
      const index = getPineconeIndex()
      expect(index).toBeDefined()
      expect(mockIndex).toHaveBeenCalledWith('test-index')
    })
  })

  describe('upsertCVEmbedding', () => {
    it('calls Pinecone upsert with correct namespace and data', async () => {
      mockUpsert.mockResolvedValue(undefined)
      const embedding = [0.1, 0.2, 0.3]

      await upsertCVEmbedding('user-123', 'cv-456', embedding)

      expect(mockNamespace).toHaveBeenCalledWith('cv-user-123')
      expect(mockUpsert).toHaveBeenCalledWith({
        records: [
          expect.objectContaining({
            id: 'cv-456',
            values: embedding,
            metadata: expect.objectContaining({
              userId: 'user-123',
              cvId: 'cv-456',
            }),
          }),
        ],
      })
    })
  })

  describe('querySimilar', () => {
    it('returns scored results', async () => {
      mockQuery.mockResolvedValue({
        matches: [
          { id: 'cv-1', score: 0.95, metadata: {} },
          { id: 'cv-2', score: 0.87, metadata: {} },
        ],
      })

      const results = await querySimilar([0.1, 0.2], 5, 'user-123')
      expect(results).toHaveLength(2)
      expect(results[0].id).toBe('cv-1')
      expect(results[0].score).toBe(0.95)
    })

    it('uses user namespace when userId provided', async () => {
      mockQuery.mockResolvedValue({ matches: [] })
      await querySimilar([0.1], 5, 'user-123')
      expect(mockNamespace).toHaveBeenCalledWith('cv-user-123')
    })

    it('returns empty array when no matches', async () => {
      mockQuery.mockResolvedValue({ matches: [] })
      const results = await querySimilar([0.1])
      expect(results).toEqual([])
    })
  })

  describe('deleteCVEmbedding', () => {
    it('calls Pinecone deleteOne with correct namespace and ID', async () => {
      mockDeleteOne.mockResolvedValue(undefined)
      await deleteCVEmbedding('cv-456', 'user-123')
      expect(mockNamespace).toHaveBeenCalledWith('cv-user-123')
      expect(mockDeleteOne).toHaveBeenCalledWith({ id: 'cv-456' })
    })
  })
})
