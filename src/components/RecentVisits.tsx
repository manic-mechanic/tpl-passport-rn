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

      <View style={[styles.stampStrip, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
        {recentBranches.map((branch: any) => (
          <TouchableOpacity
            key={branch.BranchCode}
            style={styles.stampSlot}
            onPress={() => router.push(`/branch/${branch.BranchCode}` as any)}
          >
            <StampShape branchCode={branch.BranchCode} wardNo={branch.WardNo} size={44} />
            <Text style={[styles.stampLabel, { color: theme.textMuted }]} numberOfLines={2}>
              {branch.BranchName}
            </Text>
          </TouchableOpacity>
        ))}
        {Array.from({ length: placeholderCount }).map((_, i) => (
          <View key={`empty-${i}`} style={[styles.stampSlot, styles.stampSlotEmpty]}>
            <View style={{ opacity: 0.15 }}>
              <StampShape
                branchCode={GHOST_CODES[i % GHOST_CODES.length]}
                wardNo={GHOST_WARDS[i % GHOST_WARDS.length]}
                size={44}
              />
            </View>
          </View>
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
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: textSize.base,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: textSize.sm,
    fontWeight: '500',
  },
  stampStrip: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  stampSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 84,
    gap: 5,
  },
  stampSlotEmpty: {},
  stampLabel: {
    fontSize: textSize.xs,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
  emptyMessage: {
    fontSize: textSize.sm,
    textAlign: 'center',
    paddingVertical: 12,
    lineHeight: 18,
  },
})
