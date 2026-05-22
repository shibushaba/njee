export type MemoryEchoKind =
  | 'text_thread'
  | 'media_moment'
  | 'pin'
  | 'capsule'
  | 'watch_watched'
  | 'late_night'
  | 'ritual'

export type MemoryEchoItem = {
  id: string
  kind: MemoryEchoKind
  at: string
  title: string
  body: string
  contextLine: string
  navigateTo: string
}

export type ConstellationNode = {
  id: string
  x: number
  y: number
  r: number
  label: string
  kind: MemoryEchoKind
  navigateTo: string
}

export type ConstellationEdge = {
  from: string
  to: string
}
