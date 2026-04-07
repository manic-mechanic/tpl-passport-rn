# Plan: React Native MVP (Bones)

Goal: a running Expo app with working navigation, the data layer, core screens, and stamp rendering. Not for App Store release — just the skeleton proven out.

**Status: Phase 1–5 complete. App is running.**

---

## What's In / Out

**In:**
- Expo project with Expo Router + bottom tab nav
- JS theme object (design tokens)
- `useStamp.js` and `useRegion.js` ported (pure JS — near-zero work)
- Zustand store replacing Pinia
- `StampShape` component in RN
- Four core screens: Home, Passport, Check-in, Settings

**Out (deferred):**
- Auth (BetterAuth) — separate phase after bones are stable
- Explore tab (Near Me, Day Trips, Extra Credit) — significant UI, deferred
- History screen — secondary feature
- Badges / Extra Credit — deferred
- Events (CKAN API) — deferred
- QR / NFC — deferred
- Photos — deferred
- Analytics (PostHog / Sentry) — deferred
- Push notifications — deferred

---

## Phase 1 — Project Setup

```bash
npx create-expo-app tpl-passport-rn --template tabs
cd tpl-passport-rn
npx expo install expo-router expo-font @react-native-async-storage/async-storage
npx expo install zustand
npx expo install react-native-safe-area-context react-native-screens
npx expo install @gorhom/bottom-sheet react-native-gesture-handler react-native-reanimated
```

**Expo Router tab layout** (`app/(tabs)/_layout.tsx`):
```
(tabs)/
  _layout.tsx       ← tab navigator: Home, Passport, Check-in, Settings
  index.tsx         ← Home (/)
  passport.tsx      ← Passport
  check-in.tsx      ← Check-in
  settings.tsx      ← Settings
branch/
  [id].tsx          ← Branch detail (pushed modally from stamps/explore)
```

Explore is stubbed as a "coming soon" tab or omitted from the tab bar initially.

---

## Phase 2 — Design Tokens

CSS custom properties become a JS theme object. One file, imported wherever needed.

```js
// src/theme.ts
export const colors = {
  tplBlue:       '#005fc0',
  tplNavy:       '#001c71',
  bg:            '#f2ede3',
  surface:       '#ffffff',
  textPrimary:   '#1a1a1a',
  textMuted:     '#767676',
  border:        '#d4cfc4',
  borderSoft:    '#e8e3d8',
}

export const dark = {
  ...colors,
  tplNavy:       '#111850',
  tplBlue:       '#6aaaf8',
  bg:            '#121212',
  surface:       '#1e1e1e',
  textPrimary:   '#f0f0f0',
  textMuted:     '#999999',
  border:        '#333333',
  borderSoft:    '#2a2a2a',
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }
export const radius  = { sm: 8, md: 12, lg: 16, pill: 999 }

export const fonts = {
  display: 'Fraunces',
  body:    'Roboto',
  stampCondensed: 'RobotoCondensed',
  stampElite:     'SpecialElite',
  stampStencil:   'AllertaStencil',
}
```

Dark mode: maintain a `useTheme()` hook that returns `colors` or `dark` based on `useColorScheme()` + user preference from the store.

**Font loading** via `expo-font` in the root layout:
```tsx
const [loaded] = useFonts({
  Fraunces:       require('../assets/fonts/Fraunces.ttf'),
  Roboto:         require('../assets/fonts/Roboto-Regular.ttf'),
  RobotoCondensed: require('../assets/fonts/RobotoCondensed-Bold.ttf'),
  SpecialElite:   require('../assets/fonts/SpecialElite-Regular.ttf'),
  AllertaStencil: require('../assets/fonts/AllertaStencil-Regular.ttf'),
})
```

Copy font files from the web app's `public/` directory.

---

## Phase 3 — Data & Store

### `useStamp.js` and `useRegion.js`

Both are pure JS with no web or Vue dependencies. Copy them to `src/composables/` and change:
- `var(--font-stamp)` → `fonts.stampCondensed` etc. (pass the theme in or resolve at call site)
- Remove any Vue auto-import assumptions — add explicit imports if needed

`useRegion.js` imports from `#data/updated-branch-info.json` — change the import path to the copied JSON file location.

### Zustand store (port of Pinia passport store)

```ts
// src/stores/passport.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { physicalBranches } from '../composables/useRegion'

interface CheckIn {
  branchCode: string
  timestamp: string
  note: string
  hasPhoto?: boolean
}

interface Profile {
  name: string
  homeBranch: string
  theme: 'light' | 'dark' | ''
  bypassLocationFence: boolean
  hasSeenOnboarding: boolean
}

interface PassportStore {
  anonymousId: string
  checkIns: CheckIn[]
  profile: Profile
  completedChallenges: string[]
  // getters
  visitCount: () => number
  hasVisited: (branchCode: string) => boolean
  hasVisitedToday: (branchCode: string) => boolean
  visitedBranchCodes: () => Set<string>
  progressPct: () => number
  // actions
  checkIn: (branchCode: string, note?: string) => string | null
  markCheckInHasPhoto: (timestamp: string) => void
  updateProfile: (patch: Partial<Profile>) => void
}

export const usePassportStore = create<PassportStore>()(
  persist(
    (set, get) => ({
      anonymousId: crypto.randomUUID(),
      checkIns: [],
      profile: {
        name: '', homeBranch: '', theme: '', bypassLocationFence: false, hasSeenOnboarding: false,
      },
      completedChallenges: [],

      visitCount: () => get().visitedBranchCodes().size,
      visitedBranchCodes: () => new Set(get().checkIns.map(c => c.branchCode)),
      hasVisited: (code) => get().visitedBranchCodes().has(code),
      hasVisitedToday: (code) => {
        const today = new Date().toLocaleDateString('en-CA')
        return get().checkIns.some(c =>
          c.branchCode === code &&
          new Date(c.timestamp).toLocaleDateString('en-CA') === today
        )
      },
      progressPct: () =>
        Math.round((get().visitCount() / physicalBranches.length) * 100),

      checkIn: (branchCode, note = '') => {
        if (get().hasVisitedToday(branchCode)) return null
        const timestamp = new Date().toISOString()
        set(s => ({ checkIns: [{ branchCode, timestamp, note }, ...s.checkIns] }))
        return timestamp
      },
      markCheckInHasPhoto: (timestamp) =>
        set(s => ({
          checkIns: s.checkIns.map(c =>
            c.timestamp === timestamp ? { ...c, hasPhoto: true } : c
          )
        })),
      updateProfile: (patch) =>
        set(s => ({ profile: { ...s.profile, ...patch } })),
    }),
    {
      name: 'tpl-passport',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

---

## Phase 4 — StampShape Component

`StampShape.vue` uses CSS `borderRadius`, `color`, `background`, and `transform: rotate()`. This ports cleanly to React Native `View` + `StyleSheet`.

```tsx
// src/components/StampShape.tsx
import { View, Text, StyleSheet } from 'react-native'
import { getStampColor, getStampShape, getStampFont, getStampRotation, getStampOpacity } from '../composables/useStamp'
import { fonts } from '../theme'

interface Props {
  branchCode: string
  wardNo: number | string
  size?: number
}

export function StampShape({ branchCode, wardNo, size }: Props) {
  const shape    = getStampShape(branchCode)
  const font     = getStampFont(branchCode)   // returns font name string
  const rotation = getStampRotation(branchCode)
  const opacity  = getStampOpacity(branchCode)
  const { color, bg, border } = getStampColor(wardNo)

  const w = size ?? parseInt(shape.width)
  const h = size ?? parseInt(shape.height)
  const br = size ? size / 2 : parseInt(shape.borderRadius)
  const fontSize = Math.round(Math.min(w, h) * 0.30)

  return (
    <View style={[
      styles.stamp,
      { width: w, height: h, borderRadius: br, backgroundColor: bg, borderColor: border,
        transform: [{ rotate: `${rotation}deg` }] }
    ]}>
      <View style={[styles.ring, { borderRadius: br - 6, borderColor: color, opacity: 0.22 }]} />
      <Text style={[styles.code, { color, fontFamily: font, fontSize, opacity }]}>
        {branchCode}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  stamp: {
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    top: 6, bottom: 6, left: 6, right: 6,
    borderWidth: 1.5,
  },
  code: {
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
})
```

`getStampFont` currently returns CSS var strings (`'var(--font-stamp)'`). Update it to return the font name directly (`'RobotoCondensed'`, `'SpecialElite'`, `'AllertaStencil'`) — pass a platform flag or just replace the return values since the RN app has no CSS vars.

---

## Phase 5 — Core Screens

### Home

- Top bar with TPL logo + wordmark + settings gear
- `PassportCard` — name, progress bar, visit count. Port as a styled `View`.
- `RecentVisits` — last 3 check-ins as a horizontal strip or list
- `HomeBadgesStrip` — defer (stub with placeholder or omit)

### Passport

- Alpha page tabs (A–C, D–G, H–M, N–R, S–Z, Extra Credit) — use a scrollable `ScrollView` with tab buttons above, or a `FlatList` of sections
- 2-column stamp grid per page using `FlatList` with `numColumns={2}`
- Each stamp: `StampShape` + name + date, tap opens branch detail as a modal sheet
- Page completion seal — simple checkmark icon for MVP

Bottom sheet for branch detail: `@gorhom/bottom-sheet` wrapping a `BranchDetail` component (simplified — stamp, name, visit history, check-in button).

### Check-in

- Auto-detect nearest branch on mount via `expo-location`
- Branch name + `StampShape` preview
- Note textarea (`TextInput` multiline)
- "Check in" button
- Success state — stamp animation + nearby suggestions (stub for MVP)

### Settings

- Signed-in state (stub — show placeholder, wire up auth later)
- Theme toggle (light / auto / dark) — update store, use `Appearance` API
- About section

---

## Key Differences From Web to Watch

| Web | React Native |
|---|---|
| `localStorage` | `AsyncStorage` (async — all reads return Promises) |
| CSS `borderRadius: '50%'` | `borderRadius: width / 2` — must be a number |
| `color-mix()` | Not available — pre-compute alpha values or use hex with opacity |
| `position: sticky` | `stickyHeaderIndices` on `ScrollView`, or Animated values |
| `env(safe-area-inset-*)` | `useSafeAreaInsets()` from `react-native-safe-area-context` |
| `vaul-vue` bottom sheet | `@gorhom/bottom-sheet` |
| Vue Router `useRoute()` | `useLocalSearchParams()` from `expo-router` |
| CSS `transition` | `react-native-reanimated` or `Animated` API |
| `calc(100dvh - ...)` | `Dimensions.get('window').height - <n>` or Flex layout |

---

## Deferred Phases (After Bones Are Stable)

1. **Explore tab** — Near Me (expo-location already in use), Day Trips (static routes JSON already exists)
2. **Auth** — BetterAuth client works in RN; wire up login screen and session sync
3. **Badges / Extra Credit** — `useBadges.js` is pure JS and ports directly; UI is the work
4. **Events** — call `/api/branch-events` on the Vercel deployment directly
5. **Photos** — `expo-image-picker` + Cloudflare R2 upload
6. **QR check-in** — `expo-barcode-scanner`
7. **Analytics** — PostHog RN SDK, Sentry RN SDK
8. **Push notifications** — `expo-notifications` + APNs setup

---

## Implementation Notes (Lessons Learned)

### Completed deviations from the original plan

- **`anonymousId`**: `crypto.randomUUID()` is not available in Hermes. Replaced with `Date.now().toString(36) + Math.random().toString(36)`. Low priority — this field is a stub for future analytics and not used by anything yet.
- **Font files**: Loaded `Fraunces_72pt-Bold.ttf` as `'Fraunces'`. RN doesn't interpolate font-weight across files, so one Bold static cut is loaded for all display usage.
- **`textSize` scale**: All `fontSize` values use named constants from `src/theme.ts` (`xs` 10 → `xxxl` 28). No magic numbers in any screen or component we own.
- **Zustand reactivity**: Store getters (`visitCount()`) don't trigger re-renders when `checkIns` changes. Components that need reactive counts select raw `checkIns` and compute inline with `useMemo`.

### Check-in screen: navigation state

Tab screens stay mounted in Expo Router. State doesn't reset on re-navigation. Fixes applied:
- Replaced `useEffect([], [])` with `useFocusEffect(useCallback(..., [prefillCode]))` — resets and re-initialises on every focus
- If `prefillCode` is in URL params (from branch detail "Check in here" button), sets that branch directly; otherwise re-runs `detectNearest()`
- All ephemeral state (`noteText`, `locationError`, `successBranch`) cleared on focus

### `branch/[id]` modal

Registered in `app/_layout.tsx` as `presentation: 'modal'`. The `two` tab from the Expo template is still present in `(tabs)/_layout.tsx` with `href: null` — harmless but can be removed.
