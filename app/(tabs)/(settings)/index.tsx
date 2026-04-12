import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '@/src/hooks/useTheme'
import { usePassportStore } from '@/src/stores/passport'
import { authClient } from '@/src/lib/auth-client'
import { fonts, radius, textSize } from '@/src/theme'

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Light' },
  { value: '' as const,      label: 'Auto' },
  { value: 'dark' as const,  label: 'Dark' },
]

export default function SettingsScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const profile = usePassportStore(s => s.profile)
  const updateProfile = usePassportStore(s => s.updateProfile)
  const { data: session } = authClient.useSession()

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
    <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: theme.tplNavy }]}>
      <Text style={[styles.headerTitle, { fontFamily: fonts.display }]}>Settings</Text>
    </View>
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: 20, paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Account */}
      <View style={styles.group}>
        <Text style={[styles.groupLabel, { color: theme.textMuted }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
          {session?.user ? (
            <>
              <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: theme.borderSoft }]}>
                <View style={styles.labelWrap}>
                  <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                    {session.user.name || session.user.email}
                  </Text>
                  {session.user.name ? (
                    <Text style={[styles.settingHint, { color: theme.textMuted }]}>{session.user.email}</Text>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => authClient.signOut()}
              >
                <Text style={[styles.signInLink, { color: '#c0392b' }]}>Sign out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/sign-in' as any)}>
              <View style={styles.labelWrap}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Save your progress</Text>
                <Text style={[styles.settingHint, { color: theme.textMuted }]}>
                  Access your passport on any device
                </Text>
              </View>
              <Text style={[styles.signInLink, { color: theme.tplBlue }]}>Sign in →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Appearance */}
      <View style={styles.group}>
        <Text style={[styles.groupLabel, { color: theme.textMuted }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Theme</Text>
            <View style={[styles.themeToggle, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              {THEME_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={String(opt.value)}
                  style={[
                    styles.themeBtn,
                    profile.theme === opt.value && [styles.themeBtnActive, { backgroundColor: theme.surface }],
                  ]}
                  onPress={() => updateProfile({ theme: opt.value })}
                >
                  <Text style={[
                    styles.themeBtnText,
                    { color: profile.theme === opt.value ? theme.textPrimary : theme.textMuted },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Developer */}
      <View style={styles.group}>
        <Text style={[styles.groupLabel, { color: theme.textMuted }]}>Developer</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
          <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: theme.borderSoft }]}>
            <View style={styles.labelWrap}>
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Location check</Text>
              <Text style={[styles.settingHint, { color: theme.textMuted }]}>
                Require being within 100 m to check in
              </Text>
            </View>
            <View style={[styles.themeToggle, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              {[{ v: false, l: 'On' }, { v: true, l: 'Off' }].map(opt => (
                <TouchableOpacity
                  key={String(opt.v)}
                  style={[
                    styles.themeBtn,
                    profile.bypassLocationFence === opt.v && [styles.themeBtnActive, { backgroundColor: theme.surface }],
                  ]}
                  onPress={() => updateProfile({ bypassLocationFence: opt.v })}
                >
                  <Text style={[
                    styles.themeBtnText,
                    { color: profile.bypassLocationFence === opt.v ? theme.textPrimary : theme.textMuted },
                  ]}>
                    {opt.l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {__DEV__ && (
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() =>
                Alert.alert('Reset all data', 'Wipes local store and signs out. Cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                      await authClient.signOut()
                      await AsyncStorage.clear().catch(() => {})
                    },
                  },
                ])
              }
            >
              <Text style={[styles.settingLabel, { color: '#c0392b' }]}>Reset all data</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* About */}
      <View style={styles.group}>
        <Text style={[styles.groupLabel, { color: theme.textMuted }]}>About</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
          <View style={[styles.aboutRow, { borderBottomColor: theme.borderSoft }]}>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Version</Text>
            <Text style={[styles.aboutVal, { color: theme.textMuted }]}>1.0 MVP</Text>
          </View>
          <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.aboutLink, { color: theme.tplBlue }]}>Toronto Public Library ↗</Text>
          </View>
        </View>
      </View>
    </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 18 },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: textSize.xxxl,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: -0.5,
  },
  group: { marginBottom: 24 },
  groupLabel: {
    fontSize: textSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  labelWrap: { flex: 1, marginRight: 12 },
  settingLabel: { fontSize: textSize.md, fontWeight: '600' },
  settingHint: { fontSize: textSize.sm, marginTop: 2, lineHeight: 16 },
  signInLink: { fontSize: textSize.md, fontWeight: '600' },
  themeToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.pill,
    padding: 3,
    gap: 2,
  },
  themeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  themeBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  themeBtnText: { fontSize: textSize.md, fontWeight: '600' },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderBottomWidth: 1,
  },
  aboutVal: { fontSize: textSize.md },
  aboutLink: { fontSize: textSize.md, fontWeight: '600' },
})
