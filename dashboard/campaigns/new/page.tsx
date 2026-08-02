"use client"

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Smartphone, CheckCircle2, QrCode, Loader2, Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase/client'
import { SUPPORTED_CHANNELS, type SupportedChannelId } from '@/lib/channels'

type Channel = SupportedChannelId

type ClientOption = {
  id: string
  name: string
}

type CampaignFormState = {
  clientId: string
  clientName: string
  propertyName: string
  address: string
  description: string
  channel: Channel
  photos: string[]
}

type SupabaseClientRow = {
  id: string
  name: string
}

const channelLabels = Object.fromEntries(
  SUPPORTED_CHANNELS.map((channel) => [channel.id, channel.name])
) as Record<SupportedChannelId, string>

const initialState: CampaignFormState = {
  clientId: '',
  clientName: '',
  propertyName: '',
  address: '',
  description: '',
  channel: 'tv',
  photos: [],
}

const channelOptions = SUPPORTED_CHANNELS.map((option) => option.id) as SupportedChannelId[]

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<CampaignFormState>(initialState)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const loadClients = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('clients').select('id, name').order('name')

      if (!error && data) {
        setClients(data as SupabaseClientRow[])
      }
      setLoadingClients(false)
    }

    void loadClients()
  }, [])

  const qrBaseUrl = useMemo(() => {
    return `https://bridge.media/p/${form.propertyName ? form.propertyName.toLowerCase().replace(/\s+/g, '-') : 'demo-property'}`
  }, [form.propertyName])

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    const supabase = createClient()
    const fileName = `${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('property-photos').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (uploadError) {
      setMessage(uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('property-photos').getPublicUrl(fileName)
    setForm((current) => ({ ...current, photos: [...current.photos, data.publicUrl] }))
    setUploading(false)
    setMessage('Photo uploaded successfully')
  }

  const handleSave = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from('campaigns').insert({
      client_id: form.clientId || null,
      property_name: form.propertyName || 'Untitled property',
      property_address: form.address || null,
      description: form.description || null,
      channel: form.channel,
      status: 'active',
      short_code: `${form.propertyName || 'property'}`.toLowerCase().replace(/\s+/g, '-'),
    })

    if (error) {
      setMessage(error.message)
      return
    }

    if (data) {
      setShowToast(true)
      setMessage('Campaign saved successfully.')
      window.setTimeout(() => {
        router.push('/dashboard')
      }, 1200)
    }
  }

  const handleDownloadQr = (channel: Channel) => {
    const element = document.getElementById(`qr-${channel}`)
    if (!element) return

    const svg = element.querySelector('svg')
    if (!svg) return

    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svg)
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = 6
      const width = Math.max(img.width, 512)
      const height = Math.max(img.height, 512)
      canvas.width = width * scale
      canvas.height = height * scale
      const context = canvas.getContext('2d')
      if (!context) return

      context.clearRect(0, 0, canvas.width, canvas.height)
      context.scale(scale, scale)
      context.drawImage(img, 0, 0, width, height)

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${channel}-qr.png`
        link.click()
        URL.revokeObjectURL(url)
      }, 'image/png', 1)
    }
    img.src = svgUrl
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Campaign Builder</p>
        <h2 className="mt-2 text-2xl font-semibold">Create a new property campaign</h2>
      </div>

      {showToast ? (
        <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-300">
          Campaign saved successfully. Redirecting to your dashboard…
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((value) => (
              <div key={value} className={`flex-1 rounded-full border px-3 py-2 text-center text-sm ${step >= value ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300' : 'border-slate-700 text-slate-400'}`}>
                Step {value}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">1. Client selection</h3>
              <select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value, clientName: clients.find((client) => client.id === event.target.value)?.name ?? '' })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" disabled={loadingClients}>
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
              <input value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Or enter a client name" />
              <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value as Channel })}>
                {channelOptions.map((value) => (
                  <option key={value} value={value}>{channelLabels[value]}</option>
                ))}
              </select>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">2. Property details</h3>
              <input value={form.propertyName} onChange={(event) => setForm({ ...form, propertyName: event.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Property name" />
              <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Property address" />
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Short property description" />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">3. Photo upload</h3>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/70 p-5 text-sm text-slate-400">
                <Upload className="h-5 w-5 text-cyan-400" />
                <span>{uploading ? 'Uploading…' : 'Upload to the property-photos bucket'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
              {message ? <p className="text-sm text-cyan-400">{message}</p> : null}
              <div className="grid gap-3 sm:grid-cols-2">
                {form.photos.map((photo, index) => (
                  <img key={`${photo}-${index}`} src={photo} alt="Property preview" className="h-32 w-full rounded-xl object-cover" />
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">4. Review</h3>
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                <p className="text-sm text-slate-400">Client</p>
                <p className="font-medium">{form.clientName || 'Untitled client'}</p>
                <p className="mt-3 text-sm text-slate-400">Property</p>
                <p className="font-medium">{form.propertyName || 'New listing'}</p>
                <p className="mt-3 text-sm text-slate-400">Channel</p>
                <p className="font-medium">{channelLabels[form.channel]}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">Back</button>
            {step === 4 ? (
              <button onClick={() => void handleSave()} className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save Campaign</button>
            ) : (
              <button onClick={() => setStep((current) => Math.min(4, current + 1))} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950">Continue</button>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center gap-2 text-cyan-400">
            <Smartphone className="h-5 w-5" />
            <h3 className="text-xl font-semibold">Live preview</h3>
          </div>
          <div className="rounded-[2rem] border border-slate-700 bg-gradient-to-b from-slate-800 to-slate-950 p-3 shadow-2xl">
            <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900 p-4">
              <div className="mb-4 rounded-xl bg-slate-800 p-3 text-center text-sm text-slate-300">
                {form.propertyName || 'Luxury Residence'}
              </div>
              {form.photos[0] ? (
                <img src={form.photos[0]} alt="Property" className="h-40 w-full rounded-xl object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">Upload a photo to preview it</div>
              )}
              <div className="mt-4 space-y-2">
                <p className="text-lg font-semibold">{form.address || '123 Market Street'}</p>
                <p className="text-sm text-slate-400">{form.description || 'Premium listing with private tour access.'}</p>
                <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  Scan from {channelLabels[form.channel]}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-cyan-400">
              <QrCode className="h-5 w-5" />
              <h4 className="font-semibold">Dynamic QR variants</h4>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {channelOptions.map((channel) => (
                <div key={channel} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-center">
                  <p className="text-sm text-slate-400">{channelLabels[channel]}</p>
                  <div id={`qr-${channel}`} className="mt-3 flex justify-center">
                    <QRCodeSVG value={`${qrBaseUrl}?channel=${channel}`} size={96} includeMargin />
                  </div>
                  <button onClick={() => handleDownloadQr(channel)} className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300">
                    <Download className="h-3.5 w-3.5" />
                    PNG
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
