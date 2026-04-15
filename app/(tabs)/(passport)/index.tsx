import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useLastNonNull } from '@/src/hooks/useLastNonNull'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/src/hooks/useTheme'
import { usePassportStore } from '@/src/stores/passport'
import { branchesByAlphaPage } from '@/src/composables/useRegion'
import { BADGE_DISPLAY_ORDER, BADGES, useBadgeCtx } from '@/src/composables/useBadges'
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { BadgeDetailSheet } from '@/src/components/BadgeDetailSheet'
import { StampGrid } from '@/src/components/StampGrid'
import { BadgeGrid } from '@/src/components/BadgeGrid'
import { textSize } from '@/src/theme'
import type { Branch } from '@/src/types'
import type { AlphaPage } from '@/src/composables/useRegion'
import type { Badge } from '@/src/composables/useBadges'

export default function PassportScreen() {
  const theme = useTheme()

  const router = useRouter()
  const [activePage, setActivePage] = useState(0)
  const badgeSheetRef = useRef<BottomSheetModal>(null)
  const [activeBadge, setActiveBadge] = useState<Badge | null>(null)
  const lastBadge = useLastNonNull(activeBadge)

  const checkIns = usePassportStore(s => s.checkIns)
  const hasVisited = usePassportStore(s => s.hasVisited)
  const badgeCtx = useBadgeCtx()

  const { tab } = useLocalSearchParams<{ tab?: string }>()

  const flatListRef = useRef<FlatList<any>>(null)
  const badgeListRef = useRef<FlatList<any>>(null)

  const pages: AlphaPage[] = branchesByAlphaPage
  const EXTRA_CREDIT_IDX = pages.length   // = 5

  const currentPage = pages[activePage]
  const isExtraCredit = activePage === EXTRA_CREDIT_IDX

  const earnedBadgeCount = useMemo(
    () => BADGES.filter(b => b.earned(badgeCtx)).length,
    [badgeCtx]
  )
  const allBadgesEarned = earnedBadgeCount === BADGES.length

  const displayBadges = useMemo(
    () => BADGE_DISPLAY_ORDER.map(id => BADGES.find(b => b.id === id)).filter((b): b is Badge => !!b),
    []
  )

  useFocusEffect(useCallback(() => {
    if (tab === 'extra-credit') setActivePage(EXTRA_CREDIT_IDX)
    return () => { badgeSheetRef.current?.dismiss() }
  }, [tab]))

  useEffect(() => {
    if (isExtraCredit) {
      badgeListRef.current?.scrollToOffset({ offset: 0, animated: false })
    } else {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false })
    }
  }, [activePage])

  function isPageComplete(page: AlphaPage) {
    return page.branches.every(b => hasVisited(b.BranchCode))
  }

  function openBranch(branch: Branch) {
    router.push({ pathname: './branch/[id]', params: { id: branch.BranchCode } })
  }

  const completeTabBg = 'rgba(200, 120, 32, 0.08)'

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader
        title="My Passport"
        rightAction={
          <TouchableOpacity onPress={() => router.push('./history')} hitSlop={8}>
            <Text style={styles.allVisitsLink}>All visits</Text>
          </TouchableOpacity>
        }
      />

      <View style={[styles.tabNav, { backgroundColor: theme.bg, borderTopColor: theme.border, borderBottomColor: theme.borderSoft }]}>
        {pages.map((page, i) => (
          <TouchableOpacity
            key={page.label}
            onPress={() => setActivePage(i)}
            style={[
              styles.pageTab,
              { borderRightColor: theme.borderSoft },
              activePage === i && { borderBottomColor: theme.tplNavy },
              isPageComplete(page) && { backgroundColor: completeTabBg },
            ]}
          >
            <Text style={[styles.pageTabText, { color: activePage === i ? theme.tplNavy : theme.textMuted }]}>
              {page.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={() => setActivePage(EXTRA_CREDIT_IDX)}
          style={[
            styles.pageTab,
            styles.pageTabLast,
            activePage === EXTRA_CREDIT_IDX && { borderBottomColor: theme.tplNavy },
            allBadgesEarned && { backgroundColor: completeTabBg },
          ]}
        >
          <Text style={[styles.pageTabText, { color: activePage === EXTRA_CREDIT_IDX ? theme.tplNavy : theme.textMuted }]}>
            Extra Credit
          </Text>
        </TouchableOpacity>
      </View>

      {isExtraCredit ? (
        <BadgeGrid
          listRef={badgeListRef}
          displayBadges={displayBadges}
          badgeCtx={badgeCtx}
          earnedBadgeCount={earnedBadgeCount}
          onBadgePress={(badge) => { setActiveBadge(badge); badgeSheetRef.current?.present() }}
        />
      ) : (
        <StampGrid
          listRef={flatListRef}
          currentPage={currentPage}
          hasVisited={hasVisited}
          checkIns={checkIns}
          openBranch={openBranch}
        />
      )}

      <View style={[styles.pageNav, { backgroundColor: theme.bg, borderTopColor: theme.border, paddingBottom: 12 }]}>
        <TouchableOpacity
          onPress={() => setActivePage(p => p - 1)}
          disabled={activePage === 0}
          style={styles.pageNavBtn}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={20} color={activePage === 0 ? theme.textMuted : theme.tplNavy} />
          <Text style={[styles.pageNavLabel, { color: activePage === 0 ? theme.textMuted : theme.tplNavy }]}>
            Prev
          </Text>
        </TouchableOpacity>

        <View style={styles.pageNavDots}>
          {Array.from({ length: EXTRA_CREDIT_IDX + 1 }, (_, i) => i).map(i => (
            <TouchableOpacity key={i} onPress={() => setActivePage(i)} hitSlop={6}>
              <View style={[
                styles.pageNavDot,
                { backgroundColor: i === activePage ? theme.tplNavy : theme.borderSoft },
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => setActivePage(p => p + 1)}
          disabled={activePage === EXTRA_CREDIT_IDX}
          style={styles.pageNavBtn}
          hitSlop={8}
        >
          <Text style={[styles.pageNavLabel, { color: activePage === EXTRA_CREDIT_IDX ? theme.textMuted : theme.tplNavy }]}>
            Next
          </Text>
          <Ionicons name="chevron-forward" size={20} color={activePage === EXTRA_CREDIT_IDX ? theme.textMuted : theme.tplNavy} />
        </TouchableOpacity>
      </View>

      <BadgeDetailSheet
        ref={badgeSheetRef}
        badge={lastBadge}
        ctx={badgeCtx}
        onDismiss={() => setActiveBadge(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  allVisitsLink: {
    fontSize: textSize.sm,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    paddingBottom: 4,
  },
  tabNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1.5,
  },
  pageTab: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    borderRightWidth: 1,
    marginBottom: -1.5,
  },
  pageTabLast: {
    flex: 2,
    borderRightWidth: 0,
  },
  pageTabText: {
    fontSize: textSize.sm,
    fontWeight: '600',
  },
  pageNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
  },
  pageNavLabel: {
    fontSize: textSize.md,
    fontWeight: '600',
  },
  pageNavDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageNavDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})
