type HomeSectionTone = 'surface' | 'pink' | 'mint' | 'yellow'

export type HomeSection = {
  to: string
  eyebrow: string
  title: string
  description: string
  tone: HomeSectionTone
}

export const HOME_SECTIONS: HomeSection[] = [
  {
    to: '/chat',
    eyebrow: 'Presence',
    title: 'Chat',
    description: 'Slow, honest conversation with the people who matter.',
    tone: 'mint',
  },
  {
    to: '/memories',
    eyebrow: 'Keep',
    title: 'Memories',
    description: 'Small artifacts from days you do not want to forget.',
    tone: 'yellow',
  },
  {
    to: '/mood',
    eyebrow: 'Check-in',
    title: 'Mood',
    description: 'A gentle read on how you are carrying the week.',
    tone: 'pink',
  },
  {
    to: '/notes',
    eyebrow: 'Scratch',
    title: 'Notes',
    description: 'Lists, fragments, and half-formed ideas in one calm surface.',
    tone: 'surface',
  },
  {
    to: '/settings',
    eyebrow: 'Care',
    title: 'Settings',
    description: 'Quiet controls for how nje fits into your day.',
    tone: 'mint',
  },
]
