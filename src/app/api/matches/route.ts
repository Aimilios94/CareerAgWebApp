import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isDevBypassAllowed, DEV_USER_ID } from '@/lib/auth/dev-bypass'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !isDevBypassAllowed()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock user ID for development (when using dev_bypass)
    const userId = user?.id || DEV_USER_ID

    // Use admin client to bypass RLS when in dev mode (no real user)
    const dbClient = user ? supabase : createAdminClient()

    const { searchParams } = new URL(request.url)
    const searchId = searchParams.get('searchId')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Build query
    let query = dbClient
      .from('job_matches')
      .select(`
        id,
        job_data,
        match_score,
        gap_analysis,
        created_at,
        search_id,
        job_searches (
          query,
          filters
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by search ID if provided
    if (searchId) {
      query = query.eq('search_id', searchId)
    }

    const { data: matches, error } = await query

    if (error) {
      console.error('Fetch matches error:', error)
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
    }

    // Transform data for frontend, filter out matches with no real job data
    const transformedMatches = matches
      ?.map((m) => {
        const jobData = (m.job_data as Record<string, unknown>) || {}
        return {
          id: m.id,
          title: jobData.title as string || '',
          company: jobData.company as string || '',
          location: jobData.location as string || 'Remote',
          salary: jobData.salary as string || null,
          url: jobData.url as string || null,
          postedDate: jobData.postedDate as string || null,
          description: jobData.description as string || null,
          matchScore: m.match_score || 0,
          gapAnalysis: m.gap_analysis,
          createdAt: m.created_at,
          searchId: m.search_id,
          searchQuery: (m.job_searches as { query: string } | null)?.query || null,
        }
      })
      .filter((m) => m.title && m.company) || []

    return NextResponse.json({ matches: transformedMatches })

  } catch (error) {
    console.error('Matches API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
