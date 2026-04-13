import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { forwardRef, useCallback } from 'react'
import { StyleSheet, useWindowDimensions, View, Text } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '../hooks/useTheme'
import { BadgeShape } from './BadgeShape'
import { compassPoints } from '../composables/useBadges'
import { branchesByAlphaPage } from '../composables/useRegion'
import { fonts, textSize } from '../theme'
import { branchNameForCode } from '../lib/utils'
import type { Badge, BadgeCtx } from '../composables/useBadges'

interface Props {
  badge: Badge | null
  ctx: BadgeCtx
  onDismiss?: () => void
}

const ANIMATION_CONFIGS = { damping: 24, stiffness: 200, mass: 0.6, overshootClamping: true }

function BadgeContent({ badge, ctx }: { badge: Badge; ctx: BadgeCtx }) {
  const theme = useTheme()
  const earned = badge.earned(ctx)
  const earnedDate = earned && badge.earnedAt ? badge.earnedAt(ctx) : null
  const progress = !earned && badge.progress ? badge.progress(ctx) : null
  const progressPct = progress ? Math.min(100, Math.round((progress.current / progress.total) * 100)) : 0

  return (
    <BottomSheetScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.badgeArea}>
        <BadgeShape badge={badge} ctx={ctx} size={88} />
      </View>

      <Text style={[styles.title, { color: theme.tplNavy, fontFamily: fonts.display }]}>
        {badge.title}
      </Text>
      <Text style={[styles.desc, { color: theme.textMuted }]}>
        {badge.desc}
      </Text>

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
            <View style={[styles.progressFill, { backgroundColor: theme.tplBlue, width: `${progressPct}%` }]} />
          </View>
          <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
            {progress.current}/{progress.total}
          </Text>
        </View>
      ) : null}

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
                  {` — ${branchNameForCode(code)}`}
                </Text>
              </View>
            )
          })}
        </View>
      )}

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

      {badge.id === 'familiar_face' && ctx.homeBranch && (
        <View style={styles.detailList}>
          <View style={[styles.detailRow, { backgroundColor: theme.borderSoft + '80' }]}>
            <Text style={[styles.detailCheck, { color: earned ? theme.tplBlue : theme.border }]}>
              {earned ? '✓' : '·'}
            </Text>
            <Text style={[styles.detailText, { color: earned ? theme.textPrimary : theme.textMuted }]}>
              {branchNameForCode(ctx.homeBranch)}
            </Text>
            <Text style={[styles.detailCount, { color: theme.textMuted }]}>
              {ctx.homeVisitCount}/5 visits
            </Text>
          </View>
        </View>
      )}
    </BottomSheetScrollView>
  )
}

export const BadgeDetailSheet = forwardRef<BottomSheetModal, Props>(
  ({ badge, ctx, onDismiss }, ref) => {
    const theme = useTheme()
    const tabBarHeight = useBottomTabBarHeight()
    const { height: screenHeight } = useWindowDimensions()

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
      ),
      []
    )

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        maxDynamicContentSize={screenHeight * 0.8 - tabBarHeight}
        bottomInset={tabBarHeight}
        backgroundStyle={[styles.sheetBg, { backgroundColor: theme.surface, borderColor: theme.border }]}
        handleIndicatorStyle={{ backgroundColor: theme.border }}
        style={[styles.sheetShadow, { shadowColor: theme.shadowColor }]}
        onDismiss={onDismiss}
        animationConfigs={ANIMATION_CONFIGS}
        backdropComponent={renderBackdrop}
      >
        {badge && <BadgeContent badge={badge} ctx={ctx} />}
      </BottomSheetModal>
    )
  }
)

const styles = StyleSheet.create({
  sheetBg: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  sheetShadow: {
    shadowColor: '#000',  // overridden inline via theme.shadowColor
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 4,
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
