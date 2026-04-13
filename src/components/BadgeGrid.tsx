import { FlatList, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../hooks/useTheme'
import { fonts, textSize } from '../theme'
import { AnimatedBadgeCell } from './AnimatedBadgeCell'
import { BADGES } from '../composables/useBadges'
import type { Badge, BadgeCtx } from '../composables/useBadges'

type BadgePhantom = { _phantom: true; id: string }
type BadgeItem = Badge | BadgePhantom

interface Props {
  displayBadges: Badge[]
  badgeCtx: BadgeCtx
  earnedBadgeCount: number
  onBadgePress: (badge: Badge) => void
  listRef: React.RefObject<FlatList<BadgeItem>>
}

export function BadgeGrid({ displayBadges, badgeCtx, earnedBadgeCount, onBadgePress, listRef }: Props) {
  const theme = useTheme()

  // Phantom item: same even-column padding trick as StampGrid — appended when the
  // badge count is odd so the last row's right cell stays visually complete.
  const badgeData: BadgeItem[] = displayBadges.length % 2 !== 0
    ? [...displayBadges, { _phantom: true as const, id: '__badge_phantom' }]
    : displayBadges

  function renderItem({ item, index }: { item: BadgeItem; index: number }) {
    const isLeftCol = index % 2 === 0
    const cellStyle = {
      flex: 1,
      borderColor: theme.border,
      borderBottomWidth: 1 as const,
      borderRightWidth: (isLeftCol ? 1 : 0) as 0 | 1,
      borderStyle: 'dashed' as const,
    }

    if ('_phantom' in item) {
      return <View style={[cellStyle, { minHeight: 140 }]} />
    }

    return (
      <AnimatedBadgeCell
        item={item}
        index={index}
        cellStyle={cellStyle}
        onPress={() => onBadgePress(item)}
        ctx={badgeCtx}
      />
    )
  }

  const ListHeader = (
    <View style={[styles.pageHeaderRow, { backgroundColor: theme.bg, borderBottomColor: theme.border, borderBottomWidth: 1, borderStyle: 'dashed' }]}>
      <Text style={[styles.pageRange, { color: theme.tplNavy, fontFamily: fonts.display }]}>
        Extra Credit
      </Text>
      <Text style={[styles.pageCount, { color: theme.textMuted }]}>
        {earnedBadgeCount}/{BADGES.length}
      </Text>
    </View>
  )

  return (
    <FlatList
      ref={listRef}
      data={badgeData}
      keyExtractor={item => item.id}
      numColumns={2}
      renderItem={renderItem}
      style={styles.list}
      contentContainerStyle={{ paddingBottom: 8 }}
      ListHeaderComponent={ListHeader}
      stickyHeaderIndices={[0]}
    />
  )
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  pageRange: {
    fontSize: textSize.base,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  pageCount: {
    fontSize: textSize.sm,
    fontWeight: '500',
  },
})
