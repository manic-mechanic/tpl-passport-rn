import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useRef } from 'react'
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { physicalBranches, sortedBranches } from '../composables/useRegion'
import { useTheme } from '../hooks/useTheme'
import { authClient } from '../lib/auth-client'
import { generateMRZ } from '../lib/mrz'
import { usePassportStore } from '../stores/passport'
import { fonts, radius, textSize } from '../theme'
import { BranchPickerModal } from './BranchPickerModal'

function branchNameForCode(code: string): string {
  return sortedBranches.find(b => b.BranchCode === code)?.BranchName ?? ''
}

export function PassportCard() {
  const theme = useTheme()
  const profile = usePassportStore(s => s.profile)
  const checkIns = usePassportStore(s => s.checkIns)
  const updateProfile = usePassportStore(s => s.updateProfile)

  const { data: session } = authClient.useSession()
  const signedIn = !!session?.user
  const branchPickerRef = useRef<BottomSheetModal>(null)

  const visitCount = new Set(checkIns.map(c => c.branchCode)).size
  const progressPct = Math.round((visitCount / physicalBranches.length) * 100)
  const issueYear = new Date().getFullYear()
  const avatarLetter = profile.name?.trim() ? profile.name[0].toUpperCase() : '?'
  const { line1: mrzLine1, line2: mrzLine2 } = generateMRZ(profile.name, visitCount, progressPct, issueYear)

  return (
    <>
      <View style={[styles.shadow, { borderRadius: radius.lg }]}>
        <View style={[styles.card, { borderRadius: radius.lg }]}>
          <View style={[styles.sideBorders, { borderColor: theme.tplBlue, borderRadius: radius.lg }]} pointerEvents="none" />
          <View style={[styles.cardTop, { backgroundColor: theme.tplBlue }]}>
            <Text style={styles.libraryName}>Toronto Public Library</Text>
          </View>

          <View style={[styles.cardBody, { backgroundColor: theme.bg }]}>
            <View style={styles.profileRow}>
              <View style={styles.profileFields}>
                <View>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Name / Nom</Text>
                  {signedIn ? (
                    <Text style={[styles.nameInput, { color: theme.tplBlue, fontFamily: fonts.display, borderBottomWidth: 0 }]}>
                      {profile.name || '—'}
                    </Text>
                  ) : (
                    <TextInput
                      style={[styles.nameInput, { color: theme.tplBlue, fontFamily: fonts.display, borderBottomColor: theme.borderSoft }]}
                      value={profile.name}
                      onChangeText={name => updateProfile({ name })}
                      placeholder="Your name"
                      placeholderTextColor={theme.textMuted}
                      maxLength={40}
                      autoCapitalize="words"
                      autoComplete="name"
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  )}
                </View>
                <View>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Home Branch</Text>
                  {signedIn ? (
                    <Text style={[styles.fieldValue, { color: profile.homeBranch ? theme.tplBlue : theme.textMuted }]} numberOfLines={1}>
                      {profile.homeBranch ? branchNameForCode(profile.homeBranch) : '—'}
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={() => branchPickerRef.current?.present()}>
                      <Text style={[styles.fieldValue, { color: profile.homeBranch ? theme.tplBlue : theme.textMuted }]} numberOfLines={1}>
                        {profile.homeBranch ? branchNameForCode(profile.homeBranch) : 'Tap to set'}
                      </Text>
                    </TouchableOpacity>
                  )}
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
                <Text style={[styles.statNum, { color: theme.tplBlue, fontFamily: fonts.display }]}>{checkIns.length}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Visits</Text>
              </View>
              <View style={[styles.stat, { borderRightColor: theme.borderSoft }]}>
                <Text style={[styles.statNum, { color: theme.tplBlue, fontFamily: fonts.display }]}>{progressPct}%</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Complete</Text>
              </View>
              <View style={[styles.countChip, { backgroundColor: theme.borderSoft, borderColor: theme.border }]}>
                <Text style={[styles.countChipNum, { color: theme.tplNavy, fontFamily: fonts.display }]}>{visitCount}</Text>
                <Text style={[styles.countChipDenom, { color: theme.textMuted }]}>/ {physicalBranches.length}</Text>
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
      </View>

      {!signedIn && (
        <BranchPickerModal
          ref={branchPickerRef}
          selectedCode={profile.homeBranch}
          onSelect={code => updateProfile({ homeBranch: code })}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  sideBorders: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0.25,
    right: 0.125,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    zIndex: 1,
  },
  shadow: {
    shadowColor: '#001c71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 5,
  },
  card: {
    overflow: 'hidden',
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
    height: 30,
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
})
