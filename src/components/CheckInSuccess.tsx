import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../hooks/useTheme'
import { StampShape } from './StampShape'
import { fonts, radius, textSize } from '../theme'
import type { Branch } from '../types'

interface Props {
  branch: Branch
  onDone: () => void
}

export function CheckInSuccess({ branch, onDone }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

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
        <TouchableOpacity
          style={[styles.viewBranchBtn, { backgroundColor: theme.tplNavy }]}
          onPress={() => {
            onDone()
            router.push(`/branch/${branch.BranchCode}` as any)
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
