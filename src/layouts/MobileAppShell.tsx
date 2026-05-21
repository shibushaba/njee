import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useMemo, useState, useEffect } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { BottomNav } from '../components/navigation/BottomNav'
import { MessagingChromeContext } from '../context/messaging-chrome-context'
import { cn } from '../lib/cn'

export function MobileAppShell() {
  const outlet = useOutlet()
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const [composerFocused, setComposerFocused] = useState(false)
  const messagingChrome = useMemo(
    () => ({ composerFocused, setComposerFocused }),
    [composerFocused],
  )
  const isChatRoute = location.pathname === '/chat'
  const isMemoriesRoute = location.pathname === '/memories'
  const fullBleedRoute = isChatRoute || isMemoriesRoute
  const hideBottomNav =
    composerFocused && (isChatRoute || isMemoriesRoute)

  useEffect(() => {
    setComposerFocused(false)
  }, [location.pathname])

  const pageTransition = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
      }

  return (
    <MessagingChromeContext.Provider value={messagingChrome}>
      <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-nje-bg">
        <main
          className={cn(
            'min-h-0 flex-1 overflow-x-hidden overscroll-y-contain [scrollbar-gutter:stable]',
            fullBleedRoute ? 'flex flex-col overflow-hidden' : 'overflow-y-auto',
          )}
        >
        <div
          className={cn(
            'mx-auto w-full max-w-lg sm:max-w-2xl md:max-w-3xl lg:max-w-4xl',
            fullBleedRoute
              ? 'flex min-h-0 flex-1 flex-col px-gutter pt-gutter-sm sm:px-gutter-sm sm:pt-gutter-md md:px-gutter-md lg:px-gutter-lg'
              : 'px-gutter pb-gutter-md pt-gutter-sm sm:px-gutter-sm sm:pb-gutter-lg sm:pt-gutter-md md:px-gutter-md lg:px-gutter-lg',
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={pageTransition.initial}
              animate={pageTransition.animate}
              exit={pageTransition.exit}
              transition={{
                duration: reduceMotion ? 0.15 : 0.24,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={cn(fullBleedRoute && 'flex min-h-0 flex-1 flex-col')}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
        {!hideBottomNav ? <BottomNav /> : null}
      </div>
    </MessagingChromeContext.Provider>
  )
}
