import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDailyStreak, subscribeDailyStreak } from '../services/streak.service'
import type { DailyStreakRow, StreakMilestone } from '../types/streak'
import { markMilestoneCelebrated, popUncelebratedMilestone } from '../utils/streakUtils'

export function useStreak(currentId: string | null, peerId: string | null) {
  const [row, setRow] = useState<DailyStreakRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [milestone, setMilestone] = useState<StreakMilestone | null>(null)
  const prevStreakRef = useRef<number | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!currentId || !peerId) {
      setRow(null)
      setLoading(false)
      prevStreakRef.current = null
      initializedRef.current = false
      return
    }

    let cancelled = false
    setLoading(true)

    void fetchDailyStreak(currentId, peerId).then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        setRow(null)
        setLoading(false)
        prevStreakRef.current = null
        initializedRef.current = true
        return
      }
      setRow(data)
      prevStreakRef.current = data?.current_streak ?? 0
      initializedRef.current = true
      setLoading(false)
    })

    const unsub = subscribeDailyStreak(currentId, peerId, (nextRow) => {
      if (cancelled) return
      const old = prevStreakRef.current
      const next = nextRow?.current_streak ?? 0
      if (initializedRef.current && old !== null && nextRow && next > old) {
        const m = popUncelebratedMilestone(currentId, peerId, old, next)
        if (m) setMilestone(m)
      }
      prevStreakRef.current = next
      setRow(nextRow)
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [currentId, peerId])

  const dismissMilestone = useCallback(() => {
    if (milestone && currentId && peerId) {
      markMilestoneCelebrated(currentId, peerId, milestone)
    }
    setMilestone(null)
  }, [milestone, currentId, peerId])

  return { row, loading, milestone, dismissMilestone }
}
