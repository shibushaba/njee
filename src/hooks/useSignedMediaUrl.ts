import { useEffect, useState } from 'react'
import { createSignedMediaUrl } from '../services/media.service'

export function useSignedMediaUrl(
  path: string | null | undefined,
  enabled: boolean,
  mediaKind: 'image' | 'video' = 'image',
) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!path || !enabled) {
      setUrl(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    let revoke: (() => void) | undefined
    setLoading(true)
    setError(null)

    void createSignedMediaUrl(path, { mediaKind, fullMedia: false }).then((res) => {
      if (cancelled) {
        res.revoke?.()
        return
      }
      revoke = res.revoke
      setUrl(res.url)
      setError(res.error)
      setLoading(false)
    })

    return () => {
      cancelled = true
      revoke?.()
    }
  }, [path, enabled, mediaKind])

  return { url, loading, error }
}
