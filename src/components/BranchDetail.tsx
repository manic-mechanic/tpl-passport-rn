import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../hooks/useTheme'
import { usePassportStore } from '../stores/passport'
import { physicalBranches, haversineKm, formatDist } from '../composables/useRegion'
import { StampShape } from './StampShape'
import { fonts, radius, textSize } from '../theme'

const EVENTS_RESOURCE = 'c73bbe54-3a48-4ada-8eef-a1a2864021e4'
const CKAN = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action'

function filterToWindow(records: any[]) {
  const today    = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10)
  return records
    .filter(e => e.StartDateLocal >= today && e.StartDateLocal <= tomorrow)
    .sort((a, b) => (a.StartDateLocal < b.StartDateLocal ? -1 : 1))
}

function EventsSection({ branchName }: { branchName: string }) {
  const theme = useTheme()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const shortName = branchName.replace(/ Branch$/i, '')
    const filters = JSON.stringify({ LocationName: shortName })
    const url = `${CKAN}/datastore_search?id=${EVENTS_RESOURCE}&filters=${encodeURIComponent(filters)}&limit=100&sort=StartDateLocal%20desc`
    fetch(url)
      .then(r => r.json())
      .then(data => setEvents(filterToWindow(data.result?.records ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [branchName])

  if (loading) return <ActivityIndicator color={theme.tplBlue} style={{ marginVertical: 8 }} />
  if (events.length === 0) return null

  return (
    <View style={evtStyles.section}>
      <Text style={[evtStyles.heading, { color: theme.textPrimary }]}>Events Today & Tomorrow</Text>
      {events.map((e: any) => {
        const name = e.EventName ?? e['Event Name'] ?? e.Title ?? 'Event'
        const time = e.StartTime ? ` · ${e.StartTime}` : ''
        const age  = e.AgeGroup ?? e['Age Group'] ?? ''
        return (
          <View key={e._id} style={[evtStyles.row, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
            <Text style={[evtStyles.eventName, { color: theme.textPrimary }]} numberOfLines={2}>{name}</Text>
            <Text style={[evtStyles.eventMeta, { color: theme.textMuted }]}>
              {e.StartDateLocal === new Date().toISOString().slice(0, 10) ? 'Today' : 'Tomorrow'}{time}{age ? ` · ${age}` : ''}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const evtStyles = StyleSheet.create({
  section: { marginBottom: 24 },
  heading: { fontSize: textSize.base, fontWeight: '600', marginBottom: 12 },
  row: {
    padding: 10, borderRadius: radius.sm, borderWidth: 1, marginBottom: 6, gap: 3,
  },
  eventName: { fontSize: textSize.md, fontWeight: '600', lineHeight: 18 },
  eventMeta: { fontSize: textSize.sm },
})

interface Props {
  branch: any
}

export function BranchDetail({ branch }: Props) {
  const theme = useTheme()
  const router = useRouter()
  const checkIns = usePassportStore(s => s.checkIns)
  const hasVisited = usePassportStore(s => s.hasVisited)
  const hasVisitedToday = usePassportStore(s => s.hasVisitedToday)

  const visited = hasVisited(branch.BranchCode)
  const visitedToday = hasVisitedToday(branch.BranchCode)
  const pastVisits = (checkIns as any[]).filter(c => c.branchCode === branch.BranchCode)
  const streetAddress = branch.Address?.split(',')[0] ?? ''

  const nearbyBranches = (() => {
    if (!branch.Lat || !branch.Long) return []
    return (physicalBranches as any[])
      .filter(b => b.BranchCode !== branch.BranchCode)
      .map(b => ({ ...b, distKm: haversineKm(branch.Lat, branch.Long, b.Lat, b.Long) }))
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 2)
  })()

  function formatVisitDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-CA', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <StampShape branchCode={branch.BranchCode} wardNo={branch.WardNo} size={72} ghost={!visited} />
        <View style={styles.titleArea}>
          <Text style={[styles.branchName, { color: theme.textPrimary, fontFamily: fonts.display }]}>
            {branch.BranchName}
          </Text>
          {streetAddress ? (
            <Text style={[styles.metaText, { color: theme.textMuted }]}>{streetAddress}</Text>
          ) : null}
          {branch.District ? (
            <Text style={[styles.metaText, { color: theme.textMuted }]}>{branch.District}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.checkInArea}>
        {visitedToday ? (
          <View style={[styles.checkInBtn, { backgroundColor: theme.textMuted, opacity: 0.7 }]}>
            <Text style={styles.checkInBtnText}>Already visited today</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.checkInBtn, { backgroundColor: theme.tplBlue }]}
            onPress={() => router.push(`/(tabs)/check-in?branch=${branch.BranchCode}` as any)}
          >
            <Text style={styles.checkInBtnText}>
              {visited ? 'Check in again' : 'Check in here'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {pastVisits.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Your visits here</Text>
          {pastVisits.map((visit: any) => (
            <View
              key={visit.timestamp}
              style={[styles.visitRow, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}
            >
              <Text style={[styles.visitDate, { color: theme.textPrimary }]}>
                {formatVisitDate(visit.timestamp)}
              </Text>
              {visit.note ? (
                <Text style={[styles.visitNote, { color: theme.textMuted }]}>{visit.note}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}

      <EventsSection branchName={branch.BranchName} />

      {nearbyBranches.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Nearby branches</Text>
          {nearbyBranches.map((nb: any) => (
            <TouchableOpacity
              key={nb.BranchCode}
              style={[styles.nearbyRow, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}
              onPress={() => router.push(`/branch/${nb.BranchCode}` as any)}
            >
              <StampShape branchCode={nb.BranchCode} wardNo={nb.WardNo} size={36} />
              <View style={styles.nearbyInfo}>
                <Text style={[styles.nearbyName, { color: theme.textPrimary }]}>{nb.BranchName}</Text>
                <Text style={[styles.nearbyDist, { color: theme.textMuted }]}>{formatDist(nb.distKm)} away</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingTop: 8 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 14,
  },
  titleArea: {
    flex: 1,
    gap: 3,
  },
  branchName: {
    fontSize: textSize.lg,
    fontWeight: '700',
    lineHeight: 22,
  },
  metaText: {
    fontSize: textSize.sm,
    lineHeight: 16,
  },
  checkInArea: {
    marginBottom: 20,
  },
  checkInBtn: {
    padding: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInBtnText: {
    color: '#fff',
    fontSize: textSize.base,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: textSize.base,
    fontWeight: '600',
    marginBottom: 12,
  },
  visitRow: {
    padding: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: 6,
    gap: 4,
  },
  visitDate: {
    fontSize: textSize.md,
    fontWeight: '600',
  },
  visitNote: {
    fontSize: textSize.sm,
    lineHeight: 18,
  },
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: 8,
  },
  nearbyInfo: {
    flex: 1,
    gap: 2,
  },
  nearbyName: {
    fontSize: textSize.md,
    fontWeight: '600',
  },
  nearbyDist: {
    fontSize: textSize.sm,
  },
})
