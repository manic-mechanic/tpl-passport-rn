import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/src/hooks/useTheme'
import { sortedBranches, haversineKm } from '@/src/composables/useRegion'
import { useBadgeCtx, BADGES } from '@/src/composables/useBadges'
import { StampShape } from '@/src/components/StampShape'
import { BadgeCard } from '@/src/components/BadgeCard'
import { fonts, radius, textSize } from '@/src/theme'
import routesData from '@/src/data/routes.json'

interface Route {
  id: string
  name: string
  mode: string
  area: string
  duration: string
  description: string
  branches: string[]
}

export default function ExploreScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const badgeCtx = useBadgeCtx()

  const [nearBy, setNearBy] = useState<any[]>([])
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => { detectNearby() }, [])

  async function detectNearby() {
    setLocationLoading(true)
    setLocationError(null)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setLocationError('Enable location to see nearby branches.')
        return
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const sorted = (sortedBranches as any[])
        .map(b => ({ ...b, distKm: haversineKm(pos.coords.latitude, pos.coords.longitude, b.Lat, b.Long) }))
        .sort((a, b) => a.distKm - b.distKm)
        .slice(0, 6)
      setNearBy(sorted)
    } catch {
      setLocationError('Could not detect location.')
    } finally {
      setLocationLoading(false)
    }
  }

  const routes = routesData as Route[]

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.tplNavy }]}>
        <Text style={[styles.title, { fontFamily: fonts.display }]}>Explore</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: 20, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Near Me ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: fonts.display }]}>
              Near Me
            </Text>
            {!locationLoading && (
              <TouchableOpacity onPress={detectNearby} hitSlop={8}>
                <Ionicons name="locate-outline" size={18} color={theme.tplBlue} />
              </TouchableOpacity>
            )}
          </View>

          {locationLoading ? (
            <ActivityIndicator color={theme.tplBlue} style={styles.loader} />
          ) : locationError ? (
            <View style={styles.errorRow}>
              <Text style={[styles.errorText, { color: theme.textMuted }]}>{locationError}</Text>
              <TouchableOpacity onPress={detectNearby}>
                <Text style={[styles.retryText, { color: theme.tplBlue }]}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.nearList, { borderColor: theme.border }]}>
              {nearBy.map((branch: any, i: number) => (
                <TouchableOpacity
                  key={branch.BranchCode}
                  style={[
                    styles.nearRow,
                    { borderBottomColor: theme.borderSoft },
                    i === nearBy.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => router.push(`/branch/${branch.BranchCode}` as any)}
                >
                  <StampShape branchCode={branch.BranchCode} wardNo={branch.WardNo} size={38} />
                  <View style={styles.nearInfo}>
                    <Text style={[styles.nearName, { color: theme.textPrimary }]} numberOfLines={1}>
                      {branch.BranchName}
                    </Text>
                    <Text style={[styles.nearDistrict, { color: theme.textMuted }]} numberOfLines={1}>
                      {branch.District}
                    </Text>
                  </View>
                  <Text style={[styles.nearDist, { color: theme.textMuted }]}>
                    {branch.distKm < 1
                      ? `${Math.round(branch.distKm * 1000)} m`
                      : `${branch.distKm.toFixed(1)} km`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Day Trips ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: fonts.display }]}>
            Day Trips
          </Text>
          {routes.map((route: Route) => {
            const routeBranches = route.branches
              .map(code => (sortedBranches as any[]).find((b: any) => b.BranchCode === code))
              .filter(Boolean)
            return (
              <View key={route.id} style={[styles.routeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.routeMeta}>
                  <View style={[styles.areaChip, { backgroundColor: `${theme.tplNavy}14` }]}>
                    <Text style={[styles.areaChipText, { color: theme.tplNavy }]}>{route.area}</Text>
                  </View>
                  <Text style={[styles.routeDuration, { color: theme.textMuted }]}>
                    {route.mode === 'walk' ? '🚶' : '🚲'} {route.duration}
                  </Text>
                </View>
                <Text style={[styles.routeName, { color: theme.textPrimary, fontFamily: fonts.display }]}>
                  {route.name}
                </Text>
                <Text style={[styles.routeDesc, { color: theme.textMuted }]} numberOfLines={3}>
                  {route.description}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.routeStamps}
                >
                  {routeBranches.map((branch: any) => (
                    <TouchableOpacity
                      key={branch.BranchCode}
                      onPress={() => router.push(`/branch/${branch.BranchCode}` as any)}
                      style={styles.routeStampItem}
                    >
                      <StampShape branchCode={branch.BranchCode} wardNo={branch.WardNo} size={44} />
                      <Text style={[styles.routeStampLabel, { color: theme.textMuted }]} numberOfLines={1}>
                        {branch.BranchName.replace(/ Branch$/, '')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )
          })}
        </View>

        {/* ── Badges ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: fonts.display }]}>
            Badges
          </Text>
          <View style={styles.badgeGrid}>
            {BADGES.map(badge => (
              <View key={badge.id} style={styles.badgeCell}>
                <BadgeCard badge={badge as any} ctx={badgeCtx} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: textSize.xxxl,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: -0.5,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    gap: 28,
  },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: textSize.xl,
    fontWeight: '700',
  },
  loader: { paddingVertical: 20 },
  errorRow: { gap: 6 },
  errorText: { fontSize: textSize.md },
  retryText: { fontSize: textSize.sm, fontWeight: '600' },
  // Near Me
  nearList: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  nearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  nearInfo: { flex: 1, gap: 2 },
  nearName: { fontSize: textSize.md, fontWeight: '600' },
  nearDistrict: { fontSize: textSize.sm },
  nearDist: { fontSize: textSize.sm, fontWeight: '600', flexShrink: 0 },
  // Day Trips
  routeCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  routeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  areaChip: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  areaChipText: {
    fontSize: textSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  routeDuration: { fontSize: textSize.sm },
  routeName: { fontSize: textSize.lg, fontWeight: '700', lineHeight: 22 },
  routeDesc: { fontSize: textSize.sm, lineHeight: 18 },
  routeStamps: { gap: 10, paddingTop: 4, paddingBottom: 2 },
  routeStampItem: { alignItems: 'center', gap: 4, width: 60 },
  routeStampLabel: { fontSize: 10, textAlign: 'center', lineHeight: 13 },
  // Badges
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCell: {
    width: '48%',
  },
})
