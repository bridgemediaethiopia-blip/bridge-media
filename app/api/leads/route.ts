import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SUPPORTED_CHANNELS } from '@/lib/channels'

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  const channelQuery = url.searchParams.get('channel')?.toString().toLowerCase() ?? 'direct'
  const channelInfo = SUPPORTED_CHANNELS.find((channel) => channel.id === channelQuery) ?? {
    id: channelQuery,
    name: channelQuery?.length ? channelQuery.toUpperCase() : 'Direct',
  }

  const formData = await request.formData()
  const short_code = String(formData.get('short_code') ?? '').trim()
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()

  if (!short_code || !name || !email || !phone) {
    return NextResponse.json({ error: 'Short code, name, email, and phone are required.' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: campaignData, error: campaignError } = await supabase
    .from('campaigns')
    .select('id')
    .eq('short_code', short_code)
    .maybeSingle()

  if (campaignError) {
    return NextResponse.json({ error: campaignError.message }, { status: 500 })
  }

  const campaignId = campaignData?.id ?? null
  const { error: leadError } = await supabase.from('leads').insert({
    campaign_id: campaignId,
    name,
    email,
    phone,
    channel: channelInfo.name,
    message: message || null,
  })

  if (leadError) {
    return NextResponse.json({ error: leadError.message }, { status: 500 })
  }

  const referer = request.headers.get('referer')
  const redirectTo = referer ? `${referer.split('?')[0]}?success=1&channel=${channelInfo.id}` : '/'
  return NextResponse.redirect(redirectTo)
}
