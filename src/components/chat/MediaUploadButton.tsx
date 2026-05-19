import { useId, useRef } from 'react'
import { ImagePlus } from 'lucide-react'
import { cn } from '../../lib/cn'

type MediaUploadButtonProps = {
  disabled: boolean
  onPick: (file: File) => void
  className?: string
}

export function MediaUploadButton({ disabled, onPick, className }: MediaUploadButtonProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={cn('shrink-0', className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onPick(f)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex size-10 items-center justify-center border-[2px] border-nje-border bg-nje-bg text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.05)] transition-[transform,box-shadow] duration-150',
          'hover:shadow-[0_3px_0_0_rgba(90,46,30,0.07)] disabled:cursor-not-allowed disabled:opacity-45 motion-safe:active:translate-y-px',
        )}
        aria-label="Add photo or video"
      >
        <ImagePlus className="size-[1.1rem]" strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  )
}
