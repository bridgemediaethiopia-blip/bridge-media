export const SUPPORTED_CHANNELS = [
  {
    id: 'tv',
    name: 'TV Broadcast',
    icon: '📺',
    headline: 'See the listing featured on TV',
    description: 'Thank you for watching our broadcast — explore the property details and request a private tour.',
  },
  {
    id: 'billboard',
    name: 'Outdoor / Billboard',
    icon: '🏙️',
    headline: 'Found us on the billboard',
    description: 'You spotted the property outdoors — get the full walk-through and connect with the listing team.',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    headline: 'Discovered on Instagram',
    description: 'Thanks for clicking through from Instagram — see the curated property tour and learn more.',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶️',
    headline: 'Arrived from YouTube',
    description: 'Enjoy the video walkthrough and check the latest details on the property listing.',
  },
  {
    id: 'facebook',
    name: 'Meta / Facebook',
    icon: '📘',
    headline: 'Connecting from Meta / Facebook',
    description: 'Thanks for visiting from Facebook — see the listing highlights and request a viewing.',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    headline: 'Discovered on TikTok',
    description: 'Short-form discovery meets premium real estate — explore the property and book a tour.',
  },
  {
    id: 'print',
    name: 'Print / Flyer',
    icon: '📄',
    headline: 'Found through print media',
    description: 'You found this listing on print — here’s the full property detail and next step information.',
  },
] as const

export const HIGH_THRESHOLD = 50
export const AVG_THRESHOLD = 25
export const LOW_THRESHOLD = 0

export type SupportedChannelId = (typeof SUPPORTED_CHANNELS)[number]['id']
export type SupportedChannel = (typeof SUPPORTED_CHANNELS)[number]
