import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTheme } from '@/src/hooks/useTheme'
import { PassportCard } from '@/src/components/PassportCard'
import { RecentVisits } from '@/src/components/RecentVisits'
import { fonts, textSize } from '@/src/theme'
import Ionicons from '@expo/vector-icons/Ionicons'

export default function HomeScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.topBar, { backgroundColor: theme.tplNavy, paddingTop: insets.top + 10 }]}>
        <Text style={[styles.wordmark, { fontFamily: fonts.display }]}>
          passport<Text style={styles.wordmarkColon}>:</Text>
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} hitSlop={8}>
          <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  wordmark: {
    flex: 1,
    fontSize: textSize.xl,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  wordmarkColon: {
    color: 'rgba(255,255,255,0.55)',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    gap: 18,
  },
})
