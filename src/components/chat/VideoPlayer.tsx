import { cn } from '../../lib/cn'

type VideoPlayerProps = {
  src: string
  className?: string
  poster?: string
}

export function VideoPlayer({ src, className, poster }: VideoPlayerProps) {
  return (
    <video
      src={src}
      poster={poster}
      controls
      playsInline
      preload="metadata"
      className={cn(
        'w-full max-w-full rounded-none border-[3px] border-nje-border bg-nje-border object-contain shadow-[var(--shadow-nje-flat-sm)]',
        className,
      )}
    />
  )
}
