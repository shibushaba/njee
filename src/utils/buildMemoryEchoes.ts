import type { MessageRow } from '../types/message'
import type { PinnedMomentRow } from '../types/pinnedMoment'
import type { TimeCapsuleRow } from '../types/timeCapsule'
import type { WatchItemRow } from '../types/watchItem'
import type { MemoryEchoItem, MemoryEchoKind } from '../types/memoryEcho'

type BuildInput = {
  messages: MessageRow[]
  pinned: PinnedMomentRow[]
  /** Skip generic message echoes for rows already represented as pins. */
  pinnedMessageIds?: Set<string>
  capsules: TimeCapsuleRow[]
  watch: WatchItemRow[]
  streakCount: number | null
  pairKey: string
  now: Date
  midnightLayer: boolean
}

const MAX_OUT = 10

function daysBetween(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 86400000)
}

function isLateHour(d: Date) {
  const h = d.getHours()
  return h >= 23 || h < 5
}

function clip(s: string, n: number) {
  const t = s.trim()
  if (t.length <= n) return t
  return `${t.slice(0, n - 1)}…`
}

function poeticContext(iso: string, now: Date, midnightLayer: boolean): string {
  const d = new Date(iso)
  const days = daysBetween(now, d)
  if (days >= 365) return 'Over a year ago'
  if (days >= 180) return 'Months back'
  if (days >= 30) return 'A different season'
  if (days >= 7) return 'Earlier together'
  if (isLateHour(d)) return midnightLayer ? 'A late hour — like tonight' : 'Late night thread'
  if (d.getHours() >= 9 && d.getHours() <= 16) return 'Daytime chapter'
  return 'A soft pocket of time'
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function seededPick<T>(arr: T[], pairKey: string, day: string, take: number): T[] {
  if (arr.length <= take) return [...arr]
  const seed = hashStr(`${pairKey}|${day}`)
  const out: T[] = []
  const pool = [...arr]
  let s = seed
  while (out.length < take && pool.length) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const idx = s % pool.length
    out.push(pool[idx]!)
    pool.splice(idx, 1)
  }
  return out
}

export function buildMemoryEchoes(input: BuildInput): MemoryEchoItem[] {
  const { messages, pinned, pinnedMessageIds, capsules, watch, streakCount, pairKey, now, midnightLayer } = input
  const candidates: MemoryEchoItem[] = []
  const seen = new Set<string>()

  const push = (item: MemoryEchoItem) => {
    if (seen.has(item.id)) return
    seen.add(item.id)
    candidates.push(item)
  }

  for (const m of messages) {
    if (m.deleted_at) continue
    if (pinnedMessageIds?.has(m.id)) continue
    const d = new Date(m.created_at)
    const age = daysBetween(now, d)
    if (m.message_type === 'text' && m.content.trim().length > 6 && age >= 5) {
      push({
        id: `msg-text-${m.id}`,
        kind: isLateHour(d) && age >= 14 ? 'late_night' : 'text_thread',
        at: m.created_at,
        title: isLateHour(d) ? 'Late thread' : 'Something you wrote',
        body: clip(m.content, 140),
        contextLine: poeticContext(m.created_at, now, midnightLayer),
        navigateTo: '/chat',
      })
    }
    if ((m.message_type === 'image' || m.message_type === 'video') && m.media_url && age >= 2) {
      push({
        id: `msg-media-${m.id}`,
        kind: 'media_moment',
        at: m.created_at,
        title: m.message_type === 'video' ? 'Moving moment' : 'Still frame',
        body: clip(m.content || 'A shared photo or clip.', 120),
        contextLine: poeticContext(m.created_at, now, midnightLayer),
        navigateTo: '/memories',
      })
    }
  }

  for (const p of pinned) {
    const m = p.message
    if (m.deleted_at) continue
    push({
      id: `pin-${p.id}`,
      kind: 'pin',
      at: p.pinned_at,
      title: 'Pinned breath',
      body: clip(m.message_type === 'text' ? m.content : m.content || 'A saved moment on the shelf.', 120),
      contextLine: poeticContext(p.pinned_at, now, midnightLayer),
      navigateTo: '/moments',
    })
  }

  for (const c of capsules) {
    if (!c.is_unlocked) continue
    const ref = c.unlocked_at ?? c.created_at
    push({
      id: `cap-${c.id}`,
      kind: 'capsule',
      at: ref,
      title: clip(c.capsule_title || 'Time capsule', 48),
      body: clip(c.content || 'Something that waited.', 120),
      contextLine: poeticContext(ref, now, midnightLayer),
      navigateTo: '/lounge/capsules',
    })
  }

  for (const w of watch) {
    if (w.status !== 'watched' || !w.watched_at) continue
    push({
      id: `watch-${w.id}`,
      kind: 'watch_watched',
      at: w.watched_at,
      title: clip(w.title, 56),
      body: clip(w.abi?.trim() || w.notes?.trim() || 'Watched together.', 120),
      contextLine: poeticContext(w.watched_at, now, midnightLayer),
      navigateTo: '/lounge/watch',
    })
  }

  if (streakCount != null && streakCount >= 7) {
    const anchor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0)
    push({
      id: 'ritual-streak',
      kind: 'ritual',
      at: anchor.toISOString(),
      title: 'Shared ritual',
      body: `You’ve carried ${streakCount} gentle days together — not a score, a rhythm.`,
      contextLine: 'The thread that kept returning',
      navigateTo: '/ritual',
    })
  }

  candidates.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  const day = now.toDateString()
  const picked = seededPick(candidates, pairKey, day, MAX_OUT)

  return picked.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

export function echoKindLabel(kind: MemoryEchoKind): string {
  switch (kind) {
    case 'text_thread':
      return 'Echo'
    case 'late_night':
      return 'Late night'
    case 'media_moment':
      return 'Moment'
    case 'pin':
      return 'Pin'
    case 'capsule':
      return 'Capsule'
    case 'watch_watched':
      return 'Watch'
    case 'ritual':
      return 'Ritual'
    default:
      return 'Memory'
  }
}
