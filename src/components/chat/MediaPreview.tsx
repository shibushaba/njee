import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { classifyMediaFile } from '../../services/media.service'

type MediaPreviewProps = {
  file: File
  onClear: () => void
  className?: string
}

export function MediaPreview({ file, onClear, className }: MediaPreviewProps) {
  const [src, setSrc] = useState<string | null>(null)
  const kind = classifyMediaFile(file)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  if (!src || !kind) return null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden border-[2px] border-nje-border bg-nje-surface shadow-[0_2px_0_0_rgba(90,46,30,0.05)]',
        className,
      )}
    >
      <button
        type="button"
        onClick={onClear}
        className="absolute right-1.5 top-1.5 z-10 flex size-8 items-center justify-center border-[2px] border-nje-border bg-nje-bg text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.05)] transition-transform duration-150 motion-safe:active:translate-y-px"
        aria-label="Remove attachment"
      >
        <X className="size-3.5" strokeWidth={2.5} aria-hidden />
      </button>
      <div className="max-h-32 w-full overflow-hidden bg-nje-bg sm:max-h-36">
        {kind === 'image' ? (
          <img src={src} alt="" className="mx-auto max-h-32 w-full object-contain sm:max-h-36" />
        ) : kind === 'voice' ? (
          <audio src={src} controls className="mx-auto w-full px-2 py-3" />
        ) : (
          <video src={src} className="mx-auto max-h-32 w-full object-contain sm:max-h-36" muted playsInline />
        )}
      </div>
      <p className="border-t-[2px] border-nje-border px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-nje-muted">
        {kind === 'image' ? 'Image' : kind === 'voice' ? 'Voice' : 'Video'}
      </p>
    </motion.div>
  )
}
