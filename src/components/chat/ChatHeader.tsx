import { cn } from '../../lib/cn'

type ChatHeaderProps = {
  peerUsername: string | null
  className?: string
}

export function ChatHeader({ peerUsername, className }: ChatHeaderProps) {
  return (
    <header
      className={cn(
        'shrink-0 border-b-[2px] border-nje-border bg-nje-surface px-3 py-2 shadow-[0_2px_0_0_rgba(90,46,30,0.05)] sm:px-3.5',
        className,
      )}
    >
      <h1 className="min-w-0 truncate text-base font-bold leading-tight tracking-tight text-nje-border sm:text-lg">
        {peerUsername ? peerUsername : 'Chat'}
      </h1>
    </header>
  )
}
