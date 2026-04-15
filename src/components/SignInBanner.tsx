import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useTheme } from '@/src/hooks/useTheme'
import { usePassportStore } from '@/src/stores/passport'
import { authClient } from '@/src/lib/auth-client'
import { radius, textSize } from '@/src/theme'

const BANNER_DISMISSED_KEY = 'signin_banner_dismissed'

export function SignInBanner() {
  const theme = useTheme()
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const hasCheckIns = usePassportStore(s => s.checkIns.length > 0)
  const [bannerDismissed, setBannerDismissed] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem(BANNER_DISMISSED_KEY).then(val => {
      setBannerDismissed(val === '1')
    })
  }, [])

  if (session?.user || !hasCheckIns || bannerDismissed) return null

  function dismiss() {
    setBannerDismissed(true)
    AsyncStorage.setItem(BANNER_DISMISSED_KEY, '1')
  }

  return (
    <View style={[styles.banner, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
      <View style={styles.bannerBody}>
        <Text style={[styles.bannerText, { color: theme.textMuted }]}>
          Save your progress — access your passport on any device
        </Text>
        <TouchableOpacity onPress={() => router.push('/sign-in' as Href)} hitSlop={8}>
          <Text style={[styles.bannerLink, { color: theme.tplBlue }]}>Sign in →</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={dismiss} hitSlop={8} accessibilityLabel="Dismiss">
        <Text style={[styles.bannerDismiss, { color: theme.textMuted }]}>✕</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  bannerBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  bannerText: {
    flex: 1,
    fontSize: textSize.sm,
    lineHeight: 18,
  },
  bannerLink: {
    fontSize: textSize.sm,
    fontWeight: '700',
    flexShrink: 0,
  },
  bannerDismiss: {
    fontSize: textSize.xs,
    padding: 4,
    lineHeight: 14,
  },
})
