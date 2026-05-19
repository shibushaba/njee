export type FullscreenMediaPayload =
  | { kind: 'image'; url: string; messageId: string; caption?: string }
  | { kind: 'video'; url: string; messageId: string; caption?: string }
