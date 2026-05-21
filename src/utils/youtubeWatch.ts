import type { WatchSourceType } from '../types/watchItem'

/** YouTube watch / youtu.be — returns 11-char id or null. */
export function extractYoutubeVideoId(raw: string): string | null {
  const u = raw.trim()
  if (!u) return null
  try {
    const url = u.startsWith('http') ? new URL(u) : new URL(`https://${u}`)
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0]
      return /^[\w-]{11}$/.test(id) ? id : null
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const v = url.searchParams.get('v')
      if (v && /^[\w-]{11}$/.test(v)) return v
      const m = url.pathname.match(/\/embed\/([\w-]{11})/)
      if (m?.[1]) return m[1]
      const s = url.pathname.match(/\/shorts\/([\w-]{11})/)
      if (s?.[1]) return s[1]
    }
  } catch {
    return null
  }
  return null
}

export function youtubeThumbUrl(videoId: string, quality: 'default' | 'hq' | 'mq' = 'mq') {
  const q = quality === 'hq' ? 'hqdefault' : quality === 'mq' ? 'mqdefault' : 'default'
  return `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/${q}.jpg`
}

export function inferWatchSourceType(url: string, titleOnly: boolean): WatchSourceType {
  if (titleOnly || !url.trim()) return 'title'
  if (extractYoutubeVideoId(url)) return 'youtube'
  return 'link'
}
