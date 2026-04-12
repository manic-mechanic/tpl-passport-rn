import { useRef } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/src/hooks/useTheme'
import { sortedBranches } from '@/src/composables/useRegion'
import { BranchDetail } from '@/src/components/BranchDetail'
import { textSize } from '@/src/theme'
import { ScreenHeader } from '@/src/components/ScreenHeader'

export default function BranchDetailScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const segments = useSegments()
  const { id } = useLocalSearchParams<{ id: string }>()
  const scrollRef = useRef<ScrollView>(null)

  const tab = segments.find(s => s === '(explore)' || s === '(passport)')
  const origin: 'explore' | 'passport' | undefined =
    tab === '(explore)' ? 'explore' : tab === '(passport)' ? 'passport' : undefined

  function navigateToNearby(code: string) {
    router.replace({ pathname: './branch/[id]', params: { id: code } })
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }

  const branch = sortedBranches.find(b => b.BranchCode === id) ?? null

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title={branch?.BranchName ?? ''} onBack={() => router.back()} />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {branch ? (
          <BranchDetail branch={branch} origin={origin} onNearbyPress={navigateToNearby} />
        ) : (
          <Text style={[styles.notFound, { color: theme.textMuted }]}>Branch not found.</Text>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 20 },
  notFound: { paddingTop: 18, fontSize: textSize.md },
})
