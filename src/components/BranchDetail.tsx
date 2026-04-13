import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { useMemo, useRef, useState } from 'react'
import {
  Image, Linking, Modal, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import { formatDist, haversineKm, physicalBranches } from '../composables/useRegion'
import { useTheme } from '../hooks/useTheme'
import { usePassportStore } from '../stores/passport'
import { fonts, radius, textSize } from '../theme'
import type { Branch, CheckIn } from '../types'
import { NoteEditSheet, type NoteEditSheetMethods } from './NoteEditSheet'
import { StampShape } from './StampShape'
import { EventsSection } from './EventsSection'
import { HistorySection } from './HistorySection'
import { VisitRow } from './VisitRow'
import branchHoursData from '@tpl-passport/shared/data/branch-hours.json'

// Explicit annotation (not a cast): TypeScript validates the JSON shape against this type.
const branchHours: Record<string, Record<string, string>> = branchHoursData
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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

      {/* History */}
      <HistorySection branchCode={branch.BranchCode} visitCount={pastVisits.length} />

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
