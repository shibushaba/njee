import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { TypingSplashAnimation } from '../pwa/TypingSplashAnimation'

type SplashScreenProps = {
  onFinish: () => void
  className?: string
}

const AUTO_DISMISS_MS = 2800

export function SplashScreen({ onFinish, className }: SplashScreenProps) {
  const [leaving, setLeaving] = useState(false)
  const dismissedRef = useRef(false)

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    setLeaving(true)
    window.setTimeout(onFinish, 360)
  }, [onFinish])

  useEffect(() => {
    const t = window.setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => window.clearTimeout(t)
  }, [dismiss])

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-label="nje is opening"
      className={cn(
        'fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-[#f5d9a6] p-6',
        className,
      )}
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(90, 46, 30, 0.09) 1px, transparent 1px),
            linear-gradient(rgba(90, 46, 30, 0.09) 1px, transparent 1px)
          `,
          backgroundSize: '14px 14px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(242,193,78,0.35),transparent_62%)]"
      />
      <motion.button
        type="button"
        onClick={dismiss}
        className={cn(
          'relative z-[1] w-full max-w-md border-[3px] border-nje-border bg-nje-surface/95 px-6 py-10 text-center shadow-[var(--shadow-nje-flat)] outline-none backdrop-blur-[2px]',
          'transition-shadow duration-200 hover:shadow-[6px_6px_0_0_rgba(90,46,30,0.2)]',
          'focus-visible:ring-2 focus-visible:ring-nje-border focus-visible:ring-offset-2 focus-visible:ring-offset-nje-bg',
        )}
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-nje-muted">Opening</p>
        <div className="mt-6">
          <TypingSplashAnimation />
        </div>
        <p className="mt-8 border-t-[3px] border-nje-border/80 pt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-nje-muted">
          Tap anywhere to enter
        </p>
      </motion.button>
    </motion.div>
  )
}
