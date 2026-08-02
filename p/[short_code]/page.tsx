import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { ArrowRight, Camera, MapPin, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SUPPORTED_CHANNELS } from '@/lib/channels'

type PropertyPageProps = {
  params: Promise<{ short_code: string }>
  searchParams?: { channel?: string; success?: string }
}

const demoProperty = {
  title: 'Riverfront Loft',
  address: '124 Harbor Avenue',
  description: 'A bright loft with open-air views and premium tenant amenities.',
  photos: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
  ],
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100 shadow-sm">
      {message}
    </div>
  )
}

export default async function PropertyLandingPage({ params, searchParams }: PropertyPageProps) {
  const { short_code } = await params
  const channelQuery = searchParams?.channel?.toString().toLowerCase() ?? 'direct'
  const channelInfo = SUPPORTED_CHANNELS.find((channel) => channel.id === channelQuery) ?? {
    id: channelQuery,
    name: channelQuery?.length ? channelQuery.toUpperCase() : 'Direct',
    icon: '🔗',
    headline: 'Explore the listing',
    description: 'Review the property details and request the next step for this opportunity.',
  }

  if (short_code !== 'demo-property') {
    notFound()
  }

  const headersList = await headers()
  const userAgent = headersList.get('user-agent')
  const supabase = await createServerSupabaseClient()

  const { data: campaignData } = await supabase
    .from('campaigns')
    .select('id')
    .eq('short_code', short_code)
    .maybeSingle()

  const campaignId = campaignData?.id ?? null
  const { error: scanError } = await supabase.from('scan_events').insert({
    campaign_id: campaignId,
    channel: channelInfo.id,
    user_agent: userAgent,
  })

  if (scanError) {
    console.warn('Failed to log scan event:', scanError.message)
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <section className="flex-1 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl sm:p-7">
          <div className="flex items-center gap-2 text-cyan-400">
            <Camera className="h-5 w-5" />
            <p className="text-sm uppercase tracking-[0.3em]">Property Preview</p>
          </div>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{demoProperty.title}</h1>
          <div className="mt-3 flex items-center gap-2 text-slate-400">
            <MapPin className="h-4 w-4" />
            <p>{demoProperty.address}</p>
          </div>
          <p className="mt-4 text-base text-slate-300">{demoProperty.description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {demoProperty.photos.map((photo) => (
              <img key={photo} src={photo} alt={demoProperty.title} className="h-48 w-full rounded-2xl object-cover" />
            ))}
          </div>
        </section>

        <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl sm:p-7">
          <div className="flex items-center gap-2 text-cyan-400">
            <QrCode className="h-5 w-5" />
            <p className="text-sm uppercase tracking-[0.3em]">{channelInfo.name} landing</p>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="mb-4 flex items-center gap-3 text-white">
              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-medium">{channelInfo.icon}</span>
              <div>
                <p className="text-lg font-semibold">{channelInfo.headline}</p>
                <p className="text-sm text-slate-400">{channelInfo.name} channel experience</p>
              </div>
            </div>
            <div className="flex justify-center rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <QRCodeSVG value={`https://bridge.media/p/demo-property?channel=${channelInfo.id}`} size={180} includeMargin />
            </div>
            <p className="mt-4 text-sm text-slate-400">{channelInfo.description}</p>
          </div>

          <form action={`/api/leads?channel=${channelInfo.id}`} method="post" className="mt-6 space-y-3">
            <input type="hidden" name="short_code" value={short_code} />
            {searchParams?.success === '1' ? (
              <SuccessBanner message="Thanks! Your request was submitted successfully." />
            ) : null}
            <label className="block text-sm text-slate-300">
              <span>Name</span>
              <input name="name" required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" placeholder="Your name" />
            </label>
            <label className="block text-sm text-slate-300">
              <span>Email</span>
              <input name="email" type="email" required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" placeholder="Email address" />
            </label>
            <label className="block text-sm text-slate-300">
              <span>Phone</span>
              <input name="phone" type="tel" required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" placeholder="Phone number" />
            </label>
            <label className="block text-sm text-slate-300">
              <span>Message</span>
              <textarea name="message" className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" placeholder="Tell us about your interest" />
            </label>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-400">
              Request details <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
