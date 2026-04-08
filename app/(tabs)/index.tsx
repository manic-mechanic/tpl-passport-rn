import { ScrollView, View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/src/hooks/useTheme'
import { PassportCard } from '@/src/components/PassportCard'
import { RecentVisits } from '@/src/components/RecentVisits'
import { fonts, textSize } from '@/src/theme'

export default function HomeScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.topBar, { backgroundColor: theme.tplNavy, paddingTop: insets.top + 8 }]}>
        <Text style={[styles.wordmark, { fontFamily: fonts.display }]}>
          passport<Text style={styles.wordmarkColon}>:</Text>
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <PassportCard />
        <RecentVisits />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
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
