import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../hooks/useTheme'
import { BADGE_COLORS, type BadgeCtx } from '../composables/useBadges'
import { fonts, radius, textSize } from '../theme'

type Badge = {
  id: string
  shape: 'octagon' | 'circle' | 'star'
  title: string
  label?: string
  desc: string
  earned: (ctx: BadgeCtx) => boolean
  progress?: (ctx: BadgeCtx) => { current: number; total: number }
  earnedAt?: (ctx: BadgeCtx) => string | null
  suggest: (ctx: BadgeCtx) => { pct: number; message: string; branches: any[] }
}

interface Props {
  badge: Badge
  ctx: BadgeCtx
}

const SHAPE_RADIUS: Record<string, number> = {
  circle:  999,
  octagon: 10,
  star:    3,
}

export function BadgeCard({ badge, ctx }: Props) {
  const theme = useTheme()
  const earned = badge.earned(ctx)
  const progress = badge.progress?.(ctx)
  const earnedAt = earned && badge.earnedAt ? badge.earnedAt(ctx) : null
  const suggest = !earned ? badge.suggest(ctx) : null

  const color = earned ? (BADGE_COLORS[badge.id] ?? theme.tplBlue) : '#aaa'
  const br = SHAPE_RADIUS[badge.shape] ?? 8
  const ICON_SIZE = 52

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: earned ? `${color}33` : theme.borderSoft }]}>
      {/* Badge icon */}
      <View style={[styles.icon, { width: ICON_SIZE, height: ICON_SIZE, borderRadius: br, backgroundColor: color }]}>
        {badge.label ? (
          <Text style={[styles.iconLabel, { fontFamily: fonts.display }]}>{badge.label}</Text>
        ) : (
          <Text style={styles.iconLabel}>{earned ? '✓' : '·'}</Text>
        )}
      </View>

      {/* Title + desc */}
      <Text style={[styles.title, { color: earned ? theme.textPrimary : theme.textMuted, fontFamily: fonts.display }]}>
        {badge.title}
      </Text>
      <Text style={[styles.desc, { color: theme.textMuted }]} numberOfLines={2}>
        {badge.desc}
      </Text>

      {/* Earned date */}
      {earnedAt && (
        <Text style={[styles.earnedAt, { color: color }]}>{earnedAt}</Text>
      )}

      {/* Progress bar + hint */}
      {!earned && suggest && (
        <View style={styles.progressWrap}>
          <View style={[styles.progressTrack, { backgroundColor: theme.borderSoft }]}>
            <View style={[styles.progressFill, { backgroundColor: theme.tplBlue, width: `${Math.round(suggest.pct * 100)}%` as any }]} />
          </View>
          {suggest.message ? (
            <Text style={[styles.hint, { color: theme.textMuted }]} numberOfLines={2}>
              {suggest.message}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
    gap: 6,
    alignItems: 'flex-start',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconLabel: {
    color: '#fff',
    fontSize: textSize.base,
    fontWeight: '700',
    lineHeight: 20,
  },
  title: {
    fontSize: textSize.md,
    fontWeight: '700',
    lineHeight: 18,
  },
  desc: {
    fontSize: textSize.xs,
    lineHeight: 14,
  },
  earnedAt: {
    fontSize: textSize.xs,
    fontWeight: '600',
  },
  progressWrap: {
    width: '100%',
    gap: 4,
    marginTop: 2,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    minWidth: 2,
  },
  hint: {
    fontSize: textSize.xs,
    lineHeight: 14,
  },
})
