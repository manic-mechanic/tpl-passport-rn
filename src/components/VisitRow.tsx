import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '../hooks/useTheme'
import { usePhotoPicker } from '../hooks/usePhotoPicker'
import { radius, textSize } from '../theme'
import type { CheckIn } from '../types'
import { CameraSheet } from './CameraSheet'

function formatVisitDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function VisitRow({
  visit,
  onPhotoTap,
  onEditNote,
}: {
  visit: CheckIn
  onPhotoTap: (uri: string) => void
  onEditNote: (visit: CheckIn) => void
}) {
  const theme = useTheme()
  const { openCamera, onCameraCapture, onCameraClose, cameraOpen, uploading } = usePhotoPicker(visit.timestamp)
  const hasNote = !!visit.note

  return (
    <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
      <View style={styles.left}>
        <Text style={[styles.date, { color: theme.textPrimary }]} numberOfLines={1}>
          {formatVisitDate(visit.timestamp)}
        </Text>
        {hasNote && (
          <Text style={[styles.notePreview, { color: theme.textMuted }]} numberOfLines={1}>
            {visit.note}
          </Text>
        )}
      </View>

      <View style={styles.right}>
        <TouchableOpacity onPress={() => onEditNote(visit)} hitSlop={8}>
          <Ionicons
            name={hasNote ? 'document-text' : 'document-text-outline'}
            size={18}
            color={hasNote ? theme.tplBlue : theme.textMuted}
          />
        </TouchableOpacity>

        {visit.photoUri ? (
          <TouchableOpacity onPress={() => onPhotoTap(visit.photoUri!)} activeOpacity={0.85}>
            <Image source={{ uri: visit.photoUri }} style={styles.photoThumb} resizeMode="cover" />
          </TouchableOpacity>
        ) : uploading ? (
          <ActivityIndicator size="small" color={theme.textMuted} />
        ) : (
          <TouchableOpacity onPress={openCamera} hitSlop={6}>
            <Ionicons name="camera-outline" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <CameraSheet visible={cameraOpen} onCapture={onCameraCapture} onClose={onCameraClose} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: 6,
    gap: 10,
    minHeight: 52,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  date: {
    fontSize: textSize.sm,
    fontWeight: '600',
  },
  notePreview: {
    fontSize: 11,
    lineHeight: 14,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  photoThumb: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
})
