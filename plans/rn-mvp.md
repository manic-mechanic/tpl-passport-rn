# Plan: React Native MVP

**Status: Phases 1–5 complete + Explore/Badges/Events done. Auth and Photos blocked on Vercel URL / R2 config.**

---

## Done

- Expo Router + 4-tab nav (Home, Passport, Check-in, Settings)
- `src/theme.ts` — colors/dark, spacing, radius, textSize scale, fonts
- `useStamp.js` + `useRegion.js` ported to `src/composables/`
- Zustand store with AsyncStorage persist (`src/stores/passport.ts`)
- `StampShape`, `PassportCard`, `RecentVisits`, `BranchDetail` components
- `app/branch/[id].tsx` — full-screen modal
- expo-location in check-in: auto-detect nearest, 100m fence, bypass toggle
- `useFocusEffect` on check-in screen so all flows (tab tap, prefill URL, success dismiss) reset correctly

**Gotchas to remember:**
- `crypto.randomUUID()` not available in Hermes — use `Date.now().toString(36)` pattern
- Zustand getters don't trigger re-renders — select raw `checkIns` and compute with `useMemo`
- Tab screens stay mounted — use `useFocusEffect` not `useEffect([], [])`

---

## Deferred Phases

1. **Explore tab** — Near Me, Day Trips (static routes JSON exists in web repo)
2. **Auth** — BetterAuth client; login screen + session sync
3. **Badges / Extra Credit** — `useBadges.js` is pure JS, UI is the work
4. **Events** — hit `/api/branch-events` on the Vercel deployment
5. **Photos** — `expo-image-picker` + Cloudflare R2
6. **QR check-in** — `expo-barcode-scanner`
7. **Analytics** — PostHog RN SDK, Sentry RN SDK
8. **Push notifications** — `expo-notifications` + APNs
