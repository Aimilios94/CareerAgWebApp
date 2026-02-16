import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { triggerN8nWebhook } from '@/lib/n8n/client'

export async function POST(request: NextRequest) {
  try {
    const { query, filters } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Mock ID if no user (for development/testing)
    const userId = user?.id || '00000000-0000-0000-0000-000000000001'

    // Use admin client for test mode (bypasses RLS)
    const dbClient = user ? supabase : createAdminClient()

    // 1. Create search record in database with status 'pending'
    const { data: search, error: searchError } = await dbClient
      .from('job_searches')
      .insert({
        user_id: userId,
        query,
        filters: filters || null,
        status: 'pending',
      })
      .select()
      .single()

    if (searchError) {
      console.error('Failed to create search record:', searchError)
      return NextResponse.json({ error: 'Failed to initiate search' }, { status: 500 })
    }

    const searchId = search.id

    // 2. Trigger n8n workflow
    const n8nResult = await triggerN8nWebhook('job-search', {
      userId,
      searchId,
      query,
      filters,
    })

    if (!n8nResult.success) {
      // Update search status to 'failed' and return mock results for demo
      await dbClient
        .from('job_searches')
        .update({ status: 'failed' })
        .eq('id', searchId)

      console.warn('n8n Job Search failed, returning mock data:', n8nResult.error)

      // Insert mock matches for demo purposes with realistic descriptions and gap analysis
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
            description: `We are looking for a Senior ${query} Developer to join our engineering team. You will be responsible for building scalable applications using modern technologies.

Requirements:
- 5+ years of experience with JavaScript and TypeScript
- Strong experience with React and Next.js
- Experience with Node.js and REST APIs
- Familiarity with PostgreSQL and MongoDB
- Experience with AWS or cloud platforms
- Knowledge of Docker and CI/CD pipelines
- Excellent problem-solving skills

Nice to have:
- Experience with GraphQL
- Knowledge of Kubernetes
- Experience with testing frameworks like Jest or Vitest`,
          },
          match_score: 85,
          gap_analysis: {
            requiredSkills: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'CI/CD'],
            niceToHaveSkills: ['GraphQL', 'Kubernetes', 'Jest', 'Vitest'],
            matchedSkills: [],
            missingSkills: [],
          },
        },
        {
          user_id: userId,
          search_id: searchId,
          job_data: {
            title: `Lead ${query} Engineer`,
            company: 'StartupAI',
            location: 'New York, NY',
            salary: '$160k - $210k',
            postedDate: '2 hours ago',
            url: null,
            description: `Join our fast-growing AI startup as a Lead ${query} Engineer. You'll architect solutions and mentor junior developers.

What you'll do:
- Lead a team of 5-7 engineers
- Design and implement scalable microservices
- Drive technical decisions and best practices
- Collaborate with product and design teams

Requirements:
- 7+ years of software development experience
- Expert in Python and JavaScript
- Experience with React or Vue.js
- Strong background in SQL and NoSQL databases
- Experience with cloud infrastructure (GCP or AWS)
- Leadership experience mentoring developers
- Strong communication skills

Bonus points:
- Machine learning experience
- Experience with Terraform
- Contributions to open source`,
          },
          match_score: 72,
          gap_analysis: {
            requiredSkills: ['Python', 'JavaScript', 'React', 'Vue', 'SQL', 'NoSQL', 'GCP', 'AWS'],
            niceToHaveSkills: ['Machine Learning', 'Terraform', 'Open Source'],
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
            description: `FinTech Solutions is hiring a Full Stack Developer to build our next-generation financial platform.

About the role:
- Develop features for our web and mobile applications
- Work with our data team on analytics dashboards
- Ensure security best practices in financial applications

Must have:
- 3+ years with TypeScript and React
- Backend experience with Node.js or Python
- Database experience with PostgreSQL
- Understanding of REST APIs and microservices
- Git version control

Nice to have:
- Experience in fintech or banking
- Knowledge of Tailwind CSS
- Experience with Redis caching`,
          },
          match_score: 65,
          gap_analysis: {
            requiredSkills: ['TypeScript', 'React', 'Node.js', 'Python', 'PostgreSQL', 'REST API', 'Git'],
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
        message: 'Search initiated (Mock)',
        searchId,
        status: 'completed',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Search initiated',
      searchId,
      status: 'pending',
    })

  } catch (error) {
    console.error('Job search API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
