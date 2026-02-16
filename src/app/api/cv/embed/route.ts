import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbedding } from '@/lib/openai/client'
import { upsertCVEmbedding } from '@/lib/pinecone/client'
import { isDevBypassAllowed, DEV_USER_ID } from '@/lib/auth/dev-bypass'

/**
 * POST /api/cv/embed
 * Generate and store embedding for the user's latest CV
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !isDevBypassAllowed()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId = user?.id
    let dbClient = supabase

    if (!user) {
      const adminClient = createAdminClient()
      userId = DEV_USER_ID
      dbClient = adminClient as typeof supabase
    }

    // Get latest CV with parsed data
    const { data: cv, error: cvError } = await dbClient
      .from('cvs')
      .select('id, parsed_data')
      .eq('user_id', userId!)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cvError || !cv) {
      return NextResponse.json(
        { error: 'No CV found. Please upload a CV first.' },
        { status: 404 }
      )
    }

    const parsedData = cv.parsed_data as {
      skills?: string[]
      experience?: { role: string; description: string }[]
      summary?: string
    } | null

    if (!parsedData) {
      return NextResponse.json(
        { error: 'CV has not been parsed yet. Please parse the CV first.' },
        { status: 400 }
      )
    }

    // Build text for embedding from parsed data
    const textParts = []
    if (parsedData.summary) textParts.push(parsedData.summary)
    if (parsedData.skills?.length) textParts.push(`Skills: ${parsedData.skills.join(', ')}`)
    if (parsedData.experience?.length) {
      const expText = parsedData.experience.map(e => `${e.role}: ${e.description}`).join('. ')
      textParts.push(expText)
    }
    const embeddingText = textParts.join('\n')

    // Generate embedding via OpenAI
    const embedding = await generateEmbedding(embeddingText)

    // Upsert to Pinecone
    await upsertCVEmbedding(userId!, cv.id, embedding)

    // Save reference in cv_embeddings table
    const pineconeId = cv.id // We use cvId as the Pinecone vector ID

    // Upsert: delete existing embedding for this CV, then insert
    await dbClient
      .from('cv_embeddings')
      .delete()
      .eq('cv_id', cv.id)

    const { error: insertError } = await dbClient
      .from('cv_embeddings')
      .insert({
        cv_id: cv.id,
        pinecone_id: pineconeId,
      })

    if (insertError) {
      console.error('Failed to save embedding reference:', insertError)
      return NextResponse.json(
        { error: 'Failed to save embedding reference' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      cvId: cv.id,
      embeddingDimensions: embedding.length,
    })
  } catch (error) {
    console.error('CV embed error:', error)
    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    )
  }
}
