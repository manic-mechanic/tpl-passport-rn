import { BadgeCard } from '@/src/components/BadgeCard'
import { StampShape } from '@/src/components/StampShape'
import { BADGES, useBadgeCtx } from '@/src/composables/useBadges'

// Column-major display order matching web BadgesSection.vue
const BADGE_DISPLAY_ORDER = [
  'first',       'day_tripper',
  'archivist',   'navigator',
  'explorer',    'familiar_face',
  'adventurer',  'page_filler',
  'globetrotter','page_turner',
  'complete',    'return_visitor',
]

const MAX_VISIBLE_STAMPS = 4
import { haversineKm, sortedBranches } from '@/src/composables/useRegion'
import routesData from '@/src/data/routes.json'
import { useTheme } from '@/src/hooks/useTheme'
import { usePassportStore } from '@/src/stores/passport'
import { fonts, radius, textSize } from '@/src/theme'
import type { Branch, Route } from '@/src/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ExploreScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const badgeCtx = useBadgeCtx()
  const hasVisited = usePassportStore(s => s.hasVisited)

  const [nearBy, setNearBy] = useState<(Branch & { distKm: number })[]>([])
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
      const sorted = sortedBranches
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

  const routes: Route[] = routesData as Route[]

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
              {nearBy.map((branch, i) => (
                <TouchableOpacity
                  key={branch.BranchCode}
                  style={[
                    styles.nearRow,
                    { borderBottomColor: theme.borderSoft },
                    i === nearBy.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => router.push(`./branch/${branch.BranchCode}` as any)}
                >
                  <StampShape branchCode={branch.BranchCode} wardNo={branch.WardNo} size={38} ghost={!hasVisited(branch.BranchCode)} />
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
              .map(code => sortedBranches.find(b => b.BranchCode === code))
              .filter((b): b is Branch => b !== undefined)
            return (
              <View key={route.id} style={[styles.routeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.routeMeta}>
                  <View style={[styles.areaChip, { backgroundColor: `${theme.tplNavy}14` }]}>
                    <Text style={[styles.areaChipText, { color: theme.tplNavy }]}>{route.area}</Text>
                  </View>
                  <Text style={[styles.routeDuration, { color: theme.textMuted }]}>
                    {route.mode === 'walk' ? '🚶' : '🚲'} {route.duration}
                  </Text>
                  <Text style={[styles.routeStops, { color: theme.textMuted }]}>
                    · {routeBranches.length} stops
                  </Text>
                </View>
                <Text style={[styles.routeName, { color: theme.textPrimary, fontFamily: fonts.display }]}>
                  {route.name}
                </Text>
                <Text style={[styles.routeDesc, { color: theme.textMuted }]} numberOfLines={3}>
                  {route.description}
                </Text>
                <View style={styles.routeStamps}>
                  {routeBranches.slice(0, MAX_VISIBLE_STAMPS).map((branch) => (
                    <TouchableOpacity
                      key={branch.BranchCode}
                      onPress={() => router.push(`./branch/${branch.BranchCode}` as any)}
                      style={styles.routeStampItem}
                    >
                      <View style={styles.routeStampArea}>
                        <StampShape branchCode={branch.BranchCode} wardNo={branch.WardNo} size={44} ghost={!hasVisited(branch.BranchCode)} />
                      </View>
                      <Text style={[styles.routeStampLabel, { color: theme.textMuted }]} numberOfLines={1}>
                        {branch.BranchName.replace(/ Branch$/, '')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {routeBranches.length > MAX_VISIBLE_STAMPS && (
                    <View style={[styles.routeOverflow, { backgroundColor: theme.borderSoft }]}>
                      <Text style={[styles.routeOverflowText, { color: theme.textMuted }]}>
                        +{routeBranches.length - MAX_VISIBLE_STAMPS}{'\n'}More
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )
          })}
        </View>

        {/* ── Badges ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: fonts.display }]}>
            Extra Credit
          </Text>
          {(() => {
            const ordered = BADGE_DISPLAY_ORDER.map(id => BADGES.find(b => b.id === id)).filter(Boolean) as typeof BADGES
            const rows: (typeof BADGES)[] = []
            for (let i = 0; i < ordered.length; i += 2) rows.push(ordered.slice(i, i + 2))
            return (
              <View style={[styles.badgeGrid, { borderColor: theme.border }]}>
                {/* Vertical dashed center divider */}
                <View style={[styles.badgeDividerV, { borderColor: theme.border }]} pointerEvents="none" />
                {rows.map((row, rowIdx) => (
                  <View key={rowIdx}>
                    {rowIdx > 0 && <View style={[styles.badgeDividerH, { borderColor: theme.border }]} />}
                    <View style={styles.badgeRow}>
                      {row.map(badge => (
                        <View key={badge.id} style={styles.badgeCell}>
                          <BadgeCard badge={badge} ctx={badgeCtx} />
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )
          })()}
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
  routeStops: { fontSize: textSize.sm },
  routeName: { fontSize: textSize.lg, fontWeight: '700', lineHeight: 22 },
  routeDesc: { fontSize: textSize.sm, lineHeight: 18 },
  routeStamps: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 4,
    paddingBottom: 2,
  },
  routeStampItem: { alignItems: 'center', gap: 4, flex: 1 },
  routeStampArea: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  routeStampLabel: { fontSize: 10, textAlign: 'center', lineHeight: 13 },
  routeOverflow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    minHeight: 44,
  },
  routeOverflowText: {
    fontSize: textSize.xs,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  // Badges
  badgeGrid: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  badgeDividerV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 0,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    zIndex: 1,
  },
  badgeDividerH: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badgeCell: {
    flex: 1,
  },
})
