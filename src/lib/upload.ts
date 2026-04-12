import * as FileSystem from 'expo-file-system/legacy'
import * as SecureStore from 'expo-secure-store'
import { getCookie } from '@better-auth/expo/client'
import type { CheckIn } from '../types'

const PHOTOS_DIR = `${FileSystem.documentDirectory}checkin-photos/`
// Key used by @better-auth/expo to store session cookies (storagePrefix + '_cookie')
const SESSION_COOKIE_KEY = 'tplpassport_cookie'
const UPLOAD_URL = 'https://auth.librarypassport.ca/api/upload/photo?ext=jpg'

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

// Upload a photo to R2 via our server using the BetterAuth session cookie.
// Uses FileSystem.uploadAsync for a native binary upload — no base64 encoding.
export async function uploadPhotoToR2(localUri: string): Promise<string> {
  const stored = await SecureStore.getItemAsync(SESSION_COOKIE_KEY)
  const cookie = getCookie(stored ?? '{}')
  if (!cookie) throw new Error('No active session')

  const result = await FileSystem.uploadAsync(UPLOAD_URL, localUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { cookie, 'content-type': 'image/jpeg' },
  })

  if (result.status !== 200 && result.status !== 201) {
    throw new Error(`Upload failed: ${result.status} ${result.body}`)
  }

  const { publicUrl } = JSON.parse(result.body) as { publicUrl: string }
  return publicUrl
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
