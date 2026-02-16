import { Pinecone } from '@pinecone-database/pinecone'

let pineconeClient: Pinecone | null = null

/**
 * Get or create singleton Pinecone client
 * Throws if PINECONE_API_KEY is not set
 */
export function getPineconeClient(): Pinecone {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not set')
  }
  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
  }
  return pineconeClient
}

/**
 * Reset the singleton client (for testing)
 */
export function resetPineconeClient(): void {
  pineconeClient = null
}

/**
 * Get the Pinecone index for CV embeddings
 */
export function getPineconeIndex() {
  const indexName = process.env.PINECONE_INDEX_NAME
  if (!indexName) {
    throw new Error('PINECONE_INDEX_NAME is not set')
  }
  const client = getPineconeClient()
  return client.index(indexName)
}

/**
 * Upsert a CV embedding into Pinecone
 * @param userId - User ID (used as namespace)
 * @param cvId - CV ID (used as vector ID)
 * @param embedding - Embedding vector (1536 dimensions)
 */
export async function upsertCVEmbedding(
  userId: string,
  cvId: string,
  embedding: number[]
): Promise<void> {
  const index = getPineconeIndex()
  const namespace = index.namespace(`cv-${userId}`)

  await namespace.upsert({
    records: [
      {
        id: cvId,
        values: embedding,
        metadata: {
          userId,
          cvId,
          createdAt: new Date().toISOString(),
        },
      },
    ],
  })
}

/**
 * Query similar vectors in Pinecone
 * @param embedding - Query embedding vector
 * @param topK - Number of results to return
 * @param userId - Optional user ID to scope search to a namespace
 */
export async function querySimilar(
  embedding: number[],
  topK: number = 5,
  userId?: string
): Promise<{ id: string; score: number }[]> {
  const index = getPineconeIndex()
  const ns = userId ? index.namespace(`cv-${userId}`) : index

  const results = await ns.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  })

  return (results.matches || []).map((match) => ({
    id: match.id,
    score: match.score || 0,
  }))
}

/**
 * Delete a CV embedding from Pinecone
 * @param cvId - CV ID to delete
 * @param userId - User ID (used as namespace)
 */
export async function deleteCVEmbedding(
  cvId: string,
  userId: string
): Promise<void> {
  const index = getPineconeIndex()
  const namespace = index.namespace(`cv-${userId}`)
  await namespace.deleteOne({ id: cvId })
}
