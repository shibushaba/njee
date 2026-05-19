import {
  driveCreateFolder,
  driveFindChildFolder,
} from '../services/googleDrive/driveApi'
import type { DriveCategory } from '../types/drive'
import { DRIVE_FOLDER_NAMES } from '../types/drive'

export async function ensureDriveVaultFolders(
  accessToken: string,
  rootFolderId: string,
): Promise<{ map: Record<DriveCategory, string>; error: string | null }> {
  const categories = Object.keys(DRIVE_FOLDER_NAMES) as DriveCategory[]
  const map = {} as Record<DriveCategory, string>

  for (const cat of categories) {
    const name = DRIVE_FOLDER_NAMES[cat]
    const found = await driveFindChildFolder(accessToken, rootFolderId, name)
    if (found.error) {
      return { map, error: found.error }
    }
    if (found.id) {
      map[cat] = found.id
      continue
    }
    const created = await driveCreateFolder(accessToken, name, rootFolderId)
    if (created.error || !created.file?.id) {
      return { map, error: created.error ?? 'Could not create vault folder.' }
    }
    map[cat] = created.file.id
  }

  return { map, error: null }
}
