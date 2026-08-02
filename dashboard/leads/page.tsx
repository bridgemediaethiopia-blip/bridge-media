"use client"

import { useEffect, useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SUPPORTED_CHANNELS } from '@/lib/channels'

type LeadChannel = string

type Lead = {
  id: string
  name: string
  email: string
  phone: string
  channel: LeadChannel
  campaign: string
  message: string
  createdAt: string
}

type SupabaseLeadRow = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  channel: string | null
  message: string | null
  created_at: string | null
  campaign_id: string | null
  campaigns?: {
    property_name: string | null
  }[] | null
}

const channelOptions = ['All', 'YouTube', 'TikTok', 'TV', 'Billboard', 'Print'] as const

type ChannelFilter = (typeof channelOptions)[number]

const formatDate = (value: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const normalizeChannel = (value: string | null): LeadChannel => {
  if (!value) return 'Other'

  const normalizedValue = value.toLowerCase()
  const matchById = SUPPORTED_CHANNELS.find((channel) => channel.id === normalizedValue)
  if (matchById) return matchById.name

  const matchByName = SUPPORTED_CHANNELS.find((channel) => channel.name.toLowerCase() === normalizedValue)
  if (matchByName) return matchByName.name

  if (normalizedValue === 'tv') return 'TV Broadcast'
  if (normalizedValue === 'facebook') return 'Meta / Facebook'
  if (normalizedValue === 'youtube') return 'YouTube'
  if (normalizedValue === 'tiktok') return 'TikTok'

  return value
}

export default function LeadsPage() {
  const [search, setSearch] = useState('')
  const [channel, setChannel] = useState<ChannelFilter>('All')
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null)

  useEffect(() => {
    const loadLeads = async () => {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data, error: supabaseError } = await supabase
        .from('leads')
        .select('id, name, email, phone, channel, message, created_at, campaign_id, campaigns!campaign_id(property_name)')
        .order('created_at', { ascending: false })

      if (supabaseError) {
        setError(supabaseError.message)
        setLeads([])
        setLoading(false)
        return
      }

      const mappedLeads: Lead[] = (data as SupabaseLeadRow[]).map((lead) => ({
        id: lead.id,
        name: lead.name ?? '—',
        email: lead.email ?? '—',
        phone: lead.phone ?? '—',
        channel: normalizeChannel(lead.channel),
        campaign: lead.campaigns?.[0]?.property_name ?? '—',
        message: lead.message ?? '—',
        createdAt: formatDate(lead.created_at),
      }))

      setLeads(mappedLeads)
      setLoading(false)
    }

    void loadLeads()
  }, [])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = [lead.name, lead.email, lead.campaign].some((value) => value.toLowerCase().includes(search.toLowerCase()))
      const normalizedFilter =
        channel === 'All'
          ? null
          : channel === 'TV'
          ? 'TV Broadcast'
          : channel === 'Billboard'
          ? 'Outdoor / Billboard'
          : channel === 'Print'
          ? 'Print / Flyer'
          : channel
      const matchesChannel = normalizedFilter === null || lead.channel === normalizedFilter
      return matchesSearch && matchesChannel
    })
  }, [channel, leads, search])

  const exportCsv = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Channel', 'Campaign', 'Message', 'Created At'],
      ...filteredLeads.map((lead) => [lead.name, lead.email, lead.phone, lead.channel, lead.campaign, lead.message, lead.createdAt]),
    ]

    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'leads.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const truncateMessage = (message: string) => {
    const limit = 80
    if (message.length <= limit) return message
    return `${message.slice(0, limit).trim()}...`
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Leads</p>
            <h2 className="mt-2 text-2xl font-semibold">Master lead table</h2>
            <p className="mt-2 text-sm text-slate-400">Search by contact, campaign, or channel and export the filtered list.</p>
          </div>
          <button onClick={exportCsv} className="flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-400">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-400">
            <Search className="h-4 w-4" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search leads" className="w-full bg-transparent outline-none" />
          </label>
          <select value={channel} onChange={(event) => setChannel(event.target.value as ChannelFilter)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
            {channelOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-400">Loading leads…</p>
        ) : error ? (
          <p className="mt-4 text-sm text-rose-400">{error}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Phone</th>
                  <th className="px-3 py-3">Channel</th>
                  <th className="px-3 py-3">Campaign</th>
                  <th className="px-3 py-3">Message</th>
                  <th className="px-3 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const isExpanded = expandedLeadId === lead.id
                  return (
                    <tr key={lead.id} className="border-b border-slate-800/70 text-slate-200">
                      <td className="px-3 py-3">{lead.name}</td>
                      <td className="px-3 py-3">{lead.email}</td>
                      <td className="px-3 py-3">{lead.phone}</td>
                      <td className="px-3 py-3">{lead.channel}</td>
                      <td className="px-3 py-3">{lead.campaign}</td>
                      <td className="px-3 py-3 max-w-xs">
                        <div className="group relative">
                          <p className="overflow-hidden text-ellipsis whitespace-pre-wrap break-words transition-all duration-200" style={{ display: '-webkit-box', WebkitLineClamp: isExpanded ? 'none' : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {isExpanded ? lead.message : truncateMessage(lead.message)}
                          </p>
                          {!isExpanded && lead.message.length > 80 ? (
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-slate-950/40 to-slate-950" />
                          ) : null}
                          {lead.message.length > 80 ? (
                            <button
                              type="button"
                              onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                              className="mt-2 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3">{lead.createdAt}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
