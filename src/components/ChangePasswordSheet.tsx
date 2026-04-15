import { BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '../hooks/useTheme'
import { authClient } from '../lib/auth-client'
import { fonts, radius, textSize } from '../theme'

export interface ChangePasswordSheetMethods {
  present: () => void
  dismiss: () => void
}

const ANIMATION_CONFIGS = { damping: 24, stiffness: 200, mass: 0.6, overshootClamping: true }

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
function ChangePasswordSheetComponent(_props: {}, ref: React.ForwardedRef<ChangePasswordSheetMethods>) {
  const theme = useTheme()
  const tabBarHeight = useBottomTabBarHeight()
  const sheetRef = useRef<BottomSheetModal>(null)

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useImperativeHandle(ref, () => ({
    present() {
      setCurrent(''); setNext(''); setConfirm(''); setError('')
      sheetRef.current?.present()
    },
    dismiss() { sheetRef.current?.dismiss() },
  }))

  async function submit() {
    if (!current || !next || !confirm) { setError('All fields are required.'); return }
    if (next !== confirm) { setError('New passwords do not match.'); return }
    if (next.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError(''); setLoading(true)
    try {
      const { error: err } = await authClient.changePassword({ currentPassword: current, newPassword: next })
      if (err) {
        setError(
          err.code === 'CREDENTIAL_ACCOUNT_NOT_FOUND'
            ? 'No password on this account (signed in with Google).'
            : err.code === 'INVALID_PASSWORD'
              ? 'Current password is incorrect.'
              : (err.message ?? 'Something went wrong.')
        )
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
          Change password
        </Text>

        <BottomSheetTextInput
          style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bg }]}
          value={current}
          onChangeText={v => { setCurrent(v); setError('') }}
          placeholder="Current password"
          placeholderTextColor={theme.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          returnKeyType="next"
        />
        <BottomSheetTextInput
          style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bg }]}
          value={next}
          onChangeText={v => { setNext(v); setError('') }}
          placeholder="New password"
          placeholderTextColor={theme.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          returnKeyType="next"
        />
        <BottomSheetTextInput
          style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bg }]}
          value={confirm}
          onChangeText={v => { setConfirm(v); setError('') }}
          placeholder="Confirm new password"
          placeholderTextColor={theme.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        {error ? <Text style={[styles.error, { color: theme.error }]}>{error}</Text> : null}

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

export const ChangePasswordSheet = forwardRef(ChangePasswordSheetComponent)

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
