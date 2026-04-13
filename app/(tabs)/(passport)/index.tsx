import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/src/hooks/useTheme'
import { usePassportStore } from '@/src/stores/passport'
import { physicalBranches, branchesByAlphaPage } from '@/src/composables/useRegion'
import { BADGE_DISPLAY_ORDER, BADGES, useBadgeCtx } from '@/src/composables/useBadges'
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { StampShape } from '@/src/components/StampShape'
import { BadgeCard } from '@/src/components/BadgeCard'
import { BadgeDetailSheet } from '@/src/components/BadgeDetailSheet'
import { fonts, textSize } from '@/src/theme'
import type { Branch } from '@/src/types'
import type { AlphaPage } from '@/src/composables/useRegion'
import type { Badge } from '@/src/composables/useBadges'

export default function PassportScreen() {
  const theme = useTheme()

  const router = useRouter()
  const [activePage, setActivePage] = useState(0)
  const badgeSheetRef = useRef<BottomSheetModal>(null)
  const [activeBadge, setActiveBadge] = useState<Badge | null>(null)
  const lastBadgeRef = useRef<Badge | null>(null)
  if (activeBadge) lastBadgeRef.current = activeBadge

  const checkIns = usePassportStore(s => s.checkIns)
  const hasVisited = usePassportStore(s => s.hasVisited)
  const badgeCtx = useBadgeCtx()

  const { tab } = useLocalSearchParams<{ tab?: string }>()

  const flatListRef = useRef<FlatList>(null)
  const badgeListRef = useRef<FlatList>(null)

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

  // Per-branch visit stats: total count, latest date, has photo, has note
  function branchVisitInfo(branchCode: string) {
    const visits = checkIns.filter(c => c.branchCode === branchCode)
    if (visits.length === 0) return null
    const total = visits.length
    const latest = visits[0] // checkIns ordered newest-first
    const dateStr = new Date(latest.timestamp).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
    const hasPhoto = visits.some(c => !!c.photoUri)
    const hasNote = visits.some(c => !!c.note?.trim())
    return { total, dateStr, hasPhoto, hasNote }
  }

  function isPageComplete(page: AlphaPage) {
    return page.branches.every(b => hasVisited(b.BranchCode))
  }

  function openBranch(branch: Branch) {
    router.push({ pathname: './branch/[id]', params: { id: branch.BranchCode } })
  }

  const stampData = useMemo<(Branch | { BranchCode: string; _phantom: true })[]>(() => {
    const branches = currentPage?.branches ?? []
    return branches.length % 2 !== 0
      ? [...branches, { BranchCode: '__phantom', _phantom: true as const }]
      : branches
  }, [currentPage])

  type PhantomItem = { BranchCode: string; _phantom: true }
  type StampItem = Branch | PhantomItem

  function renderStampItem({ item, index }: { item: StampItem; index: number }) {
    const isLeftCol = index % 2 === 0
    const borderStyle = {
      borderColor: theme.border,
      borderBottomWidth: 1,
      borderRightWidth: isLeftCol ? 1 : 0,
    } as const

    if ('_phantom' in item) {
      return <View style={[styles.stampSlot, borderStyle]} />
    }

    const visited = hasVisited(item.BranchCode)
    const info = visited ? branchVisitInfo(item.BranchCode) : null
    const visitLabel = info
      ? info.total === 1
        ? info.dateStr
        : `${info.dateStr} · ${info.total - 1} more visit${info.total - 1 === 1 ? '' : 's'}`
      : ''

    return (
      <TouchableOpacity
        style={[styles.stampSlot, borderStyle]}
        onPress={() => openBranch(item)}
        activeOpacity={0.7}
      >
        <View style={styles.stampCenter}>
          <StampShape
            branchCode={item.BranchCode}
            wardNo={item.WardNo}
            ghost={!visited}
          />
        </View>
        <View style={styles.stampBottom}>
          <Text
            style={[styles.stampName, { color: visited ? theme.textPrimary : theme.textMuted }]}
            numberOfLines={2}
          >
            {item.BranchName}
          </Text>
          {info && (
            <Text style={[styles.stampDate, { color: theme.textMuted }]}>
              {visitLabel}
            </Text>
          )}
          {info && (info.hasNote || info.hasPhoto) && (
            <View style={styles.stampIcons}>
              {info.hasNote && (
                <Ionicons name="document-text-outline" size={11} color={theme.textMuted} />
              )}
              {info.hasPhoto && (
                <Ionicons name="image-outline" size={11} color={theme.textMuted} />
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  type BadgePhantom = { _phantom: true; id: string }
  type BadgeItem = Badge | BadgePhantom

  const badgeData = useMemo<BadgeItem[]>(() => {
    return displayBadges.length % 2 !== 0
      ? [...displayBadges, { _phantom: true as const, id: '__badge_phantom' }]
      : displayBadges
  }, [displayBadges])

  function renderBadgeItem({ item, index }: { item: BadgeItem; index: number }) {
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
      <TouchableOpacity
        style={cellStyle}
        onPress={() => { setActiveBadge(item); badgeSheetRef.current?.present() }}
        activeOpacity={0.7}
      >
        <BadgeCard badge={item} ctx={badgeCtx} />
      </TouchableOpacity>
    )
  }

  const completeTabStyle = {
    backgroundColor: `${theme.tplBlue}14`,
    borderTopWidth: 1 as const,
    borderTopColor: theme.tplNavy,
    borderLeftWidth: 1 as const,
    borderLeftColor: theme.tplNavy,
    borderRightWidth: 1 as const,
    borderRightColor: theme.tplNavy,
  }

  const StampListHeader = (
    <View style={[styles.pageHeaderRow, { backgroundColor: theme.bg, borderBottomColor: theme.border, borderBottomWidth: 1, borderStyle: 'dashed' }]}>
      <Text style={[styles.pageRange, { color: theme.tplNavy, fontFamily: fonts.display }]}>
        {currentPage?.label}
      </Text>
      <Text style={[styles.pageCount, { color: theme.textMuted }]}>
        {currentPage?.branches.filter(b => hasVisited(b.BranchCode)).length}
        /{currentPage?.branches.length}
      </Text>
    </View>
  )

  const BadgeListHeader = (
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
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader
        title="My Passport"
        rightAction={
          <TouchableOpacity onPress={() => router.push('./history')} hitSlop={8}>
            <Text style={styles.allVisitsLink}>All visits</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabNav, { borderBottomColor: theme.borderSoft }]}
        contentContainerStyle={styles.tabNavContent}
      >
        {pages.map((page, i) => (
          <TouchableOpacity
            key={page.label}
            onPress={() => setActivePage(i)}
            style={[
              styles.pageTab,
              activePage === i && { borderBottomColor: theme.tplNavy },
              isPageComplete(page) && [styles.pageTabComplete, completeTabStyle],
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
            activePage === EXTRA_CREDIT_IDX && { borderBottomColor: theme.tplNavy },
            allBadgesEarned && [styles.pageTabComplete, completeTabStyle],
          ]}
        >
          <Text style={[styles.pageTabText, { color: activePage === EXTRA_CREDIT_IDX ? theme.tplNavy : theme.textMuted }]}>
            Extra Credit
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {isExtraCredit ? (
        <FlatList
          ref={badgeListRef}
          data={badgeData}
          keyExtractor={item => item.id}
          numColumns={2}
          renderItem={renderBadgeItem}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 8 }}
          ListHeaderComponent={BadgeListHeader}
          stickyHeaderIndices={[0]}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={stampData}
          keyExtractor={(item) => item.BranchCode}
          numColumns={2}
          renderItem={renderStampItem}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 8 }}
          ListHeaderComponent={StampListHeader}
          stickyHeaderIndices={[0]}
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
        badge={lastBadgeRef.current}
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
    flexGrow: 0,
    borderBottomWidth: 2,
    paddingTop: 8,
  },
  tabNavContent: {
    paddingHorizontal: 18,
  },
  pageTab: {
    paddingHorizontal: 6,
    paddingVertical: 10,
    marginRight: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  pageTabComplete: {},
  pageTabText: {
    fontSize: textSize.md,
    fontWeight: '600',
  },
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
  stampSlot: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
    minHeight: 140,
    borderStyle: 'dashed',
  },
  stampCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  stampBottom: {
    alignItems: 'center',
    gap: 3,
  },
  stampName: {
    fontSize: textSize.sm,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  stampDate: {
    fontSize: textSize.xs,
    fontWeight: '500',
  },
  stampIcons: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 1,
  },
  // Bottom page navigation
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
