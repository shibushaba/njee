import { useCallback, useRef, useState } from 'react'
import type { NotificationKind } from '../types/notification'

export type ToastItem = {
  id: string
  title: string
  body: string
  kind: NotificationKind
  url: string
}

const TOAST_TTL_MS = 5200
const MAX_TOASTS = 3

export function useToastStack() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, number>>(new Map())

  const dismiss = useCallback((id: string) => {
    const t = timersRef.current.get(id)
    if (t != null) {
      window.clearTimeout(t)
      timersRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const push = useCallback(
    (item: ToastItem) => {
      setToasts((prev) => {
        const without = prev.filter((x) => x.id !== item.id)
        return [item, ...without].slice(0, MAX_TOASTS)
      })

      const existing = timersRef.current.get(item.id)
      if (existing != null) window.clearTimeout(existing)

      const timer = window.setTimeout(() => {
        timersRef.current.delete(item.id)
        setToasts((prev) => prev.filter((x) => x.id !== item.id))
      }, TOAST_TTL_MS)
      timersRef.current.set(item.id, timer)
    },
    [],
  )

  return { toasts, push, dismiss }
}
