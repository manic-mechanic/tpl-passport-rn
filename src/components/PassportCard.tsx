import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useRef } from 'react'
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Defs, G, Mask, Path, Rect, Svg } from 'react-native-svg'
import { physicalBranches } from '../composables/useRegion'
import { useTheme } from '../hooks/useTheme'
import { authClient } from '../lib/auth-client'
import { generateMRZ } from '../lib/mrz'
import { branchNameForCode } from '../lib/utils'
import { usePassportStore } from '../stores/passport'
import { fonts, radius, textSize } from '../theme'
import { BranchPickerModal } from './BranchPickerModal'

// boring-avatars beam algorithm (inlined — package utilities not exported at runtime)
function _hash(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) { h = Math.imul(h, 31) + name.charCodeAt(i) | 0 }
  return Math.abs(h)
}
function _unit(n: number, range: number, idx?: number) {
  const v = n % range
  return idx !== undefined && Math.floor(n / 10 ** idx) % 10 % 2 === 0 ? -v : v
}
function _color(n: number, colors: string[]) { return colors[n % colors.length] }
function _bool(n: number, idx: number) { return Math.floor(n / 10 ** idx) % 10 % 2 === 0 }
function _contrast(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000000' : '#ffffff'
}

const AVATAR_COLORS = [
  '#005fc0', // TPL blue
  '#001c71', // TPL navy
  '#1a6b4a', // forest green
  '#6b3fa0', // purple
  '#0d7a8a', // teal
  '#c45520', // burnt orange
  '#8b4513', // terracotta
  '#f5d6db', // light rose   (stamp hue 350, 90% l)
  '#d6f5ed', // light mint   (stamp hue 165, 90% l)
  '#e8d8f5', // light lavender (stamp hue 275, 90% l)
]
const S = 36

function getBeamData(name: string) {
  const n = _hash(name || 'TPL Passport')
  const wrapperColor = _color(n, AVATAR_COLORS)
  const wx = _unit(n, 10, 1)
  const wy = _unit(n, 10, 2)
  const wrapperTranslateX = wx < 5 ? wx + S / 9 : wx
  const wrapperTranslateY = wy < 5 ? wy + S / 9 : wy
  return {
    backgroundColor: _color(n + 13, AVATAR_COLORS),
    wrapperColor,
    faceColor: _contrast(wrapperColor),
    wrapperTranslateX,
    wrapperTranslateY,
    wrapperRotate: _unit(n, 360),
    wrapperScale: 1 + _unit(n, S / 12) / 10,
    isMouthOpen: _bool(n, 2),
    isCircle: _bool(n, 1),
    eyeSpread: _unit(n, 5),
    mouthSpread: _unit(n, 3),
    faceRotate: _unit(n, 10, 3),
    faceTranslateX: wrapperTranslateX > S / 6 ? wrapperTranslateX / 2 : _unit(n, 8, 1),
    faceTranslateY: wrapperTranslateY > S / 6 ? wrapperTranslateY / 2 : _unit(n, 7, 2),
  }
}

function BeamAvatar({ name }: { name: string }) {
  const d = getBeamData(name)
  return (
    <Svg viewBox="0 0 36 36" width="100%" height="100%">
      <Defs>
        <Mask id="beam-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
          <Rect width="36" height="36" fill="#FFFFFF" />
        </Mask>
      </Defs>
      <G mask="url(#beam-mask)">
        <Rect width="36" height="36" fill={d.backgroundColor} />
        <Rect x="0" y="0" width="36" height="36"
          transform={`translate(${d.wrapperTranslateX} ${d.wrapperTranslateY}) rotate(${d.wrapperRotate} 18 18) scale(${d.wrapperScale})`}
          fill={d.wrapperColor}
          rx={d.isCircle ? 36 : 6}
        />
        <G transform={`translate(${d.faceTranslateX} ${d.faceTranslateY}) rotate(${d.faceRotate} 18 18)`}>
          {d.isMouthOpen
            ? <Path d={`M15 ${19 + d.mouthSpread}c2 1 4 1 6 0`} stroke={d.faceColor} fill="none" strokeLinecap="round" />
            : <Path d={`M13,${19 + d.mouthSpread} a1,0.75 0 0,0 10,0`} fill={d.faceColor} />
          }
          <Rect x={14 - d.eyeSpread} y="14" width="1.5" height="2" rx="1" fill={d.faceColor} />
          <Rect x={20 + d.eyeSpread} y="14" width="1.5" height="2" rx="1" fill={d.faceColor} />
        </G>
      </G>
    </Svg>
  )
}

export function PassportCard() {
  const theme = useTheme()
  const profile = usePassportStore(s => s.profile)
  const checkIns = usePassportStore(s => s.checkIns)
  const visitCount = usePassportStore(s => s.visitCount())
  const progressPct = usePassportStore(s => s.progressPct())
  const updateProfile = usePassportStore(s => s.updateProfile)

  const { data: session } = authClient.useSession()
  const signedIn = !!session?.user
  const branchPickerRef = useRef<BottomSheetModal>(null)

  const issueYear = new Date().getFullYear()
  const { line1: mrzLine1, line2: mrzLine2 } = generateMRZ(profile.name, visitCount, progressPct, issueYear)

  return (
    <>
      <View style={[styles.shadow, { borderRadius: radius.lg, shadowColor: theme.shadowColor }]}>
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
              <View style={[styles.avatar, { borderColor: theme.border }]}>
                <BeamAvatar name={[profile.name, profile.homeBranch].filter(Boolean).join('|') || 'TPL Passport'} />
              </View>
            </View>

            <View style={[styles.progressTrack, { backgroundColor: theme.borderSoft }]}>
              <View style={[styles.progressFill, { backgroundColor: theme.tplBlue, width: `${progressPct}%` }]} />
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
    shadowColor: '#000',  // overridden inline via theme.shadowColor
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
    overflow: 'hidden',
    flexShrink: 0,
    borderWidth: 2,
    padding: 3,
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
