import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../hooks/useTheme'
import { usePassportStore } from '../stores/passport'
import { physicalBranches } from '../composables/useRegion'
import { StampShape } from './StampShape'
import { fonts, textSize } from '../theme'

const GHOST_CODES = ['GH4', 'GH5', 'GH1']
const GHOST_WARDS = [5, 9, 3]

export function RecentVisits() {
  const theme = useTheme()
  const router = useRouter()
  const checkIns = usePassportStore(s => s.checkIns)

  const recentBranches = (() => {
    const seen = new Set<string>()
    const result: any[] = []
    for (const ci of checkIns as any[]) {
      if (seen.has(ci.branchCode)) continue
      seen.add(ci.branchCode)
      const branch = (physicalBranches as any[]).find(b => b.BranchCode === ci.branchCode)
      if (branch) result.push(branch)
      if (result.length >= 3) break
    }
    return result
  })()

  const placeholderCount = Math.max(0, 3 - recentBranches.length)

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: fonts.display }]}>
          Recent Visits
        </Text>
        {recentBranches.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/passport')}>
            <Text style={[styles.seeAll, { color: theme.tplBlue }]}>See all</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.stampStrip}>
        {[...recentBranches, ...Array.from({ length: placeholderCount }).map((_, i) => ({ _ghost: true, _idx: i }))].map((item: any, i: number) => (
          item._ghost ? (
            <View
              key={`empty-${item._idx}`}
              style={[
                styles.stampSlot,
                i < 2 && { borderRightWidth: 1, borderRightColor: theme.border, borderStyle: 'dashed' as const },
              ]}
            >
              <View style={{ opacity: 0.12 }}>
                <StampShape
                  branchCode={GHOST_CODES[item._idx % GHOST_CODES.length]}
                  wardNo={GHOST_WARDS[item._idx % GHOST_WARDS.length]}
                  size={62}
                  hideCode
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              key={item.BranchCode}
              style={[
                styles.stampSlot,
                i < 2 && { borderRightWidth: 1, borderRightColor: theme.border, borderStyle: 'dashed' as const },
              ]}
              onPress={() => router.push(`/branch/${item.BranchCode}` as any)}
            >
              <StampShape branchCode={item.BranchCode} wardNo={item.WardNo} size={62} />
              <Text style={[styles.stampLabel, { color: theme.textMuted }]} numberOfLines={2}>
                {item.BranchName}
              </Text>
            </TouchableOpacity>
          )
        ))}
      </View>

      {recentBranches.length === 0 && (
        <Text style={[styles.emptyMessage, { color: theme.textMuted }]}>
          Check in at any branch — your recent visits will appear here.
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: textSize.xl,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: textSize.md,
    fontWeight: '500',
  },
  stampStrip: {
    flexDirection: 'row',
  },
  stampSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    minHeight: 110,
    gap: 8,
  },
  stampSlotEmpty: {},
  stampLabel: {
    fontSize: textSize.sm,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyMessage: {
    fontSize: textSize.md,
    textAlign: 'center',
    paddingVertical: 14,
    lineHeight: 20,
  },
})
