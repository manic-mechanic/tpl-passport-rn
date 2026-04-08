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

    if (result.canceled) return

    setUploading(true)
    setError(null)
    try {
      const sourceUri = result.assets[0].uri
      const photoUri = session?.user
        ? await uploadPhotoToR2(sourceUri)
        : await saveLocalPhoto(sourceUri, timestamp)
      setCheckInPhoto(timestamp, photoUri)
    } catch {
      setError('Failed to save photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return { pickPhoto, uploading, error }
}
