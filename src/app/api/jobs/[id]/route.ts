import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Use admin client for dev mode (no real user)
    const dbClient = user ? supabase : createAdminClient()
    const userId = user?.id || '00000000-0000-0000-0000-000000000001'

    const { data: match, error } = await dbClient
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
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !match) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Transform data for frontend
    const jobData = (match.job_data as Record<string, unknown>) || {}
    const transformedJob = {
      id: match.id,
      title: jobData.title as string || 'Unknown Position',
      company: jobData.company as string || 'Unknown Company',
      location: jobData.location as string || 'Remote',
      salary: jobData.salary as string || null,
      url: jobData.url as string || null,
      postedDate: jobData.postedDate as string || null,
      description: jobData.description as string || null,
      matchScore: match.match_score || 0,
      gapAnalysis: match.gap_analysis,
      createdAt: match.created_at,
      searchId: match.search_id,
      searchQuery: (match.job_searches as { query: string } | null)?.query || null,
    }

    return NextResponse.json({ job: transformedJob })

  } catch (error) {
    console.error('Job fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
