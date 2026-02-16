'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface SavedSearchItem {
  id: string
  name: string
  query: string
  filters: Record<string, unknown> | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  savedAt: string | null
  createdAt: string
  matchCount: number
  searchId: string
}

interface ApiSavedSearch {
  id: string
  query: string
  filters: Record<string, unknown> | null
  status: string
  savedName: string | null
  savedAt: string | null
  createdAt: string
  matchCount: number
}

interface SavedSearchesResponse {
  searches: ApiSavedSearch[]
}

async function fetchSavedSearches(limit?: number): Promise<SavedSearchItem[]> {
  const params = new URLSearchParams()
  if (limit) {
    params.set('limit', limit.toString())
  }

  const response = await fetch(`/api/saved-searches?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch saved searches')
  }

  const data: SavedSearchesResponse = await response.json()
  return data.searches.map((s) => ({
    id: s.id,
    name: s.savedName || s.query,
    query: s.query,
    filters: s.filters,
    status: s.status as SavedSearchItem['status'],
    savedAt: s.savedAt,
    createdAt: s.createdAt,
    matchCount: s.matchCount,
    searchId: s.id,
  }))
}

export function useSavedSearches(limit?: number) {
  return useQuery({
    queryKey: ['savedSearches', limit],
    queryFn: () => fetchSavedSearches(limit),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  })
}

async function saveSearch(params: { searchId: string; name?: string }) {
  const response = await fetch('/api/saved-searches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error('Failed to save search')
  }

  return response.json()
}

export function useSaveSearch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] })
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] })
    },
  })
}

async function deleteSavedSearch({ id }: { id: string }) {
  const response = await fetch(`/api/saved-searches/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete saved search')
  }

  return response.json()
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteSavedSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] })
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] })
    },
  })
}

async function rerunSavedSearch({ id }: { id: string }) {
  const response = await fetch(`/api/saved-searches/${id}/rerun`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Failed to rerun saved search')
  }

  return response.json()
}

export function useRerunSavedSearch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rerunSavedSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] })
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] })
    },
  })
}
