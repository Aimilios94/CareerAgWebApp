import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { triggerN8nWebhook } from '@/lib/n8n/client'
import { generateInterviewQuestions as generateInterviewQuestionsAI } from '@/lib/openai/client'
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
    const { jobId } = body

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

    const jobData = jobMatch.job_data as { title?: string; company?: string }
    const n8nResult = await triggerN8nWebhook('interview-prep', {
      userId: userId!, jobId,
      jobTitle: jobData?.title, company: jobData?.company,
    })

    if (n8nResult.success) {
      return NextResponse.json({
        success: true,
        data: (n8nResult as any).data || { questions: generateMockQuestions(jobData) },
      })
    }

    // Try direct OpenAI generation
    try {
      const aiQuestions = await generateInterviewQuestionsAI(jobData)
      return NextResponse.json({ success: true, data: { questions: aiQuestions } })
    } catch (aiError) {
      console.error('Direct OpenAI interview question generation failed, falling back to mock:', aiError)
    }

    return NextResponse.json({ success: true, data: { questions: generateMockQuestions(jobData) } })
  } catch (error) {
    console.error('Interview questions error:', error)
    return NextResponse.json({ error: 'Failed to generate interview questions' }, { status: 500 })
  }
}

function generateMockQuestions(jobData: { title?: string; company?: string }) {
  const title = jobData?.title || 'this role'
  const company = jobData?.company || 'the company'
  return [
    { question: 'Tell me about a time you faced a significant challenge in a previous role and how you overcame it.', type: 'behavioral', guidance: 'Use the STAR method: Situation, Task, Action, Result. Focus on a challenge relevant to the role.', tip: 'Keep your answer under 2 minutes and quantify results where possible.' },
    { question: `What technical skills make you a strong candidate for the ${title} position?`, type: 'technical', guidance: 'Highlight skills listed in the job description. Give specific examples of projects.', tip: 'Reference specific technologies mentioned in the job posting.' },
    { question: 'How would you handle a situation where project requirements changed significantly mid-sprint?', type: 'situational', guidance: 'Show adaptability and communication skills. Describe your prioritization process.', tip: 'Mention stakeholder communication and impact assessment.' },
    { question: `What interests you most about working at ${company} and in this specific role?`, type: 'role-specific', guidance: `Research ${company}'s mission, recent news, and culture. Connect your goals to their values.`, tip: 'Be specific — generic answers are a red flag for interviewers.' },
    { question: 'Describe your ideal team environment and how you contribute to team success.', type: 'cultural-fit', guidance: 'Show self-awareness and collaboration skills. Give examples of teamwork.', tip: 'Align your answer with the company culture you researched.' },
  ]
}
