import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useMemo, useState, useEffect } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { BottomNav } from '../components/navigation/BottomNav'
import { NotificationBadge } from '../components/notifications/NotificationBadge'
import { NotificationCenter } from '../components/notifications/NotificationCenter'
import { MessagingChromeContext } from '../context/messaging-chrome-context'
import { useNotificationHub } from '../providers/NotificationProvider'
import { cn } from '../lib/cn'

export function MobileAppShell() {
  const outlet = useOutlet()
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const [composerFocused, setComposerFocused] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const {
    items,
    unreadCount,
    loadingInbox,
    markRead,
    markAllRead,
  } = useNotificationHub()
  const isChatRoute = location.pathname === '/chat'
  const messagingChrome = useMemo(
    () => ({
      composerFocused,
      setComposerFocused,
      chatInlineNotifications: isChatRoute
        ? { open: () => setNotifyOpen(true), unreadCount: unreadCount }
        : undefined,
    }),
    [composerFocused, isChatRoute, unreadCount],
  )
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
      <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-transparent">
        {!isChatRoute ? (
          <div className="pointer-events-none fixed inset-x-0 top-0 z-[120] flex justify-center px-gutter pt-[max(env(safe-area-inset-top),0.35rem)]">
            <div className="pointer-events-auto flex w-full max-w-lg justify-end sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
              <button
                type="button"
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                onClick={() => setNotifyOpen(true)}
                className="relative flex h-10 w-10 items-center justify-center border-[2px] border-nje-border bg-nje-surface shadow-[0_2px_0_0_rgba(90,46,30,0.08)] transition-shadow hover:shadow-[0_3px_0_0_rgba(90,46,30,0.1)] motion-safe:active:translate-y-px"
              >
                <Bell className="h-[1.15rem] w-[1.15rem] text-nje-border" strokeWidth={2.25} />
                <NotificationBadge count={unreadCount} />
              </button>
            </div>
          </div>
        ) : null}
        <NotificationCenter
          open={notifyOpen}
          onClose={() => setNotifyOpen(false)}
          items={items}
          loading={loadingInbox}
          onMarkRead={async (id) => {
            await markRead(id)
          }}
          onMarkAllRead={async () => {
            await markAllRead()
          }}
        />
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
                ? cn(
                    'flex min-h-0 flex-1 flex-col px-gutter sm:px-gutter-sm md:px-gutter-md lg:px-gutter-lg',
                    isChatRoute ? 'pt-[max(env(safe-area-inset-top),0.35rem)] sm:pt-1' : 'pt-11 sm:pt-12',
                  )
                : 'px-gutter pb-gutter-md pt-11 sm:px-gutter-sm sm:pb-gutter-lg sm:pt-12 md:px-gutter-md lg:px-gutter-lg',
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
