import { generateEmbedding } from '@/lib/openai/client'
import { getPineconeIndex } from '@/lib/pinecone/client'

/**
 * Compute cosine similarity between two vectors.
 * Returns 0 for zero-length or zero-magnitude vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0

  let dot = 0
  let magA = 0
  let magB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB)
  if (magnitude === 0) return 0

  return dot / magnitude
}

/**
 * Embed a search query string using OpenAI.
 * Returns null if embedding fails.
 */
export async function embedSearchQuery(query: string): Promise<number[] | null> {
  try {
    return await generateEmbedding(query)
  } catch {
    return null
  }
}

/**
 * Fetch a CV embedding vector from Pinecone.
 * Returns null if the vector is not found or Pinecone is unavailable.
 */
export async function getCVEmbedding(
  userId: string,
  cvId: string
): Promise<number[] | null> {
  try {
    const index = getPineconeIndex()
    const namespace = index.namespace(`cv-${userId}`)
    const result = await namespace.fetch({ ids: [cvId] })

    const record = result.records?.[cvId]
    if (!record?.values) return null

    return record.values
  } catch {
    return null
  }
}

/**
 * For each job, embed its description and compute cosine similarity against the CV embedding.
 * Jobs with empty descriptions get a score of 0.
 */
export async function computeSemanticScores(
  cvEmbedding: number[],
  jobs: { id: string; description: string }[]
): Promise<{ id: string; semanticScore: number }[]> {
  const results: { id: string; semanticScore: number }[] = []

  for (const job of jobs) {
    if (!job.description) {
      results.push({ id: job.id, semanticScore: 0 })
      continue
    }

    try {
      const jobEmbedding = await generateEmbedding(job.description)
      const score = cosineSimilarity(cvEmbedding, jobEmbedding)
      results.push({ id: job.id, semanticScore: score })
    } catch {
      results.push({ id: job.id, semanticScore: 0 })
    }
  }

  return results
}

/**
 * Blend a keyword score and semantic score with a given weight.
 * weight=0 means 100% keyword, weight=1 means 100% semantic.
 */
export function blendScores(
  keywordScore: number,
  semanticScore: number,
  weight: number
): number {
  return (1 - weight) * keywordScore + weight * semanticScore
}
