# Plan: Code Readability & Maintainability

Improvements to make the codebase easier to read, type-safe, and navigable for new developers.

---

## 1. Define core TypeScript interfaces

**Priority: High — unblocks everything else**

Create `/src/types/index.ts` with interfaces derived from the actual JSON data shapes:

```ts
// Branch (from src/data/branch-info.json)
export interface Branch {
  BranchCode: string
  BranchName: string
  Lat: number
  Long: number
  Address?: string
  District?: string
  WardNo: number
  PhysicalBranch: 1 | 0
}

// Route (from src/data/routes.json)
export interface Route {
  id: string
  name: string
  description: string
  branches: string[]  // BranchCodes
}

// CheckIn (from Zustand store)
export interface CheckIn {
  id: string
  branchCode: string
  date: string        // ISO date string
  note?: string
}
```

Then replace all `as any[]` casts throughout the codebase:
- `src/components/PassportCard.tsx` — 8 instances
- `app/(tabs)/explore.tsx` — 5 instances
- `app/(tabs)/check-in.tsx` — 5 instances
- `app/(tabs)/passport.tsx` — 4 instances
- `src/components/BranchDetail.tsx` — 4 instances
- `src/components/RecentVisits.tsx` — 3 instances
- `router.push(... as any)` — 9 instances (use typed Expo Router paths or cast at one boundary)

---

## 2. Extract types for Zustand store

**Priority: High**

The store's `checkIns` array and `profile` object are used everywhere but exported without types. In `src/stores/passport.ts`:
- Export `CheckIn` type (or import from `/src/types`)
- Export `Profile` type for the user profile object
- Add explicit return types to all store selectors

This stops the cascade of `as any` in components that consume store state.

---

## 3. Split `check-in.tsx` into two components

**Priority: High — biggest single file complexity win**

`app/(tabs)/check-in.tsx` (412 lines) contains two unrelated UI flows. Split:

- **`CheckInForm`** (`src/components/CheckInForm.tsx`) — the main form: location detection, branch picker, note input, submit button. Contains most of the state logic.
- **`CheckInSuccess`** (`src/components/CheckInSuccess.tsx`) — the success confirmation screen: stamp display, branch name, note preview, "done" button.

`check-in.tsx` becomes a thin coordinator (~40 lines):
```tsx
export default function CheckInScreen() {
  const [successBranch, setSuccessBranch] = useState<Branch | null>(null)
  if (successBranch) return <CheckInSuccess branch={successBranch} onDone={() => setSuccessBranch(null)} />
  return <CheckInForm onSuccess={setSuccessBranch} />
}
```

---

## 4. Break up `PassportCard.tsx` — extract MRZ and branch picker

**Priority: Medium**

`src/components/PassportCard.tsx` (385 lines) has two clearly separable concerns:

**a) Extract `generateMRZ(name, visitCount, issueYear)` to a pure utility function** in `src/lib/mrz.ts`:
```ts
// Generates a simplified MRZ (Machine Readable Zone) string in ICAO 9303 format.
// Line 1: P<TPL + surname<<given (max 30 chars)
// Line 2: TPLnnnnn + CAN + YYMMDD + PCT
export function generateMRZ(name: string, visitCount: number, issueYear: number): { line1: string; line2: string }
```
Add a comment explaining these are passport-style display strings, not real document data.

**b) Extract `BranchPickerModal`** (`src/components/BranchPickerModal.tsx`) — the modal + FlatList + search input currently embedded in PassportCard. Props: `branches`, `onSelect`, `onClose`.

PassportCard then composes these two pieces rather than defining them inline.

---

## 5. Reorganize `useBadges.ts` for scannability

**Priority: Medium**

`src/composables/useBadges.ts` (305 lines) is one long array of badge definitions. It's not wrong, just hard to scan. Two options — pick one:

**Option A (minimal change):** Add visual section separators and consistent spacing:
```ts
// ─── Visit Count Badges ───────────────────────────────────────────────────
{ id: 'first', ... },
{ id: 'ten', ... },
{ id: 'allBranches', ... },

// ─── Streak Badges ────────────────────────────────────────────────────────
{ id: 'streak3', ... },
```

**Option B (fuller refactor):** Extract a `defineBadge(config)` factory and group badges into named arrays:
```ts
const visitCountBadges = [
  defineBadge({ id: 'first', ... }),
  defineBadge({ id: 'ten', ... }),
]
const streakBadges = [...]
export const BADGES = [...visitCountBadges, ...streakBadges, ...]
```

Option A is quicker. Option B makes it easier to add new badges later.

---

## 6. Name magic numbers and hardcoded constants

**Priority: Medium**

Replace inline literals with named constants at the top of each file (or in a shared `src/lib/constants.ts` if used across files):

| Location | Current | Fix |
|---|---|---|
| `check-in.tsx:16` | `'TRL'` | `const FALLBACK_BRANCH_CODE = 'TRL'` + comment: "used when no branch selected and GPS fails" |
| `check-in.tsx:100` | `km > 0.1` | `const MAX_CHECKIN_DISTANCE_KM = 0.1` |
| `BranchDetail.tsx:15` | `864e5` | `const MS_PER_DAY = 24 * 60 * 60 * 1000` |
| `check-in.tsx err code 3` | `err?.code === 3` | `const LOCATION_TIMEOUT_CODE = 3` + comment: "GeolocationPositionError.TIMEOUT" |
| `PassportCard.tsx:81,154` | `${theme.tplBlue}1a` / `12` | extract as `theme.tplBlueSubtle` and `theme.tplBlueHover` in `theme.ts` |

---

## 7. Fix silent error swallowing in `BranchDetail.tsx`

**Priority: Medium**

`src/components/BranchDetail.tsx:33`:
```ts
.catch(() => {})
```

Replace with at minimum:
```ts
.catch((err) => {
  console.warn('[BranchDetail] Failed to load events:', err)
  setEvents([])
})
```

Optionally surface a "couldn't load events" message in the UI if this is user-visible.

---

## 8. Rename `composables/` to `hooks/` (or merge)

**Priority: Low**

`src/composables/` is Vue.js naming. In a React project it reads as a mistake. Options:

- Rename to `src/hooks/` and merge with existing `src/hooks/` (check for naming collisions)
- Or rename to `src/lib/` if these files are not React hooks

Also rename `useRegion.js` and `useStamp.js` — these don't use `useState`/`useEffect` so the `use` prefix is misleading. Better names: `branchData.ts`, `stampUtils.ts`. Convert from `.js` to `.ts` at the same time.

---

## 9. Delete dead code

**Priority: Low**

Files to remove:
- `app/(tabs)/two.tsx` — hidden from tabs, never used
- `app/modal.tsx` — never referenced by any route
- `components/EditScreenInfo.tsx`
- `components/ExternalLink.tsx`
- `components/StyledText.tsx`
- `components/Themed.tsx`
- `components/useClientOnlyValue.ts`
- `constants/Colors.ts` — superseded by `src/theme.ts`

Verify with a grep for imports before deleting each one.

---

## Order of attack

1. ✅ `src/types/index.ts` — interfaces first, everything else gets easier
2. ✅ Replace `as any` casts using the new types
3. Split `check-in.tsx`
4. Extract MRZ + BranchPickerModal from `PassportCard.tsx`
5. ✅ Magic numbers
6. ✅ Silent catch fix
7. ✅ `useBadges.ts` section separators (Option A)
8. ✅ Rename `composables/` + convert `.js` → `.ts`
9. ✅ Delete dead code
