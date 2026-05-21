import { useCallback, useEffect, useMemo, useState } from 'react'
import { chatRoomTopicId } from '../utils/chatTopic'
import type { PresenceStatusId } from '../types/presenceStatus'
import type { TimeCapsuleRow, TimeCapsuleType } from '../types/timeCapsule'
import { derivePinContextLabel } from '../utils/pinnedMomentContext'
import {
  deleteTimeCapsule,
  fetchTimeCapsules,
  insertTimeCapsule,
  subscribeTimeCapsules,
  syncDueCapsuleUnlocks,
} from '../services/timeCapsules.service'

export function useTimeCapsules(
  currentId: string | null,
  peerId: string | null,
  myPresenceStatus: PresenceStatusId,
) {
  const pairKey = useMemo(
    () => (currentId && peerId ? chatRoomTopicId(currentId, peerId) : null),
    [currentId, peerId],
  )

  const [rows, setRows] = useState<TimeCapsuleRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!pairKey) {
      setRows([])
      return
    }
    setLoading(true)
    setError(null)
    await syncDueCapsuleUnlocks(pairKey)
    const res = await fetchTimeCapsules(pairKey)
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
    const sub = subscribeTimeCapsules(pairKey, () => {
      void reload()
    })
    return () => sub.unsubscribe()
  }, [pairKey, reload])

  useEffect(() => {
    if (!pairKey) return
    const tick = window.setInterval(() => {
      void (async () => {
        const r = await syncDueCapsuleUnlocks(pairKey)
        if (r.unlockedIds.length > 0) void reload()
      })()
    }, 45_000)
    return () => window.clearInterval(tick)
  }, [pairKey, reload])

  useEffect(() => {
    if (!pairKey) return
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void (async () => {
          const r = await syncDueCapsuleUnlocks(pairKey)
          if (r.unlockedIds.length > 0) void reload()
        })()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [pairKey, reload])

  const createCapsule = useCallback(
    async (opts: {
      content: string
      capsuleTitle?: string | null
      capsuleType: TimeCapsuleType
      mediaUrl?: string | null
      mediaType?: 'image' | 'video' | null
      unlockAtIso: string
    }) => {
      if (!currentId || !peerId || !pairKey) return { error: 'Not ready' as const }
      const ctx = derivePinContextLabel(myPresenceStatus)
      const res = await insertTimeCapsule({
        pairKey,
        senderId: currentId,
        receiverId: peerId,
        capsuleTitle: opts.capsuleTitle,
        content: opts.content,
        capsuleType: opts.capsuleType,
        mediaUrl: opts.mediaUrl,
        mediaType: opts.mediaType,
        unlockAtIso: opts.unlockAtIso,
        contextLabel: ctx,
      })
      if (res.error) return { error: res.error }
      await reload()
      return { error: null as string | null }
    },
    [currentId, peerId, pairKey, myPresenceStatus, reload],
  )

  const removeCapsule = useCallback(
    async (capsuleId: string) => {
      const res = await deleteTimeCapsule(capsuleId)
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
    createCapsule,
    removeCapsule,
  }
}
