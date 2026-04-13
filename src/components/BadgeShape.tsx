/**
 * SVG badge shape renderer — mirrors BadgeShape.vue from the web app.
 *
 * Shapes:  octagon / star via polygon clip-path percentages
 *          circle  via SvgCircle
 * Fills:   radial gradient (earned) or locked color (unearned) for most badges
 *          conic-gradient simulation via pie slices for navigator + page_turner
 * Labels:  badge.label text, or progress.current for unlabelled progress badges
 *          (approximates web's badge.stat(ctx) which we don't port)
 * Navigator: compass rose overlay matching IconCompassRose.vue
 */

import Svg, {
  Circle as SvgCircle,
  Defs,
  Line,
  Path,
  Polygon,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg'
import { compassPoints, type Badge, type BadgeCtx } from '../composables/useBadges'
import { branchesByAlphaPage } from '../composables/useRegion'
import { fonts } from '../theme'
import { useTheme } from '../hooks/useTheme'

// All coordinates are in a 64×64 viewBox; SVG scales to the `size` prop.

// Web: clip-path: polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)
const OCTAGON = '18.56,0 45.44,0 64,18.56 64,45.44 45.44,64 18.56,64 0,45.44 0,18.56'

// Web: clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)
const STAR = '32,0 39.04,22.4 62.72,22.4 43.52,36.48 50.56,58.24 32,44.8 13.44,58.24 20.48,36.48 1.28,22.4 24.96,22.4'

// Radial gradient stops: [inner, outer] matching web's radial-gradient(circle, inner 0%, outer 100%)
const GRADIENTS: Record<string, [string, string]> = {
  first:          ['#7ab4ec', '#3878c4'],
  explorer:       ['#4a90d9', '#0048a8'],
  adventurer:     ['#2e74c8', '#0030a0'],
  globetrotter:   ['#1e60b4', '#001e78'],
  complete:       ['#001c70', '#000640'],
  page_filler:    ['#52cc84', '#1a6640'],
  day_tripper:    ['#eaa040', '#9e3c14'],
  archivist:      ['#eaa040', '#9e3c14'],
  familiar_face:  ['#eaa040', '#9e3c14'],
  return_visitor: ['#eaa040', '#9e3c14'],
}

// Page Turner conic segment colors (web: PAGE_TURNER_COLORS)
const PAGE_COLORS = ['#e07832', '#52cc84', '#1898c0', '#d44545', '#8f5fe0']

/**
 * SVG arc-slice path for conic gradient simulation (64×64 space, center at 32,32).
 * startDeg/endDeg are in clockwise degrees where 0° = top (12 o'clock).
 */
function slicePath(startDeg: number, endDeg: number): string {
  const cx = 32, cy = 32, r = 32
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180
  const x1 = cx + r * Math.cos(toRad(startDeg))
  const y1 = cy + r * Math.sin(toRad(startDeg))
  const x2 = cx + r * Math.cos(toRad(endDeg))
  const y2 = cy + r * Math.sin(toRad(endDeg))
  return `M32,32 L${x1.toFixed(2)},${y1.toFixed(2)} A32,32 0 0,1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`
}

interface Props {
  badge: Badge
  ctx: BadgeCtx
  size?: number
}

export function BadgeShape({ badge, ctx, size = 64 }: Props) {
  const theme = useTheme()
  const earned = badge.earned(ctx)
  const lockedFill = theme.border
  const gradId = `grad_${badge.id}`

  // Label text: use badge.label if present, else progress.current for unlabelled progress badges
  // (mirrors web's badge.stat(ctx) fallback to badge.label)
  const labelStr: string | null = (() => {
    if (badge.id === 'page_turner' || badge.id === 'navigator') return null
    if (badge.label) return badge.label
    if (badge.progress) return String(badge.progress(ctx).current)
    return null
  })()

  const labelColor = earned ? '#fff' : theme.textMuted

  // ── Navigator ────────────────────────────────────────────────────────────────
  // Conic circle (4 compass quadrants) + compass rose overlay (mirrors IconCompassRose.vue)
  if (badge.id === 'navigator') {
    const v = ctx.visitedBranchCodes
    const hit = '#fff'
    const miss = theme.border
    const nHit = v.has(compassPoints.n)
    const eHit = v.has(compassPoints.e)
    const sHit = v.has(compassPoints.s)
    const wHit = v.has(compassPoints.w)
    const dark = 'rgba(0,0,0,0.7)'
    const faint = 'rgba(0,0,0,0.12)'

    return (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {/* Quadrant fills (conic simulation, from -45°) */}
        <Path d={slicePath(-45,  45)} fill={nHit ? hit : miss} />
        <Path d={slicePath( 45, 135)} fill={eHit ? hit : miss} />
        <Path d={slicePath(135, 225)} fill={sHit ? hit : miss} />
        <Path d={slicePath(225, 315)} fill={wHit ? hit : miss} />
        {/* Outer ring */}
        <SvgCircle cx="32" cy="32" r="30" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" />
        {/* N arrow */}
        <Path d="M32,6 L29,13 L35,13 Z" fill={nHit ? '#c0201a' : faint} />
        {/* E / S / W tick lines */}
        <Line x1="58" y1="32" x2="52" y2="32" strokeWidth="1.5" stroke={eHit ? dark : faint} />
        <Line x1="32" y1="58" x2="32" y2="52" strokeWidth="1.5" stroke={sHit ? dark : faint} />
        <Line x1="6"  y1="32" x2="12" y2="32" strokeWidth="1.5" stroke={wHit ? dark : faint} />
        {/* Direction labels */}
        <SvgText x="32" y="23" textAnchor="middle" fontSize="11" fontWeight="800" fill={nHit ? '#c0201a' : faint}>N</SvgText>
        <SvgText x="45" y="34" textAnchor="middle" fontSize="9"  fontWeight="700" fill={eHit ? dark : faint}>E</SvgText>
        <SvgText x="32" y="47" textAnchor="middle" fontSize="9"  fontWeight="700" fill={sHit ? dark : faint}>S</SvgText>
        <SvgText x="19" y="34" textAnchor="middle" fontSize="9"  fontWeight="700" fill={wHit ? dark : faint}>W</SvgText>
        <SvgCircle cx="32" cy="32" r="2" fill="rgba(0,0,0,0.7)" />
      </Svg>
    )
  }

  // ── Page Turner ──────────────────────────────────────────────────────────────
  // 5 conic segments (one per alpha page), from -36°, 72° each
  if (badge.id === 'page_turner') {
    return (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {branchesByAlphaPage.map((page, i) => {
          const visited = page.branches.some(b => ctx.visitedBranchCodes.has(b.BranchCode))
          const start = -36 + i * 72
          return (
            <Path
              key={i}
              d={slicePath(start, start + 72)}
              fill={visited ? PAGE_COLORS[i] : lockedFill}
            />
          )
        })}
        <SvgCircle cx="32" cy="32" r="2.5" fill="rgba(255,255,255,0.25)" />
      </Svg>
    )
  }

  // ── Octagon ──────────────────────────────────────────────────────────────────
  if (badge.shape === 'octagon') {
    const fill = earned ? `url(#${gradId})` : lockedFill
    return (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {earned && (
          <Defs>
            <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
              <Stop offset="0%"   stopColor={GRADIENTS[badge.id][0]} />
              <Stop offset="100%" stopColor={GRADIENTS[badge.id][1]} />
            </RadialGradient>
          </Defs>
        )}
        <Polygon points={OCTAGON} fill={fill} />
        {labelStr && (
          <SvgText x="32" y="36" textAnchor="middle" fontSize="16" fontWeight="700"
            fontFamily={fonts.display} fill={labelColor}>
            {labelStr}
          </SvgText>
        )}
      </Svg>
    )
  }

  // ── Star ─────────────────────────────────────────────────────────────────────
  if (badge.shape === 'star') {
    const fill = earned ? `url(#${gradId})` : lockedFill
    return (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {earned && (
          <Defs>
            <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
              <Stop offset="0%"   stopColor={GRADIENTS[badge.id][0]} />
              <Stop offset="100%" stopColor={GRADIENTS[badge.id][1]} />
            </RadialGradient>
          </Defs>
        )}
        <Polygon points={STAR} fill={fill} />
        {labelStr && (
          // web: .star .badge-content { margin-top: 3px } — shift text down slightly
          <SvgText x="32" y="38" textAnchor="middle" fontSize="16" fontWeight="700"
            fontFamily={fonts.display} fill={labelColor}>
            {labelStr}
          </SvgText>
        )}
      </Svg>
    )
  }

  // ── Circle (page_filler + any future circle badges) ──────────────────────────
  const fill = earned ? `url(#${gradId})` : lockedFill
  const grad = GRADIENTS[badge.id]
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {earned && grad && (
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={grad[0]} />
            <Stop offset="100%" stopColor={grad[1]} />
          </RadialGradient>
        </Defs>
      )}
      <SvgCircle cx="32" cy="32" r="32" fill={fill} />
      {labelStr && (
        <SvgText x="32" y="36" textAnchor="middle" fontSize="16" fontWeight="700"
          fontFamily={fonts.display} fill={labelColor}>
          {labelStr}
        </SvgText>
      )}
    </Svg>
  )
}
