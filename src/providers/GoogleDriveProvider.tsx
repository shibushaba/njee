import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  GOOGLE_TOKEN_EXPIRY_STORAGE_KEY,
  GOOGLE_TOKEN_STORAGE_KEY,
  readDriveRootFolderId,
  readGoogleClientId,
} from '../config/googleDrive'
import { loadGooglePlatform } from '../lib/loadGooglePlatform'
import { ensureDriveVaultFolders } from '../utils/driveVaultFolders'
import type { DriveCategory } from '../types/drive'

type GoogleDriveContextValue = {
  platformReady: boolean
  clientIdConfigured: boolean
  rootFolderConfigured: boolean
  connected: boolean
  accessToken: string | null
  tokenExpiresAt: number | null
  foldersReady: boolean
  folderId: (category: DriveCategory) => string | null
  error: string | null
  busy: boolean
  connect: () => void
  disconnect: () => void
  refreshFolders: () => Promise<void>
}

const GoogleDriveContext = createContext<GoogleDriveContextValue | null>(null)

function readStoredToken(): { token: string | null; expiresAt: number | null } {
  if (typeof window === 'undefined') return { token: null, expiresAt: null }
  const token = sessionStorage.getItem(GOOGLE_TOKEN_STORAGE_KEY)
  const expRaw = sessionStorage.getItem(GOOGLE_TOKEN_EXPIRY_STORAGE_KEY)
  const expiresAt = expRaw ? Number(expRaw) : null
  if (!token || expiresAt == null || Number.isNaN(expiresAt)) {
    return { token: null, expiresAt: null }
  }
  if (Date.now() > expiresAt - 60_000) {
    sessionStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY)
    sessionStorage.removeItem(GOOGLE_TOKEN_EXPIRY_STORAGE_KEY)
    return { token: null, expiresAt: null }
  }
  return { token, expiresAt }
}

function persistToken(token: string, expiresInSec?: number) {
  sessionStorage.setItem(GOOGLE_TOKEN_STORAGE_KEY, token)
  const ttlMs = typeof expiresInSec === 'number' && expiresInSec > 0 ? expiresInSec * 1000 : 50 * 60 * 1000
  const expiresAt = Date.now() + ttlMs
  sessionStorage.setItem(GOOGLE_TOKEN_EXPIRY_STORAGE_KEY, String(expiresAt))
}

type GoogleDriveProviderProps = {
  children: ReactNode
}

export function GoogleDriveProvider({ children }: GoogleDriveProviderProps) {
  const clientId = readGoogleClientId()
  const rootFolderId = readDriveRootFolderId()

  const [platformReady, setPlatformReady] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(() => readStoredToken().token)
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(() => readStoredToken().expiresAt)
  const [folderMap, setFolderMap] = useState<Partial<Record<DriveCategory, string>>>({})
  const [foldersReady, setFoldersReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const tokenClientRef = useRef<{
    requestAccessToken: (opts?: { prompt?: '' | 'none' | 'consent' | 'select_account' }) => void
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadGooglePlatform()
      .then(() => {
        if (!cancelled) setPlatformReady(true)
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load Google libraries.')
          setPlatformReady(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const refreshFolders = useCallback(async () => {
    if (!accessToken || !rootFolderId) {
      setFolderMap({})
      setFoldersReady(false)
      return
    }
    setBusy(true)
    setError(null)
    const res = await ensureDriveVaultFolders(accessToken, rootFolderId)
    setBusy(false)
    if (res.error) {
      setError(res.error)
      setFoldersReady(false)
      return
    }
    setFolderMap(res.map)
    setFoldersReady(true)
  }, [accessToken, rootFolderId])

  useEffect(() => {
    if (!accessToken || !rootFolderId) {
      setFolderMap({})
      setFoldersReady(false)
      return
    }
    void refreshFolders()
  }, [accessToken, rootFolderId, refreshFolders])

  const connect = useCallback(() => {
    setError(null)
    if (!clientId) {
      setError('Missing VITE_GOOGLE_CLIENT_ID.')
      return
    }
    if (!platformReady || !window.google?.accounts?.oauth2) {
      setError('Google sign-in is still loading.')
      return
    }

    let tokenClient = tokenClientRef.current
    if (!tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive',
        callback: (resp) => {
          if (resp.error) {
            setError(resp.error)
            return
          }
          if (!resp.access_token) {
            setError('No access token returned.')
            return
          }
          persistToken(resp.access_token, resp.expires_in)
          setAccessToken(resp.access_token)
          setTokenExpiresAt(Date.now() + (resp.expires_in ?? 3600) * 1000)
        },
      })
      tokenClientRef.current = tokenClient
    }

    tokenClient.requestAccessToken({ prompt: 'consent' })
  }, [clientId, platformReady])

  const disconnect = useCallback(() => {
    sessionStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY)
    sessionStorage.removeItem(GOOGLE_TOKEN_EXPIRY_STORAGE_KEY)
    setAccessToken(null)
    setTokenExpiresAt(null)
    setFolderMap({})
    setFoldersReady(false)
    tokenClientRef.current = null
  }, [])

  const folderId = useCallback(
    (category: DriveCategory) => folderMap[category] ?? null,
    [folderMap],
  )

  const value = useMemo<GoogleDriveContextValue>(
    () => ({
      platformReady,
      clientIdConfigured: Boolean(clientId),
      rootFolderConfigured: Boolean(rootFolderId),
      connected: Boolean(accessToken),
      accessToken,
      tokenExpiresAt,
      foldersReady,
      folderId,
      error,
      busy,
      connect,
      disconnect,
      refreshFolders,
    }),
    [
      accessToken,
      busy,
      clientId,
      connect,
      disconnect,
      error,
      folderId,
      foldersReady,
      platformReady,
      refreshFolders,
      rootFolderId,
      tokenExpiresAt,
    ],
  )

  return <GoogleDriveContext.Provider value={value}>{children}</GoogleDriveContext.Provider>
}

export function useGoogleDrive() {
  const ctx = useContext(GoogleDriveContext)
  if (!ctx) {
    throw new Error('useGoogleDrive must be used within GoogleDriveProvider')
  }
  return ctx
}
