import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/cn'

type PasswordFieldProps = {
  id: string
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  disabled?: boolean
  visible: boolean
  onToggleVisible: () => void
}

export function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  visible,
  onToggleVisible,
}: PasswordFieldProps) {
  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <label htmlFor={id} className="text-xs font-bold uppercase tracking-[0.2em] text-nje-muted">
          {label}
        </label>
        <button
          type="button"
          onClick={onToggleVisible}
          disabled={disabled}
          className="border-[3px] border-transparent px-2 py-1 text-xs font-bold uppercase tracking-wide text-nje-muted underline-offset-2 hover:text-nje-border hover:underline disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-1">
            {visible ? (
              <>
                <EyeOff className="size-3.5 shrink-0" aria-hidden />
                Hide
              </>
            ) : (
              <>
                <Eye className="size-3.5 shrink-0" aria-hidden />
                Show
              </>
            )}
          </span>
        </button>
      </div>
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'mt-stack-md w-full border-[3px] border-nje-border bg-nje-bg px-3 py-3 text-base text-nje-border outline-none transition-shadow duration-150',
          'placeholder:text-nje-whisper focus-visible:shadow-[var(--shadow-nje-flat-sm)]',
        )}
        placeholder="••••••"
      />
    </div>
  )
}
