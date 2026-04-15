import Ionicons from '@expo/vector-icons/Ionicons'
import * as Location from 'expo-location'
import { useFocusEffect } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
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
import { getErrorCode } from '../lib/errors'
import { filterBranches, formatDist, haversineKm, sortedBranches } from '../composables/useRegion'
import { useTheme } from '../hooks/useTheme'
import { useLocationDetector } from '../hooks/useLocationDetector'
import { MAX_CHECKIN_DISTANCE_KM, LOCATION_TIMEOUT_CODE } from '../constants'
import { usePassportStore } from '../stores/passport'
import { fonts, radius, textSize } from '../theme'
import type { Branch } from '../types'
import { ScreenHeader } from './ScreenHeader'
import { StampShape } from './StampShape'
import { CheckInBranchPicker } from './CheckInBranchPicker'

interface Props {
  prefillCode?: string
  onSuccess: (branch: Branch, timestamp: string) => void
}

export function CheckInForm({ prefillCode, onSuccess }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const [selectedCode, setSelectedCode] = useState('')
  const [noteText, setNoteText] = useState('')
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')

  const checkIn = usePassportStore(s => s.checkIn)
  const hasVisitedToday = usePassportStore(s => s.hasVisitedToday)
  const bypassLocationFence = usePassportStore(s => s.profile.bypassLocationFence)

  const { detecting, locationError, setLocationError, detect } = useLocationDetector(hasVisitedToday)

  // Refs so useFocusEffect always calls the latest version without re-registering on every render.
  const hasVisitedTodayRef = useRef(hasVisitedToday)
  hasVisitedTodayRef.current = hasVisitedToday
  const detectNearestRef = useRef(detectNearest)
  detectNearestRef.current = detectNearest

  const selectedBranch: Branch | null = sortedBranches.find(b => b.BranchCode === selectedCode) ?? null
  const pickerResults: Branch[] = filterBranches(pickerSearch)

  useFocusEffect(
    useCallback(() => {
      setNoteText('')
      setLocationError(null)
      setCheckInError(null)
      setShowPicker(false)
      setPickerSearch('')
      if (prefillCode) {
        if (hasVisitedTodayRef.current(prefillCode)) {
          showAlreadyVisitedAlert(prefillCode, () => detectNearestRef.current())
        } else {
          setSelectedCode(prefillCode)
          // detecting stays false — skip location check when prefilled
        }
      } else {
        setSelectedCode('')
        detectNearestRef.current()
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
    setCheckInError(null)
    setShowPicker(false)
    setSelectedCode('')
    const result = await detect()
    if (result.type === 'code') setSelectedCode(result.code)
    else if (result.type === 'picker') setShowPicker(true)
    // 'error' case: locationError already set by hook
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
          const dist = formatDist(km)
          setCheckInError(`You're ${dist} away — you must be within 100m to check in.`)
          return
        }
      } catch (err) {
        setCheckInError(getErrorCode(err) === LOCATION_TIMEOUT_CODE ? 'Location check timed out. Try again.' : 'Location access denied.')
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
      <ScreenHeader title="Check In" />
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
                  <Text style={[styles.checkInErrorText, { color: theme.error }]}>
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
          <CheckInBranchPicker
            search={pickerSearch}
            onSearchChange={setPickerSearch}
            results={pickerResults}
            onPick={pickBranch}
            showLocateOption={showPicker}
            onLocate={detectNearest}
          />
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
})
