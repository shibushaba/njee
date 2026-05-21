import { createContext, useContext } from 'react'

export type MessagingChromeContextValue = {
  composerFocused: boolean
  setComposerFocused: (v: boolean) => void
}

export const MessagingChromeContext = createContext<MessagingChromeContextValue | null>(null)

export function useMessagingChrome(): MessagingChromeContextValue | null {
  return useContext(MessagingChromeContext)
}
