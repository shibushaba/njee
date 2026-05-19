import { useCallback, useState } from 'react'
import { uploadChatMedia } from '../services/media.service'

/**
 * Uploads into the private `media` bucket using the chat thread folder prefix.
 * Progress is best-effort (Storage client does not expose byte-level progress).
 */
export function useMediaUpload(threadFolder: string | null) {
  const [progress, setProgress] = useState<number | null>(null)

  const uploadFile = useCallback(
    async (file: File, onUploadProgress?: (pct: number) => void) => {
      if (!threadFolder) {
        return { path: null as string | null, error: 'Chat is not ready.' }
      }
      setProgress(0)
      const res = await uploadChatMedia(threadFolder, file, (p) => {
        setProgress(p)
        onUploadProgress?.(p)
      })
      setProgress(null)
      return res
    },
    [threadFolder],
  )

  return { uploadFile, progress }
}
