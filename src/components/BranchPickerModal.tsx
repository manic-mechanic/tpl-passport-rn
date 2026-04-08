import { useState } from 'react'
import { View, Text, StyleSheet, Modal, FlatList, TextInput, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../hooks/useTheme'
import { sortedBranches } from '../composables/useRegion'
import { fonts, radius, textSize } from '../theme'

interface Props {
  visible: boolean
  selectedCode: string
  onSelect: (code: string) => void
  onClose: () => void
}

export function BranchPickerModal({ visible, selectedCode, onSelect, onClose }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')

  const filteredBranches = search.trim()
    ? sortedBranches.filter(b => b.BranchName.toLowerCase().includes(search.toLowerCase()))
    : sortedBranches

  function handleClose() {
    setSearch('')
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.surface, paddingBottom: insets.bottom }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.textPrimary, fontFamily: fonts.display }]}>
              Home Branch
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={26} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={[styles.searchRow, { backgroundColor: theme.borderSoft, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search branches…"
              placeholderTextColor={theme.textMuted}
              clearButtonMode="while-editing"
              autoCapitalize="none"
            />
          </View>
          <FlatList
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
                  onPress={() => {
                    onSelect(item.BranchCode)
                    handleClose()
                  }}
                >
                  <Text style={[styles.rowText, { color: selected ? theme.tplBlue : theme.textPrimary }]} numberOfLines={1}>
                    {item.BranchName}
                  </Text>
                  {selected && <Ionicons name="checkmark" size={20} color={theme.tplBlue} />}
                </TouchableOpacity>
              )
            }}
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    height: '75%',
    overflow: 'hidden',
  },
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
