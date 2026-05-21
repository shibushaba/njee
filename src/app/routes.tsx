import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthLoadingScreen } from '../components/auth/AuthLoadingScreen'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { useAuth } from '../hooks/useAuth'
import { MobileAppShell } from '../layouts/MobileAppShell'
import { ChatRoomProvider } from '../providers/ChatRoomProvider'
import { NotificationProvider } from '../providers/NotificationProvider'
import { ChangePasswordPage } from '../pages/ChangePasswordPage'
import { LoginPage } from '../pages/LoginPage'
import { MemoriesPage } from '../pages/MemoriesPage'
import { MoodPage } from '../pages/MoodPage'
import { SettingsPage } from '../pages/SettingsPage'
import { NotificationSettingsPage } from '../pages/NotificationSettingsPage'

const ChatPage = lazy(async () => {
  const m = await import('../pages/ChatPage')
  return { default: m.ChatPage }
})

const RitualPage = lazy(async () => {
  const m = await import('../pages/RitualPage')
  return { default: m.RitualPage }
})

const PinnedMomentsPage = lazy(async () => {
  const m = await import('../pages/PinnedMomentsPage')
  return { default: m.PinnedMomentsPage }
})

const LoungePage = lazy(async () => {
  const m = await import('../pages/LoungePage')
  return { default: m.LoungePage }
})

const TimeCapsulesPage = lazy(async () => {
  const m = await import('../pages/TimeCapsulesPage')
  return { default: m.TimeCapsulesPage }
})

const WatchSpacePage = lazy(async () => {
  const m = await import('../pages/WatchSpacePage')
  return { default: m.WatchSpacePage }
})

function LoungeShell() {
  return (
    <Suspense fallback={<ChatRouteFallback />}>
      <Outlet />
    </Suspense>
  )
}

function ChatRouteFallback() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-stack-md border-[3px] border-nje-border bg-nje-surface px-gutter py-stack-lg shadow-[var(--shadow-nje-flat-sm)]">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-nje-whisper">Chat</p>
      <p className="text-sm font-semibold text-nje-muted">Loading quiet room…</p>
    </div>
  )
}

export function AppRoutes() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <AuthLoadingScreen message="Restoring session…" />
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<NotificationProvider><MobileAppShell /></NotificationProvider>}>
          <Route index element={<Navigate to="/chat" replace />} />
          <Route
            path="chat"
            element={
              <ChatRoomProvider>
                <Suspense fallback={<ChatRouteFallback />}>
                  <ChatPage />
                </Suspense>
              </ChatRoomProvider>
            }
          />
          <Route
            path="memories"
            element={
              <ChatRoomProvider>
                <MemoriesPage />
              </ChatRoomProvider>
            }
          />
          <Route
            path="moments"
            element={
              <ChatRoomProvider>
                <Suspense fallback={<ChatRouteFallback />}>
                  <PinnedMomentsPage />
                </Suspense>
              </ChatRoomProvider>
            }
          />
          <Route path="mood" element={<MoodPage />} />
          <Route
            path="lounge"
            element={
              <ChatRoomProvider>
                <LoungeShell />
              </ChatRoomProvider>
            }
          >
            <Route index element={<LoungePage />} />
            <Route path="capsules" element={<TimeCapsulesPage />} />
            <Route path="watch" element={<WatchSpacePage />} />
          </Route>
          <Route
            path="ritual"
            element={
              <ChatRoomProvider>
                <Suspense fallback={<ChatRouteFallback />}>
                  <RitualPage />
                </Suspense>
              </ChatRoomProvider>
            }
          />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/notifications" element={<NotificationSettingsPage />} />
          <Route path="settings/password" element={<ChangePasswordPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  )
}
