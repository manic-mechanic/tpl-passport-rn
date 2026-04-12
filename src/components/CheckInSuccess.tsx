import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '../hooks/useTheme'
import { usePassportStore } from '../stores/passport'
import { usePhotoPicker } from '../hooks/usePhotoPicker'
import { StampShape } from './StampShape'
import { fonts, radius, textSize } from '../theme'
import type { Branch } from '../types'

interface Props {
  branch: Branch
  timestamp: string
  onDone: () => void
}

export function CheckInSuccess({ branch, timestamp, onDone }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const photoUri = usePassportStore(s => s.checkIns.find(c => c.timestamp === timestamp)?.photoUri)
  const { pickPhoto, takePhoto, uploading, error } = usePhotoPicker(timestamp)

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.tplNavy }]}>
        <Text style={[styles.headerTitle, { fontFamily: fonts.display }]}>Check In</Text>
      </View>
      <View style={[styles.successWrap, { paddingTop: 40 }]}>
        <StampShape branchCode={branch.BranchCode} wardNo={branch.WardNo} size={110} />
        <Text style={[styles.successLabel, { color: theme.textPrimary, fontFamily: fonts.display }]}>
          Stamp collected!
        </Text>
        <Text style={[styles.successBranch, { color: theme.textMuted }]}>{branch.BranchName}</Text>
        {branch.District ? (
          <Text style={[styles.successRegion, { color: theme.textMuted }]}>{branch.District}</Text>
        ) : null}

        <View style={styles.photoSection}>
          {photoUri ? (
            <View style={styles.photoAdded}>
              <Image source={{ uri: photoUri }} style={styles.photoThumb} />
              <View style={styles.photoAddedLabel}>
                <Ionicons name="checkmark-circle" size={16} color={theme.tplBlue} />
                <Text style={[styles.photoAddedText, { color: theme.tplBlue }]}>Photo added</Text>
              </View>
            </View>
          ) : (
            <View style={styles.photoBtnRow}>
              <TouchableOpacity
                style={[styles.photoBtn, { borderColor: theme.border }]}
                onPress={takePhoto}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={theme.tplBlue} />
                ) : (
                  <Ionicons name="camera-outline" size={18} color={theme.tplBlue} />
                )}
                <Text style={[styles.photoBtnText, { color: theme.tplBlue }]}>
                  {uploading ? 'Saving…' : 'Take photo'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoBtn, { borderColor: theme.border }]}
                onPress={pickPhoto}
                disabled={uploading}
              >
                <Ionicons name="image-outline" size={18} color={theme.tplBlue} />
                <Text style={[styles.photoBtnText, { color: theme.tplBlue }]}>Choose</Text>
              </TouchableOpacity>
            </View>
          )}
          {error ? (
            <Text style={[styles.photoError, { color: theme.textMuted }]}>{error}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.viewBranchBtn, { backgroundColor: theme.tplNavy }]}
          onPress={() => {
            router.push(`./branch/${branch.BranchCode}` as any)
          }}
        >
          <Text style={styles.viewBranchBtnText}>View branch</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDone}>
          <Text style={[styles.doneLink, { color: theme.tplBlue }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: textSize.xxxl,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: -0.5,
  },
  successWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 8,
  },
  successLabel: { fontSize: textSize.xxl, fontWeight: '700', marginTop: 16 },
  successBranch: { fontSize: textSize.base, fontWeight: '600' },
  successRegion: { fontSize: textSize.md },
  photoSection: {
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    minHeight: 44,
  },
  photoBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  photoBtnText: { fontSize: textSize.md, fontWeight: '600' },
  photoAdded: { alignItems: 'center', gap: 8 },
  photoThumb: {
    width: 120,
    height: 90,
    borderRadius: radius.md,
  },
  photoAddedLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  photoAddedText: { fontSize: textSize.md, fontWeight: '600' },
  photoError: { fontSize: textSize.sm, textAlign: 'center' },
  viewBranchBtn: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radius.md,
    minWidth: 200,
    alignItems: 'center',
  },
  viewBranchBtnText: { color: '#fff', fontSize: textSize.base, fontWeight: '700' },
  doneLink: { fontSize: textSize.md, fontWeight: '600', marginTop: 4 },
})
