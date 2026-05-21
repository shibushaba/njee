import { useCallback, useEffect, useMemo, useState } from 'react'
import { chatRoomTopicId } from '../utils/chatTopic'
import type { MessageRow } from '../types/message'
import type { PresenceStatusId } from '../types/presenceStatus'
import type { PinnedMomentRow } from '../types/pinnedMoment'
import { derivePinContextLabel } from '../utils/pinnedMomentContext'
import {
  deletePinnedMoment,
  fetchPinnedMoments,
  insertPinnedMoment,
  subscribePinnedMoments,
} from '../services/pinnedMoments.service'

export function usePinnedMoments(
  currentId: string | null,
  peerId: string | null,
  myPresenceStatus: PresenceStatusId,
) {
  const pairKey = useMemo(
    () => (currentId && peerId ? chatRoomTopicId(currentId, peerId) : null),
    [currentId, peerId],
  )

  const [rows, setRows] = useState<PinnedMomentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!pairKey) {
      setRows([])
      return
    }
    setLoading(true)
    setError(null)
    const res = await fetchPinnedMoments(pairKey)
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
    const sub = subscribePinnedMoments(pairKey, () => {
      void reload()
    })
    return () => sub.unsubscribe()
  }, [pairKey, reload])

  const pinnedMessageIds = useMemo(() => new Set(rows.map((r) => r.message_id)), [rows])

  const pinMessage = useCallback(
    async (message: MessageRow) => {
      if (!currentId || !pairKey) return { error: 'Not ready' as const }
      const ctx = derivePinContextLabel(myPresenceStatus)
      const res = await insertPinnedMoment({
        messageId: message.id,
        pairKey,
        pinnedBy: currentId,
        contextLabel: ctx,
      })
      if (res.error) return { error: res.error }
      await reload()
      return { error: null as string | null }
    },
    [currentId, pairKey, myPresenceStatus, reload],
  )

  const unpin = useCallback(
    async (pinId: string) => {
      const res = await deletePinnedMoment(pinId)
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
    pinnedMessageIds,
    pinMessage,
    unpin,
    pairKey,
  }
}
