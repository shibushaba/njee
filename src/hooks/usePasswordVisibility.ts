import { useCallback, useState } from 'react'

export function usePasswordVisibility(initial = false) {
  const [visible, setVisible] = useState(initial)
  const toggle = useCallback(() => setVisible((v) => !v), [])
  return { visible, toggle, setVisible }
}
