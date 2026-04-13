import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../hooks/useTheme'
import { radius, textSize } from '../theme'
import branchHistoryData from '../data/branch-history.json'

// Explicit annotation (not a cast): TypeScript validates the JSON shape against this type.
const branchHistory: Record<string, { year: string; detail: string }[]> = branchHistoryData

export function HistorySection({ branchCode, visitCount }: { branchCode: string; visitCount: number }) {
  const theme = useTheme()
  const entries = branchHistory[branchCode]
  if (!entries?.length) return null

  return (
    <View style={styles.section}>
      <Text style={[styles.heading, { color: theme.textPrimary }]}>Branch History</Text>

      {visitCount === 0 ? (
        <Text style={[styles.locked, { color: theme.textMuted }]}>
          Check in here to start reading this branch's history.
        </Text>
      ) : (
        <>
          <View style={styles.row}>
            <View style={[styles.yearBadge, { backgroundColor: `${theme.tplBlue}14`, borderColor: `${theme.tplBlue}33` }]}>
              <Text style={[styles.year, { color: theme.tplBlue }]}>{entries[0].year}</Text>
            </View>
            <Text style={[styles.detail, { color: theme.textPrimary }]}>{entries[0].detail}</Text>
          </View>
          <Text style={[styles.locked, { color: theme.textMuted }]}>Come back to unlock more history.</Text>
        </>
      )}
    </View>
  )
}

// Note: section/heading/row styles mirror EventsSection intentionally — both are
// independent display components with the same date-badge-plus-text layout.
const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  heading: { fontSize: textSize.base, fontWeight: '600', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  yearBadge: {
    flexShrink: 0,
    width: 44,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  year: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  detail: {
    flex: 1,
    fontSize: textSize.sm,
    lineHeight: 18,
    paddingTop: 2,
  },
  locked: {
    marginTop: 4,
    fontSize: textSize.sm,
    fontStyle: 'italic',
  },
})
