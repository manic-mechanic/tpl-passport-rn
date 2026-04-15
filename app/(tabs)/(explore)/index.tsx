import { BadgeShape } from '@/src/components/BadgeShape'
import { StampShape } from '@/src/components/StampShape'
import { BADGES, useBadgeCtx } from '@/src/composables/useBadges'
import { haversineKm, sortedBranches } from '@/src/composables/useRegion'
import { useAllEvents, type AggregatedEvent } from '@/src/hooks/useAllEvents'
import { formatAudiences, formatEventTime } from '@/src/lib/events'
import { requestLocation } from '@/src/lib/location'
import routesData from '@tpl-passport/shared/data/routes.json'
import { useTheme } from '@/src/hooks/useTheme'
import { usePassportStore } from '@/src/stores/passport'
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { fonts, radius, textSize } from '@/src/theme'
import type { Branch, Route } from '@/src/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Tab = 'near-me' | 'routes' | 'events' | 'extra-credit'
type Mode = 'walk' | 'bike' | 'transit' | 'drive'

const MAX_VISIBLE_STAMPS = 4

const TABS: { id: Tab; label: string }[] = [
  { id: 'near-me', label: 'Near Me' },
  { id: 'routes', label: 'Day Trips' },
  { id: 'events', label: "What's On" },
  { id: 'extra-credit', label: 'Extra Credit' },
]

const MODES: { id: Mode; icon: string; label: string }[] = [
  { id: 'walk', icon: 'walk-outline', label: 'Walk' },
  { id: 'bike', icon: 'bicycle-outline', label: 'Bike' },
  { id: 'transit', icon: 'bus-outline', label: 'Transit' },
  { id: 'drive', icon: 'car-outline', label: 'Drive' },
]

function formatEventDate(dateStr: string): { day: number; month: string; weekday: string } {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('en-CA', { month: 'short' }).toUpperCase(),
    weekday: d.toLocaleDateString('en-CA', { weekday: 'short' }),
  }
}

export default function ExploreScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const badgeCtx = useBadgeCtx()
  const hasVisited = usePassportStore(s => s.hasVisited)

  const [activeTab, setActiveTab] = useState<Tab>('near-me')
  const [activeMode, setActiveMode] = useState<Mode>('walk')
  const [nearBy, setNearBy] = useState<(Branch & { distKm: number })[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const { events, loading: eventsLoading, error: eventsError } = useAllEvents()

  useEffect(() => { detectNearby() }, [])

  async function detectNearby() {
    setLocationLoading(true)
    setLocationError(null)
    try {
      const coords = await requestLocation()
      if (!coords) {
        setLocationError('Enable location to see nearby branches.')
        return
      }
      const { latitude: lat, longitude: lng } = coords
      setUserLocation({ lat, lng })
      const sorted = sortedBranches
        .map(b => ({ ...b, distKm: haversineKm(lat, lng, b.Lat, b.Long) }))
        .sort((a, b) => a.distKm - b.distKm)
        .slice(0, 6)
      setNearBy(sorted)
    } catch {
      setLocationError('Could not detect location.')
    } finally {
      setLocationLoading(false)
    }
  }

  const filteredRoutes = useMemo(
    () => (routesData as Route[]).filter(r => r.mode === activeMode),
    [activeMode]
  )

  const badgeSuggestions = useMemo(() => {
    return BADGES
      .filter(b => !b.earned(badgeCtx))
      .map(b => {
        const s = b.suggest(badgeCtx)
        return { id: b.id, title: b.title, badge: b, pct: s.pct, message: s.message, branches: s.branches }
      })
      .filter(s => s.message)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3)
  }, [badgeCtx])

  // Sort events by distance when location is available, then by date/time.
  const sortedEvents = useMemo(() => {
    if (!userLocation) return events
    return [...events].sort((a, b) => {
      const aDist = a.branch ? haversineKm(userLocation.lat, userLocation.lng, a.branch.Lat, a.branch.Long) : 999
      const bDist = b.branch ? haversineKm(userLocation.lat, userLocation.lng, b.branch.Lat, b.branch.Long) : 999
      if (a.date !== b.date) return a.date < b.date ? -1 : 1
      if (Math.abs(aDist - bDist) > 2) return aDist - bDist
      return (a.time ?? '') < (b.time ?? '') ? -1 : 1
    })
  }, [events, userLocation])

  const isNearMe = activeTab === 'near-me'

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title="Explore" />

      {/* Tab bar — light background, distinct from navy header */}
      <View style={[styles.tabBar, { backgroundColor: theme.bg, borderBottomColor: theme.borderSoft, borderTopColor: theme.border }]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabPill, activeTab === tab.id && { borderBottomColor: theme.tplNavy }]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabLabel, { color: activeTab === tab.id ? theme.tplNavy : theme.textMuted }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: isNearMe ? insets.bottom + 80 : insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Near Me ──────────────────────────────────────────────────── */}
        {activeTab === 'near-me' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: fonts.display }]}>
                Nearby
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
                    onPress={() => router.push({ pathname: './branch/[id]', params: { id: branch.BranchCode } })}
                  >
                    <StampShape branchCode={branch.BranchCode} wardNo={branch.WardNo} size={38} ghost={!hasVisited(branch.BranchCode)} />
                    <Text style={[styles.nearName, { color: theme.textPrimary }]} numberOfLines={1}>
                      {branch.BranchName}
                    </Text>
                    <Text style={[styles.nearDist, { color: theme.textMuted }]}>
                      {branch.distKm < 1
                        ? `${Math.round(branch.distKm * 1000)} m`
                        : `${branch.distKm.toFixed(1)} km`}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Day Trips ────────────────────────────────────────────────── */}
        {activeTab === 'routes' && (
          <View style={styles.section}>
            <View style={[styles.modeBar, { borderBottomColor: theme.borderSoft }]}>
              {MODES.map(mode => (
                <TouchableOpacity
                  key={mode.id}
                  style={[styles.modeTab, activeMode === mode.id && { borderBottomColor: theme.tplNavy }]}
                  onPress={() => setActiveMode(mode.id)}
                >
                  <Ionicons
                    name={mode.icon as any}
                    size={20}
                    color={activeMode === mode.id ? theme.tplNavy : theme.textMuted}
                  />
                  <Text style={[styles.modeLabel, { color: activeMode === mode.id ? theme.tplNavy : theme.textMuted }]}>
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {filteredRoutes.length === 0 ? (
              <Text style={[styles.comingSoon, { color: theme.textMuted }]}>
                {MODES.find(m => m.id === activeMode)?.label} routes coming soon.
              </Text>
            ) : (
              filteredRoutes.map((route: Route) => {
                const routeBranches = route.branches
                  .map(code => sortedBranches.find(b => b.BranchCode === code))
                  .filter((b): b is Branch => b !== undefined)
                return (
                  <TouchableOpacity
                    key={route.id}
                    style={[styles.routeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => router.push({ pathname: './day-trip/[id]', params: { id: route.id } })}
                  >
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
                      <Ionicons name="chevron-forward" size={14} color={theme.textMuted} style={styles.routeChevron} />
                    </View>
                    <Text style={[styles.routeName, { color: theme.textPrimary, fontFamily: fonts.display }]}>
                      {route.name}
                    </Text>
                    <Text style={[styles.routeDesc, { color: theme.textMuted }]} numberOfLines={3}>
                      {route.description}
                    </Text>
                    <View style={styles.routeStamps}>
                      {routeBranches.slice(0, MAX_VISIBLE_STAMPS).map((branch) => (
                        <View key={branch.BranchCode} style={styles.routeStampItem}>
                          <View style={styles.routeStampArea}>
                            <StampShape branchCode={branch.BranchCode} wardNo={branch.WardNo} size={44} ghost={!hasVisited(branch.BranchCode)} />
                          </View>
                          <Text style={[styles.routeStampLabel, { color: theme.textMuted }]} numberOfLines={1}>
                            {branch.BranchName.replace(/ Branch$/, '')}
                          </Text>
                        </View>
                      ))}
                      {routeBranches.length > MAX_VISIBLE_STAMPS && (
                        <View style={[styles.routeOverflow, { backgroundColor: theme.borderSoft }]}>
                          <Text style={[styles.routeOverflowText, { color: theme.textMuted }]}>
                            +{routeBranches.length - MAX_VISIBLE_STAMPS}{'\n'}More
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                )
              })
            )}
          </View>
        )}

        {/* ── What's On ────────────────────────────────────────────────── */}
        {activeTab === 'events' && (
          <View style={styles.section}>
            {eventsLoading ? (
              <ActivityIndicator color={theme.tplBlue} style={styles.loader} />
            ) : eventsError ? (
              <Text style={[styles.comingSoon, { color: theme.textMuted }]}>{eventsError}</Text>
            ) : sortedEvents.length === 0 ? (
              <Text style={[styles.comingSoon, { color: theme.textMuted }]}>
                No upcoming events in the next 7 days.
              </Text>
            ) : (
              sortedEvents.map((event: AggregatedEvent) => {
                const { day, month, weekday } = formatEventDate(event.date)
                const time = formatEventTime(event.time)
                const age = formatAudiences(event.audiences)
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={[styles.eventRow, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}
                    onPress={event.branch ? () => router.push({ pathname: './branch/[id]', params: { id: event.branch!.BranchCode } }) : undefined}
                    activeOpacity={event.branch ? 0.7 : 1}
                  >
                    <View style={[styles.eventDate, { backgroundColor: `${theme.tplBlue}12`, borderColor: `${theme.tplBlue}30` }]}>
                      <Text style={[styles.eventMonth, { color: theme.tplBlue }]}>{month}</Text>
                      <Text style={[styles.eventDay, { color: theme.tplNavy, fontFamily: fonts.display }]}>{day}</Text>
                      <Text style={[styles.eventWeekday, { color: theme.textMuted }]}>{weekday}</Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={[styles.eventTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                        {event.title}
                      </Text>
                      <Text style={[styles.eventMeta, { color: theme.textMuted }]}>
                        {[event.locationName, time, age].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    {event.branch && (
                      <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                    )}
                  </TouchableOpacity>
                )
              })
            )}
          </View>
        )}

        {/* ── Extra Credit ─────────────────────────────────────────────── */}
        {activeTab === 'extra-credit' && (
          <View style={styles.section}>
            {badgeSuggestions.length === 0 ? (
              <Text style={[styles.comingSoon, { color: theme.textMuted }]}>
                You've earned every badge. Well done!
              </Text>
            ) : (
              badgeSuggestions.map(s => (
                <View key={s.id} style={[styles.suggestionCard, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
                  <BadgeShape badge={s.badge} ctx={badgeCtx} size={44} />
                  <View style={styles.suggestionBody}>
                    <View style={styles.suggestionHeader}>
                      <Text style={[styles.suggestionTitle, { color: theme.textPrimary }]}>{s.title}</Text>
                      <View style={[styles.suggestionBar, { backgroundColor: theme.border }]}>
                        <View style={[styles.suggestionFill, { width: `${Math.min(s.pct * 100, 100)}%` as any, backgroundColor: theme.tplBlue }]} />
                      </View>
                    </View>
                    <Text style={[styles.suggestionMessage, { color: theme.textMuted }]}>{s.message}</Text>
                    {s.branches.length > 0 && (
                      <View style={styles.suggestionBranches}>
                        <Text style={[styles.suggestionSubhead, { color: theme.textMuted }]}>Suggested:</Text>
                        {s.branches.map(branch => (
                          <TouchableOpacity
                            key={branch.BranchCode}
                            style={[styles.suggestionBranchRow, { borderTopColor: theme.borderSoft }]}
                            onPress={() => router.push({ pathname: './branch/[id]', params: { id: branch.BranchCode } })}
                          >
                            <StampShape branchCode={branch.BranchCode} wardNo={branch.WardNo} size={28} ghost={!hasVisited(branch.BranchCode)} />
                            <Text style={[styles.suggestionBranchName, { color: theme.textPrimary }]} numberOfLines={1}>
                              {branch.BranchName}
                            </Text>
                            <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>

      {/* Browse all — fixed to bottom, Near Me tab only */}
      {isNearMe && (
        <View style={[styles.browseBar, { backgroundColor: theme.bg, borderTopColor: theme.border, paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.browseBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push('./branches')}
          >
            <Text style={[styles.browseBtnText, { color: theme.tplBlue }]}>Browse all branches</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.tplBlue} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
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

  // ── Tab bar ────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1.5,
  },
  tabPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
    marginBottom: -1.5,
  },
  tabLabel: {
    fontSize: textSize.md,
    fontWeight: '600',
  },

  // ── Near Me ────────────────────────────────────────────────────────────
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
  nearName: { fontSize: textSize.md, fontWeight: '600', flex: 1 },
  nearDist: { fontSize: textSize.sm, fontWeight: '600', flexShrink: 0 },

  // ── Browse bar ─────────────────────────────────────────────────────────
  browseBar: {
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  browseBtnText: {
    fontSize: textSize.md,
    fontWeight: '600',
  },

  // ── Day Trips ──────────────────────────────────────────────────────────
  modeBar: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    marginHorizontal: -18,
    paddingHorizontal: 18,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
    marginBottom: -1.5,
  },
  modeLabel: {
    fontSize: textSize.xs,
    fontWeight: '600',
  },
  comingSoon: {
    fontSize: textSize.sm,
    textAlign: 'center',
    paddingVertical: 24,
  },
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
  routeChevron: { marginLeft: 'auto' as any },
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

  // ── What's On ──────────────────────────────────────────────────────────
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  eventDate: {
    flexShrink: 0,
    width: 46,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 1,
  },
  eventMonth: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  eventDay: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  eventWeekday: {
    fontSize: 9,
    fontWeight: '600',
  },
  eventInfo: { flex: 1, gap: 3 },
  eventTitle: {
    fontSize: textSize.sm,
    fontWeight: '600',
    lineHeight: 18,
  },
  eventMeta: { fontSize: textSize.sm },

  // ── Extra Credit ───────────────────────────────────────────────────────
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 14,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  suggestionBody: { flex: 1, minWidth: 0 },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  suggestionTitle: {
    fontSize: textSize.sm,
    fontWeight: '700',
  },
  suggestionBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  suggestionFill: {
    height: '100%',
    borderRadius: 2,
    minWidth: 2,
  },
  suggestionMessage: {
    fontSize: textSize.sm,
    lineHeight: 18,
    marginBottom: 8,
  },
  suggestionBranches: { gap: 2 },
  suggestionSubhead: {
    fontSize: textSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  suggestionBranchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  suggestionBranchName: {
    flex: 1,
    fontSize: textSize.sm,
    fontWeight: '600',
  },
})
