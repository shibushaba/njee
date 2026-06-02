import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, X } from 'lucide-react'
import { useMessagingChrome } from '../../context/messaging-chrome-context'
import { cn } from '../../lib/cn'
import type { MessageRow } from '../../types/message'
import { classifyMediaFile } from '../../services/media.service'
import type { MediaSendViewMode } from '../../utils/mediaViewMode'
import type { ReplyInsertMeta } from '../../utils/messageReply'
import { buildReplyInsertMeta } from '../../utils/messageReply'
import { MediaPreview } from './MediaPreview'
import { MediaUploadButton } from './MediaUploadButton'
import { MediaViewSelector } from './MediaViewSelector'
import { UploadProgress } from './UploadProgress'

type MessageInputProps = {
  /** Chat = text + Supabase media. Memories = Google shelf media. */
  variant?: 'chat' | 'memories'
  surface: 'chat' | 'memories'
  replyTo?: MessageRow | null
  onClearReply?: () => void
  onSend?: (text: string) => Promise<{ error: string | null }>
  onSendMedia?: (
    file: File,
    caption: string,
    opts: { surface: 'chat' | 'memories'; viewMode: MediaSendViewMode; reply?: ReplyInsertMeta | null },
    onUploadProgress?: (pct: number) => void,
  ) => Promise<{ error: string | null }>
  onTypingActivity?: (active: boolean) => void
  disabled: boolean
  sending: boolean
}

export function MessageInput({
  variant = 'chat',
  surface,
  replyTo,
  onClearReply,
  onSend,
  onSendMedia,
  onTypingActivity,
  disabled,
  sending,
}: MessageInputProps) {
  const messagingChrome = useMessagingChrome()
  const isMemories = variant === 'memories'
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const typingActiveRef = useRef(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<MediaSendViewMode>('once')

  const pendingKind = pendingFile ? classifyMediaFile(pendingFile) : null
  const isVoicePending = pendingKind === 'voice'

  useEffect(() => {
    if (disabled && typingActiveRef.current) {
      typingActiveRef.current = false
      onTypingActivity?.(false)
    }
  }, [disabled, onTypingActivity])

  useEffect(() => {
    return () => {
      if (typingActiveRef.current) {
        typingActiveRef.current = false
        onTypingActivity?.(false)
      }
    }
  }, [onTypingActivity])

  function pushTypingFromValue(next: string) {
    const active = next.trim().length > 0
    if (active) {
      typingActiveRef.current = true
      onTypingActivity?.(true)
      return
    }
    if (typingActiveRef.current) {
      typingActiveRef.current = false
      onTypingActivity?.(false)
    }
  }

  function clearPending() {
    setPendingFile(null)
    setViewMode('once')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (pendingFile && onSendMedia) {
      setUploadProgress(0)
      const { error: sendErr } = await onSendMedia(
        pendingFile,
        value,
        {
          surface,
          viewMode: isVoicePending ? 'unlimited' : viewMode,
          reply: replyTo ? buildReplyInsertMeta(replyTo) : null,
        },
        (p) => setUploadProgress(p),
      )
      setUploadProgress(null)
      if (sendErr) {
        setError(sendErr)
        return
      }
      clearPending()
      setValue('')
      typingActiveRef.current = false
      onTypingActivity?.(false)
      return
    }

    if (isMemories) {
      setError('Choose a photo, video, or voice note to send.')
      return
    }

    const trimmed = value.trim()
    if (!trimmed) return

    if (!onSend) {
      setError('Cannot send text here.')
      return
    }

    const { error: sendErr } = await onSend(trimmed)
    if (sendErr) {
      setError(sendErr)
      return
    }
    setValue('')
    typingActiveRef.current = false
    onTypingActivity?.(false)
  }

  const canSendText = value.trim().length > 0
  const canSendMedia = Boolean(pendingFile && onSendMedia)
  const uploading = uploadProgress !== null && uploadProgress < 100
  const submitDisabled =
    disabled ||
    sending ||
    uploading ||
    (pendingFile ? !canSendMedia : isMemories ? true : !onSend || !canSendText)

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="shrink-0 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 sm:px-2.5"
      layout
    >
      <div className="rounded-sm border-[2px] border-nje-border bg-nje-surface/95 px-1.5 py-1.5 shadow-[0_3px_0_0_rgba(90,46,30,0.06)] backdrop-blur-[2px] sm:px-2 sm:py-1.5">
        {replyTo ? (
          <div className="mb-1.5 flex items-start gap-2 border-b-[2px] border-nje-border/50 pb-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-nje-whisper">Replying to</p>
              <p className="truncate text-xs leading-snug text-nje-border">{buildReplyInsertMeta(replyTo).replySnippet}</p>
            </div>
            <button
              type="button"
              onClick={() => onClearReply?.()}
              className="flex size-8 shrink-0 items-center justify-center border-[2px] border-nje-border bg-nje-bg text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.05)]"
              aria-label="Cancel reply"
            >
              <X className="size-3.5" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="mb-1.5 text-xs font-medium text-nje-border" role="alert">
            {error}
          </p>
        ) : null}

        {pendingFile ? (
          <>
            <MediaPreview file={pendingFile} onClear={clearPending} className="mb-1.5" />
            {!isVoicePending && surface === 'chat' ? (
              <MediaViewSelector
                value={viewMode}
                onChange={setViewMode}
                disabled={disabled || sending || uploading}
                className="mb-1"
              />
            ) : null}
            <p className="mb-1.5 text-[0.62rem] leading-snug text-nje-muted">
              {isVoicePending ? (
                <>Voice stays open for <span className="font-semibold text-nje-border/85">24 hours</span>, then leaves storage.</>
              ) : surface === 'memories' ? (
                <>Uploads to Google Drive when connected.</>
              ) : viewMode === 'unlimited' ? (
                <>
                  <span className="font-semibold text-nje-border/85">Keep</span> — reopen until end of day (~24h), then
                  auto-removed.
                </>
              ) : viewMode === 'twice' ? (
                <>
                  <span className="font-semibold text-nje-border/85">Twice</span> — two opens, then removed from storage.
                </>
              ) : (
                <>
                  <span className="font-semibold text-nje-border/85">View once</span> — one open, then removed from
                  storage.
                </>
              )}
            </p>
          </>
        ) : null}

        {uploadProgress !== null && uploadProgress < 100 ? (
          <UploadProgress progress={uploadProgress} className="mb-1.5" />
        ) : null}

        <div className="flex items-end gap-1.5">
          {onSendMedia ? (
            <MediaUploadButton
              disabled={disabled || sending || uploading}
              onPick={(file) => setPendingFile(file)}
            />
          ) : null}

          <label htmlFor="nje-chat-input" className="sr-only">
            {pendingFile ? 'Caption' : 'Message'}
          </label>
          <textarea
            id="nje-chat-input"
            name="message"
            rows={isMemories || pendingFile ? 2 : 1}
            maxLength={4000}
            value={value}
            disabled={disabled || sending}
            onChange={(e) => {
              const next = e.target.value
              setValue(next)
              if (!isMemories) pushTypingFromValue(next)
            }}
            onFocus={() => messagingChrome?.setComposerFocused(true)}
            onBlur={() => {
              messagingChrome?.setComposerFocused(false)
              if (!isMemories) {
                typingActiveRef.current = false
                onTypingActivity?.(false)
              }
            }}
            placeholder={
              pendingFile
                ? 'Optional note…'
                : isMemories
                  ? 'Pick media below, add a note…'
                  : 'Message… or attach media'
            }
            className={cn(
              'min-h-[2.35rem] max-h-28 w-full flex-1 resize-y border-[2px] border-nje-border bg-nje-bg px-2 py-1.5 text-sm leading-snug text-nje-border outline-none transition-shadow duration-150',
              'placeholder:text-nje-whisper focus-visible:shadow-[0_2px_0_0_rgba(90,46,30,0.06)] sm:min-h-[2.5rem]',
            )}
          />
          <button
            type="submit"
            disabled={submitDisabled}
            className={cn(
              'flex size-10 shrink-0 items-center justify-center border-[2px] border-nje-border bg-nje-mint text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.06)] transition-[transform,box-shadow] duration-150',
              'hover:shadow-[0_3px_0_0_rgba(90,46,30,0.08)] disabled:cursor-not-allowed disabled:opacity-55 motion-safe:active:translate-y-px sm:size-11',
            )}
            aria-label={pendingFile ? 'Send media' : 'Send message'}
          >
            <Send className="size-[1.05rem]" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      </div>
    </motion.form>
  )
}
