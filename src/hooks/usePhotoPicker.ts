import { useState } from 'react'
import * as ImageManipulator from 'expo-image-manipulator'
import { authClient } from '../lib/auth-client'
import { uploadPhotoToR2, saveLocalPhoto } from '../lib/upload'
import { usePassportStore } from '../stores/passport'

async function resizePhoto(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1280 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  )
  return result.uri
}

export function usePhotoPicker(timestamp: string) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const { data: session } = authClient.useSession()
  const setCheckInPhoto = usePassportStore(s => s.setCheckInPhoto)

  async function handleUri(sourceUri: string) {
    setUploading(true)
    setError(null)
    try {
      const resized = await resizePhoto(sourceUri)
      const photoUri = session?.user
        ? await uploadPhotoToR2(resized)
        : await saveLocalPhoto(resized, timestamp)
      setCheckInPhoto(timestamp, photoUri)
      if (session?.user) {
        const updated = usePassportStore.getState().checkIns.find(c => c.timestamp === timestamp)
        if (updated) {
          import('../lib/sync').then(({ pushCheckIn }) =>
            pushCheckIn(updated).catch(() => {})
          )
        }
      }
    } catch {
      setError('Failed to save photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function openCamera() { setCameraOpen(true) }
  function onCameraCapture(uri: string) { setCameraOpen(false); handleUri(uri) }
  function onCameraClose() { setCameraOpen(false) }

  return { openCamera, onCameraCapture, onCameraClose, cameraOpen, uploading, error }
}
