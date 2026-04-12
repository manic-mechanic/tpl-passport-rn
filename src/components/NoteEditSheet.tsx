import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import {
  Keyboard, KeyboardAvoidingView, Modal, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../hooks/useTheme'
import { usePassportStore } from '../stores/passport'
import { fonts, radius, textSize } from '../theme'
import type { CheckIn } from '../types'

// Expose the same surface as BottomSheetModal so callers use the same ref type.
export interface NoteEditSheetMethods {
  present: (visit: CheckIn) => void
  dismiss: () => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
function NoteEditSheetComponent(
  _props: {},
  ref: React.ForwardedRef<NoteEditSheetMethods>,
) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const updateCheckIn = usePassportStore(s => s.updateCheckIn)
  const inputRef = useRef<TextInput>(null)

  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const [visit, setVisit] = useState<CheckIn | null>(null)
  const [draftNote, setDraftNote] = useState('')

  useImperativeHandle(ref, () => ({
    present(v: CheckIn) {
      setVisit(v)
      setDraftNote(v.note ?? '')
      setClosing(false)
      setVisible(true)
    },
    dismiss: close,
  }))

  function close() {
    setClosing(true)   // disable all touches immediately
    Keyboard.dismiss()
    setVisible(false)
  }

  function save() {
    if (visit) updateCheckIn(visit.timestamp, { note: draftNote })
    close()
  }

  // Focus input after slide animation (~300ms on iOS).
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => inputRef.current?.focus(), 320)
      return () => clearTimeout(t)
    }
  }, [visible])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        pointerEvents={closing ? 'none' : 'box-none'}
      >
        {/* Tappable backdrop */}
        <TouchableWithoutFeedback onPress={close}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <View style={[styles.sheet, { backgroundColor: theme.bg, paddingBottom: insets.bottom + 16 }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          <Text style={[styles.title, { color: theme.textPrimary, fontFamily: fonts.display }]}>
            {visit?.note ? 'Edit note' : 'Add a note'}
          </Text>

          <TextInput
            ref={inputRef}
            style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
            value={draftNote}
            onChangeText={setDraftNote}
            placeholder="What do you remember about this visit?"
            placeholderTextColor={theme.textMuted}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <TouchableOpacity onPress={close} style={[styles.btn, { borderColor: theme.border }]}>
              <Text style={[styles.btnText, { color: theme.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} style={[styles.btn, styles.btnPrimary, { backgroundColor: theme.tplBlue }]}>
              <Text style={[styles.btnText, { color: '#fff' }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export const NoteEditSheet = forwardRef(NoteEditSheetComponent)

const styles = StyleSheet.create({
  kav: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
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
