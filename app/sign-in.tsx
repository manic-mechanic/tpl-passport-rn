import { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/src/hooks/useTheme'
import { authClient } from '@/src/lib/auth-client'
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { radius, textSize } from '@/src/theme'

export default function SignInScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const emailRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)

  function switchMode(next: 'signin' | 'signup') {
    setMode(next)
    setError(null)
  }

  async function handleEmailSubmit() {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (mode === 'signup') {
        const { error: err } = await authClient.signUp.email({ email, password, name })
        if (err) { console.error('signup error', JSON.stringify(err)); setError(`${err.message} (${err.status})`); return }
      } else {
        const { error: err } = await authClient.signIn.email({ email, password })
        if (err) { console.error('signin error', JSON.stringify(err)); setError(`${err.message} (${err.status})`); return }
      }
      router.back()
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError(null)
    try {
      const { error: err } = await authClient.signIn.social({ provider: 'google', callbackURL: 'tplpassportrn://' })
      if (err) { console.error('google error', JSON.stringify(err)); setError(`${err.message ?? 'Google sign in failed.'} (${err.status})`); return }
      router.back()
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader
        title={mode === 'signin' ? 'Sign In' : 'Create Account'}
        onClose={() => router.back()}
        topInset={12}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Tab row */}
          <View style={[styles.tabRow, { borderBottomColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.tabBtn, mode === 'signin' && { borderBottomColor: theme.tplBlue }]}
              onPress={() => switchMode('signin')}
            >
              <Text style={[styles.tabBtnText, { color: mode === 'signin' ? theme.tplBlue : theme.textMuted }]}>
                Sign in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, mode === 'signup' && { borderBottomColor: theme.tplBlue }]}
              onPress={() => switchMode('signup')}
            >
              <Text style={[styles.tabBtnText, { color: mode === 'signup' ? theme.tplBlue : theme.textMuted }]}>
                Create account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email fields */}
          {mode === 'signup' && (
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Name</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surface, borderColor: theme.border }]}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Email</Text>
            <TextInput
              ref={emailRef}
              style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surface, borderColor: theme.border }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Password</Text>
            <TextInput
              ref={passwordRef}
              style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surface, borderColor: theme.border }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              returnKeyType="done"
              onSubmitEditing={handleEmailSubmit}
            />
          </View>

          {error && (
            <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.tplBlue }]}
            onPress={handleEmailSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>
            }
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textMuted }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          {/* Google */}
          <TouchableOpacity
            style={[styles.googleBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleGoogle}
            disabled={googleLoading}
          >
            {googleLoading
              ? <ActivityIndicator color={theme.textPrimary} />
              : <>
                  <Ionicons name="logo-google" size={18} color={theme.textPrimary} />
                  <Text style={[styles.googleBtnText, { color: theme.textPrimary }]}>Continue with Google</Text>
                </>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabBtnText: {
    fontSize: textSize.md,
    fontWeight: '600',
  },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: textSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: textSize.base,
  },
  errorText: {
    fontSize: textSize.md,
    lineHeight: 18,
  },
  submitBtn: {
    paddingVertical: 15,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: textSize.base,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: textSize.sm },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  googleBtnText: {
    fontSize: textSize.base,
    fontWeight: '600',
  },
})
