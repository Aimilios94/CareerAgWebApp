'use client'

import { useQuery } from '@tanstack/react-query'

// Type definitions
export interface Profile {
  id: string
  fullName: string | null
  jobTitle: string | null
  skills: string[] | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface ParsedCVData {
  skills: string[]
  experience: Array<{ company: string; role: string; dates: string }>
  education: Array<{ institution: string; degree: string; year: string }>
  summary: string
}

export interface ParsedCV {
  id: string
  filename: string
  parsedData: ParsedCVData
  createdAt: string
}

interface ProfileResponse {
  profile: Profile
  parsedCV: ParsedCV | null
}

export interface UseProfileDataReturn {
  profile: Profile | null
  parsedCV: ParsedCV | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

async function fetchProfileData(): Promise<ProfileResponse> {
  const response = await fetch('/api/profile', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

export function useProfileData(): UseProfileDataReturn {
  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery<ProfileResponse, Error>({
    queryKey: ['profile'],
    queryFn: fetchProfileData,
  })

  const refetch = async (): Promise<void> => {
    await queryRefetch()
  }

  return {
    profile: data?.profile ?? null,
    parsedCV: data?.parsedCV ?? null,
    isLoading,
    error: error ?? null,
    refetch,
  }
}
