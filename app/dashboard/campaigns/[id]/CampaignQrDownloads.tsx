'use client'

import { Download, Printer, Tv, Video, LayoutGrid } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

type CampaignQrDownloadsProps = {
  baseUrl: string
}

const formats = [
  { id: 'youtube', label: 'YouTube', description: 'Video placements and channel links', icon: Video },
  { id: 'tiktok', label: 'TikTok', description: 'Short-form social placements', icon: LayoutGrid },
  { id: 'tv', label: 'TV Broadcast', description: 'Broadcast and on-air media', icon: Tv },
  { id: 'billboard', label: 'Billboard', description: 'Outdoor and large-format print', icon: LayoutGrid },
  { id: 'print', label: 'Print / Flyer', description: 'Flyers, mailers, and direct print use', icon: Printer },
]

export default function CampaignQrDownloads({ baseUrl }: CampaignQrDownloadsProps) {
  const handleDownload = async (id: string) => {
    const element = document.getElementById(`qr-${id}`)
    const svg = element?.querySelector('svg')
    if (!(svg instanceof SVGSVGElement)) return

    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svg)
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()

    img.onload = () => {
      const size = 1024
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return
        const pngUrl = URL.createObjectURL(pngBlob)
        const link = document.createElement('a')
        link.href = pngUrl
        link.download = `${id}-qr.png`
        link.click()
        URL.revokeObjectURL(pngUrl)
      }, 'image/png')
    }

    img.src = url
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {formats.map((format) => {
        const Icon = format.icon
        return (
          <div key={format.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-cyan-300">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{format.label}</p>
                <p className="mt-1 text-sm text-slate-400">{format.description}</p>
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-center">
              <QRCodeSVG id={`qr-${format.id}-svg`} value={`${baseUrl}?channel=${format.id}`} size={220} level="H" includeMargin />
            </div>

            <button
              type="button"
              onClick={() => void handleDownload(format.id)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </button>

            <div id={`qr-${format.id}`} className="pointer-events-none absolute left-[-9999px] top-[-9999px] opacity-0">
              <QRCodeSVG value={`${baseUrl}?channel=${format.id}`} size={1024} level="H" includeMargin />
            </div>
          </div>
        )
      })}
    </div>
  )
}
