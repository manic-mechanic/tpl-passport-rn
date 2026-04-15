import { ScreenHeader } from '@/src/components/ScreenHeader'
import { StampShape } from '@/src/components/StampShape'
import { sortedBranches } from '@/src/composables/useRegion'
import { useTheme } from '@/src/hooks/useTheme'
import { usePassportStore } from '@/src/stores/passport'
import { radius, textSize } from '@/src/theme'
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
        b.Address?.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title="All Branches" onBack={() => router.back()} />

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
              {branch.Address ? (
                <Text style={[styles.rowSub, { color: theme.textMuted }]} numberOfLines={1}>
                  {branch.Address.split(',')[0]}
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
