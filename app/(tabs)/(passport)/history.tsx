import { useMemo, useState } from 'react'
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/src/hooks/useTheme'
import { usePassportStore } from '@/src/stores/passport'
import { physicalBranches } from '@/src/composables/useRegion'
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { StampShape } from '@/src/components/StampShape'
import { fonts, textSize } from '@/src/theme'
import type { CheckIn } from '@/src/types'

type HistoryGroup = { title: string; data: CheckIn[] }

function formatMeta(iso: string): string {
  const d = new Date(iso)
  if (d.toDateString() === new Date().toDateString()) {
    return d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

function groupCheckIns(checkIns: CheckIn[], memoriesOnly: boolean): HistoryGroup[] {
  const now = new Date()
  const todayStr = now.toDateString()
  const yesterdayStr = new Date(now.getTime() - 86400000).toDateString()
  const weekAgo = new Date(now.getTime() - 7 * 86400000)

  const source = memoriesOnly
    ? checkIns.filter(c => c.note?.trim() || c.photoUri)
    : checkIns

  const buckets: Record<string, CheckIn[]> = { Today: [], Yesterday: [], 'This week': [], Older: [] }
  for (const ci of source) {
    const d = new Date(ci.timestamp)
    const ds = d.toDateString()
    if (ds === todayStr) buckets.Today.push(ci)
    else if (ds === yesterdayStr) buckets.Yesterday.push(ci)
    else if (d > weekAgo) buckets['This week'].push(ci)
    else buckets.Older.push(ci)
  }
  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([title, data]) => ({ title, data }))
}

export default function HistoryScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const checkIns = usePassportStore(s => s.checkIns)

  const [memoriesOnly, setMemoriesOnly] = useState(false)

  const branchMap = useMemo(
    () => Object.fromEntries(physicalBranches.map(b => [b.BranchCode, b])),
    []
  )

  const visitCount = useMemo(() => new Set(checkIns.map(c => c.branchCode)).size, [checkIns])
  const memoryCount = useMemo(
    () => checkIns.filter(c => c.note?.trim() || c.photoUri).length,
    [checkIns]
  )

  const sections = useMemo(
    () => groupCheckIns(checkIns, memoriesOnly),
    [checkIns, memoriesOnly]
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader title="History" onBack={() => router.back()} />

      <SectionList
        sections={sections}
        keyExtractor={item => item.timestamp}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          checkIns.length > 0 ? (
            <View style={styles.listTop}>
              <View style={[styles.statsStrip, { borderColor: theme.borderSoft }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: theme.tplBlue, fontFamily: fonts.display }]}>
                    {checkIns.length}
                  </Text>
                  <Text style={[styles.statLbl, { color: theme.textMuted }]}>Total visits</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.borderSoft }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: theme.tplBlue, fontFamily: fonts.display }]}>
                    {visitCount}
                  </Text>
                  <Text style={[styles.statLbl, { color: theme.textMuted }]}>Branches</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.borderSoft }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: theme.tplBlue, fontFamily: fonts.display }]}>
                    {memoryCount}
                  </Text>
                  <Text style={[styles.statLbl, { color: theme.textMuted }]}>Memories</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  memoriesOnly
                    ? { backgroundColor: theme.tplNavy, borderColor: theme.tplNavy }
                    : { borderColor: theme.border },
                ]}
                onPress={() => setMemoriesOnly(v => !v)}
              >
                <Text style={[styles.filterPillText, { color: memoriesOnly ? '#fff' : theme.textMuted }]}>
                  Memories
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const branch = branchMap[item.branchCode]
          if (!branch) return null
          return (
            <TouchableOpacity
              style={[styles.row, { borderColor: theme.borderSoft, backgroundColor: theme.surface }]}
              onPress={() => router.push({ pathname: './branch/[id]', params: { id: branch.BranchCode } })}
              activeOpacity={0.7}
            >
              <View style={styles.rowStamp}>
                <StampShape branchCode={branch.BranchCode} wardNo={branch.WardNo} size={40} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {branch.BranchName}
                </Text>
                <Text style={[styles.rowMeta, { color: theme.textMuted }]}>{formatMeta(item.timestamp)}</Text>
              </View>
              <View style={styles.rowTrailing}>
                {!!item.note?.trim() && (
                  <Ionicons name="document-text-outline" size={14} color={theme.textMuted} />
                )}
                {!!item.photoUri && (
                  <Ionicons name="image-outline" size={14} color={theme.textMuted} />
                )}
                <Ionicons name="chevron-forward" size={16} color={theme.border} />
              </View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={40} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {memoriesOnly
                ? 'No memories yet.\nAdd a note or photo when checking in.'
                : 'No check-ins yet.\nVisit a branch to get started.'}
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  listTop: {
    marginBottom: 8,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 3,
  },
  statNum: {
    fontSize: textSize.xxl,
    fontWeight: '700',
    lineHeight: textSize.xxl + 2,
  },
  statLbl: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 36,
    flexShrink: 0,
  },
  filterPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  filterPillText: {
    fontSize: textSize.md,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: textSize.sm,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 8,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 6,
  },
  rowStamp: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowName: {
    fontSize: textSize.md,
    fontWeight: '600',
  },
  rowMeta: {
    fontSize: textSize.sm,
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: textSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
})
