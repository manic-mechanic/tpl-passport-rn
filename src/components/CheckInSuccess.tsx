import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BADGES, buildBadgeCtx } from '../shared/badges'
import { useTheme } from '../hooks/useTheme'
import { usePhotoPicker } from '../hooks/usePhotoPicker'
import { usePassportStore } from '../stores/passport'
import { fonts, radius, textSize } from '../theme'
import type { Branch } from '../types'
import { CameraSheet } from './CameraSheet'
import { StampShape } from './StampShape'

type Origin = 'explore' | 'passport' | undefined

interface Props {
  branch: Branch
  timestamp: string
  origin?: Origin
  onDone: () => void
}

export function CheckInSuccess({ branch, timestamp, origin, onDone }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const checkIns = usePassportStore(s => s.checkIns)
  const completedChallenges = usePassportStore(s => s.completedChallenges)
  const homeBranch = usePassportStore(s => s.profile.homeBranch)

  const checkIn = checkIns.find(c => c.timestamp === timestamp)
  const photoUri = checkIn?.photoUri
  const noteText = checkIn?.note?.trim()

  const { openCamera, onCameraCapture, onCameraClose, cameraOpen, uploading, error } = usePhotoPicker(timestamp)

  // Badges newly earned by this check-in
  const newBadges = useMemo(() => {
    const prevCheckIns = checkIns.filter(c => c.timestamp !== timestamp)
    const prevVisited = new Set(prevCheckIns.map(c => c.branchCode))
    const ctxBefore = buildBadgeCtx({ checkIns: prevCheckIns, visitedBranchCodes: prevVisited, completedChallenges, homeBranch })
    const ctxAfter = buildBadgeCtx({ checkIns, visitedBranchCodes: new Set(checkIns.map(c => c.branchCode)), completedChallenges, homeBranch })
    return BADGES.filter(b => !b.earned(ctxBefore) && b.earned(ctxAfter))
  }, [checkIns, timestamp, completedChallenges, homeBranch])

  function handleDone() {
    if (origin === 'explore') {
      router.replace('/(tabs)/(explore)' as any)
    } else if (origin === 'passport') {
      router.replace('/(tabs)/(passport)' as any)
    } else {
      router.replace('/(tabs)/(home)' as any)
    }
    onDone()
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.tplNavy }]}>
        <Text style={[styles.headerTitle, { fontFamily: fonts.display }]}>Check In</Text>
      </View>
      <View style={[styles.successWrap, { paddingTop: 40, paddingBottom: insets.bottom + 24 }]}>
        <StampShape branchCode={branch.BranchCode} wardNo={branch.WardNo} size={110} />
        <Text style={[styles.successLabel, { color: theme.textPrimary, fontFamily: fonts.display }]}>
          Stamp collected!
        </Text>
        <Text style={[styles.successBranch, { color: theme.textMuted }]}>{branch.BranchName}</Text>

        {noteText ? (
          <View style={[styles.noteBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.noteText, { color: theme.textPrimary }]}>{noteText}</Text>
          </View>
        ) : null}

        {newBadges.length > 0 && (
          <View style={styles.badgesSection}>
            {newBadges.map(badge => (
              <View key={badge.id} style={[styles.badgeRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="ribbon-outline" size={18} color={theme.tplBlue} />
                <View style={styles.badgeInfo}>
                  <Text style={[styles.badgeEarned, { color: theme.tplBlue }]}>Badge earned!</Text>
                  <Text style={[styles.badgeTitle, { color: theme.textPrimary }]}>{badge.title}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

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
            <TouchableOpacity
              style={[styles.photoBtn, { borderColor: theme.border }]}
              onPress={openCamera}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={theme.tplBlue} />
              ) : (
                <Ionicons name="camera-outline" size={18} color={theme.tplBlue} />
              )}
              <Text style={[styles.photoBtnText, { color: theme.tplBlue }]}>
                {uploading ? 'Saving…' : 'Add Photo'}
              </Text>
            </TouchableOpacity>
          )}
          {error ? (
            <Text style={[styles.photoError, { color: theme.textMuted }]}>{error}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.viewBranchBtn, { backgroundColor: theme.tplNavy }]}
          onPress={() => router.push(`./branch/${branch.BranchCode}` as any)}
        >
          <Text style={styles.viewBranchBtnText}>View branch</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDone}>
          <Text style={[styles.doneLink, { color: theme.tplBlue }]}>Done</Text>
        </TouchableOpacity>
      </View>

      <CameraSheet visible={cameraOpen} onCapture={onCameraCapture} onClose={onCameraClose} />
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
  noteBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    alignSelf: 'stretch',
    marginTop: 4,
  },
  noteText: { fontSize: textSize.md, lineHeight: 20, fontStyle: 'italic' },
  badgesSection: { alignSelf: 'stretch', gap: 8, marginTop: 4 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  badgeInfo: { gap: 1 },
  badgeEarned: { fontSize: textSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  badgeTitle: { fontSize: textSize.md, fontWeight: '600' },
  photoSection: {
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    minHeight: 44,
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
