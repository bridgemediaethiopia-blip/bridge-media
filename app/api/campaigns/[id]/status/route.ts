import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const formData = await request.formData()
  const status = String(formData.get('status') ?? '').trim()

  if (!['active', 'paused'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('campaigns').update({ status }).eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const referer = request.headers.get('referer') ?? '/dashboard'
  return NextResponse.redirect(referer)
}
