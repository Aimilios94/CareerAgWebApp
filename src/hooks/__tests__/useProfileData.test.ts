import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useProfileData } from '../useProfileData'

// Type definitions for API response
interface ProfileResponse {
  profile: {
    id: string
    fullName: string | null
    jobTitle: string | null
    skills: string[] | null
    avatarUrl: string | null
    createdAt: string
    updatedAt: string
  }
  parsedCV: {
    id: string
    filename: string
    parsedData: {
      skills: string[]
      experience: Array<{ company: string; role: string; dates: string }>
      education: Array<{ institution: string; degree: string; year: string }>
      summary: string
    }
    createdAt: string
  } | null
}

// Mock data
const mockProfileResponse: ProfileResponse = {
  profile: {
    id: 'user-123',
    fullName: 'John Doe',
    jobTitle: 'Software Engineer',
    skills: ['React', 'TypeScript'],
    avatarUrl: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  parsedCV: {
    id: 'cv-123',
    filename: 'resume.pdf',
    parsedData: {
      skills: ['React', 'Node.js'],
      experience: [{ company: 'Tech Corp', role: 'Developer', dates: '2020-2024' }],
      education: [{ institution: 'University', degree: 'CS', year: '2020' }],
      summary: 'Experienced developer...',
    },
    createdAt: '2024-01-15T00:00:00Z',
  },
}

const mockProfileResponseNoCV: ProfileResponse = {
  profile: {
    id: 'user-456',
    fullName: 'Jane Smith',
    jobTitle: 'Product Manager',
    skills: ['Agile', 'Scrum'],
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  parsedCV: null,
}

// Helper to create a fresh QueryClient wrapper for each test
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// Mock fetch
const mockFetch = vi.fn()

describe('useProfileData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
  })

  it('returns isLoading true initially', () => {
    // Setup: fetch that never resolves to keep loading state
    mockFetch.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useProfileData(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.profile).toBeNull()
    expect(result.current.parsedCV).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('fetches and returns profile data', async () => {
    // Setup: successful fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfileResponse,
    })

    const { result } = renderHook(() => useProfileData(), {
      wrapper: createWrapper(),
    })

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith('/api/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Verify profile data is returned
    expect(result.current.profile).toEqual(mockProfileResponse.profile)
    expect(result.current.error).toBeNull()
  })

  it('fetches and returns parsedCV when CV exists', async () => {
    // Setup: response with CV data
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfileResponse,
    })

    const { result } = renderHook(() => useProfileData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify parsedCV is returned
    expect(result.current.parsedCV).toEqual(mockProfileResponse.parsedCV)
    expect(result.current.parsedCV?.filename).toBe('resume.pdf')
    expect(result.current.parsedCV?.parsedData.skills).toContain('React')
    expect(result.current.parsedCV?.parsedData.experience).toHaveLength(1)
    expect(result.current.parsedCV?.parsedData.education).toHaveLength(1)
  })

  it('returns null parsedCV when no CV exists', async () => {
    // Setup: response without CV
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfileResponseNoCV,
    })

    const { result } = renderHook(() => useProfileData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify profile is returned but parsedCV is null
    expect(result.current.profile).toEqual(mockProfileResponseNoCV.profile)
    expect(result.current.parsedCV).toBeNull()
  })

  it('returns error when fetch fails', async () => {
    // Setup: failed fetch response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Failed to fetch profile' }),
    })

    const { result } = renderHook(() => useProfileData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify error state
    expect(result.current.error).toBeTruthy()
    expect(result.current.profile).toBeNull()
    expect(result.current.parsedCV).toBeNull()
  })

  it('returns error when network request fails', async () => {
    // Setup: network error (fetch throws)
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useProfileData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify error state
    expect(result.current.error).toBeTruthy()
    expect(result.current.profile).toBeNull()
    expect(result.current.parsedCV).toBeNull()
  })

  it('refetch function triggers new fetch', async () => {
    // Setup: initial successful fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfileResponse,
    })

    const { result } = renderHook(() => useProfileData(), {
      wrapper: createWrapper(),
    })

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Setup: updated data for refetch
    const updatedProfile = {
      ...mockProfileResponse,
      profile: {
        ...mockProfileResponse.profile,
        fullName: 'John Updated',
        jobTitle: 'Senior Engineer',
      },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedProfile,
    })

    // Trigger refetch
    await result.current.refetch()

    // Wait for refetch to complete
    await waitFor(() => {
      expect(result.current.profile?.fullName).toBe('John Updated')
    })

    // Verify fetch was called twice
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result.current.profile?.jobTitle).toBe('Senior Engineer')
  })

  it('handles unauthorized response (401)', async () => {
    // Setup: unauthorized response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: 'Unauthorized' }),
    })

    const { result } = renderHook(() => useProfileData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify error state for unauthorized
    expect(result.current.error).toBeTruthy()
    expect(result.current.profile).toBeNull()
  })

  it('exposes refetch function', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useProfileData(), {
      wrapper: createWrapper(),
    })

    // Verify refetch is a function
    expect(typeof result.current.refetch).toBe('function')
  })
})
