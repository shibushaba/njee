import { useCallback, useRef } from 'react'

type UseLongPressOptions = {
  /** Default ~ half second */
  ms?: number
  moveTolerance?: number
}

/**
 * Pointer long-press (mobile press-and-hold). Cancels on move, release, or leave.
 * Suppresses the following click so underlying buttons do not activate after the menu.
 */
export function useLongPress(onLongPress: (e: PointerEvent) => void, options?: UseLongPressOptions) {
  const ms = options?.ms ?? 560
  const tol = options?.moveTolerance ?? 14
  const timer = useRef(0)
  const start = useRef({ x: 0, y: 0 })
  const longPressHappened = useRef(false)

  const clearTimer = useCallback(() => {
    if (timer.current) {
      window.clearTimeout(timer.current)
      timer.current = 0
    }
  }, [])

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return
      longPressHappened.current = false
      start.current = { x: e.clientX, y: e.clientY }
      clearTimer()
      timer.current = window.setTimeout(() => {
        timer.current = 0
        longPressHappened.current = true
        onLongPress(e.nativeEvent)
      }, ms)
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!timer.current) return
      const dx = Math.abs(e.clientX - start.current.x)
      const dy = Math.abs(e.clientY - start.current.y)
      if (dx > tol || dy > tol) clearTimer()
    },
    onPointerUp: clearTimer,
    onPointerLeave: clearTimer,
    onPointerCancel: clearTimer,
    onClickCapture: (e: React.MouseEvent) => {
      if (longPressHappened.current) {
        e.preventDefault()
        e.stopPropagation()
        longPressHappened.current = false
      }
    },
  }

  return handlers
}
