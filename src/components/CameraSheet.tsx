import Ionicons from '@expo/vector-icons/Ionicons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import * as MediaLibrary from 'expo-media-library'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../hooks/useTheme'

interface Props {
  visible: boolean
  onCapture: (uri: string) => void
  onClose: () => void
}

export function CameraSheet({ visible, onCapture, onClose }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [taking, setTaking] = useState(false)
  const [libraryThumb, setLibraryThumb] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    ;(async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== 'granted') return
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 1,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      })
      if (!assets[0]) return
      const info = await MediaLibrary.getAssetInfoAsync(assets[0])
      if (info.localUri) setLibraryThumb(info.localUri)
    })()
  }, [visible])

  // Open library picker for the corner button
  async function openLibraryPicker() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 1,
    })
    if (!result.canceled) {
      onCapture(result.assets[0].uri)
      onClose()
    }
  }

  async function takePhoto() {
    if (!cameraRef.current || taking) return
    setTaking(true)
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 })
      if (photo) {
        onCapture(photo.uri)
        onClose()
      }
    } finally {
      setTaking(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      {permission == null ? (
        <View style={[styles.center, { backgroundColor: '#000' }]}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : !permission.granted ? (
        <View style={[styles.center, { backgroundColor: '#000', gap: 16 }]}>
          <Text style={styles.permText}>Camera access is required to take a photo.</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.permBtnText, { color: 'rgba(255,255,255,0.5)' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.container}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

          {/* Top bar */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Bottom controls */}
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
            {/* Library picker — bottom left */}
            <TouchableOpacity onPress={openLibraryPicker} style={styles.libraryBtn} hitSlop={8}>
              {libraryThumb ? (
                <Image source={{ uri: libraryThumb }} style={styles.libraryThumb} />
              ) : (
                <View style={styles.libraryPlaceholder}>
                  <Ionicons name="image-outline" size={22} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {/* Shutter — center */}
            <TouchableOpacity onPress={takePhoto} disabled={taking} style={styles.shutter}>
              {taking
                ? <ActivityIndicator color="#fff" />
                : <View style={styles.shutterInner} />
              }
            </TouchableOpacity>

            {/* Spacer to keep shutter centered */}
            <View style={styles.libraryBtn} />
          </View>
        </View>
      )}
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  libraryBtn: {
    width: 56,
    height: 56,
  },
  libraryThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  libraryPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  permText: { color: '#fff', fontSize: 16, textAlign: 'center', lineHeight: 22 },
  permBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  permBtnText: { color: '#000', fontSize: 15, fontWeight: '600' },
})
