import { formatChatDateDividerLabel } from '../../utils/formatChatDateDivider'

type ChatDateDividerProps = {
  /** First message in this calendar-day group (local) — time shown matches this stamp. */
  iso: string
  className?: string
}

export function ChatDateDivider({ iso, className }: ChatDateDividerProps) {
  return (
    <div className={className} role="separator" aria-label={formatChatDateDividerLabel(iso)}>
      <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-nje-muted">
        {formatChatDateDividerLabel(iso)}
      </p>
    </div>
  )
}
