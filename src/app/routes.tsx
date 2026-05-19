import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthLoadingScreen } from '../components/auth/AuthLoadingScreen'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { useAuth } from '../hooks/useAuth'
import { MobileAppShell } from '../layouts/MobileAppShell'
import { ChatRoomProvider } from '../providers/ChatRoomProvider'
import { ChangePasswordPage } from '../pages/ChangePasswordPage'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { MemoriesPage } from '../pages/MemoriesPage'
import { MoodPage } from '../pages/MoodPage'
import { NotesPage } from '../pages/NotesPage'
import { SettingsPage } from '../pages/SettingsPage'

const ChatPage = lazy(async () => {
  const m = await import('../pages/ChatPage')
  return { default: m.ChatPage }
})

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
        <Route element={<MobileAppShell />}>
          <Route index element={<HomePage />} />
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
          <Route path="mood" element={<MoodPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/password" element={<ChangePasswordPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
