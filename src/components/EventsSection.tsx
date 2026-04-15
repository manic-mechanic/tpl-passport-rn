import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '../hooks/useTheme'
import { useEventsForBranch, type BranchEvent } from '../hooks/useEventsForBranch'
import { formatAudiences, formatEventTime, formatEventMonth } from '../lib/events'
import { fonts, radius, textSize } from '../theme'

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
