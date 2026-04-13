import { BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useTheme } from '../hooks/useTheme'
import { usePassportStore } from '../stores/passport'
import { fonts, radius, textSize } from '../theme'
import type { CheckIn } from '../types'

// Expose the same surface as BottomSheetModal so callers use the same ref type.
export interface NoteEditSheetMethods {
  present: (visit: CheckIn) => void
  dismiss: () => void
}

const ANIMATION_CONFIGS = { damping: 24, stiffness: 200, mass: 0.6, overshootClamping: true }

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
function NoteEditSheetComponent(
  _props: {},
  ref: React.ForwardedRef<NoteEditSheetMethods>,
) {
  const theme = useTheme()
  const tabBarHeight = useBottomTabBarHeight()
  const updateCheckIn = usePassportStore(s => s.updateCheckIn)
  const sheetRef = useRef<BottomSheetModal>(null)
  const inputRef = useRef<TextInput>(null)

  const [visit, setVisit] = useState<CheckIn | null>(null)
  const [draftNote, setDraftNote] = useState('')

  useImperativeHandle(ref, () => ({
    present(v: CheckIn) {
      setVisit(v)
      setDraftNote(v.note ?? '')
      sheetRef.current?.present()
    },
    dismiss() {
      sheetRef.current?.dismiss()
    },
  }))

  function save() {
    if (visit) updateCheckIn(visit.timestamp, { note: draftNote })
    sheetRef.current?.dismiss()
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      bottomInset={tabBarHeight}
      backgroundStyle={[styles.sheetBg, { backgroundColor: theme.surface, borderColor: theme.border }]}
      handleIndicatorStyle={{ backgroundColor: theme.border }}
      style={styles.sheetShadow}
      animationConfigs={ANIMATION_CONFIGS}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onChange={(index) => {
        if (index === 0) setTimeout(() => inputRef.current?.focus(), 100)
      }}
    >
      <BottomSheetView style={styles.content}>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: fonts.display }]}>
          {visit?.note ? 'Edit note' : 'Add a note'}
        </Text>

        <BottomSheetTextInput
          ref={inputRef}
          style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bg }]}
          value={draftNote}
          onChangeText={setDraftNote}
          placeholder="What do you remember about this visit?"
          placeholderTextColor={theme.textMuted}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => sheetRef.current?.dismiss()} style={[styles.btn, { borderColor: theme.border }]}>
            <Text style={[styles.btnText, { color: theme.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={save} style={[styles.btn, styles.btnPrimary, { backgroundColor: theme.tplBlue }]}>
            <Text style={[styles.btnText, { color: '#fff' }]}>Save</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export const NoteEditSheet = forwardRef(NoteEditSheetComponent)

const styles = StyleSheet.create({
  sheetBg: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  sheetShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 14,
  },
  title: {
    fontSize: textSize.base,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: 12,
    fontSize: textSize.sm,
    lineHeight: 20,
    minHeight: 100,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnPrimary: {
    borderWidth: 0,
  },
  btnText: {
    fontSize: textSize.sm,
    fontWeight: '600',
  },
})
