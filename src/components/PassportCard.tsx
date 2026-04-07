import { View, Text, TextInput, StyleSheet } from 'react-native'
import { useTheme } from '../hooks/useTheme'
import { usePassportStore } from '../stores/passport'
import { physicalBranches } from '../composables/useRegion'
import { fonts, radius, textSize } from '../theme'

export function PassportCard() {
  const theme = useTheme()
  const profile = usePassportStore(s => s.profile)
  const checkIns = usePassportStore(s => s.checkIns)
  const updateProfile = usePassportStore(s => s.updateProfile)

  const visitCount = new Set((checkIns as any[]).map(c => c.branchCode)).size
  const progressPct = Math.round((visitCount / (physicalBranches as any[]).length) * 100)
  const issueYear = new Date().getFullYear()
  const avatarLetter = profile.name?.trim() ? profile.name[0].toUpperCase() : '?'

  const mrzLine1 = (() => {
    const raw = (profile.name || 'TRAVELLER').toUpperCase()
    const parts = raw.replace(/[^A-Z ]/g, '').split(' ').filter(Boolean)
    const surname = parts[0] ?? 'TRAVELLER'
    const given = parts.slice(1).join('<') || ''
    return `P<CAN${(given ? `${surname}<<${given}` : surname).padEnd(39, '<').slice(0, 39)}`
  })()

  const mrzLine2 = (() => {
    const num = `TPL${String(visitCount).padStart(5, '0')}`
    const dob = String(issueYear % 100).padStart(2, '0') + '0101'
    const pct = String(progressPct).padStart(3, '0')
    return `${num}0CAN${dob}0M260101${pct}PCT`.padEnd(44, '<').slice(0, 44)
  })()

  return (
    <View style={[styles.card, { borderRadius: radius.lg }]}>
      <View style={[styles.cardTop, { backgroundColor: theme.tplBlue }]}>
        <Text style={styles.libraryName}>Toronto Public Library</Text>
      </View>

      <View style={[styles.cardBody, { backgroundColor: theme.bg }]}>
        <View style={styles.profileRow}>
          <View style={styles.profileFields}>
            <View>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Name / Nom</Text>
              <TextInput
                style={[styles.nameInput, { color: theme.tplBlue, fontFamily: fonts.display, borderBottomColor: theme.borderSoft }]}
                value={profile.name}
                onChangeText={name => updateProfile({ name })}
                placeholder="Your name"
                placeholderTextColor={theme.textMuted}
                maxLength={40}
              />
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Home Branch</Text>
              <Text style={[styles.fieldValue, { color: theme.tplBlue }]} numberOfLines={1}>
                {profile.homeBranch || '—'}
              </Text>
            </View>
          </View>
          <View style={[styles.avatar, { borderColor: theme.tplBlue, backgroundColor: `${theme.tplBlue}1a` }]}>
            <Text style={[styles.avatarLetter, { color: theme.tplBlue, fontFamily: fonts.display }]}>
              {avatarLetter}
            </Text>
          </View>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: theme.borderSoft }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.tplBlue, width: `${progressPct}%` as any }]} />
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.stat, { borderRightColor: theme.borderSoft }]}>
            <Text style={[styles.statNum, { color: theme.tplBlue, fontFamily: fonts.display }]}>{(checkIns as any[]).length}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Visits</Text>
          </View>
          <View style={[styles.stat, { borderRightColor: theme.borderSoft }]}>
            <Text style={[styles.statNum, { color: theme.tplBlue, fontFamily: fonts.display }]}>{progressPct}%</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Complete</Text>
          </View>
          <View style={[styles.countChip, { backgroundColor: theme.borderSoft, borderColor: theme.border }]}>
            <Text style={[styles.countChipNum, { color: theme.tplNavy, fontFamily: fonts.display }]}>{visitCount}</Text>
            <Text style={[styles.countChipDenom, { color: theme.textMuted }]}>/ {(physicalBranches as any[]).length}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.mrz, { backgroundColor: theme.tplBlue }]}>
        <View style={styles.mrzLines}>
          <Text style={styles.mrzLine} numberOfLines={1}>{mrzLine1}</Text>
          <Text style={styles.mrzLine} numberOfLines={1}>{mrzLine2}</Text>
        </View>
        <View style={styles.mrzIssued}>
          <Text style={styles.mrzIssuedLabel}>Issued</Text>
          <Text style={[styles.mrzIssuedYear, { fontFamily: fonts.display }]}>{issueYear}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    shadowColor: '#001c71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTop: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  libraryName: {
    fontSize: textSize.sm,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  profileFields: {
    flex: 1,
    gap: 8,
  },
  fieldLabel: {
    fontSize: textSize.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  nameInput: {
    fontSize: textSize.lg,
    fontWeight: '700',
    lineHeight: 22,
    borderBottomWidth: 1.5,
    paddingBottom: 1,
    paddingTop: 0,
  },
  fieldValue: {
    fontSize: textSize.md,
    fontWeight: '600',
  },
  avatar: {
    width: 56,
    height: 68,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarLetter: {
    fontSize: textSize.xxl,
    fontWeight: '700',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    minWidth: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingRight: 8,
    marginRight: 8,
    borderRightWidth: 1,
  },
  statNum: {
    fontSize: textSize.base,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: textSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countChip: {
    marginLeft: 'auto',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  countChipNum: {
    fontSize: textSize.md,
    fontWeight: '700',
  },
  countChipDenom: {
    fontSize: textSize.sm,
  },
  mrz: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mrzLines: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  mrzLine: {
    fontFamily: 'monospace',
    fontSize: textSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.28)',
  },
  mrzIssued: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    flexShrink: 0,
  },
  mrzIssuedLabel: {
    fontSize: textSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.28)',
  },
  mrzIssuedYear: {
    fontSize: textSize.base,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.58)',
    lineHeight: 20,
  },
})
