import type { LucideIcon } from 'lucide-react'
import {
  FileText,
  Home,
  ImageIcon,
  MessageSquare,
  Settings,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

/** Bottom tab bar: five primary destinations (no Mood tab). */
export const TAB_NAV: NavItem[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/memories', label: 'Memories', icon: ImageIcon },
  { to: '/notes', label: 'Notes', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
]
