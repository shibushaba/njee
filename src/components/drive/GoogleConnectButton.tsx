import { Cloud } from 'lucide-react'
import { cn } from '../../lib/cn'

type GoogleConnectButtonProps = {
  connected: boolean
  busy?: boolean
  disabled?: boolean
  onConnect: () => void
  onDisconnect: () => void
  className?: string
}

export function GoogleConnectButton({
  connected,
  busy,
  disabled,
  onConnect,
  onDisconnect,
  className,
}: GoogleConnectButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={() => (connected ? onDisconnect() : onConnect())}
      className={cn(
        'inline-flex items-center gap-2 border-[2px] border-nje-border px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] shadow-[0_2px_0_0_rgba(90,46,30,0.06)] transition-[transform,box-shadow] duration-150',
        connected ? 'bg-nje-pink text-nje-border' : 'bg-nje-surface text-nje-border',
        'disabled:cursor-not-allowed disabled:opacity-55 motion-safe:hover:-translate-y-px motion-safe:hover:shadow-[0_3px_0_0_rgba(90,46,30,0.08)]',
        className,
      )}
    >
      <Cloud className="size-4" strokeWidth={2.5} aria-hidden />
      {connected ? 'Disconnect Google' : 'Connect Google'}
    </button>
  )
}
