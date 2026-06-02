import { useCallback, useEffect, useMemo, useState } from 'react'
import { useChatRoom } from '../context/chat-room-context'
import { useOptionalMidnightLayer } from './useMidnightLayer'
import { usePinnedMoments } from './usePinnedMoments'
import { useStreak } from './useStreak'
import { useWatchSpace } from './useWatchSpace'
import type { TimeCapsuleRow } from '../types/timeCapsule'
import { buildMemoryEchoes } from '../utils/buildMemoryEchoes'
import { prepareTimeCapsules, subscribeTimeCapsules } from '../services/timeCapsules.service'

/** Merges thread + pins + capsules + watch + streak into calm “echo” cards (pair-scoped). */
export function useMemoryEchoes() {
  const room = useChatRoom()
  const midnight = useOptionalMidnightLayer()
  const pinned = usePinnedMoments(room.currentId, room.peerId, room.myPresenceStatus)
  const watch = useWatchSpace(room.currentId, room.peerId)
  const streak = useStreak(room.currentId, room.peerId)

  const pairKey = pinned.pairKey ?? watch.pairKey

  const [capsules, setCapsules] = useState<TimeCapsuleRow[]>([])
  const [capsulesError, setCapsulesError] = useState<string | null>(null)

  const reloadCapsules = useCallback(async () => {
    if (!pairKey) {
      setCapsules([])
      return
    }
    const res = await prepareTimeCapsules(pairKey)
    if (res.error) {
      setCapsulesError(res.error)
      setCapsules([])
      return
    }
    setCapsulesError(null)
    setCapsules(res.data)
  }, [pairKey])

  useEffect(() => {
    void reloadCapsules()
  }, [reloadCapsules])

  useEffect(() => {
    if (!pairKey) return
    const sub = subscribeTimeCapsules(pairKey, () => {
      void reloadCapsules()
    })
    return () => sub.unsubscribe()
  }, [pairKey, reloadCapsules])

  const [clock, setClock] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const now = useMemo(() => new Date(clock), [clock])

  const echoes = useMemo(
    () =>
      pairKey
        ? buildMemoryEchoes({
            messages: room.messages,
            pinned: pinned.rows,
            pinnedMessageIds: pinned.pinnedMessageIds,
            capsules,
            watch: watch.rows,
            streakCount: streak.row?.current_streak ?? null,
            pairKey,
            now,
            midnightLayer: Boolean(midnight?.snapshot.active),
          })
        : [],
    [
      pairKey,
      room.messages,
      pinned.rows,
      pinned.pinnedMessageIds,
      capsules,
      watch.rows,
      streak.row?.current_streak,
      now,
      midnight?.snapshot.active,
    ],
  )

  const loading = room.loading || pinned.loading || watch.loading || streak.loading

  return {
    echoes,
    pairKey,
    loading: Boolean(pairKey) && loading,
    errors: {
      room: room.error,
      pinned: pinned.error,
      watch: watch.error,
      capsules: capsulesError,
    },
    reloadCapsules,
  }
}
