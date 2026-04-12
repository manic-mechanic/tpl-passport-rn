import { ScrollView, View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/src/hooks/useTheme'
import { HomeBadgesStrip } from '@/src/components/HomeBadgesStrip'
import { PassportCard } from '@/src/components/PassportCard'
import { RecentVisits } from '@/src/components/RecentVisits'
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { fonts, textSize } from '@/src/theme'

export default function HomeScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader>
        <Text style={[styles.wordmark, { fontFamily: fonts.display }]}>
          passport<Text style={styles.wordmarkColon}>:</Text>
        </Text>
      </ScreenHeader>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <PassportCard />
        <RecentVisits />
        <HomeBadgesStrip />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  wordmark: {
    fontSize: textSize.xxxl,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: -0.5,
  },
  wordmarkColon: {
    color: 'rgba(255,255,255,0.5)',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    gap: 22,
  },
})
