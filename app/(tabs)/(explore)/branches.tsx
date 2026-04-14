import { StampShape } from '@/src/components/StampShape'
import { sortedBranches } from '@/src/composables/useRegion'
import { useTheme } from '@/src/hooks/useTheme'
import { usePassportStore } from '@/src/stores/passport'
import { fonts, radius, textSize } from '@/src/theme'
import type { Branch } from '@/src/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function BranchesScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const hasVisited = usePassportStore(s => s.hasVisited)

  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sortedBranches
    return sortedBranches.filter(
      b =>
        b.BranchName.toLowerCase().includes(q) ||
        b.District?.toLowerCase().includes(q) ||
        b.Neighbourhood?.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, backgroundColor: theme.tplNavy }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={[styles.title, { fontFamily: fonts.display }]}>All Branches</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder="Search by name or neighbourhood…"
          placeholderTextColor={theme.textMuted}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Count */}
      <Text style={[styles.countLabel, { color: theme.textMuted }]}>
        {filtered.length} of {sortedBranches.length} branches
      </Text>

      {/* Branch list */}
      <FlatList
        data={filtered}
        keyExtractor={b => b.BranchCode}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: branch, index }) => (
          <TouchableOpacity
            style={[
              styles.row,
              { borderBottomColor: theme.borderSoft },
              index === filtered.length - 1 && { borderBottomWidth: 0 },
            ]}
            onPress={() =>
              router.push({ pathname: './branch/[id]', params: { id: branch.BranchCode } })
            }
          >
            <StampShape
              branchCode={branch.BranchCode}
              wardNo={branch.WardNo}
              size={36}
              ghost={!hasVisited(branch.BranchCode)}
            />
            <View style={styles.rowInfo}>
              <Text style={[styles.rowName, { color: theme.textPrimary }]} numberOfLines={1}>
                {branch.BranchName}
              </Text>
              {branch.District ? (
                <Text style={[styles.rowSub, { color: theme.textMuted }]} numberOfLines={1}>
                  {branch.District}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => null}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  backBtn: { width: 30 },
  title: {
    flex: 1,
    fontSize: textSize.lg,
    fontWeight: '600',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.92)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: textSize.md,
    padding: 0,
  },
  countLabel: {
    fontSize: textSize.xs,
    paddingHorizontal: 22,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: textSize.md, fontWeight: '600' },
  rowSub: { fontSize: textSize.sm },
})
