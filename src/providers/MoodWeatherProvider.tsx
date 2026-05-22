import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { MoodWeatherContext, type MoodWeatherContextValue } from '../context/mood-weather-context'
import { useOptionalChatRoom } from '../context/chat-room-context'
import { useMessagingChrome } from '../context/messaging-chrome-context'
import { useStreak } from '../hooks/useStreak'
import { useOptionalMidnightLayer } from '../hooks/useMidnightLayer'
import { NJE_MOOD_STREAK_EVENT, type NjeMoodStreakDetail } from '../lib/moodWeatherBridge'
import type { MoodWeatherSignals } from '../types/moodWeather'
import { resolveMoodWeather } from '../utils/moodWeatherEngine'
import { AmbientParticles } from '../components/moodWeather/AmbientParticles'
import { AmbientWeatherLayer } from '../components/moodWeather/AmbientWeatherLayer'
import { MoodWeatherOverlay } from '../components/moodWeather/MoodWeatherOverlay'
import { MidnightOverlay, MidnightParticles } from '../components/midnight'

type MoodWeatherProviderProps = {
  children: ReactNode
}

export function MoodWeatherProvider({ children }: MoodWeatherProviderProps) {
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const messaging = useMessagingChrome()
  const room = useOptionalChatRoom()
  const streak = useStreak(room?.currentId ?? null, room?.peerId ?? null)
  const midnight = useOptionalMidnightLayer()

  const [now, setNow] = useState(() => new Date())
  const [streakMilestoneActive, setStreakMilestoneActive] = useState(false)

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const onStreak = (e: Event) => {
      const ce = e as CustomEvent<NjeMoodStreakDetail>
      setStreakMilestoneActive(Boolean(ce.detail?.active))
    }
    window.addEventListener(NJE_MOOD_STREAK_EVENT, onStreak)
    return () => window.removeEventListener(NJE_MOOD_STREAK_EVENT, onStreak)
  }, [])

  const signals: MoodWeatherSignals = useMemo(
    () => ({
      hour: now.getHours(),
      pathname: location.pathname,
      myPresence: room?.myPresenceStatus ?? null,
      peerPresence: room?.peerPresenceStatus ?? null,
      peerOnline: room?.peerOnline ?? false,
      peerTyping: room?.peerTyping ?? false,
      composerFocused: messaging?.composerFocused ?? false,
      streakCount: streak.row?.current_streak ?? null,
      streakMilestoneActive,
      midnightLayerActive: Boolean(midnight?.snapshot.active),
    }),
    [
      now,
      location.pathname,
      room?.myPresenceStatus,
      room?.peerPresenceStatus,
      room?.peerOnline,
      room?.peerTyping,
      messaging?.composerFocused,
      streak.row?.current_streak,
      streakMilestoneActive,
      midnight?.snapshot.active,
    ],
  )

  const snapshot = useMemo(() => resolveMoodWeather(signals), [signals])

  const value = useMemo<MoodWeatherContextValue>(
    () => ({
      snapshot,
      lastResolvedAt: now.getTime(),
    }),
    [snapshot, now],
  )

  const disableParticles = Boolean(reduceMotion)

  return (
    <MoodWeatherContext.Provider value={value}>
      <div className="relative isolate min-h-dvh">
        <div className="pointer-events-none fixed inset-0 z-[1] bg-nje-bg" aria-hidden />
        <AmbientWeatherLayer snapshot={snapshot} reduceMotion={Boolean(reduceMotion)} />
        <MoodWeatherOverlay snapshot={snapshot} reduceMotion={Boolean(reduceMotion)} />
        {!disableParticles ? <AmbientParticles snapshot={snapshot} /> : null}
        <MidnightOverlay />
        {!disableParticles ? <MidnightParticles /> : null}
        <div className="relative z-[10] min-h-dvh">{children}</div>
      </div>
    </MoodWeatherContext.Provider>
  )
}
