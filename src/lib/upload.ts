import * as FileSystem from 'expo-file-system/legacy'
import { authClient } from './auth-client'
import type { CheckIn } from '../types'

const PHOTOS_DIR = `${FileSystem.documentDirectory}checkin-photos/`

async function ensurePhotosDir() {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR)
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true })
  }
}

// Save a photo to the app's local document directory (used for anonymous users).
export async function saveLocalPhoto(sourceUri: string, timestamp: string): Promise<string> {
  await ensurePhotosDir()
  const safe = timestamp.replace(/[:.]/g, '-')
  const dest = `${PHOTOS_DIR}${safe}.jpg`
  await FileSystem.copyAsync({ from: sourceUri, to: dest })
  return dest
}

// Upload a photo directly to R2 via our server (which uses the R2 binding).
// Avoids presigned URL signing complexity — auth is handled by authClient.$fetch.
export async function uploadPhotoToR2(localUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  })

  const { data, error } = await (authClient as any).$fetch<{ publicUrl: string }>(
    'https://auth.librarypassport.ca/api/upload/photo?ext=jpg',
    {
      method: 'POST',
      body: JSON.stringify({ data: base64 }),
      headers: { 'Content-Type': 'application/json' },
    }
  )
  if (error || !data?.publicUrl) throw new Error(`Upload failed: ${JSON.stringify(error)}`)

  return data.publicUrl
}

// Migrate any locally-stored photos to R2 after the user signs in.
// Calls onMigrated for each successfully migrated check-in so the store can be updated.
export async function migrateLocalPhotos(
  checkIns: CheckIn[],
  onMigrated: (timestamp: string, newUri: string) => void
): Promise<void> {
  const localOnes = checkIns.filter(c => c.photoUri?.startsWith('file://'))
  for (const ci of localOnes) {
    try {
      const cloudUri = await uploadPhotoToR2(ci.photoUri!)
      await FileSystem.deleteAsync(ci.photoUri!, { idempotent: true })
      onMigrated(ci.timestamp, cloudUri)
    } catch {
      // Best-effort — leave the local file in place if upload fails
    }
  }
}
