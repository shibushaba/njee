import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react'
import { NjeToastStack } from '../components/notifications/NjeToastStack'
import { useNotifications } from '../hooks/useNotifications'
import { useToastStack } from '../hooks/useToastStack'
import { registerServiceWorkerForPush } from '../services/pushSubscription.service'
import { notificationUrlForKind } from '../utils/notificationDelivery'
import { isWebPushConfigured } from '../utils/webPush'

type NotificationHubContextValue = ReturnType<typeof useNotifications> & {
  testNotificationDelivery: () => void
}

const NotificationHubContext = createContext<NotificationHubContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { toasts, push, dismiss } = useToastStack()

  const value = useNotifications({
    onNewNotification: (row) => {
      push({
        id: row.id,
        title: row.title,
        body: row.body,
        kind: row.kind,
        url: notificationUrlForKind(row.kind),
      })
    },
  })

  useEffect(() => {
    if (!value.userId) return
    if (isWebPushConfigured()) {
      void registerServiceWorkerForPush()
    }
  }, [value.userId])

  const testNotificationDelivery = useCallback(() => {
    value.testNotificationDelivery((row) => {
      push({
        id: row.id,
        title: row.title,
        body: row.body,
        kind: row.kind,
        url: notificationUrlForKind(row.kind),
      })
    })
  }, [push, value])

  const hubValue: NotificationHubContextValue = {
    ...value,
    testNotificationDelivery,
  }

  return (
    <NotificationHubContext.Provider value={hubValue}>
      {children}
      <NjeToastStack toasts={toasts} onDismiss={dismiss} />
    </NotificationHubContext.Provider>
  )
}

export function useNotificationHub() {
  const ctx = useContext(NotificationHubContext)
  if (!ctx) {
    throw new Error('useNotificationHub must be used within NotificationProvider')
  }
  return ctx
}
