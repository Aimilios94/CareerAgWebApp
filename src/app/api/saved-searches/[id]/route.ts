import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userId = user?.id || '00000000-0000-0000-0000-000000000001'
    const dbClient = user ? supabase : createAdminClient()

    const { data, error } = await dbClient
      .from('job_searches')
      .update({
        is_saved: false,
        saved_name: null,
        saved_at: null,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Unsave search error:', error)
      return NextResponse.json({ error: 'Failed to unsave search' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete saved search API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userId = user?.id || '00000000-0000-0000-0000-000000000001'
    const dbClient = user ? supabase : createAdminClient()

    const { data, error } = await dbClient
      .from('job_searches')
      .update({ saved_name: name })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update saved search error:', error)
      return NextResponse.json({ error: 'Failed to update saved search' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Patch saved search API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
