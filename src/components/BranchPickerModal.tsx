import { forwardRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheetModal, BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useTheme } from '../hooks/useTheme'
import { sortedBranches } from '../composables/useRegion'
import { fonts, radius, textSize } from '../theme'

interface Props {
  selectedCode: string
  onSelect: (code: string) => void
}

export const BranchPickerModal = forwardRef<BottomSheetModal, Props>(
  ({ selectedCode, onSelect }, ref) => {
    const theme = useTheme()
    const insets = useSafeAreaInsets()
    const [search, setSearch] = useState('')

    const filteredBranches = search.trim()
      ? sortedBranches.filter(b => b.BranchName.toLowerCase().includes(search.toLowerCase()))
      : sortedBranches

    function handleSelect(code: string) {
      onSelect(code)
      if (ref && typeof ref !== 'function') {
        ref.current?.dismiss()
      }
    }

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['60%', '85%']}
        bottomInset={insets.bottom}
        backgroundStyle={{ backgroundColor: theme.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.border }}
        onDismiss={() => setSearch('')}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.textPrimary, fontFamily: fonts.display }]}>
            Home Branch
          </Text>
        </View>
        <View style={[styles.searchRow, { backgroundColor: theme.borderSoft, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.textMuted} />
          <BottomSheetTextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search branches…"
            placeholderTextColor={theme.textMuted}
            clearButtonMode="while-editing"
            autoCapitalize="none"
          />
        </View>
        <BottomSheetFlatList
          data={filteredBranches}
          keyExtractor={item => item.BranchCode}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const selected = selectedCode === item.BranchCode
            return (
              <TouchableOpacity
                style={[
                  styles.row,
                  { borderBottomColor: theme.border },
                  selected && { backgroundColor: `${theme.tplBlue}12` },
                ]}
                onPress={() => handleSelect(item.BranchCode)}
              >
                <Text style={[styles.rowText, { color: selected ? theme.tplBlue : theme.textPrimary }]} numberOfLines={1}>
                  {item.BranchName}
                </Text>
                {selected && <Ionicons name="checkmark" size={20} color={theme.tplBlue} />}
              </TouchableOpacity>
            )
          }}
        />
      </BottomSheetModal>
    )
  }
)

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: textSize.xl,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: textSize.base,
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    fontSize: textSize.base,
    fontWeight: '500',
    flex: 1,
  },
})
