import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'

type SplashScreenProps = {
  onFinish: () => void
  className?: string
}

const AUTO_DISMISS_MS = 2200

export function SplashScreen({ onFinish, className }: SplashScreenProps) {
  const [leaving, setLeaving] = useState(false)
  const dismissedRef = useRef(false)

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    setLeaving(true)
    window.setTimeout(onFinish, 320)
  }, [onFinish])

  useEffect(() => {
    const t = window.setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => window.clearTimeout(t)
  }, [dismiss])

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-label="Welcome"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-nje-bg/96 p-4 backdrop-blur-[2px]',
        className,
      )}
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.button
        type="button"
        onClick={dismiss}
        className={cn(
          'w-full max-w-sm border-[3px] border-nje-border bg-nje-surface px-6 py-8 text-left shadow-[var(--shadow-nje-flat)] outline-none',
          'transition-shadow duration-200 hover:shadow-[6px_6px_0_0_rgba(90,46,30,0.22)]',
          'focus-visible:ring-2 focus-visible:ring-nje-border focus-visible:ring-offset-2 focus-visible:ring-offset-nje-bg',
        )}
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-nje-muted">Welcome</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-nje-border sm:text-4xl">nje</h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-nje-border/90 sm:text-base">
          njenjenje
        </p>
        <p className="mt-6 border-t-[3px] border-nje-border pt-4 text-xs font-semibold uppercase tracking-widest text-nje-muted">
          Tap to continue
        </p>
      </motion.button>
    </motion.div>
  )
}
