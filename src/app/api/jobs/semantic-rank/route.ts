import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCVEmbedding, computeSemanticScores, blendScores } from '@/lib/pinecone/semantic-search'
import { mockSemanticScores } from '@/lib/pinecone/mock-semantic'

const SEMANTIC_WEIGHT = 0.3

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchId, query } = body

    if (!searchId) {
      return NextResponse.json({ error: 'searchId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userId = user?.id || '00000000-0000-0000-0000-000000000001'
    const dbClient = user ? supabase : createAdminClient()

    // 1. Fetch job_matches for this search
    const { data: matches, error: matchError } = await dbClient
      .from('job_matches')
      .select('id, job_data, match_score, semantic_score, search_id')
      .eq('search_id', searchId)

    if (matchError || !matches || matches.length === 0) {
      return NextResponse.json({
        method: 'unchanged',
        updated: 0,
      })
    }

    // 2. Get user's latest CV ID
    const { data: cv } = await dbClient
      .from('cvs')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 3. Try Pinecone semantic scoring
    let scores: { id: string; semanticScore: number }[] | null = null
    let method = 'unchanged'

    if (cv?.id) {
      const cvEmbedding = await getCVEmbedding(userId, cv.id)

      if (cvEmbedding) {
        const jobs = matches.map((m) => {
          const jobData = (m.job_data as Record<string, unknown>) || {}
          return {
            id: m.id,
            description: (jobData.description as string) || '',
          }
        })

        scores = await computeSemanticScores(cvEmbedding, jobs)
        method = 'pinecone'
      }
    }

    // 4. Fallback to mock scoring if Pinecone failed
    if (!scores && query) {
      const jobs = matches.map((m) => {
        const jobData = (m.job_data as Record<string, unknown>) || {}
        return {
          id: m.id,
          description: (jobData.description as string) || '',
        }
      })

      scores = mockSemanticScores(jobs, query)
      method = 'mock'
    }

    // 5. If we have scores, update the database
    if (scores) {
      const scoreMap = new Map(scores.map((s) => [s.id, s.semanticScore]))

      for (const match of matches) {
        const semanticScore = scoreMap.get(match.id) ?? 0
        const keywordScore = match.match_score || 0
        const blended = blendScores(keywordScore, semanticScore * 100, SEMANTIC_WEIGHT)

        await dbClient
          .from('job_matches')
          .update({ semantic_score: blended })
          .eq('id', match.id)
      }
    }

    return NextResponse.json({
      method,
      updated: scores?.length || 0,
    })

  } catch (error) {
    console.error('Semantic rank API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
