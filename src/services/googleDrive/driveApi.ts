const DRIVE_FILES_BASE = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3/files'

export type DriveApiFile = {
  id: string
  name: string
  mimeType?: string
  size?: string
  webViewLink?: string
  thumbnailLink?: string
  parents?: string[]
}

function sharedDriveQuery(): string {
  return 'supportsAllDrives=true&includeItemsFromAllDrives=true'
}

export async function driveListChildren(
  accessToken: string,
  parentFolderId: string,
  pageSize = 50,
): Promise<{ files: DriveApiFile[]; error: string | null }> {
  const q = encodeURIComponent(`'${parentFolderId}' in parents and trashed = false`)
  const url = `${DRIVE_FILES_BASE}?q=${q}&pageSize=${pageSize}&fields=files(id,name,mimeType,size,parents)&orderBy=folder,name&${sharedDriveQuery()}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) {
    return { files: [], error: await readDriveError(res) }
  }
  const data = (await res.json()) as { files?: DriveApiFile[] }
  return { files: data.files ?? [], error: null }
}

export async function driveCreateFolder(
  accessToken: string,
  name: string,
  parentId: string,
): Promise<{ file: DriveApiFile | null; error: string | null }> {
  const meta = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId],
  }
  const url = `${DRIVE_FILES_BASE}?fields=id,name,mimeType,parents&${sharedDriveQuery()}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(meta),
  })
  if (!res.ok) {
    return { file: null, error: await readDriveError(res) }
  }
  const file = (await res.json()) as DriveApiFile
  return { file, error: null }
}

/** Find first immediate child folder by exact name, or null. */
export async function driveFindChildFolder(
  accessToken: string,
  parentId: string,
  folderName: string,
): Promise<{ id: string | null; error: string | null }> {
  const escaped = folderName.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  const q = encodeURIComponent(
    `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${escaped}' and trashed = false`,
  )
  const url = `${DRIVE_FILES_BASE}?q=${q}&pageSize=5&fields=files(id,name)&${sharedDriveQuery()}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) {
    return { id: null, error: await readDriveError(res) }
  }
  const data = (await res.json()) as { files?: { id: string }[] }
  const id = data.files?.[0]?.id ?? null
  return { id, error: null }
}

/** Anyone with the link can view (no Google sign-in for your partner in the browser). */
export async function driveAddAnyoneReaderPermission(
  accessToken: string,
  fileId: string,
): Promise<{ error: string | null }> {
  const url = `${DRIVE_FILES_BASE}/${encodeURIComponent(fileId)}/permissions?${sharedDriveQuery()}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  })
  if (!res.ok) {
    return { error: await readDriveError(res) }
  }
  return { error: null }
}

export async function driveDeleteFile(
  accessToken: string,
  fileId: string,
): Promise<{ error: string | null }> {
  const url = `${DRIVE_FILES_BASE}/${encodeURIComponent(fileId)}?${sharedDriveQuery()}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok && res.status !== 404) {
    return { error: await readDriveError(res) }
  }
  return { error: null }
}

export type MultipartUploadProgress = (loaded: number, total: number) => void

/**
 * Multipart upload (metadata + media) with XMLHttpRequest for progress events.
 * @see https://developers.google.com/drive/api/guides/manage-uploads
 */
export function driveUploadMultipart(
  accessToken: string,
  file: File,
  parentFolderId: string,
  onProgress?: MultipartUploadProgress,
): Promise<{ file: DriveApiFile | null; error: string | null }> {
  const boundary = `nje_boundary_${crypto.randomUUID()}`
  const delimiter = `\r\n--${boundary}\r\n`
  const closeDelimiter = `\r\n--${boundary}--`

  const metadata = {
    name: file.name,
    parents: [parentFolderId],
    mimeType: file.type || 'application/octet-stream',
  }

  const metadataPart =
    `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`

  const reader = new FileReader()
  const fileBlobPromise = new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsArrayBuffer(file)
  })

  return fileBlobPromise.then(
    (buffer) =>
      new Promise((resolve) => {
        const filePartHeader = `${delimiter}Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`
        const metaBytes = new TextEncoder().encode(metadataPart + filePartHeader)
        const endBytes = new TextEncoder().encode(closeDelimiter)
        const body = concatUint8Arrays(metaBytes, new Uint8Array(buffer), endBytes)

        const url = `${DRIVE_UPLOAD_BASE}?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,thumbnailLink&${sharedDriveQuery()}`
        const xhr = new XMLHttpRequest()
        xhr.open('POST', url)
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
        xhr.setRequestHeader('Content-Type', `multipart/related; boundary=${boundary}`)

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) onProgress?.(ev.loaded, ev.total)
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const parsed = JSON.parse(xhr.responseText) as DriveApiFile
              resolve({ file: parsed, error: null })
            } catch {
              resolve({ file: null, error: 'Invalid response from Drive.' })
            }
          } else {
            resolve({ file: null, error: xhr.responseText || `Upload failed (${xhr.status})` })
          }
        }
        const arrayBuffer = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer
        xhr.send(arrayBuffer)
      }),
  )
}

function concatUint8Arrays(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.byteLength, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const p of parts) {
    out.set(p, offset)
    offset += p.byteLength
  }
  return out
}

async function readDriveError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: { message?: string } }
    return j.error?.message ?? `Drive error (${res.status})`
  } catch {
    return `Drive error (${res.status})`
  }
}

export async function driveGetFileMetadata(
  accessToken: string,
  fileId: string,
): Promise<{ file: DriveApiFile | null; error: string | null }> {
  const url = `${DRIVE_FILES_BASE}/${encodeURIComponent(fileId)}?fields=id,name,mimeType,thumbnailLink,webViewLink&${sharedDriveQuery()}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) {
    return { file: null, error: await readDriveError(res) }
  }
  const file = (await res.json()) as DriveApiFile
  return { file, error: null }
}

/** Download file bytes (alt=media) and expose as an object URL (caller may revoke). */
export async function fetchDriveFileBlobObjectUrl(
  accessToken: string,
  fileId: string,
): Promise<{ objectUrl: string | null; revoke: () => void; error: string | null }> {
  const noop = () => {}
  const mediaUrl = `${DRIVE_FILES_BASE}/${encodeURIComponent(fileId)}?alt=media&${sharedDriveQuery()}`
  const res = await fetch(mediaUrl, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) {
    return { objectUrl: null, revoke: noop, error: await readDriveError(res) }
  }
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  return {
    objectUrl,
    revoke: () => {
      try {
        URL.revokeObjectURL(objectUrl)
      } catch {
        /* noop */
      }
    },
    error: null,
  }
}
