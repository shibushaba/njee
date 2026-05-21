import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

const PHRASE = 'nje nje nje nje'

type TypingSplashAnimationProps = {
  className?: string
}

/** Soft looping typewriter for the boot splash — calm, not frantic. */
export function TypingSplashAnimation({ className }: TypingSplashAnimationProps) {
  const reduceMotion = useReducedMotion()
  const [count, setCount] = useState(0)
  const [cursorOn, setCursorOn] = useState(true)

  useEffect(() => {
    if (reduceMotion) {
      setCount(PHRASE.length)
      return
    }
    let cancelled = false
    let timeoutId = 0

    const typeNext = (i: number) => {
      if (cancelled) return
      if (i <= PHRASE.length) {
        setCount(i)
        const delay = i === 0 ? 340 : 108
        timeoutId = window.setTimeout(() => typeNext(i + 1), delay)
      } else {
        timeoutId = window.setTimeout(() => typeNext(0), 900)
      }
    }

    typeNext(0)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [reduceMotion])

  useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => setCursorOn((v) => !v), 480)
    return () => window.clearInterval(id)
  }, [reduceMotion])

  const visible = reduceMotion ? PHRASE : PHRASE.slice(0, count)

  return (
    <div className={className}>
      <p
        className="text-center font-bold leading-snug tracking-[0.04em] text-nje-border"
        style={{ fontSize: 'clamp(1.4rem, 6.5vw, 2.15rem)' }}
      >
        <span className="whitespace-pre-wrap">{visible}</span>
        {!reduceMotion ? (
          <motion.span
            aria-hidden
            className="ml-0.5 inline-block w-[0.45em] translate-y-px text-nje-muted"
            animate={{ opacity: cursorOn ? 1 : 0.12 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            |
          </motion.span>
        ) : null}
      </p>
    </div>
  )
}
