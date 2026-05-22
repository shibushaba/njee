/** Local calendar day key for grouping. */
export function chatMessageDayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/**
 * Centered thread stamp (e.g. `YESTERDAY 4:16 PM`) — uppercase, muted, local timezone.
 */
export function formatChatDateDividerLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.round((startOfLocalDay(now) - startOfLocalDay(d)) / 86400000)

  const timePart = d
    .toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })
    .toUpperCase()

  let dayPart: string
  if (diffDays === 0) dayPart = 'TODAY'
  else if (diffDays === 1) dayPart = 'YESTERDAY'
  else if (diffDays < 7) {
    dayPart = d.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase()
  } else if (d.getFullYear() === now.getFullYear()) {
    dayPart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase().replace(',', '')
  } else {
    dayPart = d
      .toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      .toUpperCase()
      .replace(/,/g, '')
  }

  return `${dayPart} ${timePart}`.replace(/\s+/g, ' ').trim()
}
