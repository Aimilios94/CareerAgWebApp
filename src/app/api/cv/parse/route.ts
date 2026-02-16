import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseCV } from '@/lib/openai/client'
import { extractTextFromFile } from '@/lib/openai/extract-text'
import { isDevBypassAllowed, DEV_USER_ID } from '@/lib/auth/dev-bypass'
import type { Json } from '@/types/database'

// Mock parsed data for development/testing
const MOCK_PARSED_DATA = {
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'Git', 'Python', 'AWS'],
  experience: [
    {
      role: 'Senior Software Developer',
      company: 'Tech Solutions Inc',
      duration: '2022 - Present',
      description: 'Leading full-stack development projects with React and Node.js. Building scalable APIs and microservices.',
    },
    {
      role: 'Software Developer',
      company: 'Digital Agency',
      duration: '2020 - 2022',
      description: 'Frontend development with React and TypeScript. Implemented responsive designs and improved performance.',
    },
    {
      role: 'Junior Developer',
      company: 'Startup Hub',
      duration: '2018 - 2020',
      description: 'Full-stack web development. Built internal tools and customer-facing applications.',
    },
  ],
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      institution: 'State University',
      year: '2018',
    },
  ],
  summary: 'Experienced software developer with 5+ years of expertise in full-stack web development, specializing in React, TypeScript, and Node.js. Proven track record of delivering scalable applications and leading development teams.',
}

/**
 * POST /api/cv/parse
 * Manually trigger CV parsing or add mock data for testing
 *
 * Body: { cvId?: string } - If not provided, uses the latest CV
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !isDevBypassAllowed()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Dev bypass
    const userId = user?.id || DEV_USER_ID
    const dbClient = user ? supabase : createAdminClient()

    // Parse request body
    let body: { cvId?: string } = {}
    try {
      body = await request.json()
    } catch {
      // Empty body is fine
    }

    let cvId = body.cvId

    // If no cvId provided, get the latest CV
    if (!cvId) {
      const { data: latestCV, error: fetchError } = await dbClient
        .from('cvs')
        .select('id, storage_path, filename')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError || !latestCV) {
        return NextResponse.json(
          { error: 'No CV found. Please upload a CV first.' },
          { status: 404 }
        )
      }

      cvId = latestCV.id
    }

    // Try direct OpenAI parsing first
    let parsedData: { [key: string]: Json | undefined } | null = null

    try {
      // Get the CV record to find storage_path
      const { data: cvRecord } = await dbClient
        .from('cvs')
        .select('storage_path, filename')
        .eq('id', cvId)
        .single()

      if (cvRecord?.storage_path) {
        // Download file from Supabase Storage
        const { data: fileData } = await dbClient.storage
          .from('cvs')
          .download(cvRecord.storage_path)

        if (fileData) {
          // Determine MIME type from filename
          const filename = cvRecord.filename || ''
          let mimeType = 'application/pdf'
          if (filename.endsWith('.docx')) {
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          } else if (filename.endsWith('.doc')) {
            mimeType = 'application/msword'
          } else if (filename.endsWith('.txt')) {
            mimeType = 'text/plain'
          }

          // Extract text from file
          const arrayBuffer = await fileData.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const text = await extractTextFromFile(buffer, mimeType)

          if (text) {
            // Parse with OpenAI
            const aiResult = await parseCV(text)
            parsedData = {
              cvId,
              ...aiResult,
            }
          }
        }
      }
    } catch (aiError) {
      console.error('Direct OpenAI parsing failed, falling back to mock:', aiError)
    }

    // Fallback to mock data if AI parsing didn't produce results
    if (!parsedData) {
      parsedData = {
        cvId,
        ...MOCK_PARSED_DATA,
      }
    }

    const { error: updateError } = await dbClient
      .from('cvs')
      .update({ parsed_data: parsedData })
      .eq('id', cvId)

    if (updateError) {
      console.error('Failed to update CV with parsed data:', updateError)
      return NextResponse.json(
        { error: 'Failed to update CV' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: parsedData.cvId === cvId && parsedData.summary !== MOCK_PARSED_DATA.summary
        ? 'CV parsed successfully'
        : 'CV parsed successfully (mock data for testing)',
      cvId,
      parsedData,
    })
  } catch (error) {
    console.error('CV parse error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
