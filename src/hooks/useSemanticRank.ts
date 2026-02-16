'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

interface SemanticRankParams {
  searchId: string
}

interface SemanticRankResponse {
  success: boolean
  updatedCount: number
}

async function semanticRank(params: SemanticRankParams): Promise<SemanticRankResponse> {
  const response = await fetch('/api/jobs/semantic-rank', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ searchId: params.searchId }),
  })

  if (!response.ok) {
    throw new Error('Failed to rank matches')
  }

  return response.json()
}

export function useSemanticRank() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: semanticRank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] })
    },
  })
}
