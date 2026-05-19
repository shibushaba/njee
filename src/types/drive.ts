export type DriveCategory = 'photos' | 'videos' | 'documents' | 'voice_notes' | 'random'

export type DriveFileRow = {
  id: string
  google_file_id: string
  google_drive_id: string | null
  name: string
  mime_type: string
  size_bytes: number | null
  category: DriveCategory
  web_view_link: string | null
  thumbnail_link: string | null
  uploaded_by: string
  participant_one: string
  participant_two: string
  created_at: string
}

export const DRIVE_CATEGORY_LABELS: Record<DriveCategory, string> = {
  photos: 'Photos',
  videos: 'Videos',
  documents: 'Documents',
  voice_notes: 'Voice notes',
  random: 'Random',
}

export const DRIVE_FOLDER_NAMES: Record<DriveCategory, string> = {
  photos: 'Photos',
  videos: 'Videos',
  documents: 'Documents',
  voice_notes: 'Voice Notes',
  random: 'Random',
}
