/** Short time label for message bubbles (local clock). */
export function formatChatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}
