import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ searchId: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { searchId } = await context.params

    if (!searchId) {
      return NextResponse.json({ error: 'Search ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Mock user ID for development
    const userId = user?.id || '00000000-0000-0000-0000-000000000001'

    // Use admin client to bypass RLS when in dev mode (no real user)
    const dbClient = user ? supabase : createAdminClient()

    // 1. Get search status
    const { data: search, error: searchError } = await dbClient
      .from('job_searches')
      .select('id, status, query, filters, created_at')
      .eq('id', searchId)
      .eq('user_id', userId)
      .single()

    if (searchError || !search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    // 2. If completed, also fetch matches
    let matches = null
    if (search.status === 'completed') {
      const { data: matchData } = await dbClient
        .from('job_matches')
        .select('id, job_data, match_score, semantic_score, gap_analysis, created_at, search_id')
        .eq('search_id', searchId)
        .order('match_score', { ascending: false })

      matches = matchData?.map((m) => {
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
          semanticScore: m.semantic_score || null,
          gapAnalysis: m.gap_analysis,
          createdAt: m.created_at,
          searchId: m.search_id,
        }
      }).filter((m) => m.title && m.company) || []
    }

    return NextResponse.json({
      searchId: search.id,
      status: search.status,
      query: search.query,
      filters: search.filters,
      createdAt: search.created_at,
      ...(matches && { matches }),
    })

  } catch (error) {
    console.error('Search status API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
