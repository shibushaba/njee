import { useEffect, useState } from 'react'
import { createSignedMediaUrl } from '../services/media.service'

export function useSignedMediaUrl(path: string | null | undefined, enabled: boolean) {
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
    setLoading(true)
    setError(null)

    void createSignedMediaUrl(path).then((res) => {
      if (cancelled) return
      setUrl(res.url)
      setError(res.error)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [path, enabled])

  return { url, loading, error }
}
