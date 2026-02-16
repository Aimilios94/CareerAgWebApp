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
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Fetch searches with match count
    const { data: searches, error } = await dbClient
      .from('job_searches')
      .select(`
        id,
        query,
        filters,
        status,
        created_at,
        job_matches (count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Fetch searches error:', error)
      return NextResponse.json({ error: 'Failed to fetch searches' }, { status: 500 })
    }

    // Transform data for frontend
    const transformedSearches = searches?.map((s) => {
      // Handle the count aggregation format from Supabase
      const matchCount = Array.isArray(s.job_matches)
        ? s.job_matches[0]?.count ?? 0
        : (s.job_matches as { count: number } | null)?.count ?? 0

      return {
        id: s.id,
        query: s.query,
        filters: s.filters,
        status: s.status as 'pending' | 'processing' | 'completed' | 'failed',
        createdAt: s.created_at,
        matchCount,
      }
    }) || []

    return NextResponse.json({ searches: transformedSearches })

  } catch (error) {
    console.error('Searches API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
