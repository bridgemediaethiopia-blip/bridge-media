"use client"

import { useMemo, useState } from 'react'
import { X, PlusCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SUPPORTED_CHANNELS } from '@/lib/channels'

type CampaignOption = {
  id: string
  property_name: string | null
}

type LeadEntryModalProps = {
  campaigns: CampaignOption[]
}

export default function LeadEntryModal({ campaigns }: LeadEntryModalProps) {
  const defaultChannel = SUPPORTED_CHANNELS[0]?.name ?? 'TV'
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [channel, setChannel] = useState<string>(defaultChannel)
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const displayCampaigns = useMemo(() => campaigns, [campaigns])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase.from('leads').insert({
      campaign_id: campaignId,
      name,
      email,
      channel,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setName('')
    setEmail('')
    setChannel(defaultChannel)
    setMessage('Lead added successfully')
    setLoading(false)
  }

  return (
    <div>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400">
        <PlusCircle className="h-4 w-4" />
        Add manual lead
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Manual Lead Entry</h2>
                <p className="text-sm text-slate-400">Create a lead for an existing campaign.</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="lead-campaign">Campaign</label>
                <select id="lead-campaign" value={campaignId} onChange={(event) => setCampaignId(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
                  {displayCampaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>{campaign.property_name || 'Untitled campaign'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="lead-name">Name</label>
                <input id="lead-name" value={name} onChange={(event) => setName(event.target.value)} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" placeholder="Lead name" />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="lead-email">Email</label>
                <input id="lead-email" value={email} onChange={(event) => setEmail(event.target.value)} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" placeholder="Lead email" />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="lead-channel">Channel</label>
                <select id="lead-channel" value={channel} onChange={(event) => setChannel(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
                  {SUPPORTED_CHANNELS.map((option) => (
                    <option key={option.id} value={option.name}>{option.name}</option>
                  ))}
                </select>
              </div>

              {message ? <p className="text-sm text-cyan-300">{message}</p> : null}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition disabled:opacity-70">
                  {loading ? 'Saving…' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
