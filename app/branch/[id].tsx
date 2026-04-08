import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/src/hooks/useTheme'
import { sortedBranches } from '@/src/composables/useRegion'
import { BranchDetail } from '@/src/components/BranchDetail'
import { fonts, textSize } from '@/src/theme'
import Ionicons from '@expo/vector-icons/Ionicons'

export default function BranchDetailModal() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const branch = (sortedBranches as any[]).find(b => b.BranchCode === id) ?? null

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: theme.tplNavy }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.display }]} numberOfLines={1}>
          {branch?.BranchName ?? ''}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {branch ? (
          <BranchDetail branch={branch} />
        ) : (
          <Text style={[styles.notFound, { color: theme.textMuted }]}>Branch not found.</Text>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  closeBtn: { width: 30 },
  headerTitle: {
    flex: 1,
    fontSize: textSize.lg,
    fontWeight: '600',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.92)',
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18 },
  notFound: { paddingTop: 18, fontSize: textSize.md },
})
