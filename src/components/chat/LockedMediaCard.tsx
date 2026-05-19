import { motion } from 'framer-motion'
import { useSignedMediaUrl } from '../../hooks/useSignedMediaUrl'
import { cn } from '../../lib/cn'
import { isGdriveMediaRef } from '../../utils/gdriveMediaUrl'
import { MediaLockOverlay } from './MediaLockOverlay'

type LockedMediaCardProps = {
  /** Storage path in the media bucket (same as message.media_url). */
  storagePath: string | null | undefined
  kind: 'image' | 'video'
  className?: string
}

/**
 * Locked limited media: blurred preview + calm lock overlay (no full reopen).
 */
export function LockedMediaCard({ storagePath, kind, className }: LockedMediaCardProps) {
  const { url, loading } = useSignedMediaUrl(storagePath, Boolean(storagePath), kind)

  return (
    <motion.div
      layout
      className={cn(
        'relative w-full max-h-[min(40vh,14rem)] min-h-[6.5rem] overflow-hidden border-[2px] border-nje-border bg-nje-bg shadow-[0_2px_0_0_rgba(90,46,30,0.05)] sm:max-h-[min(38vh,15rem)]',
        className,
      )}
      role="img"
      aria-label="Media locked after view limit"
    >
      {url && kind === 'image' ? (
        <img
          src={url}
          alt=""
          className="h-full w-full scale-110 object-cover opacity-[0.42] blur-2xl"
          draggable={false}
        />
      ) : null}
      {url && kind === 'video' && isGdriveMediaRef(storagePath) ? (
        <img
          src={url}
          alt=""
          className="h-full w-full scale-110 object-cover opacity-[0.38] blur-2xl"
          draggable={false}
        />
      ) : null}
      {url && kind === 'video' && !isGdriveMediaRef(storagePath) ? (
        <video
          src={url}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full scale-110 object-cover opacity-[0.38] blur-2xl"
          aria-hidden
        />
      ) : null}

      {!url && loading ? (
        <div className="absolute inset-0 animate-pulse bg-nje-surface/80" aria-hidden />
      ) : null}

      {!url && !loading ? (
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: 'radial-gradient(circle at 30% 20%, rgba(245,217,166,0.45) 0%, transparent 60%)',
          }}
          aria-hidden
        />
      ) : null}

      <MediaLockOverlay />
    </motion.div>
  )
}
