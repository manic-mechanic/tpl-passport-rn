import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '../hooks/useTheme'
import { BADGES, useBadgeCtx, type Badge, type BadgeCtx } from '../composables/useBadges'
import { fonts, textSize } from '../theme'
import { BadgeShape } from './BadgeShape'

// TODO: wire "See all" to navigate to the Explore tab's Extra Credit section
function SeeAll() {
  const theme = useTheme()
  return (
    <TouchableOpacity onPress={() => {/* navigate to explore#extra-credit */}} hitSlop={8}>
      <Text style={[styles.seeAll, { color: theme.tplBlue }]}>See all</Text>
    </TouchableOpacity>
  )
}

function BadgeTile({ badge, ctx }: { badge: Badge; ctx: BadgeCtx }) {
  const theme = useTheme()
  const earned = badge.earned(ctx)
  const progress = !earned && badge.progress ? badge.progress(ctx) : null

  return (
    <View style={styles.tile}>
      <BadgeShape badge={badge} ctx={ctx} size={40} />
      <Text style={[styles.badgeName, { color: theme.textMuted }]} numberOfLines={2}>
        {badge.title}
      </Text>
      {progress && (
        <View style={styles.progressWrap}>
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: theme.textMuted, width: `${Math.min(100, Math.round((progress.current / progress.total) * 100))}%` as any },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.textMuted }]}>
            {progress.current}/{progress.total}
          </Text>
        </View>
      )}
    </View>
  )
}

// Port of web HomeBadgesStrip highlight logic.
// Stamp badges (octagon): most recently earned + next up.
// Non-stamps: recently earned → in-progress by % → upcoming → older earned.
// Always fills up to 6 slots.
function getHighlightBadges(ctx: BadgeCtx): Badge[] {
  const stamps    = BADGES.filter(b => b.shape === 'octagon')
  const nonStamps = BADGES.filter(b => b.shape !== 'octagon')

  const earnedStamps = stamps.filter(b => b.earned(ctx))
  const nextStamp    = stamps.find(b => !b.earned(ctx))
  const stampSlots: Badge[] = [
    ...(earnedStamps.length ? [earnedStamps[earnedStamps.length - 1]] : []),
    ...(nextStamp ? [nextStamp] : []),
  ]

  const earnedNonStamps = nonStamps.filter(b => b.earned(ctx))
  const unearned        = nonStamps.filter(b => !b.earned(ctx))
  const inProgress      = unearned
    .filter(b => b.progress && b.progress(ctx).current > 0)
    .sort((a, b) => (b.progress!(ctx).current / b.progress!(ctx).total) - (a.progress!(ctx).current / a.progress!(ctx).total))
  const inProgressIds   = new Set(inProgress.map(b => b.id))
  const upcoming        = unearned.filter(b => !inProgressIds.has(b.id))

  const recentEarned = earnedNonStamps.slice(-2).reverse()
  const olderEarned  = earnedNonStamps.slice(0, -2).reverse()

  return [
    ...stampSlots,
    ...recentEarned,
    ...inProgress,
    ...upcoming,
    ...olderEarned,
  ].slice(0, 6)
}

export function HomeBadgesStrip() {
  const theme = useTheme()
  const ctx = useBadgeCtx()
  const highlights = getHighlightBadges(ctx)

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: fonts.display }]}>
          Extra Credit
        </Text>
        <SeeAll />
      </View>
      <View style={styles.grid}>
        {highlights.map(badge => (
          <View key={badge.id} style={styles.cell}>
            <BadgeTile badge={badge} ctx={ctx} />
          </View>
        ))}
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  cell: {
    width: '32%',
  },
  tile: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressTrack: {
    width: 28,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    minWidth: 2,
  },
  progressText: {
    fontSize: 8,
    fontWeight: '600',
    lineHeight: 10,
  },
})
