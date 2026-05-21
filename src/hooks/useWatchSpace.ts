import { useCallback, useEffect, useMemo, useState } from 'react'
import { chatRoomTopicId } from '../utils/chatTopic'
import type { PresenceStatusId } from '../types/presenceStatus'
import type { WatchItemRow, WatchSourceType, WatchStatus } from '../types/watchItem'
import { deriveWatchContextLabel } from '../utils/watchSpaceContext'
import {
  deleteWatchItem,
  fetchWatchItems,
  insertWatchItem,
  subscribeWatchItems,
  updateWatchItem,
} from '../services/watchSpace.service'

export function useWatchSpace(currentId: string | null, peerId: string | null, myPresenceStatus: PresenceStatusId) {
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

  const addItem = useCallback(
    async (opts: {
      url: string
      title: string
      notes?: string | null
      status: WatchStatus
      sourceType: WatchSourceType
    }) => {
      if (!currentId || !pairKey) return { error: 'Not ready' as const }
      const ctx = deriveWatchContextLabel(myPresenceStatus)
      const res = await insertWatchItem({
        pairKey,
        addedBy: currentId,
        url: opts.url,
        title: opts.title,
        notes: opts.notes,
        status: opts.status,
        sourceType: opts.sourceType,
        contextLabel: ctx,
      })
      if (res.error) return { error: res.error }
      await reload()
      return { error: null as string | null }
    },
    [currentId, pairKey, myPresenceStatus, reload],
  )

  const patchItem = useCallback(
    async (id: string, patch: Partial<Pick<WatchItemRow, 'title' | 'notes' | 'status' | 'url' | 'source_type'>>) => {
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
    addItem,
    patchItem,
    removeItem,
  }
}
