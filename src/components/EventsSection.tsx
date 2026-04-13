import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '../hooks/useTheme'
import { useEventsForBranch, type BranchEvent } from '../hooks/useEventsForBranch'
import { fonts, radius, textSize } from '../theme'

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

export function EventsSection({ branchName, branchWebsite }: { branchName: string; branchWebsite: string }) {
  const theme = useTheme()
  const { events, loading } = useEventsForBranch(branchName)

  return (
    <View style={styles.section}>
      <Text style={[styles.heading, { color: theme.textPrimary }]}>Upcoming Events</Text>

      {loading ? (
        <ActivityIndicator color={theme.tplBlue} style={{ marginVertical: 8 }} />
      ) : events.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textMuted }]}>No events today or tomorrow.</Text>
      ) : (
        events.map((e: BranchEvent) => {
          const time = formatEventTime(e.time)
          const age = formatAudiences(e.audiences)
          const day = e.date ? new Date(e.date + 'T00:00:00').getDate() : ''
          const month = e.date ? formatEventMonth(e.date) : ''
          return (
            <View key={e.id} style={styles.row}>
              <View style={[styles.dateBadge, { backgroundColor: `${theme.tplBlue}14`, borderColor: `${theme.tplBlue}33` }]}>
                <Text style={[styles.month, { color: theme.tplBlue }]}>{month}</Text>
                <Text style={[styles.day, { color: theme.tplNavy, fontFamily: fonts.display }]}>{day}</Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>{e.title}</Text>
                <Text style={[styles.meta, { color: theme.textMuted }]}>
                  {[time, age].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
          )
        })
      )}

      {branchWebsite ? (
        <TouchableOpacity onPress={() => Linking.openURL(branchWebsite)}>
          <Text style={[styles.allEvents, { color: theme.tplBlue }]}>All events at this branch ↗</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
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
