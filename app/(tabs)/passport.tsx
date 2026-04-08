import { useRef, useState, useMemo, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/src/hooks/useTheme'
import { usePassportStore } from '@/src/stores/passport'
import { physicalBranches, branchesByAlphaPage } from '@/src/composables/useRegion'
import { StampShape } from '@/src/components/StampShape'
import { BranchDetail } from '@/src/components/BranchDetail'
import { fonts, textSize } from '@/src/theme'

export default function PassportScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [activePage, setActivePage] = useState(0)
  const [selectedBranch, setSelectedBranch] = useState<any>(null)

  const checkIns = usePassportStore(s => s.checkIns)
  const hasVisited = usePassportStore(s => s.hasVisited)
  const visitCount = useMemo(
    () => new Set((checkIns as any[]).map(c => c.branchCode)).size,
    [checkIns]
  )

  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const flatListRef = useRef<FlatList>(null)
  const snapPoints = useMemo(() => ['60%', '92%'], [])

  const pages = branchesByAlphaPage as any[]
  const currentPage = pages[activePage]

  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false })
  }, [activePage])

  function visitDate(branchCode: string) {
    const ci = (checkIns as any[]).find(c => c.branchCode === branchCode)
    if (!ci) return ''
    return new Date(ci.timestamp).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
  }

  function isPageComplete(page: any) {
    return page.branches.every((b: any) => hasVisited(b.BranchCode))
  }

  function openBranch(branch: any) {
    setSelectedBranch(branch)
    bottomSheetRef.current?.present()
  }

  const stampData = useMemo(() => {
    const branches = currentPage?.branches ?? []
    return branches.length % 2 !== 0
      ? [...branches, { BranchCode: '__phantom', _phantom: true }]
      : branches
  }, [currentPage])

  function renderItem({ item, index }: { item: any; index: number }) {
    const isLeftCol = index % 2 === 0
    const borderStyle = {
      borderColor: theme.border,
      borderBottomWidth: 1,
      borderRightWidth: isLeftCol ? 1 : 0,
    } as const

    if (item._phantom) {
      return <View style={[styles.stampSlot, borderStyle]} />
    }

    const visited = hasVisited(item.BranchCode)
    return (
      <TouchableOpacity
        style={[styles.stampSlot, borderStyle]}
        onPress={() => openBranch(item)}
        activeOpacity={0.7}
      >
        <StampShape
          branchCode={item.BranchCode}
          wardNo={item.WardNo}
          ghost={!visited}
        />
        <Text
          style={[styles.stampName, { color: visited ? theme.textPrimary : theme.textMuted }]}
          numberOfLines={2}
        >
          {item.BranchName}
        </Text>
        {visited && (
          <Text style={[styles.stampDate, { color: theme.textMuted }]}>
            {visitDate(item.BranchCode)}
          </Text>
        )}
      </TouchableOpacity>
    )
  }

  const ListHeader = (
    <View style={[styles.pageHeaderRow, { backgroundColor: theme.bg, borderBottomColor: theme.border, borderBottomWidth: 1, borderStyle: 'dashed' }]}>
      <Text style={[styles.pageRange, { color: theme.tplNavy, fontFamily: fonts.display }]}>
        {currentPage?.label}
      </Text>
      <Text style={[styles.pageCount, { color: theme.textMuted }]}>
        {currentPage?.branches.filter((b: any) => hasVisited(b.BranchCode)).length}
        /{currentPage?.branches.length}
      </Text>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.tplNavy }]}>
        <Text style={[styles.title, { fontFamily: fonts.display }]}>
          My Passport
        </Text>
        <Text style={styles.subtitle}>
          {visitCount} of {(physicalBranches as any[]).length} stamps collected
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabNav, { borderBottomColor: theme.borderSoft }]}
        contentContainerStyle={styles.tabNavContent}
      >
        {pages.map((page: any, i: number) => (
          <TouchableOpacity
            key={page.label}
            onPress={() => setActivePage(i)}
            style={[
              styles.pageTab,
              activePage === i && { borderBottomColor: theme.tplNavy },
              isPageComplete(page) && [styles.pageTabComplete, { backgroundColor: `${theme.tplBlue}14` }],
            ]}
          >
            <Text style={[styles.pageTabText, { color: activePage === i ? theme.tplNavy : theme.textMuted }]}>
              {page.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        ref={flatListRef}
        data={stampData}
        keyExtractor={(item: any) => item.BranchCode}
        numColumns={2}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 8 }}
        ListHeaderComponent={ListHeader}
        stickyHeaderIndices={[0]}
      />

      <View style={[styles.pageNav, { backgroundColor: theme.bg, borderTopColor: theme.border, paddingBottom: insets.bottom + 8 }]}>
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
          {pages.map((_: any, i: number) => (
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
          disabled={activePage === pages.length - 1}
          style={styles.pageNavBtn}
          hitSlop={8}
        >
          <Text style={[styles.pageNavLabel, { color: activePage === pages.length - 1 ? theme.textMuted : theme.tplNavy }]}>
            Next
          </Text>
          <Ionicons name="chevron-forward" size={20} color={activePage === pages.length - 1 ? theme.textMuted : theme.tplNavy} />
        </TouchableOpacity>
      </View>

      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: theme.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.border }}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
          {selectedBranch && <BranchDetail branch={selectedBranch} />}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    gap: 4,
  },
  title: {
    fontSize: textSize.xl,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
  },
  subtitle: {
    fontSize: textSize.md,
    color: 'rgba(255,255,255,0.6)',
  },
  tabNav: {
    flexGrow: 0,
    borderBottomWidth: 2,
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 12,
    minHeight: 140,
    borderStyle: 'dashed',
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
