import { useCallback, useEffect, useMemo, useState } from 'react'
import { chatRoomTopicId } from '../utils/chatTopic'
import type { WatchItemRow, WatchSourceType } from '../types/watchItem'
import {
  deleteWatchItem,
  fetchWatchItems,
  insertWatchSuggestion,
  subscribeWatchItems,
  updateWatchItem,
} from '../services/watchSpace.service'

export function useWatchSpace(currentId: string | null, peerId: string | null) {
  const pairKey = useMemo(
    () => (currentId && peerId ? chatRoomTopicId(currentId, peerId) : null),
    [currentId, peerId],
  )

  const [rows, setRows] = useState<WatchItemRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!pairKey) {
      setRows([])
      return
    }
    setLoading(true)
    setError(null)
    const res = await fetchWatchItems(pairKey)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      setRows([])
      return
    }
    setRows(res.data)
  }, [pairKey])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (!pairKey) return
    const sub = subscribeWatchItems(pairKey, () => {
      void reload()
    })
    return () => sub.unsubscribe()
  }, [pairKey, reload])

  const stats = useMemo(() => {
    if (!currentId || !peerId) {
      return { theyFinishedMine: 0, iFinishedTheirs: 0 }
    }
    const theyFinishedMine = rows.filter(
      (r) => r.added_by === currentId && r.recipient_id === peerId && r.status === 'watched',
    ).length
    const iFinishedTheirs = rows.filter(
      (r) => r.added_by === peerId && r.recipient_id === currentId && r.status === 'watched',
    ).length
    return { theyFinishedMine, iFinishedTheirs }
  }, [rows, currentId, peerId])

  const addSuggestion = useCallback(
    async (opts: {
      url: string
      title: string
      notes?: string | null
      sourceType: WatchSourceType
      suggestStars: number
      priority: number
    }) => {
      if (!currentId || !peerId || !pairKey) return { error: 'Not ready' as const }
      const res = await insertWatchSuggestion({
        pairKey,
        suggesterId: currentId,
        recipientId: peerId,
        url: opts.url,
        title: opts.title,
        notes: opts.notes,
        sourceType: opts.sourceType,
        suggestStars: opts.suggestStars,
        priority: opts.priority,
      })
      if (res.error) return { error: res.error }
      await reload()
      return { error: null as string | null }
    },
    [currentId, peerId, pairKey, reload],
  )

  const patchItem = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      const res = await updateWatchItem(id, patch)
      if (res.error) return { error: res.error }
      await reload()
      return { error: null as string | null }
    },
    [reload],
  )

  const markWatched = useCallback(
    async (id: string, abi: string, starsWatch: number) => {
      const t = abi.trim()
      if (!t) return { error: 'Abi cannot be empty.' as const }
      const s = Math.min(5, Math.max(1, Math.round(starsWatch)))
      const res = await updateWatchItem(id, {
        status: 'watched',
        abi: t,
        stars_watch: s,
        watched_at: new Date().toISOString(),
      })
      if (res.error) return { error: res.error }
      await reload()
      return { error: null as string | null }
    },
    [reload],
  )

  const setStatus = useCallback(
    async (id: string, status: 'suggested' | 'watching') => {
      const patch: Partial<
        Pick<WatchItemRow, 'status' | 'watched_at' | 'abi' | 'stars_watch'>
      > = { status }
      if (status === 'suggested') {
        patch.watched_at = null
        patch.abi = null
        patch.stars_watch = null
      }
      const res = await updateWatchItem(id, patch)
      if (res.error) return { error: res.error }
      await reload()
      return { error: null as string | null }
    },
    [reload],
  )

  const removeItem = useCallback(
    async (id: string) => {
      const res = await deleteWatchItem(id)
      if (res.error) return { error: res.error }
      await reload()
      return { error: null as string | null }
    },
    [reload],
  )

  return {
    rows,
    loading,
    error,
    reload,
    pairKey,
    stats,
    addSuggestion,
    patchItem,
    markWatched,
    setStatus,
    removeItem,
  }
}
