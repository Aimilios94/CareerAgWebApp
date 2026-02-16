/**
 * Mock semantic scoring using simple keyword overlap.
 * Used as a fallback when Pinecone/OpenAI API keys are unavailable.
 */
export function mockSemanticScores(
  jobs: { id: string; description: string }[],
  query: string
): { id: string; semanticScore: number }[] {
  if (!query) {
    return jobs.map((job) => ({ id: job.id, semanticScore: 0 }))
  }

  const queryWords = new Set(
    query.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
  )

  if (queryWords.size === 0) {
    return jobs.map((job) => ({ id: job.id, semanticScore: 0 }))
  }

  return jobs.map((job) => {
    if (!job.description) {
      return { id: job.id, semanticScore: 0 }
    }

    const descWords = new Set(
      job.description.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
    )

    let overlap = 0
    Array.from(queryWords).forEach((word) => {
      if (descWords.has(word)) overlap++
    })

    const score = overlap / queryWords.size

    return { id: job.id, semanticScore: score }
  })
}
