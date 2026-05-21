import type { LucideIcon } from 'lucide-react'
import { FileText, ImageIcon, MessageSquare, Pin, Settings, Sparkles } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

/** Bottom tab bar (no Mood tab). */
export const TAB_NAV: NavItem[] = [
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/memories', label: 'Memories', icon: ImageIcon },
  { to: '/moments', label: 'Pins', icon: Pin },
  { to: '/lounge', label: 'Lounge', icon: Sparkles },
  { to: '/notes', label: 'Notes', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
]
