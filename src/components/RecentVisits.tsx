import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../hooks/useTheme'
import { usePassportStore } from '../stores/passport'
import { physicalBranches } from '../composables/useRegion'
import { StampShape } from './StampShape'
import { fonts, textSize } from '../theme'
import type { Branch } from '../types'

function DashedSeparator({ color }: { color: string }) {
  return (
    <View style={{ width: 1, height: 72, alignSelf: 'center', overflow: 'hidden' }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <View
          key={i}
          style={{ width: 1, height: 4, backgroundColor: i % 2 === 0 ? color : 'transparent', marginBottom: 2 }}
        />
      ))}
    </View>
  )
}

const GHOST_CODES = ['GH4', 'GH5', 'GH1']
const GHOST_WARDS = [5, 9, 3]

export function RecentVisits() {
  const theme = useTheme()
  const router = useRouter()
  const checkIns = usePassportStore(s => s.checkIns)

  const recentBranches = (() => {
    const seen = new Set<string>()
    const result: Branch[] = []
    for (const ci of checkIns) {
      if (seen.has(ci.branchCode)) continue
      seen.add(ci.branchCode)
      const branch = physicalBranches.find(b => b.BranchCode === ci.branchCode)
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
        {([
          ...recentBranches,
          ...Array.from({ length: placeholderCount }).map((_, i) => ({ _ghost: true as const, _idx: i })),
        ] as Array<Branch | { _ghost: true; _idx: number }>).map((item, i) => (
          <View key={'_ghost' in item ? `empty-${item._idx}` : item.BranchCode} style={styles.stampSlotWrapper}>
            {i > 0 && <DashedSeparator color={theme.border} />}
            {'_ghost' in item ? (
              <View style={styles.stampSlot}>
                <View style={styles.stampArea}>
                  <View style={{ opacity: 0.12 }}>
                    <StampShape
                      branchCode={GHOST_CODES[item._idx % GHOST_CODES.length]}
                      wardNo={GHOST_WARDS[item._idx % GHOST_WARDS.length]}
                      size={62}
                      hideCode
                    />
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.stampSlot}
                onPress={() => router.push(`/branch/${item.BranchCode}` as any)}
              >
                <View style={styles.stampArea}>
                  <StampShape branchCode={item.BranchCode} wardNo={item.WardNo} size={62} />
                </View>
                <Text style={[styles.stampLabel, { color: theme.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                  {item.BranchName}
                </Text>
              </TouchableOpacity>
            )}
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
  stampSlotWrapper: {
    flex: 1,
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
  stampArea: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
