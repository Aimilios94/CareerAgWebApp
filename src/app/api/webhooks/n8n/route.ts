import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { N8nCallbackPayload, CVAnalysisResult } from '@/lib/n8n/types'
import type { Json } from '@/types/database'

interface JobMatchPayload {
  searchId: string
  userId: string
  matches: Array<{
    title: string
    company: string
    location: string
    salary?: string
    url?: string
    postedDate?: string
    description?: string
    matchScore?: number
  }>
}

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-n8n-webhook-secret')
    if (secret !== process.env.N8N_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as N8nCallbackPayload
    const supabase = createAdminClient()

    if (body.type === 'cv-parsed') {
      const data = body.payload as CVAnalysisResult

      console.log('Received cv-parsed webhook:', JSON.stringify(data, null, 2))

      const { error, data: updatedRows } = await supabase
        .from('cvs')
        .update({
          parsed_data: data as unknown as Json,
        })
        .eq('id', data.cvId)
        .select()

      if (error) {
        console.error('Supabase update error:', error)
        throw error
      }

      console.log(`Updated CV ${data.cvId} with parsed data. Rows affected:`, updatedRows?.length || 0)
    }

    if (body.type === 'job-matches') {
      const data = body.payload as JobMatchPayload

      if (!data.searchId || !data.userId || !data.matches) {
        console.error('Invalid job-matches payload:', data)
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
      }

      // 1. Insert job matches into database
      const matchRecords = data.matches.map((match, index) => ({
        user_id: data.userId,
        search_id: data.searchId,
        job_data: {
          title: match.title,
          company: match.company,
          location: match.location,
          salary: match.salary || null,
          url: match.url || null,
          postedDate: match.postedDate || null,
          description: match.description || null,
        } as Json,
        match_score: match.matchScore ?? Math.max(95 - index * 5, 50), // Default scoring if not provided
      }))

      const { error: insertError } = await supabase
        .from('job_matches')
        .insert(matchRecords)

      if (insertError) {
        console.error('Failed to insert job matches:', insertError)
        throw insertError
      }

      // 2. Update search status to 'completed'
      const { error: updateError } = await supabase
        .from('job_searches')
        .update({ status: 'completed' })
        .eq('id', data.searchId)

      if (updateError) {
        console.error('Failed to update search status:', updateError)
        throw updateError
      }

      console.log(`Processed ${data.matches.length} job matches for search ${data.searchId}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
