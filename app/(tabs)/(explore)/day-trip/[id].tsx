import { ScreenHeader } from '@/src/components/ScreenHeader'
import { StampShape } from '@/src/components/StampShape'
import { sortedBranches, buildMapsUrl } from '@/src/composables/useRegion'
import { useTheme } from '@/src/hooks/useTheme'
import { usePassportStore } from '@/src/stores/passport'
import { radius, textSize } from '@/src/theme'
import type { Branch, Route } from '@/src/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import routesData from '@tpl-passport/shared/data/routes.json'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const branchesByCode = Object.fromEntries(sortedBranches.map(b => [b.BranchCode, b]))

export default function DayTripDetailScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const hasVisited = usePassportStore(s => s.hasVisited)

  const trip = (routesData as Route[]).find(r => r.id === id)
  const branchObjects: Branch[] = trip
    ? trip.branches.map(code => branchesByCode[code]).filter((b): b is Branch => !!b)
    : []

  const mapsUrl = trip ? buildMapsUrl(branchObjects) : null

  if (!trip) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScreenHeader title="Day Trip" onBack={() => router.back()} />
        <Text style={[styles.notFound, { color: theme.textMuted }]}>Route not found.</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title="Day Trips" onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Route meta */}
        <View style={styles.routeTop}>
          <Text style={[styles.routeName, { color: theme.textPrimary, fontFamily: fonts.display }]}>
            {trip.name}
          </Text>
          <Text style={[styles.routeChips, { color: theme.textMuted }]}>
            {trip.area} · {branchObjects.length} stops · {trip.duration}
          </Text>
          <Text style={[styles.routeDesc, { color: theme.textMuted }]}>{trip.description}</Text>
        </View>

        {/* Maps button */}
        {mapsUrl && (
          <TouchableOpacity
            style={[styles.mapsBtn, { backgroundColor: theme.tplBlue }]}
            onPress={() => Linking.openURL(mapsUrl)}
          >
            <Ionicons name="map-outline" size={16} color="#fff" />
            <Text style={styles.mapsBtnText}>Open route in Maps</Text>
          </TouchableOpacity>
        )}

        {/* Stops */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: fonts.display }]}>
            Stops
          </Text>
          <View style={[styles.stopsList, { borderColor: theme.border }]}>
            {branchObjects.map((branch, i) => (
              <TouchableOpacity
                key={branch.BranchCode}
                style={[
                  styles.stopRow,
                  { borderBottomColor: theme.borderSoft },
                  i === branchObjects.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => router.push({ pathname: '../branch/[id]', params: { id: branch.BranchCode } })}
              >
                <Text style={[styles.stopIndex, { color: theme.textMuted }]}>{i + 1}</Text>
                <StampShape
                  branchCode={branch.BranchCode}
                  wardNo={branch.WardNo}
                  size={36}
                  ghost={!hasVisited(branch.BranchCode)}
                />
                <View style={styles.stopInfo}>
                  <Text style={[styles.stopName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {branch.BranchName}
                  </Text>
                  <Text style={[styles.stopAddress, { color: theme.textMuted }]} numberOfLines={1}>
                    {branch.Address.split(',')[0]}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Local Suggestions placeholder */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: fonts.display }]}>
            Local Suggestions
          </Text>
          <Text style={[styles.comingSoon, { color: theme.textMuted }]}>
            Curated tips from locals and librarians — coming soon.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    paddingTop: 24,
    gap: 24,
  },
  routeTop: { gap: 6 },
  routeName: {
    fontSize: textSize.xxl,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  routeChips: {
    fontSize: textSize.sm,
    lineHeight: 18,
  },
  routeDesc: {
    fontSize: textSize.sm,
    lineHeight: 20,
    marginTop: 2,
  },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  mapsBtnText: {
    fontSize: textSize.sm,
    fontWeight: '600',
    color: '#fff',
  },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: textSize.lg,
    fontWeight: '700',
  },
  stopsList: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  stopIndex: {
    fontSize: textSize.sm,
    fontWeight: '700',
    width: 18,
    textAlign: 'center',
  },
  stopInfo: { flex: 1, gap: 2 },
  stopName: { fontSize: textSize.md, fontWeight: '600' },
  stopAddress: { fontSize: textSize.sm },
  comingSoon: {
    fontSize: textSize.sm,
    fontStyle: 'italic',
  },
  notFound: {
    padding: 24,
    fontSize: textSize.md,
  },
})
