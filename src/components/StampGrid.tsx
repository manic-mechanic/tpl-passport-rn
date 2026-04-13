import Ionicons from '@expo/vector-icons/Ionicons'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '../hooks/useTheme'
import { fonts, textSize } from '../theme'
import { StampShape } from './StampShape'
import type { Branch, CheckIn } from '../types'
import type { AlphaPage } from '../composables/useRegion'

type PhantomItem = { BranchCode: string; _phantom: true }
type StampItem = Branch | PhantomItem

interface Props {
  currentPage: AlphaPage
  hasVisited: (code: string) => boolean
  checkIns: CheckIn[]
  openBranch: (branch: Branch) => void
  listRef: React.RefObject<FlatList<StampItem>>
}

function branchVisitInfo(checkIns: CheckIn[], branchCode: string) {
  const visits = checkIns.filter(c => c.branchCode === branchCode)
  if (visits.length === 0) return null
  const total = visits.length
  const latest = visits[0]
  const dateStr = new Date(latest.timestamp).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
  const hasPhoto = visits.some(c => !!c.photoUri)
  const hasNote = visits.some(c => !!c.note?.trim())
  return { total, dateStr, hasPhoto, hasNote }
}

export function StampGrid({ currentPage, hasVisited, checkIns, openBranch, listRef }: Props) {
  const theme = useTheme()

  // Phantom item: FlatList uses numColumns={2}. If the branch count is odd, the last
  // row renders a single stamp flush-left. Appending a phantom item fills the right
  // cell so the grid borders complete the row without showing a real stamp.
  const stampData: StampItem[] = (() => {
    const branches = currentPage?.branches ?? []
    return branches.length % 2 !== 0
      ? [...branches, { BranchCode: '__phantom', _phantom: true as const }]
      : branches
  })()

  function renderItem({ item, index }: { item: StampItem; index: number }) {
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
    const info = visited ? branchVisitInfo(checkIns, item.BranchCode) : null
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

  const ListHeader = (
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

  return (
    <FlatList
      ref={listRef}
      data={stampData}
      keyExtractor={(item) => item.BranchCode}
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
})
