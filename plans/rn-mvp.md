# Plan: React Native MVP

**Status: All screens complete and polished. Auth and Photos are next — blocked on Vercel URL / R2 config.**

---

## Gotchas

- `crypto.randomUUID()` not available in Hermes — use `Date.now().toString(36)` pattern
- Zustand getters don't trigger re-renders — select raw `checkIns` and compute with `useMemo`
- Tab screens stay mounted — use `useFocusEffect` not `useEffect([], [])`
- Tab bar handles bottom safe area — don't add `insets.bottom` to elements directly above it
- `StampShape` size prop scales proportionally from shape's natural dimensions; `borderRadius` scales with it
- Branch detail is a single modal route (`app/branch/[id].tsx`). Nearby branch taps swap the branch in local state (`setCurrentId`) — do not use `router.push/replace` or modals will stack

---

## Up Next

1. **Photos** — `expo-image-picker` in check-in flow, upload to Cloudflare R2 via presigned URL. **Blocked: needs R2 bucket + presigned URL endpoint in `tpl-passport-auth`.**

## Done

- **Auth** — BetterAuth client, email/password + Google OAuth, session stored in `expo-secure-store`, shown in Settings. Auth server at `auth.librarypassport.ca` (`tpl-passport-auth` repo, Cloudflare Workers).

---

## Backlog

- **QR check-in** — `expo-barcode-scanner`
- **Analytics** — PostHog RN SDK, Sentry RN SDK
- **Push notifications** — `expo-notifications` + APNs
