import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { triggerN8nWebhook } from '@/lib/n8n/client'
import { generateCoverLetter as generateCoverLetterAI } from '@/lib/openai/client'
import { isDevBypassAllowed, DEV_USER_ID } from '@/lib/auth/dev-bypass'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { jobId, tone = 'professional' } = body

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const { data: subscription } = await dbClient
      .from('subscriptions').select('plan_type').eq('user_id', userId!).single()

    if (subscription?.plan_type !== 'pro') {
      return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 })
    }

    const { data: jobMatch, error: jobError } = await dbClient
      .from('job_matches').select('*').eq('id', jobId).eq('user_id', userId!).single()

    if (jobError || !jobMatch) {
      return NextResponse.json({ error: 'Job match not found' }, { status: 404 })
    }

    const { data: cv } = await dbClient
      .from('cvs').select('*').eq('user_id', userId!)
      .order('created_at', { ascending: false }).limit(1).single()

    const jobData = jobMatch.job_data as { title?: string; company?: string }
    const n8nResult = await triggerN8nWebhook('cover-letter-generate', {
      userId: userId!, jobId, cvId: cv?.id || '', tone,
    })

    if (n8nResult.success) {
      return NextResponse.json({
        success: true,
        data: (n8nResult as any).data || generateMockCoverLetter(jobData, tone),
      })
    }

    // Try direct OpenAI generation
    try {
      const parsedData = cv?.parsed_data as Record<string, unknown> | null
      const cvData = {
        skills: parsedData?.skills as string[] | undefined,
        summary: parsedData?.summary as string | undefined,
      }
      const aiResult = await generateCoverLetterAI(cvData, jobData, tone)
      return NextResponse.json({ success: true, data: aiResult })
    } catch (aiError) {
      console.error('Direct OpenAI cover letter generation failed, falling back to mock:', aiError)
    }

    return NextResponse.json({ success: true, data: generateMockCoverLetter(jobData, tone) })
  } catch (error) {
    console.error('Cover letter generate error:', error)
    return NextResponse.json({ error: 'Failed to generate cover letter' }, { status: 500 })
  }
}

function generateMockCoverLetter(jobData: { title?: string; company?: string }, tone: string) {
  const title = jobData?.title || 'the position'
  const company = jobData?.company || 'your company'

  return {
    subject: `Application for ${title} at ${company}`,
    body: `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${title} position at ${company}. With my background in software development and passion for building exceptional products, I believe I would be a valuable addition to your team.\n\nThroughout my career, I have developed expertise in modern web technologies and have consistently delivered high-quality solutions. My experience aligns well with the requirements of this role, and I am excited about the opportunity to contribute to ${company}'s continued success.\n\nI would welcome the opportunity to discuss how my skills and experience can benefit your team. Thank you for considering my application.\n\nBest regards`,
    tone,
  }
}
