import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isDevBypassAllowed, DEV_USER_ID } from '@/lib/auth/dev-bypass'

// Transform profile from snake_case to camelCase
function transformProfile(profile: {
  id: string
  full_name: string | null
  job_title: string | null
  skills: string[] | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}) {
  return {
    id: profile.id,
    fullName: profile.full_name,
    jobTitle: profile.job_title,
    skills: profile.skills,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }
}

// Transform CV from snake_case to camelCase
function transformCV(cv: {
  id: string
  filename: string
  parsed_data: unknown
  created_at: string
}) {
  return {
    id: cv.id,
    filename: cv.filename,
    parsedData: cv.parsed_data,
    createdAt: cv.created_at,
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !isDevBypassAllowed()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Dev bypass: use mock user ID if no authenticated user
    const userId = user?.id || DEV_USER_ID

    // Use admin client for dev mode (bypasses RLS)
    const dbClient = user ? supabase : createAdminClient()

    // Fetch profile
    const { data: profile, error: profileError } = await dbClient
      .from('profiles')
      .select('id, full_name, job_title, skills, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .single()

    if (profileError) {
      // If profile doesn't exist in dev mode, return a mock profile
      if (!user && profileError.code === 'PGRST116') {
        return NextResponse.json({
          profile: {
            id: DEV_USER_ID,
            fullName: 'Test User',
            jobTitle: 'Developer',
            skills: null,
            avatarUrl: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          parsedCV: null,
        })
      }
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // Fetch latest CV with parsed_data
    const { data: cv, error: cvError } = await dbClient
      .from('cvs')
      .select('id, filename, parsed_data, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // CV might not exist, that's okay
    const parsedCV = cv && !cvError ? transformCV(cv) : null

    return NextResponse.json({
      profile: transformProfile(profile),
      parsedCV,
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !isDevBypassAllowed()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Dev bypass: use mock user ID if no authenticated user
    const userId = user?.id || DEV_USER_ID

    // Use admin client for dev mode (bypasses RLS)
    const dbClient = user ? supabase : createAdminClient()

    // Parse request body
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Only allow specific fields to be updated (whitelist approach for security)
    const allowedFields: Record<string, string> = {
      fullName: 'full_name',
      jobTitle: 'job_title',
    }

    const updateData: Record<string, unknown> = {}

    for (const [camelKey, snakeKey] of Object.entries(allowedFields)) {
      if (body[camelKey] !== undefined) {
        updateData[snakeKey] = body[camelKey]
      }
    }

    // Check if there are any valid fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await dbClient
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('id, full_name, job_title, skills, avatar_url, created_at, updated_at')
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      profile: transformProfile(updatedProfile),
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
