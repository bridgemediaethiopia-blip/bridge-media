import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pause, Play, QrCode, Eye, MessageSquare, CalendarDays } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SUPPORTED_CHANNELS } from '@/lib/channels'
import CampaignQrDownloads from './CampaignQrDownloads'

type CampaignPageProps = {
  params: { id: string }
}

const formatNumber = (value: number) => value.toLocaleString()

export default async function CampaignDetailPage({ params }: CampaignPageProps) {
  const supabase = await createServerSupabaseClient()
  const campaignRes = await supabase
    .from('campaigns')
    .select('id, client_id, property_name, property_address, description, channel, status, short_code, created_at')
    .eq('id', params.id)
    .maybeSingle()

  if (!campaignRes.data || campaignRes.error) {
    notFound()
  }

  const campaign = campaignRes.data
  const [scanCountRes, leadCountRes, scanChannelRes, leadChannelRes] = await Promise.all([
    supabase.from('scan_events').select('id', { count: 'exact', head: true }).eq('campaign_id', campaign.id),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('campaign_id', campaign.id),
    supabase.from('scan_events').select('channel'),
    supabase.from('leads').select('channel'),
  ])

  const scanCount = scanCountRes.count ?? 0
  const leadCount = leadCountRes.count ?? 0
  const conversionRate = scanCount > 0 ? Math.round((leadCount / scanCount) * 100) : 0

  const scanChannels = (scanChannelRes.data ?? []).map((row) => row?.channel).filter(Boolean) as string[]
  const leadChannels = (leadChannelRes.data ?? []).map((row) => row?.channel).filter(Boolean) as string[]

  const channelInfo = SUPPORTED_CHANNELS.find((item) => item.id === campaign.channel) ?? {
    id: campaign.channel,
    name: campaign.channel?.toUpperCase() ?? 'Direct',
    icon: '🔗',
    headline: 'Campaign landing experience',
    description: 'Track scans and leads from this campaign channel.',
  }

  const campaignPerformance = SUPPORTED_CHANNELS.filter((channel) => ['youtube', 'tiktok', 'tv', 'billboard', 'print'].includes(channel.id)).map((channel) => {
    const scans = scanChannels.filter((id) => id === channel.id).length
    const leads = leadChannels.filter((name) => name === channel.name).length
    const rate = scans > 0 ? Math.round((leads / scans) * 100) : 0
    return {
      ...channel,
      scans,
      leads,
      conversion: rate,
    }
  })

  const statusLabel = campaign.status === 'paused' ? 'Paused' : 'Active'
  const nextStatus = campaign.status === 'paused' ? 'active' : 'paused'
  const baseUrl = `https://bridge.media/p/${campaign.short_code}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-400">Campaign detail</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{campaign.property_name}</h1>
          <p className="mt-1 text-sm text-slate-500">Detailed performance and QR tools for this campaign.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/campaigns" className="rounded-lg border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-500 hover:text-white">
            <ArrowLeft className="inline h-4 w-4" /> Back to campaigns
          </Link>
          <form action={`/api/campaigns/${campaign.id}/status`} method="post">
            <input type="hidden" name="status" value={nextStatus} />
            <button
              type="submit"
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                nextStatus === 'active'
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              }`}
            >
              {nextStatus === 'active' ? <Play className="inline h-4 w-4" /> : <Pause className="inline h-4 w-4" />} {nextStatus === 'active' ? 'Resume' : 'Pause'} campaign
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Campaign snapshot</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{campaign.property_name}</h2>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${campaign.status === 'paused' ? 'bg-amber-500/10 text-amber-200' : 'bg-emerald-500/10 text-emerald-200'}`}>
              {campaign.status === 'paused' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {statusLabel}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-sm text-slate-400">Campaign channel</p>
              <p className="mt-3 text-lg font-semibold text-white">{channelInfo.name}</p>
              <p className="mt-2 text-sm text-slate-500">{channelInfo.description}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-sm text-slate-400">Landing URL</p>
              <p className="mt-3 break-all text-slate-100">{baseUrl}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-center">
              <p className="text-sm text-slate-400">Scans</p>
              <p className="mt-3 text-3xl font-semibold text-white">{formatNumber(scanCount)}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-center">
              <p className="text-sm text-slate-400">Leads</p>
              <p className="mt-3 text-3xl font-semibold text-white">{formatNumber(leadCount)}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-center">
              <p className="text-sm text-slate-400">Conversion</p>
              <p className="mt-3 text-3xl font-semibold text-white">{conversionRate}%</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="mb-4 flex items-center gap-3 text-slate-300">
              <Eye className="h-5 w-5 text-cyan-400" />
              <p className="text-sm uppercase tracking-[0.3em]">Channel conversion</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {campaignPerformance.map((channel) => (
                <div key={channel.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400">{channel.name}</p>
                      <p className="mt-1 text-lg font-semibold text-white">{channel.conversion}%</p>
                    </div>
                    <div className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">{channel.scans} scans</div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-cyan-500" style={{ width: `${channel.conversion}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                    <span>Leads</span>
                    <span>{channel.leads}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-center gap-3 text-slate-300">
              <MessageSquare className="h-5 w-5 text-cyan-400" />
              <div>
                <p className="text-sm uppercase tracking-[0.3em]">Campaign details</p>
                <p className="mt-1 text-sm text-slate-500">Status, launch date, and summary.</p>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm text-slate-400">
              <div>
                <p className="text-slate-500">Property</p>
                <p className="text-white">{campaign.property_name}</p>
              </div>
              <div>
                <p className="text-slate-500">Address</p>
                <p className="text-white">{campaign.property_address ?? 'Not provided'}</p>
              </div>
              <div>
                <p className="text-slate-500">Created</p>
                <p className="text-white">{campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'Unknown'}</p>
              </div>
              <div>
                <p className="text-slate-500">Channel</p>
                <p className="text-white">{channelInfo.name}</p>
              </div>
              <div>
                <p className="text-slate-500">Status</p>
                <p className="text-white">{statusLabel}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">QR tools</p>
            <p className="mt-2 text-sm text-slate-400">Download campaign-ready codes for the top high-impact channels.</p>
          </div>
        </aside>
      </div>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-6 flex items-center gap-3">
          <QrCode className="h-5 w-5 text-cyan-400" />
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Download QR codes</p>
            <h2 className="text-xl font-semibold text-white">High-resolution campaign downloads</h2>
          </div>
        </div>
        <CampaignQrDownloads baseUrl={baseUrl} />
      </section>
    </div>
  )
}
