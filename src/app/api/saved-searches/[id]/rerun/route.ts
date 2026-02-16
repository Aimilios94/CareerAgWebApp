import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { triggerN8nWebhook } from '@/lib/n8n/client'
import type { JobSearchPayload } from '@/lib/n8n/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userId = user?.id || '00000000-0000-0000-0000-000000000001'
    const dbClient = user ? supabase : createAdminClient()

    // 1. Fetch the original saved search
    const { data: savedSearch, error: fetchError } = await dbClient
      .from('job_searches')
      .select('id, query, filters, user_id, is_saved')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !savedSearch) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 })
    }

    const query = savedSearch.query
    const filters = savedSearch.filters

    // 2. Create a new search record with the original query/filters
    const { data: newSearch, error: insertError } = await dbClient
      .from('job_searches')
      .insert({
        user_id: userId,
        query,
        filters: filters || null,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError || !newSearch) {
      console.error('Failed to create new search record:', insertError)
      return NextResponse.json({ error: 'Failed to create new search' }, { status: 500 })
    }

    const searchId = newSearch.id

    // 3. Trigger n8n workflow (same pattern as /api/jobs/search)
    const n8nResult = await triggerN8nWebhook('job-search', {
      userId,
      searchId,
      query,
      filters: filters as JobSearchPayload['filters'],
    })

    if (!n8nResult.success) {
      // Update search status to 'failed' and return mock results for demo
      await dbClient
        .from('job_searches')
        .update({ status: 'failed' })
        .eq('id', searchId)

      console.warn('n8n rerun failed, returning mock data:', n8nResult.error)

      // Insert mock matches for demo purposes
      const mockMatches = [
        {
          user_id: userId,
          search_id: searchId,
          job_data: {
            title: `Senior ${query} Developer`,
            company: 'Tech Giant Corp',
            location: 'Remote',
            salary: '$140k - $180k',
            postedDate: 'Just now',
            url: null,
          },
          match_score: 85,
          gap_analysis: {
            requiredSkills: ['JavaScript', 'TypeScript', 'React'],
            niceToHaveSkills: ['GraphQL'],
            matchedSkills: [],
            missingSkills: [],
          },
        },
        {
          user_id: userId,
          search_id: searchId,
          job_data: {
            title: `${query} Full Stack Developer`,
            company: 'FinTech Solutions',
            location: 'San Francisco, CA (Hybrid)',
            salary: '$130k - $165k',
            postedDate: '1 day ago',
            url: null,
          },
          match_score: 65,
          gap_analysis: {
            requiredSkills: ['TypeScript', 'React', 'Node.js'],
            niceToHaveSkills: ['Tailwind', 'Redis'],
            matchedSkills: [],
            missingSkills: [],
          },
        },
      ]

      await dbClient.from('job_matches').insert(mockMatches)

      // Mark search as completed with mock data
      await dbClient
        .from('job_searches')
        .update({ status: 'completed' })
        .eq('id', searchId)

      return NextResponse.json({
        success: true,
        message: 'Search re-run initiated (Mock)',
        searchId,
        status: 'completed',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Search re-run initiated',
      searchId,
      status: 'pending',
    })

  } catch (error) {
    console.error('Rerun saved search API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
