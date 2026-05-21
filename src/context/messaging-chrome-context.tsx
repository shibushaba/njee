import { createContext, useContext } from 'react'

/** On `/chat`, the shell hides the floating bell and exposes this for the header row. */
export type ChatInlineNotifications = {
  open: () => void
  unreadCount: number
}

export type MessagingChromeContextValue = {
  composerFocused: boolean
  setComposerFocused: (v: boolean) => void
  chatInlineNotifications?: ChatInlineNotifications
}

export const MessagingChromeContext = createContext<MessagingChromeContextValue | null>(null)

export function useMessagingChrome(): MessagingChromeContextValue | null {
  return useContext(MessagingChromeContext)
}
