'use client'

import { useQuery } from '@tanstack/react-query'

export interface SearchHistoryItem {
  id: string
  query: string
  filters: Record<string, unknown> | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  matchCount: number
}

interface SearchHistoryResponse {
  searches: SearchHistoryItem[]
}

async function fetchSearchHistory(limit?: number): Promise<SearchHistoryItem[]> {
  const params = new URLSearchParams()
  if (limit) {
    params.set('limit', limit.toString())
  }

  const response = await fetch(`/api/searches?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch search history')
  }

  const data: SearchHistoryResponse = await response.json()
  return data.searches
}

export function useSearchHistory(limit?: number) {
  return useQuery({
    queryKey: ['searchHistory', limit],
    queryFn: () => fetchSearchHistory(limit),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  })
}
