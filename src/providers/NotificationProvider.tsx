import { createContext, useContext, type ReactNode } from 'react'
import { useNotifications } from '../hooks/useNotifications'

type NotificationHubContextValue = ReturnType<typeof useNotifications>

const NotificationHubContext = createContext<NotificationHubContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const value = useNotifications()
  return <NotificationHubContext.Provider value={value}>{children}</NotificationHubContext.Provider>
}

export function useNotificationHub() {
  const ctx = useContext(NotificationHubContext)
  if (!ctx) {
    throw new Error('useNotificationHub must be used within NotificationProvider')
  }
  return ctx
}
