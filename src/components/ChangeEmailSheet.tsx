import { BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '../hooks/useTheme'
import { authClient } from '../lib/auth-client'
import { fonts, radius, textSize } from '../theme'

export interface ChangeEmailSheetMethods {
  present: () => void
  dismiss: () => void
}

const ANIMATION_CONFIGS = { damping: 24, stiffness: 200, mass: 0.6, overshootClamping: true }

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
function ChangeEmailSheetComponent(_props: {}, ref: React.ForwardedRef<ChangeEmailSheetMethods>) {
  const theme = useTheme()
  const tabBarHeight = useBottomTabBarHeight()
  const sheetRef = useRef<BottomSheetModal>(null)
  const { data: session } = authClient.useSession()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useImperativeHandle(ref, () => ({
    present() {
      setEmail(''); setError('')
      sheetRef.current?.present()
    },
    dismiss() { sheetRef.current?.dismiss() },
  }))

  async function submit() {
    const trimmed = email.trim()
    if (!trimmed) { setError('Enter a new email address.'); return }
    if (trimmed === session?.user?.email) { setError('That is already your current email.'); return }
    setError(''); setLoading(true)
    try {
      const { error: err } = await authClient.changeEmail({ newEmail: trimmed })
      if (err) {
        setError(err.message ?? 'Something went wrong.')
      } else {
        sheetRef.current?.dismiss()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      bottomInset={tabBarHeight}
      backgroundStyle={[styles.sheetBg, { backgroundColor: theme.surface, borderColor: theme.border }]}
      handleIndicatorStyle={{ backgroundColor: theme.border }}
      style={[styles.sheetShadow, { shadowColor: theme.shadowColor }]}
      animationConfigs={ANIMATION_CONFIGS}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView style={styles.content}>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: fonts.display }]}>
          Change email
        </Text>

        {session?.user?.email ? (
          <Text style={[styles.currentEmail, { color: theme.textMuted }]}>
            Current: {session.user.email}
          </Text>
        ) : null}

        <BottomSheetTextInput
          style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bg }]}
          value={email}
          onChangeText={v => { setEmail(v); setError('') }}
          placeholder="New email address"
          placeholderTextColor={theme.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        {error ? <Text style={[styles.error, { color: '#c0392b' }]}>{error}</Text> : null}

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => sheetRef.current?.dismiss()}
            style={[styles.btn, { borderColor: theme.border }]}
          >
            <Text style={[styles.btnText, { color: theme.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={submit}
            disabled={loading}
            style={[styles.btn, styles.btnPrimary, { backgroundColor: theme.tplBlue, opacity: loading ? 0.6 : 1 }]}
          >
            <Text style={[styles.btnText, { color: '#fff' }]}>{loading ? 'Saving…' : 'Update'}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export const ChangeEmailSheet = forwardRef(ChangeEmailSheetComponent)

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
    gap: 12,
  },
  title: {
    fontSize: textSize.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  currentEmail: {
    fontSize: textSize.sm,
    marginTop: -4,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: textSize.sm,
  },
  error: {
    fontSize: textSize.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnPrimary: { borderWidth: 0 },
  btnText: { fontSize: textSize.sm, fontWeight: '600' },
})
