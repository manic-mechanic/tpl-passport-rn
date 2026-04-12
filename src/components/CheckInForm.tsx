import Ionicons from '@expo/vector-icons/Ionicons'
import * as Location from 'expo-location'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { haversineKm, sortedBranches } from '../composables/useRegion'
import { useTheme } from '../hooks/useTheme'
import { usePassportStore } from '../stores/passport'
import { fonts, radius, textSize } from '../theme'
import type { Branch } from '../types'
import { StampShape } from './StampShape'

const FALLBACK_CODE = 'TRL' // shown when GPS is unavailable
const MAX_CHECKIN_DISTANCE_KM = 0.1 // must be within 100 m to check in
const LOCATION_TIMEOUT_CODE = 3 // GeolocationPositionError.TIMEOUT

interface Props {
  prefillCode?: string
  onSuccess: (branch: Branch, timestamp: string) => void
}

export function CheckInForm({ prefillCode, onSuccess }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const [selectedCode, setSelectedCode] = useState('')
  const [noteText, setNoteText] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')

  const checkIn = usePassportStore(s => s.checkIn)
  const hasVisitedToday = usePassportStore(s => s.hasVisitedToday)
  const bypassLocationFence = usePassportStore(s => s.profile.bypassLocationFence)

  const selectedBranch: Branch | null = sortedBranches.find(b => b.BranchCode === selectedCode) ?? null

  const pickerResults: Branch[] = pickerSearch.trim()
    ? sortedBranches.filter(b =>
      b.BranchName.toLowerCase().includes(pickerSearch.toLowerCase())
    )
    : sortedBranches

  useFocusEffect(
    useCallback(() => {
      setNoteText('')
      setLocationError(null)
      setCheckInError(null)
      setShowPicker(false)
      setPickerSearch('')
      if (prefillCode) {
        if (hasVisitedToday(prefillCode)) {
          showAlreadyVisitedAlert(prefillCode, () => detectNearest())
        } else {
          setSelectedCode(prefillCode)
          setDetecting(false)
        }
      } else {
        setSelectedCode('')
        detectNearest()
      }
    }, [prefillCode])
  )

  function showAlreadyVisitedAlert(code: string, onDismiss: () => void) {
    const branch = sortedBranches.find(b => b.BranchCode === code)
    Alert.alert(
      'Already checked in',
      `You've already checked in at ${branch?.BranchName ?? code} today.`,
      [{ text: 'OK', onPress: onDismiss }]
    )
  }

  async function detectNearest() {
    setDetecting(true)
    setLocationError(null)
    setCheckInError(null)
    setShowPicker(false)
    setSelectedCode('')
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setSelectedCode(FALLBACK_CODE)
        setLocationError('Location access denied — showing default branch.')
        return
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const nearest = sortedBranches
        .map(b => ({ ...b, distKm: haversineKm(pos.coords.latitude, pos.coords.longitude, b.Lat, b.Long) }))
        .sort((a, b) => a.distKm - b.distKm)[0]
      if (hasVisitedToday(nearest.BranchCode)) {
        showAlreadyVisitedAlert(nearest.BranchCode, () => setShowPicker(true))
      } else {
        setSelectedCode(nearest.BranchCode)
      }
    } catch {
      setSelectedCode(FALLBACK_CODE)
      setLocationError('Could not determine location — showing default branch.')
    } finally {
      setDetecting(false)
    }
  }

  function pickBranch(code: string) {
    if (hasVisitedToday(code)) {
      showAlreadyVisitedAlert(code, () => {})
      return
    }
    setSelectedCode(code)
    setShowPicker(false)
    setPickerSearch('')
    setLocationError(null)
    setCheckInError(null)
  }

  async function doCheckIn() {
    if (!selectedBranch) return
    setCheckInError(null)

    if (!bypassLocationFence) {
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        const km = haversineKm(pos.coords.latitude, pos.coords.longitude, selectedBranch.Lat, selectedBranch.Long)
        if (km > MAX_CHECKIN_DISTANCE_KM) {
          const dist = km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m`
          setCheckInError(`You're ${dist} away — you must be within 100m to check in.`)
          return
        }
      } catch (err: any) {
        setCheckInError(err?.code === LOCATION_TIMEOUT_CODE ? 'Location check timed out. Try again.' : 'Location access denied.')
        return
      }
    }

    const timestamp = checkIn(selectedBranch.BranchCode, noteText.trim())
    if (timestamp) {
      setNoteText('')
      onSuccess(selectedBranch, timestamp)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.tplNavy }]}>
        <Text style={[styles.headerTitle, { fontFamily: fonts.display }]}>Check In</Text>
      </View>
      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.bg }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: 20, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {detecting
            ? 'Detecting your location…'
            : selectedBranch
              ? `Closest branch — ${selectedBranch.BranchName}`
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
              <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.changeBtn} hitSlop={8}>
                <Ionicons name="swap-horizontal-outline" size={14} color={theme.tplBlue} />
                <Text style={[styles.changeBtnText, { color: theme.tplBlue }]}>Change branch</Text>
              </TouchableOpacity>
              {/* Reserved space for check-in error — prevents layout shift */}
              <View style={styles.checkInErrorWrap}>
                {checkInError ? (
                  <Text style={[styles.checkInErrorText, { color: '#c0392b' }]}>
                    {checkInError}
                  </Text>
                ) : null}
              </View>
            </View>

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

            <TouchableOpacity
              style={[styles.checkInBtn, { backgroundColor: theme.tplBlue }]}
              onPress={doCheckIn}
            >
              <Text style={styles.checkInBtnText}>Check in</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Branch picker — shown when no branch detected or user tapped "Change branch"
          <View style={styles.pickerWrap}>
            <View style={[styles.pickerSearchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="search-outline" size={18} color={theme.textMuted} />
              <TextInput
                style={[styles.pickerSearchInput, { color: theme.textPrimary }]}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                placeholder="Search branches…"
                placeholderTextColor={theme.textMuted}
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

            <ScrollView
              style={[styles.pickerList, { borderColor: theme.border }]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              nestedScrollEnabled
            >
              {pickerResults.map((b, i) => (
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
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: textSize.xxxl,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: -0.5,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 16 },
  subtitle: { fontSize: textSize.md, lineHeight: 20 },
  locationError: { fontSize: textSize.md, lineHeight: 18 },
  detectingWrap: { alignItems: 'center', paddingVertical: 40 },
  stampArea: { alignItems: 'center', gap: 8, marginVertical: 4 },
  stampName: { fontSize: textSize.base, fontWeight: '600', textAlign: 'center' },
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
  checkInErrorWrap: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  checkInErrorText: {
    fontSize: textSize.md,
    textAlign: 'center',
    lineHeight: 18,
  },
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
  // Branch picker
  pickerWrap: { gap: 10, flex: 1 },
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
})
