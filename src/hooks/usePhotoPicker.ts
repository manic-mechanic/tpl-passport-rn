import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { authClient } from '../lib/auth-client'
import { uploadPhotoToR2, saveLocalPhoto } from '../lib/upload'
import { usePassportStore } from '../stores/passport'

export function usePhotoPicker(timestamp: string) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = authClient.useSession()
  const setCheckInPhoto = usePassportStore(s => s.setCheckInPhoto)

  async function handleResult(result: ImagePicker.ImagePickerResult) {
    if (result.canceled) return

    setUploading(true)
    setError(null)
    try {
      const sourceUri = result.assets[0].uri
      const photoUri = session?.user
        ? await uploadPhotoToR2(sourceUri)
        : await saveLocalPhoto(sourceUri, timestamp)
      setCheckInPhoto(timestamp, photoUri)
      if (session?.user) {
        // Read after update so the check-in has the new photoUri
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

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      setError('Photo library access is required to add a photo.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    await handleResult(result)
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      setError('Camera access is required to take a photo.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    await handleResult(result)
  }

  return { pickPhoto, takePhoto, uploading, error }
}
