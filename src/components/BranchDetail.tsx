import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator, Image, Linking, Modal, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import { formatDist, haversineKm, physicalBranches } from '../composables/useRegion'
import { useTheme } from '../hooks/useTheme'
import { usePhotoPicker } from '../hooks/usePhotoPicker'
import { usePassportStore } from '../stores/passport'
import { fonts, radius, textSize } from '../theme'
import type { Branch, CheckIn } from '../types'
import { CameraSheet } from './CameraSheet'
import { NoteEditSheet, type NoteEditSheetMethods } from './NoteEditSheet'
import { StampShape } from './StampShape'
import branchHoursData from '../data/branch-hours.json'

const branchHours = branchHoursData as Record<string, Record<string, string>>
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ─── Event helpers ────────────────────────────────────────────────────────────

const EVENTS_RESOURCE = 'c73bbe54-3a48-4ada-8eef-a1a2864021e4'
const CKAN = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action'
const MS_PER_DAY = 24 * 60 * 60 * 1000

const AUDIENCE_MAP: Record<string, string> = {
  'Adults (18+)': 'Adults',
  'Older Adults': 'Seniors',
  'Younger Adults (18-24)': 'Ages 18–24',
  'Teens (13-17)': 'Teens',
  'School Age Children (6-12)': 'Kids 6–12',
  'Preschool Children (0-5)': 'Ages 0–5',
}
const ADULT_GROUPS = new Set(['Adults (18+)', 'Older Adults', 'Younger Adults (18-24)'])
const KID_GROUPS = new Set(['Teens (13-17)', 'School Age Children (6-12)', 'Preschool Children (0-5)'])

function formatAudiences(raw: string): string {
  if (!raw) return ''
  const groups = raw.split(',').map(g => g.trim())
  const adults = groups.filter(g => ADULT_GROUPS.has(g))
  const kids = groups.filter(g => KID_GROUPS.has(g))
  if (adults.length >= 1 && kids.length >= 1) return 'All ages'
  if (adults.length >= 2) return 'Adults'
  if (kids.length >= 2) return 'Kids'
  return groups.map(g => AUDIENCE_MAP[g] ?? g).join(', ')
}

function formatEventTime(s: string): string {
  if (!s) return ''
  const tIdx = s.indexOf('T')
  const timePart = tIdx !== -1 ? s.slice(tIdx + 1) : s
  const [h, m] = timePart.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return ''
  const suffix = h >= 12 ? 'pm' : 'am'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')}${suffix}`
}

function formatEventMonth(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short' }).toUpperCase()
}

function filterToWindow(records: CkanEvent[]) {
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + MS_PER_DAY).toISOString().slice(0, 10)
  return records
    .filter(e => e.StartDateLocal >= today && e.StartDateLocal <= tomorrow)
    .sort((a, b) => (a.StartDateLocal < b.StartDateLocal ? -1 : 1))
}

// ─── EventsSection ────────────────────────────────────────────────────────────

interface CkanEvent {
  _id: number | string
  EventName?: string
  'Event Name'?: string
  Title?: string
  StartDateLocal: string
  StartTime?: string
  Audiences?: string
  AgeGroup?: string
  'Age Group'?: string
}

function EventsSection({ branchName, branchWebsite }: { branchName: string; branchWebsite: string }) {
  const theme = useTheme()
  const [events, setEvents] = useState<CkanEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ac = new AbortController()
    const shortName = branchName.replace(/ Branch$/i, '')
    const filters = JSON.stringify({ LocationName: shortName })
    const url = `${CKAN}/datastore_search?id=${EVENTS_RESOURCE}&filters=${encodeURIComponent(filters)}&limit=100&sort=StartDateLocal%20desc`
    fetch(url, { signal: ac.signal })
      .then(r => r.json())
      .then(data => setEvents(filterToWindow(data.result?.records ?? [])))
      .catch(err => { if (!(err instanceof Error && err.name === 'AbortError')) setEvents([]) })
      .finally(() => setLoading(false))
    return () => ac.abort()
  }, [branchName])

  return (
    <View style={evtStyles.section}>
      <Text style={[evtStyles.heading, { color: theme.textPrimary }]}>Upcoming Events</Text>

      {loading ? (
        <ActivityIndicator color={theme.tplBlue} style={{ marginVertical: 8 }} />
      ) : events.length === 0 ? (
        <Text style={[evtStyles.empty, { color: theme.textMuted }]}>No events today or tomorrow.</Text>
      ) : (
        events.map((e) => {
          const title = e.EventName ?? e['Event Name'] ?? e.Title ?? 'Event'
          const time = formatEventTime(e.StartTime ?? '')
          const age = formatAudiences(e.Audiences ?? e.AgeGroup ?? e['Age Group'] ?? '')
          const date = e.StartDateLocal ?? ''
          const day = date ? new Date(date + 'T00:00:00').getDate() : ''
          const month = date ? formatEventMonth(date) : ''
          return (
            <View key={e._id} style={evtStyles.row}>
              {/* Date badge — mirrors web .event-date-badge */}
              <View style={[evtStyles.dateBadge, { backgroundColor: `${theme.tplBlue}14`, borderColor: `${theme.tplBlue}33` }]}>
                <Text style={[evtStyles.month, { color: theme.tplBlue }]}>{month}</Text>
                <Text style={[evtStyles.day, { color: theme.tplNavy, fontFamily: fonts.display }]}>{day}</Text>
              </View>
              <View style={evtStyles.info}>
                <Text style={[evtStyles.title, { color: theme.textPrimary }]} numberOfLines={2}>{title}</Text>
                <Text style={[evtStyles.meta, { color: theme.textMuted }]}>
                  {[time, age].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
          )
        })
      )}

      {branchWebsite ? (
        <TouchableOpacity onPress={() => Linking.openURL(branchWebsite)}>
          <Text style={[evtStyles.allEvents, { color: theme.tplBlue }]}>All events at this branch ↗</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const evtStyles = StyleSheet.create({
  section: { marginBottom: 24 },
  heading: { fontSize: textSize.base, fontWeight: '600', marginBottom: 12 },
  empty: { fontSize: textSize.sm, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  dateBadge: {
    flexShrink: 0,
    width: 44,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 1,
  },
  month: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  day: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  info: {
    flex: 1,
    gap: 3,
    paddingTop: 2,
  },
  title: {
    fontSize: textSize.sm,
    fontWeight: '600',
    lineHeight: 18,
  },
  meta: {
    fontSize: textSize.sm,
  },
  allEvents: {
    marginTop: 10,
    fontSize: textSize.sm,
    fontWeight: '600',
  },
})

// ─── VisitRow ─────────────────────────────────────────────────────────────────
// Extracted as a component so hooks (usePhotoPicker, useState) work per-row.

function formatVisitDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function VisitRow({
  visit,
  onPhotoTap,
  onEditNote,
}: {
  visit: CheckIn
  onPhotoTap: (uri: string) => void
  onEditNote: (visit: CheckIn) => void
}) {
  const theme = useTheme()
  const { openCamera, onCameraCapture, onCameraClose, cameraOpen, uploading } = usePhotoPicker(visit.timestamp)
  const hasNote = !!visit.note

  return (
    <View style={[vstyles.row, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
      {/* Left: date + note preview */}
      <View style={vstyles.left}>
        <Text style={[vstyles.date, { color: theme.textPrimary }]} numberOfLines={1}>
          {formatVisitDate(visit.timestamp)}
        </Text>
        {hasNote && (
          <Text style={[vstyles.notePreview, { color: theme.textMuted }]} numberOfLines={1}>
            {visit.note}
          </Text>
        )}
      </View>

      {/* Right: note icon + photo/add-photo */}
      <View style={vstyles.right}>
        <TouchableOpacity onPress={() => onEditNote(visit)} hitSlop={8}>
          <Ionicons
            name={hasNote ? 'document-text' : 'document-text-outline'}
            size={18}
            color={hasNote ? theme.tplBlue : theme.textMuted}
          />
        </TouchableOpacity>

        {visit.photoUri ? (
          <TouchableOpacity onPress={() => onPhotoTap(visit.photoUri!)} activeOpacity={0.85}>
            <Image source={{ uri: visit.photoUri }} style={vstyles.photoThumb} resizeMode="cover" />
          </TouchableOpacity>
        ) : uploading ? (
          <ActivityIndicator size="small" color={theme.textMuted} />
        ) : (
          <TouchableOpacity onPress={openCamera} hitSlop={6}>
            <Ionicons name="camera-outline" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <CameraSheet visible={cameraOpen} onCapture={onCameraCapture} onClose={onCameraClose} />
    </View>
  )
}

const vstyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: 6,
    gap: 10,
    minHeight: 52,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  date: {
    fontSize: textSize.sm,
    fontWeight: '600',
  },
  notePreview: {
    fontSize: 11,
    lineHeight: 14,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  photoThumb: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
})

// ─── BranchDetail ─────────────────────────────────────────────────────────────

interface Props {
  branch: Branch
  origin?: 'explore' | 'passport'
  onNearbyPress?: (branchCode: string) => void
}

export function BranchDetail({ branch, origin, onNearbyPress }: Props) {
  const theme = useTheme()
  const router = useRouter()
  const checkIns = usePassportStore(s => s.checkIns)
  const hasVisited = usePassportStore(s => s.hasVisited)
  const hasVisitedToday = usePassportStore(s => s.hasVisitedToday)
  const [lightboxUri, setLightboxUri] = useState<string | null>(null)
  const noteSheetRef = useRef<NoteEditSheetMethods>(null)

  function openNoteSheet(visit: CheckIn) {
    noteSheetRef.current?.present(visit)
  }

  const visited = hasVisited(branch.BranchCode)
  const visitedToday = hasVisitedToday(branch.BranchCode)
  const pastVisits = checkIns.filter(c => c.branchCode === branch.BranchCode)
  const streetAddress = branch.Address?.split(',')[0] ?? ''

  const todayHours = branchHours[branch.BranchCode]?.[DAYS[new Date().getDay()]] ?? null
  const hasParking = branch.PublicParking && branch.PublicParking !== '0' && branch.PublicParking !== 0

  const nearbyBranches = useMemo(() => {
    if (!branch.Lat || !branch.Long) return []
    return physicalBranches
      .filter(b => b.BranchCode !== branch.BranchCode)
      .map(b => ({ ...b, distKm: haversineKm(branch.Lat, branch.Long, b.Lat, b.Long) }))
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 2)
  }, [branch.BranchCode])

  return (
    <View style={styles.container}>

      {/* Hero */}
      <View style={styles.hero}>
        <StampShape branchCode={branch.BranchCode} wardNo={branch.WardNo} size={72} ghost={!visited} />
        <View style={styles.titleArea}>
          <Text style={[styles.branchName, { color: theme.textPrimary, fontFamily: fonts.display }]}>
            {branch.BranchName}
          </Text>
          {todayHours ? (
            <Text style={[styles.hours, { color: theme.textMuted }]}>Today {todayHours}</Text>
          ) : null}
          <View style={styles.metaList}>
            {streetAddress ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={12} color={theme.textMuted} />
                <Text style={[styles.metaText, { color: theme.textMuted }]}>{streetAddress}</Text>
              </View>
            ) : null}
            {branch.Telephone ? (
              <TouchableOpacity style={styles.metaRow} onPress={() => Linking.openURL(`tel:${branch.Telephone}`)}>
                <Ionicons name="call-outline" size={12} color={theme.textMuted} />
                <Text style={[styles.metaText, { color: theme.textMuted }]}>{branch.Telephone}</Text>
              </TouchableOpacity>
            ) : null}
            {hasParking ? (
              <View style={styles.metaRow}>
                <Ionicons name="car-outline" size={12} color={theme.textMuted} />
                <Text style={[styles.metaText, { color: theme.textMuted }]}>Parking</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Check-in button */}
      <View style={styles.checkInArea}>
        {visitedToday ? (
          <View style={[styles.checkInBtn, { backgroundColor: theme.textMuted, opacity: 0.7 }]}>
            <Text style={styles.checkInBtnText}>Already visited today</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.checkInBtn, { backgroundColor: theme.tplBlue }]}
            onPress={() => {
                router.navigate({
                  pathname: '/(tabs)/(check-in)',
                  params: origin ? { branch: branch.BranchCode, origin } : { branch: branch.BranchCode },
                })
              }}
          >
            <Text style={styles.checkInBtnText}>
              {visited ? 'Check in again' : 'Check in here'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Past visits */}
      {pastVisits.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Your visits here</Text>
          {pastVisits.map(visit => (
            <VisitRow key={visit.timestamp} visit={visit} onPhotoTap={setLightboxUri} onEditNote={openNoteSheet} />
          ))}
        </View>
      )}

      {/* Events */}
      <EventsSection branchName={branch.BranchName} branchWebsite={branch.Website} />

      {/* Nearby branches */}
      {nearbyBranches.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Nearby branches</Text>
          {nearbyBranches.map((nb) => (
            <TouchableOpacity
              key={nb.BranchCode}
              style={[styles.nearbyRow, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}
              onPress={() => onNearbyPress ? onNearbyPress(nb.BranchCode) : router.push({ pathname: '/branch/[id]', params: { id: nb.BranchCode } })}
            >
              <StampShape branchCode={nb.BranchCode} wardNo={nb.WardNo} size={36} />
              <View style={styles.nearbyInfo}>
                <Text style={[styles.nearbyName, { color: theme.textPrimary }]}>{nb.BranchName}</Text>
                <Text style={[styles.nearbyDist, { color: theme.textMuted }]}>{formatDist(nb.distKm)} away</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Note edit sheet */}
      <NoteEditSheet ref={noteSheetRef} />

      {/* Photo lightbox */}
      <Modal visible={!!lightboxUri} transparent animationType="fade" onRequestClose={() => setLightboxUri(null)}>
        <TouchableOpacity
          style={styles.lightbox}
          onPress={() => setLightboxUri(null)}
          activeOpacity={1}
        >
          {lightboxUri && (
            <Image source={{ uri: lightboxUri }} style={styles.lightboxImg} resizeMode="contain" />
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingTop: 0 },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  hours: {
    fontSize: textSize.sm,
    marginTop: 1,
  },
  metaList: {
    marginTop: 4,
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: 8,
  },
  nearbyInfo: {
    flex: 1,
    gap: 2,
  },
  nearbyName: {
    fontSize: textSize.sm,
    fontWeight: '600',
    lineHeight: 17,
  },
  nearbyDist: {
    fontSize: textSize.sm,
  },
  lightbox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImg: {
    width: '100%',
    height: '100%',
  },
})
