import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Modal, FlatList, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../hooks/useTheme'
import { usePassportStore } from '../stores/passport'
import { physicalBranches, sortedBranches } from '../composables/useRegion'
import { fonts, radius, textSize } from '../theme'

function branchNameForCode(code: string): string {
  return (sortedBranches as any[]).find(b => b.BranchCode === code)?.BranchName ?? ''
}

export function PassportCard() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const profile = usePassportStore(s => s.profile)
  const checkIns = usePassportStore(s => s.checkIns)
  const updateProfile = usePassportStore(s => s.updateProfile)

  const [showBranchPicker, setShowBranchPicker] = useState(false)
  const [search, setSearch] = useState('')

  const visitCount = new Set((checkIns as any[]).map(c => c.branchCode)).size
  const progressPct = Math.round((visitCount / (physicalBranches as any[]).length) * 100)
  const issueYear = new Date().getFullYear()
  const avatarLetter = profile.name?.trim() ? profile.name[0].toUpperCase() : '?'

  const mrzLine1 = (() => {
    const raw = (profile.name || 'TRAVELLER').toUpperCase()
    const parts = raw.replace(/[^A-Z ]/g, '').split(' ').filter(Boolean)
    const surname = parts[0] ?? 'TRAVELLER'
    const given = parts.slice(1).join('<') || ''
    const name = given ? `${surname}<<${given}` : surname
    return `P<TPL${name}`.slice(0, 30)
  })()

  const mrzLine2 = (() => {
    const num = `TPL${String(visitCount).padStart(5, '0')}`
    const dob = String(issueYear % 100).padStart(2, '0') + '0101'
    const pct = String(progressPct).padStart(3, '0')
    return `${num}CAN${dob}M${pct}PCT`
  })()

  const filteredBranches = search.trim()
    ? (sortedBranches as any[]).filter(b =>
        b.BranchName.toLowerCase().includes(search.toLowerCase())
      )
    : sortedBranches as any[]

  return (
    <>
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
                <TouchableOpacity onPress={() => setShowBranchPicker(true)}>
                  <Text style={[styles.fieldValue, { color: profile.homeBranch ? theme.tplBlue : theme.textMuted }]} numberOfLines={1}>
                    {profile.homeBranch ? branchNameForCode(profile.homeBranch) : 'Tap to set'}
                  </Text>
                </TouchableOpacity>
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
            <Text style={styles.mrzLine} numberOfLines={1} adjustsFontSizeToFit>{mrzLine1}</Text>
            <Text style={styles.mrzLine} numberOfLines={1} adjustsFontSizeToFit>{mrzLine2}</Text>
          </View>
          <View style={styles.mrzIssued}>
            <Text style={styles.mrzIssuedLabel}>Issued</Text>
            <Text style={[styles.mrzIssuedYear, { fontFamily: fonts.display }]}>{issueYear}</Text>
          </View>
        </View>
      </View>

      <Modal visible={showBranchPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, paddingBottom: insets.bottom }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary, fontFamily: fonts.display }]}>
                Home Branch
              </Text>
              <TouchableOpacity onPress={() => { setShowBranchPicker(false); setSearch('') }} hitSlop={8}>
                <Ionicons name="close" size={26} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={[styles.searchRow, { backgroundColor: theme.borderSoft, borderColor: theme.border }]}>
              <Ionicons name="search-outline" size={18} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                value={search}
                onChangeText={setSearch}
                placeholder="Search branches…"
                placeholderTextColor={theme.textMuted}
                clearButtonMode="while-editing"
                autoCapitalize="none"
              />
            </View>
            <FlatList
              data={filteredBranches}
              keyExtractor={item => item.BranchCode}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = profile.homeBranch === item.BranchCode
                return (
                  <TouchableOpacity
                    style={[
                      styles.branchRow,
                      { borderBottomColor: theme.border },
                      selected && { backgroundColor: `${theme.tplBlue}12` },
                    ]}
                    onPress={() => {
                      updateProfile({ homeBranch: item.BranchCode })
                      setShowBranchPicker(false)
                      setSearch('')
                    }}
                  >
                    <Text style={[styles.branchRowText, { color: selected ? theme.tplBlue : theme.textPrimary }]} numberOfLines={1}>
                      {item.BranchName}
                    </Text>
                    {selected && <Ionicons name="checkmark" size={20} color={theme.tplBlue} />}
                  </TouchableOpacity>
                )
              }}
            />
          </View>
        </View>
      </Modal>
    </>
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
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
  },
  libraryName: {
    fontSize: textSize.md,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.75)',
  },
  cardBody: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  profileFields: {
    flex: 1,
    gap: 10,
  },
  fieldLabel: {
    fontSize: textSize.sm,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  nameInput: {
    fontSize: textSize.xl,
    fontWeight: '700',
    lineHeight: 26,
    borderBottomWidth: 1.5,
    paddingBottom: 2,
    paddingTop: 0,
  },
  fieldValue: {
    fontSize: textSize.lg,
    fontWeight: '600',
  },
  avatar: {
    width: 64,
    height: 78,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarLetter: {
    fontSize: textSize.xxxl,
    fontWeight: '700',
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    paddingRight: 10,
    marginRight: 10,
    borderRightWidth: 1,
  },
  statNum: {
    fontSize: textSize.lg,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: textSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countChip: {
    marginLeft: 'auto',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  countChipNum: {
    fontSize: textSize.base,
    fontWeight: '700',
  },
  countChipDenom: {
    fontSize: textSize.md,
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
    letterSpacing: 0.8,
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    height: '75%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: textSize.xl,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: textSize.base,
    paddingVertical: 0,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  branchRowText: {
    fontSize: textSize.base,
    fontWeight: '500',
    flex: 1,
  },
})
