import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userId = user?.id || '00000000-0000-0000-0000-000000000001'
    const dbClient = user ? supabase : createAdminClient()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const { data: searches, error } = await dbClient
      .from('job_searches')
      .select(`
        id,
        query,
        filters,
        status,
        saved_name,
        saved_at,
        created_at,
        job_matches (count)
      `)
      .eq('user_id', userId)
      .eq('is_saved', true)
      .order('saved_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Fetch saved searches error:', error)
      return NextResponse.json({ error: 'Failed to fetch saved searches' }, { status: 500 })
    }

    const transformedSearches = searches?.map((s) => {
      const matchCount = Array.isArray(s.job_matches)
        ? s.job_matches[0]?.count ?? 0
        : (s.job_matches as { count: number } | null)?.count ?? 0

      return {
        id: s.id,
        query: s.query,
        filters: s.filters,
        status: s.status as 'pending' | 'processing' | 'completed' | 'failed',
        savedName: s.saved_name,
        savedAt: s.saved_at,
        createdAt: s.created_at,
        matchCount,
      }
    }) || []

    return NextResponse.json({ searches: transformedSearches })

  } catch (error) {
    console.error('Saved searches API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchId, name } = await request.json()

    if (!searchId) {
      return NextResponse.json({ error: 'searchId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userId = user?.id || '00000000-0000-0000-0000-000000000001'
    const dbClient = user ? supabase : createAdminClient()

    const { data, error } = await dbClient
      .from('job_searches')
      .update({
        is_saved: true,
        saved_name: name || null,
        saved_at: new Date().toISOString(),
      })
      .eq('id', searchId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Save search error:', error)
      return NextResponse.json({ error: 'Failed to save search' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, search: data })

  } catch (error) {
    console.error('Save search API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
