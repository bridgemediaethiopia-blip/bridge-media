import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SUPPORTED_CHANNELS, AVG_THRESHOLD, HIGH_THRESHOLD, LOW_THRESHOLD } from '@/lib/channels'
import LeadEntryModal from './lead-entry-modal'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const [{ count: campaignCount }, { count: leadCount }, { data: recentCampaigns }, { data: campaignOptions }, { data: channelCounts }, { data: scanEvents }, { data: leadChannels }] = await Promise.all([
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('campaigns').select('id, property_name, status, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('campaigns').select('id, property_name').order('property_name'),
    supabase.from('campaigns').select('channel'),
    supabase.from('scan_events').select('channel'),
    supabase.from('leads').select('channel'),
  ])

  const activeCampaignChannels = Array.from(
    new Set(
      (channelCounts ?? [])
        .map((channel) => channel?.channel)
        .filter(Boolean)
    )
  ) as string[]

  const activeChannelLabels = activeCampaignChannels.length
    ? activeCampaignChannels
        .map((channel) => SUPPORTED_CHANNELS.find((item) => item.id === channel)?.name ?? channel)
        .join(', ')
    : SUPPORTED_CHANNELS.map((channel) => channel.name).join(', ')

  const scanCount = (scanEvents ?? []).filter((row) => row?.channel).length
  const leadCountForConversion = leadCount ?? 0
  const conversionRate = scanCount > 0 ? Math.round((leadCountForConversion / scanCount) * 100) : 0

  const channelPerformance = SUPPORTED_CHANNELS.map((channel) => {
    const scans = (scanEvents ?? []).filter((event) => event?.channel === channel.id).length
    const leadsForChannel = (leadChannels ?? []).filter((lead) => lead?.channel === channel.name).length
    const rate = scans > 0 ? Math.round((leadsForChannel / scans) * 100) : 0
    return {
      id: channel.id,
      name: channel.name,
      scans,
      leads: leadsForChannel,
      conversion: rate,
    }
  })

  const getPerformanceBadge = (conversion: number) => {
    if (conversion >= HIGH_THRESHOLD) {
      return { label: 'High', classes: 'bg-emerald-500/15 text-emerald-200' }
    }

    if (conversion >= AVG_THRESHOLD) {
      return { label: 'Average', classes: 'bg-amber-500/15 text-amber-200' }
    }

    if (conversion >= LOW_THRESHOLD) {
      return { label: 'Needs Attention', classes: 'bg-rose-500/15 text-rose-200' }
    }

    return { label: 'Needs Attention', classes: 'bg-rose-500/15 text-rose-200' }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">Live performance</p>
          <h2 className="text-2xl font-semibold">Campaign overview</h2>
          <p className="mt-1 text-sm text-slate-500">Track your media campaigns and incoming audience leads.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/campaigns/new" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400">
            + New Campaign
          </Link>
          {campaignOptions ? <LeadEntryModal campaigns={campaignOptions} /> : null}
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Active Campaigns</p>
          <p className="mt-3 text-3xl font-semibold text-white">{campaignCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Total Leads Collected</p>
          <p className="mt-3 text-3xl font-semibold text-white">{leadCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Total Scans</p>
          <p className="mt-3 text-3xl font-semibold text-white">{scanCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Scan-to-Lead Conversion</p>
          <p className="mt-3 text-3xl font-semibold text-white">{conversionRate}%</p>
          <span className="text-xs text-slate-500">Based on scans vs. leads</span>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Channel performance</h2>
            <p className="text-sm text-slate-400">Compare scans and leads across each channel.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {channelPerformance.map((channel) => {
            const badge = getPerformanceBadge(channel.conversion)
            return (
              <div key={channel.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">{channel.name}</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{channel.conversion}%</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] font-semibold ${badge.classes}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Scans</span>
                    <span>{channel.scans}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Leads</span>
                    <span>{channel.leads}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                    <span>Conversion progress</span>
                    <span>{channel.conversion}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-cyan-500 transition-all duration-300" style={{ width: `${channel.conversion}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Campaigns</h2>
        </div>
        {recentCampaigns && recentCampaigns.length > 0 ? (
          <div className="space-y-3">
            {recentCampaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/dashboard/campaigns/${campaign.id}`}
                className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-cyan-500 hover:bg-slate-900"
              >
                <div>
                  <p className="font-medium text-white">{campaign.property_name ?? 'Untitled Campaign'}</p>
                  <p className="text-sm text-slate-500">{campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'Unknown date'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${campaign.status === 'paused' ? 'bg-amber-500/10 text-amber-200' : 'bg-emerald-500/10 text-emerald-300'}`}>
                    {campaign.status === 'paused' ? 'Paused' : 'Active'}
                  </span>
                  <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300 transition group-hover:border-cyan-500">
                    View details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No campaigns created yet. Click "+ New Campaign" to launch your first one!</p>
        )}
      </section>
    </div>
  )
}
