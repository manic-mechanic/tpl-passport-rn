import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '../hooks/useTheme'
import { BadgeShape } from './BadgeShape'
import { compassPoints } from '../composables/useBadges'
import { branchesByAlphaPage, physicalBranches } from '../composables/useRegion'
import { fonts, textSize } from '../theme'
import type { Badge, BadgeCtx } from '../composables/useBadges'

interface Props {
  badge: Badge | null   // keep non-null during close animation via lastBadgeRef
  ctx: BadgeCtx
  visible: boolean
  onClose: () => void
}

function branchName(code: string): string {
  return physicalBranches.find(b => b.BranchCode === code)?.BranchName ?? code
}

export function BadgeDetailSheet({ badge, ctx, visible, onClose }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  if (!badge) return null

  const earned = badge.earned(ctx)
  const earnedDate = earned && badge.earnedAt ? badge.earnedAt(ctx) : null
  const progress = !earned && badge.progress ? badge.progress(ctx) : null
  const progressPct = progress ? Math.min(100, Math.round((progress.current / progress.total) * 100)) : 0

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.bg, paddingBottom: insets.bottom + 16 }]}>
        {/* Handle + close */}
        <View style={[styles.topBar, { borderBottomColor: theme.borderSoft }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Badge shape */}
          <View style={styles.badgeArea}>
            <BadgeShape badge={badge} ctx={ctx} size={88} />
          </View>

          <Text style={[styles.title, { color: theme.tplNavy, fontFamily: fonts.display }]}>
            {badge.title}
          </Text>
          <Text style={[styles.desc, { color: theme.textMuted }]}>
            {badge.desc}
          </Text>

          {/* Earned / progress status */}
          {earned ? (
            <View style={styles.earnedRow}>
              <Ionicons name="checkmark-circle" size={16} color="#2a8a4a" />
              <Text style={[styles.earnedText, { color: '#2a8a4a' }]}>
                Earned{earnedDate ? ` · ${earnedDate}` : ''}
              </Text>
            </View>
          ) : progress ? (
            <View style={styles.progressRow}>
              <View style={[styles.progressTrack, { backgroundColor: theme.borderSoft }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: theme.tplBlue, width: `${progressPct}%` as any },
                  ]}
                />
              </View>
              <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
                {progress.current}/{progress.total}
              </Text>
            </View>
          ) : null}

          {/* Navigator: compass directions */}
          {badge.id === 'navigator' && (
            <View style={styles.detailList}>
              {(['n', 'e', 's', 'w'] as const).map((dir, idx) => {
                const label = ['North', 'East', 'South', 'West'][idx]
                const code = compassPoints[dir]
                const done = ctx.visitedBranchCodes.has(code)
                return (
                  <View key={dir} style={[styles.detailRow, { backgroundColor: theme.borderSoft + '80' }]}>
                    <Text style={[styles.detailCheck, { color: done ? theme.tplBlue : theme.border }]}>
                      {done ? '✓' : '·'}
                    </Text>
                    <Text style={[styles.detailText, { color: done ? theme.textPrimary : theme.textMuted }]}>
                      <Text style={styles.detailDir}>{label}</Text>
                      {` — ${branchName(code)}`}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}

          {/* Page Turner: one branch per alpha page */}
          {badge.id === 'page_turner' && (
            <View style={styles.detailList}>
              {branchesByAlphaPage.map(page => {
                const done = page.branches.some(b => ctx.visitedBranchCodes.has(b.BranchCode))
                return (
                  <View key={page.label} style={[styles.detailRow, { backgroundColor: theme.borderSoft + '80' }]}>
                    <Text style={[styles.detailCheck, { color: done ? theme.tplBlue : theme.border }]}>
                      {done ? '✓' : '·'}
                    </Text>
                    <Text style={[styles.detailText, { color: done ? theme.textPrimary : theme.textMuted }]}>
                      {page.label}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}

          {/* Page Filler: fill one complete page */}
          {badge.id === 'page_filler' && (
            <View style={styles.detailList}>
              {branchesByAlphaPage.map(page => {
                const visitedCount = page.branches.filter(b => ctx.visitedBranchCodes.has(b.BranchCode)).length
                const done = visitedCount === page.branches.length
                return (
                  <View key={page.label} style={[styles.detailRow, { backgroundColor: theme.borderSoft + '80' }]}>
                    <Text style={[styles.detailCheck, { color: done ? theme.tplBlue : theme.border }]}>
                      {done ? '✓' : '·'}
                    </Text>
                    <Text style={[styles.detailText, { color: done ? theme.textPrimary : theme.textMuted }]}>
                      {page.label}
                    </Text>
                    <Text style={[styles.detailCount, { color: theme.textMuted }]}>
                      {visitedCount}/{page.branches.length}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}

          {/* Familiar Face: home branch visit count */}
          {badge.id === 'familiar_face' && ctx.homeBranch && (
            <View style={styles.detailList}>
              <View style={[styles.detailRow, { backgroundColor: theme.borderSoft + '80' }]}>
                <Text style={[styles.detailCheck, { color: earned ? theme.tplBlue : theme.border }]}>
                  {earned ? '✓' : '·'}
                </Text>
                <Text style={[styles.detailText, { color: earned ? theme.textPrimary : theme.textMuted }]}>
                  {branchName(ctx.homeBranch)}
                </Text>
                <Text style={[styles.detailCount, { color: theme.textMuted }]}>
                  {ctx.homeVisitCount}/5 visits
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    alignItems: 'center',
  },
  badgeArea: {
    paddingVertical: 16,
  },
  title: {
    fontSize: textSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: textSize.xl + 4,
  },
  desc: {
    fontSize: textSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  earnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  earnedText: {
    fontSize: textSize.md,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  progressTrack: {
    width: 120,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    minWidth: 2,
  },
  progressLabel: {
    fontSize: textSize.sm,
    fontWeight: '600',
  },
  detailList: {
    width: '100%',
    gap: 4,
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 8,
  },
  detailCheck: {
    fontSize: textSize.md,
    fontWeight: '700',
    width: 14,
    textAlign: 'center',
    flexShrink: 0,
  },
  detailText: {
    fontSize: textSize.md,
    flex: 1,
    lineHeight: 20,
  },
  detailDir: {
    fontWeight: '600',
  },
  detailCount: {
    fontSize: textSize.sm,
    fontWeight: '600',
    flexShrink: 0,
  },
})
