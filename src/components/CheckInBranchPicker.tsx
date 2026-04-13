import Ionicons from '@expo/vector-icons/Ionicons'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useTheme } from '../hooks/useTheme'
import { radius, textSize } from '../theme'
import type { Branch } from '../types'

interface Props {
  search: string
  onSearchChange: (s: string) => void
  results: Branch[]
  onPick: (code: string) => void
  showLocateOption: boolean
  onLocate: () => void
}

export function CheckInBranchPicker({ search, onSearchChange, results, onPick, showLocateOption, onLocate }: Props) {
  const theme = useTheme()

  return (
    <View style={styles.pickerWrap}>
      <View style={[styles.searchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          value={search}
          onChangeText={onSearchChange}
          placeholder="Search branches…"
          placeholderTextColor={theme.textMuted}
          clearButtonMode="while-editing"
          autoCapitalize="none"
        />
      </View>

      {showLocateOption && (
        <TouchableOpacity onPress={onLocate} style={styles.detectRow} hitSlop={4}>
          <Ionicons name="locate-outline" size={16} color={theme.tplBlue} />
          <Text style={[styles.detectRowText, { color: theme.tplBlue }]}>Use my location</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        style={[styles.list, { borderColor: theme.border }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
      >
        {results.map((b, i) => (
          <TouchableOpacity
            key={b.BranchCode}
            style={[
              styles.row,
              { borderBottomColor: theme.borderSoft },
              i === results.length - 1 && { borderBottomWidth: 0 },
            ]}
            onPress={() => onPick(b.BranchCode)}
          >
            <Text style={[styles.rowText, { color: theme.textPrimary }]} numberOfLines={1}>
              {b.BranchName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  pickerWrap: { gap: 10, flex: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: textSize.base,
    paddingVertical: 0,
  },
  detectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detectRowText: {
    fontSize: textSize.sm,
    fontWeight: '600',
  },
  list: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 2,
  },
  rowText: {
    fontSize: textSize.base,
    fontWeight: '500',
  },
})
