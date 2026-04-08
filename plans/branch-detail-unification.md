# Plan: Unified Branch Detail + Check-In

## Problem

Branch detail surfaces from at least 6 entry points with two different presentations (full-screen modal vs BottomSheetModal) and inconsistent styles. Tapping "Nearby branches" from inside the Passport bottom sheet pushes a modal route on top of the open sheet — stacking UI layers that are impossible to escape cleanly.

## Decision

**`app/branch/[id].tsx` is the single, universal branch detail presentation.**

- Navy header + cream body (already implemented)
- Reached via `router.push('/branch/[id]')` from every entry point
- No more BottomSheetModal usage for branch detail

This eliminates the stacking issue entirely. The navigation stack handles back-navigation naturally.

---

## Changes Required

### 1. Passport screen (`app/(tabs)/passport.tsx`)
- Remove `BottomSheetModal`, `BottomSheetScrollView`, `@gorhom/bottom-sheet` imports
- Remove `bottomSheetRef`, `snapPoints`, `selectedBranch` state
- `openBranch(branch)` becomes `router.push('/branch/' + branch.BranchCode)`
- Remove the `<BottomSheetModal>` block at the bottom

### 2. Nearby branches navigation in `BranchDetail.tsx`
- Already uses `router.push('/branch/[id]')` ✓ — no change needed

### 3. Check-in flow from branch detail
- Already routes to `/(tabs)/check-in?branch=CODE` ✓ — no change needed
- After check-in success, "View branch" already routes to `branch/[id]` ✓

---

## Entry Points After Unification

| Entry point | Action | Result |
|---|---|---|
| Home → recent visit stamp | `router.push('/branch/[id]')` | modal |
| Explore → near me row | `router.push('/branch/[id]')` | modal |
| Explore → day trip stamp | `router.push('/branch/[id]')` | modal |
| Passport → stamp tap | `router.push('/branch/[id]')` | modal |
| BranchDetail → nearby branch | `router.push('/branch/[id]')` | modal (stackable, back works) |
| Check-in success → View branch | `router.push('/branch/[id]')` | modal |

## Check-In Entry Points

| Entry point | Action |
|---|---|
| BranchDetail → "Check in here" button | `router.push('/(tabs)/check-in?branch=CODE')` |
| Check In tab | direct |

---

## What's Not Changing

- `BranchDetail.tsx` component internals — used inside `branch/[id].tsx` unchanged
- `branch/[id].tsx` style — navy header, close button, cream scroll body
- Check-in flow, success state, location fence logic
