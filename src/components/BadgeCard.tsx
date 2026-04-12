import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../hooks/useTheme'
import { BADGES, type Badge, type BadgeCtx } from '../composables/useBadges'
import { textSize } from '../theme'
import { BadgeShape } from './BadgeShape'

interface Props {
  badge: Badge
  ctx: BadgeCtx
}

// Mirror web BadgesSection.vue showBadgeProgress:
// show progress only when unearned, current > 0, and for octagons only the next stamp.
function shouldShowProgress(badge: Badge, ctx: BadgeCtx, nextStampId: string | null): boolean {
  if (badge.earned(ctx) || !badge.progress) return false
  if (badge.progress(ctx).current === 0) return false
  if (badge.shape === 'octagon') return badge.id === nextStampId
  return true
}

export function BadgeCard({ badge, ctx }: Props) {
  const theme = useTheme()
  const earned = badge.earned(ctx)
  const nextStampId = BADGES.find(b => b.shape === 'octagon' && !b.earned(ctx))?.id ?? null
  const showProgress = shouldShowProgress(badge, ctx, nextStampId)

  return (
    <View style={styles.item}>
      <BadgeShape badge={badge} ctx={ctx} size={64} />

      <Text style={[styles.badgeName, { color: earned ? theme.textPrimary : theme.textMuted }]} numberOfLines={2}>
        {badge.title}
      </Text>

      {showProgress && (() => {
        const { current, total } = badge.progress!(ctx)
        return (
          <View style={styles.progressRow}>
            <View style={[styles.progressTrack, { backgroundColor: theme.borderSoft }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: theme.textMuted, width: `${Math.min(100, Math.round((current / total) * 100))}%` },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.textMuted }]}>{current}/{total}</Text>
          </View>
        )
      })()}
    </View>
  )
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 12,
    minHeight: 140,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
    letterSpacing: 0.1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressTrack: {
    width: 28,
    height: 4,
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
