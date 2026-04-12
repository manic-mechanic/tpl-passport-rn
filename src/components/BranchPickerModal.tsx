import Ionicons from '@expo/vector-icons/Ionicons'
import { BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Location from 'expo-location'
import { forwardRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { filterBranches, haversineKm, sortedBranches } from '../composables/useRegion'
import { useTheme } from '../hooks/useTheme'
import { fonts, radius, textSize } from '../theme'
import type { Branch } from '../types'

interface Props {

  selectedCode: string
  onSelect: (code: string) => void
}

export const BranchPickerModal = forwardRef<BottomSheetModal, Props>(
  ({ selectedCode, onSelect }, ref) => {
    const theme = useTheme()
    const insets = useSafeAreaInsets()
    const [search, setSearch] = useState('')
    const [locating, setLocating] = useState(false)

    const filteredBranches = filterBranches(search)

    function handleSelect(code: string) {
      onSelect(code)
      if (ref && typeof ref !== 'function') {
        ref.current?.dismiss()
      }
    }

    async function handleUseLocation() {
      setLocating(true)
      try {
        const { status } = await Location.getForegroundPermissionsAsync()
        const granted = status === 'granted'
          ? true
          : (await Location.requestForegroundPermissionsAsync()).status === 'granted'
        if (!granted) return
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        const nearest = sortedBranches
          .map(b => ({ b, d: haversineKm(pos.coords.latitude, pos.coords.longitude, b.Lat, b.Long) }))
          .sort((a, b) => a.d - b.d)[0]
        if (nearest) handleSelect(nearest.b.BranchCode)
      } finally {
        setLocating(false)
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
            Select your Home Branch
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.locationRow, { borderBottomColor: theme.border }]}
          onPress={handleUseLocation}
          disabled={locating}
        >
          {locating
            ? <ActivityIndicator size="small" color={theme.tplBlue} />
            : <Ionicons name="locate-outline" size={18} color={theme.tplBlue} />
          }
          <Text style={[styles.locationText, { color: theme.tplBlue }]}>Use my Location</Text>
        </TouchableOpacity>
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
          keyExtractor={(item: Branch) => item.BranchCode}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              No branches match "{search}"
            </Text>
          }
          renderItem={({ item }: { item: Branch }) => {
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
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  locationText: {
    fontSize: textSize.base,
    fontWeight: '600',
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
  emptyText: {
    fontSize: textSize.md,
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
})
