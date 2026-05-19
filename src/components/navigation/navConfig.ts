import type { LucideIcon } from 'lucide-react'
import { FileText, ImageIcon, MessageSquare, Settings } from 'lucide-react'

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
  { to: '/notes', label: 'Notes', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
]
