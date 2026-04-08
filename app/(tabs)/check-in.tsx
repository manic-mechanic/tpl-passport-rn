import { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/src/hooks/useTheme'
import { usePassportStore } from '@/src/stores/passport'
import { sortedBranches, haversineKm } from '@/src/composables/useRegion'
import { StampShape } from '@/src/components/StampShape'
import { fonts, radius, textSize } from '@/src/theme'

const FALLBACK_CODE = 'TRL'

export default function CheckInScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { branch: prefillCode } = useLocalSearchParams<{ branch?: string }>()

  const [selectedCode, setSelectedCode] = useState<string>('')
  const [noteText, setNoteText] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [successBranch, setSuccessBranch] = useState<any>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')

  const checkIn = usePassportStore(s => s.checkIn)
  const hasVisitedToday = usePassportStore(s => s.hasVisitedToday)
  const bypassLocationFence = usePassportStore(s => s.profile.bypassLocationFence)

  const selectedBranch = (sortedBranches as any[]).find(b => b.BranchCode === selectedCode) ?? null
  const alreadyVisitedToday = selectedBranch ? hasVisitedToday(selectedBranch.BranchCode) : false

  const pickerResults = pickerSearch.trim()
    ? (sortedBranches as any[]).filter(b =>
        b.BranchName.toLowerCase().includes(pickerSearch.toLowerCase())
      ).slice(0, 8)
    : (sortedBranches as any[]).slice(0, 8)

  useFocusEffect(
    useCallback(() => {
      setNoteText('')
      setLocationError(null)
      setSuccessBranch(null)
      setShowPicker(false)
      setPickerSearch('')
      if (prefillCode) {
        setSelectedCode(prefillCode)
        setDetecting(false)
      } else {
        setSelectedCode('')
        detectNearest()
      }
    }, [prefillCode])
  )

  async function detectNearest() {
    setDetecting(true)
    setLocationError(null)
    setShowPicker(false)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setSelectedCode(FALLBACK_CODE)
        setLocationError('Location access denied — showing default branch.')
        return
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const nearest = (sortedBranches as any[])
        .map(b => ({ ...b, distKm: haversineKm(pos.coords.latitude, pos.coords.longitude, b.Lat, b.Long) }))
        .sort((a, b) => a.distKm - b.distKm)[0]
      setSelectedCode(nearest.BranchCode)
    } catch {
      setSelectedCode(FALLBACK_CODE)
      setLocationError('Could not determine location — showing default branch.')
    } finally {
      setDetecting(false)
    }
  }

  function pickBranch(code: string) {
    setSelectedCode(code)
    setShowPicker(false)
    setPickerSearch('')
    setLocationError(null)
  }

  async function doCheckIn() {
    if (!selectedBranch || alreadyVisitedToday) return

    if (!bypassLocationFence) {
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        const km = haversineKm(pos.coords.latitude, pos.coords.longitude, selectedBranch.Lat, selectedBranch.Long)
        if (km > 0.1) {
          const dist = km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m`
          setLocationError(`You're ${dist} away — you need to be within 100 m to check in.`)
          return
        }
      } catch (err: any) {
        setLocationError(err?.code === 3 ? 'Location check timed out. Try again.' : 'Location access denied.')
        return
      }
    }

    setLocationError(null)
    const timestamp = checkIn(selectedBranch.BranchCode, noteText.trim())
    if (timestamp) {
      setSuccessBranch(selectedBranch)
      setNoteText('')
    }
  }

  if (successBranch) {
    return (
      <View style={[styles.container, { backgroundColor: theme.tplNavy }]}>
        <View style={{ height: insets.top }} />
        <View style={[styles.successWrap, { paddingTop: 40, backgroundColor: theme.bg }]}>
          <StampShape branchCode={successBranch.BranchCode} wardNo={successBranch.WardNo} size={110} />
          <Text style={[styles.successLabel, { color: theme.textPrimary, fontFamily: fonts.display }]}>
            Stamp collected!
          </Text>
          <Text style={[styles.successBranch, { color: theme.textMuted }]}>{successBranch.BranchName}</Text>
          {successBranch.District ? (
            <Text style={[styles.successRegion, { color: theme.textMuted }]}>{successBranch.District}</Text>
          ) : null}
          <TouchableOpacity
            style={[styles.viewBranchBtn, { backgroundColor: theme.tplNavy }]}
            onPress={() => {
              setSuccessBranch(null)
              router.push(`/branch/${successBranch.BranchCode}` as any)
            }}
          >
            <Text style={styles.viewBranchBtnText}>View branch</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSuccessBranch(null)}>
            <Text style={[styles.doneLink, { color: theme.tplBlue }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.tplNavy }]}>
      <View style={{ height: insets.top }} />
      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.bg }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: 20, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: fonts.display }]}>Check In</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {detecting
            ? 'Detecting your location…'
            : selectedBranch
              ? `Nearest branch — ${selectedBranch.BranchName}`
              : 'Select the branch you\'re visiting'}
        </Text>
        {locationError && (
          <Text style={[styles.locationError, { color: theme.textMuted }]}>{locationError}</Text>
        )}

        {detecting ? (
          <View style={styles.detectingWrap}>
            <ActivityIndicator color={theme.tplBlue} size="large" />
          </View>
        ) : selectedBranch && !showPicker ? (
          <>
            <View style={styles.stampArea}>
              <StampShape branchCode={selectedBranch.BranchCode} wardNo={selectedBranch.WardNo} size={100} />
              <Text style={[styles.stampName, { color: theme.textPrimary, fontFamily: fonts.display }]}>
                {selectedBranch.BranchName}
              </Text>
              {selectedBranch.District ? (
                <Text style={[styles.stampRegion, { color: theme.textMuted }]}>{selectedBranch.District}</Text>
              ) : null}
              <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.changeBtn} hitSlop={8}>
                <Ionicons name="swap-horizontal-outline" size={14} color={theme.tplBlue} />
                <Text style={[styles.changeBtnText, { color: theme.tplBlue }]}>Change branch</Text>
              </TouchableOpacity>
            </View>

            {alreadyVisitedToday ? (
              <View style={[styles.visitedNotice, { backgroundColor: `${theme.tplBlue}10`, borderColor: `${theme.tplBlue}33` }]}>
                <Text style={[styles.visitedNoticeText, { color: theme.textMuted }]}>
                  You've already checked in here today
                </Text>
              </View>
            ) : (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                  Note <Text style={[styles.optional, { color: theme.textMuted }]}>(optional)</Text>
                </Text>
                <TextInput
                  style={[styles.noteTextarea, {
                    color: theme.textPrimary,
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  }]}
                  value={noteText}
                  onChangeText={setNoteText}
                  placeholder="What did you do? What did you read?"
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: theme.textMuted }]}>{noteText.length} / 500</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.checkInBtn,
                { backgroundColor: alreadyVisitedToday ? theme.textMuted : theme.tplBlue },
                alreadyVisitedToday && { opacity: 0.6 },
              ]}
              onPress={doCheckIn}
              disabled={alreadyVisitedToday}
            >
              <Text style={styles.checkInBtnText}>Check in</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Branch picker (shown when no branch or user tapped "Change branch")
          <View style={styles.pickerWrap}>
            <View style={[styles.pickerSearchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="search-outline" size={18} color={theme.textMuted} />
              <TextInput
                style={[styles.pickerSearchInput, { color: theme.textPrimary }]}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                placeholder="Search branches…"
                placeholderTextColor={theme.textMuted}
                autoFocus={showPicker}
                clearButtonMode="while-editing"
                autoCapitalize="none"
              />
            </View>

            {showPicker && (
              <TouchableOpacity onPress={detectNearest} style={styles.detectRow} hitSlop={4}>
                <Ionicons name="locate-outline" size={16} color={theme.tplBlue} />
                <Text style={[styles.detectRowText, { color: theme.tplBlue }]}>Use my location</Text>
              </TouchableOpacity>
            )}

            <View style={[styles.pickerList, { borderColor: theme.border }]}>
              {pickerResults.map((b: any, i: number) => (
                <TouchableOpacity
                  key={b.BranchCode}
                  style={[
                    styles.pickerRow,
                    { borderBottomColor: theme.borderSoft },
                    i === pickerResults.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => pickBranch(b.BranchCode)}
                >
                  <Text style={[styles.pickerRowText, { color: theme.textPrimary }]} numberOfLines={1}>
                    {b.BranchName}
                  </Text>
                  <Text style={[styles.pickerRowDistrict, { color: theme.textMuted }]} numberOfLines={1}>
                    {b.District}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 16 },
  title: { fontSize: textSize.xxxl, fontWeight: '700' },
  subtitle: { fontSize: textSize.md, lineHeight: 20 },
  locationError: { fontSize: textSize.md, lineHeight: 18 },
  detectingWrap: { alignItems: 'center', paddingVertical: 40 },
  stampArea: { alignItems: 'center', gap: 8, marginVertical: 4 },
  stampName: { fontSize: textSize.base, fontWeight: '600', textAlign: 'center' },
  stampRegion: { fontSize: textSize.sm, fontWeight: '600' },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  changeBtnText: {
    fontSize: textSize.sm,
    fontWeight: '600',
  },
  visitedNotice: {
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  visitedNoticeText: { fontSize: textSize.md, textAlign: 'center' },
  fieldGroup: { gap: 4 },
  fieldLabel: {
    fontSize: textSize.md,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  optional: { fontWeight: '500', textTransform: 'none', letterSpacing: 0 },
  noteTextarea: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    fontSize: textSize.base,
    lineHeight: 22,
    minHeight: 80,
  },
  charCount: { fontSize: textSize.sm, textAlign: 'right' },
  checkInBtn: {
    padding: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 4,
  },
  checkInBtnText: { color: '#fff', fontSize: textSize.base, fontWeight: '700' },
  // Picker
  pickerWrap: { gap: 10 },
  pickerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerSearchInput: {
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
  pickerList: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  pickerRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 2,
  },
  pickerRowText: {
    fontSize: textSize.base,
    fontWeight: '500',
  },
  pickerRowDistrict: {
    fontSize: textSize.sm,
  },
  // Success
  successWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 8,
  },
  successLabel: { fontSize: textSize.xxl, fontWeight: '700', marginTop: 16 },
  successBranch: { fontSize: textSize.base, fontWeight: '600' },
  successRegion: { fontSize: textSize.md },
  viewBranchBtn: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radius.md,
    minWidth: 200,
    alignItems: 'center',
  },
  viewBranchBtnText: { color: '#fff', fontSize: textSize.base, fontWeight: '700' },
  doneLink: { fontSize: textSize.md, fontWeight: '600', marginTop: 4 },
})
