import { checkInDayKey } from '@tpl-passport/shared'
import type { CheckIn } from '../types'

// A photo already uploaded to R2. Anything else (a file:// path) only exists on
// this device and can't be sent to the server until migrateLocalPhotos uploads it.
export function isHostedPhoto(uri: string | undefined): uri is string {
  return !!uri && /^https:\/\//.test(uri)
}

function branchDayKey(c: CheckIn): string {
  return `${c.branchCode}|${checkInDayKey(c.timestamp)}`
}

// Pure merge logic for syncCheckIns, following the web app's reconcileCheckIns.
// Kept in its own file so it can be unit-tested without React Native / Expo.
//
// - Same timestamp on both sides: the server copy wins, except for a note or
//   photo the server copy is missing (e.g. an edit made here that never got
//   pushed). Those are kept and the record is pushed back up.
// - A local-only check-in for a branch + library day (Toronto time) the server
//   already has, e.g. the same visit recorded on two devices, is dropped: the
//   server keeps one per branch per day. If the server copy has no note or
//   photo, the local one's move onto it and it's pushed back up.
// - Remaining local-only check-ins are pushed.
//
// A photo that is still only on this device is kept in the merged result but
// never sent; pushCheckIn leaves it out. Once migrateLocalPhotos uploads it,
// the next sync finds the server copy without a photo and pushes the URL.
export function mergeCheckIns(
  localCheckIns: CheckIn[],
  serverCheckIns: CheckIn[],
): { merged: CheckIn[]; toPush: CheckIn[] } {
  const serverByTimestamp = new Map<string, CheckIn>()
  const serverByDay = new Map<string, CheckIn>()
  const mergedServer = serverCheckIns.map(c => {
    const copy = { ...c }
    serverByTimestamp.set(copy.timestamp, copy)
    if (!serverByDay.has(branchDayKey(copy))) serverByDay.set(branchDayKey(copy), copy)
    return copy
  })

  const localOnly: CheckIn[] = []
  const updated = new Set<CheckIn>()

  // Moves the local note/photo onto the server copy where it has none.
  function fillMissing(target: CheckIn, local: CheckIn) {
    if (!target.note?.trim() && local.note?.trim()) {
      target.note = local.note
      updated.add(target)
    }
    if (!target.photoUri && local.photoUri) {
      target.photoUri = local.photoUri
      if (isHostedPhoto(local.photoUri)) updated.add(target)
    }
  }

  for (const local of localCheckIns) {
    const sameTimestamp = serverByTimestamp.get(local.timestamp)
    if (sameTimestamp) {
      fillMissing(sameTimestamp, local)
      continue
    }
    const sameDay = serverByDay.get(branchDayKey(local))
    if (sameDay) {
      fillMissing(sameDay, local)
      continue
    }
    localOnly.push(local)
  }

  const merged = [...mergedServer, ...localOnly]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  return { merged, toPush: [...localOnly, ...updated] }
}
