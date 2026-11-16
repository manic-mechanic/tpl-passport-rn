import * as SecureStore from 'expo-secure-store'
import { getCookie } from '@better-auth/expo/client'
import type { CheckIn } from '../types/index'
import { isHostedPhoto, mergeCheckIns } from './merge-check-ins'
import { usePassportStore } from '../stores/passport'

const BASE = 'https://auth.librarypassport.ca'
const SESSION_COOKIE_KEY = 'tplpassport_cookie'

async function getAuthCookie(): Promise<string> {
  const stored = await SecureStore.getItemAsync(SESSION_COOKIE_KEY)
  const cookie = getCookie(stored ?? '{}')
  if (!cookie) throw new Error('No active session')
  return cookie
}

// Sends one check-in. A photo still only on this device (file://) is left
// out: the server only accepts this user's own uploaded photo URLs and would
// reject the whole check-in. Resolves to the timestamp of the check-in the
// server kept instead when another one (e.g. from another device) already
// holds this branch and library day, or null when this one was saved.
async function postCheckIn(checkIn: CheckIn): Promise<string | null> {
  const cookie = await getAuthCookie()
  const res = await fetch(`${BASE}/api/checkins`, {
    method: 'POST',
    body: JSON.stringify({
      branchCode: checkIn.branchCode,
      timestamp: checkIn.timestamp,
      note: checkIn.note,
      photoUri: isHostedPhoto(checkIn.photoUri) ? checkIn.photoUri : null,
    }),
    headers: { 'Content-Type': 'application/json', cookie },
  })
  if (!res.ok) throw new Error(`pushCheckIn failed: ${res.status}`)
  const data = await res.json().catch(() => null) as { duplicateOf?: string | null } | null
  return data?.duplicateOf ?? null
}

// Pushes a check-in made or edited here. If the server kept a different
// check-in for that branch and day, sync so this device drops its copy and
// moves its note or photo onto the kept one.
export async function pushCheckIn(checkIn: CheckIn): Promise<void> {
  const duplicateOf = await postCheckIn(checkIn)
  if (duplicateOf) await syncCheckIns()
}

export { mergeCheckIns } from './merge-check-ins'

let inFlight: Promise<void> | null = null

// Merges the server's check-ins with this device's and pushes what the server
// is missing. Concurrent calls share one run.
export function syncCheckIns(): Promise<void> {
  if (!inFlight) {
    inFlight = runSync().finally(() => { inFlight = null })
  }
  return inFlight
}

async function runSync(): Promise<void> {
  const cookie = await getAuthCookie()
  const res = await fetch(`${BASE}/api/checkins`, { headers: { cookie } })
  if (!res.ok) return

  const data: Array<{
    branch_code: string
    timestamp: string
    note: string
    photo_url: string | null
  }> = await res.json()

  const serverCheckIns: CheckIn[] = data.map(row => ({
    branchCode: row.branch_code,
    timestamp: row.timestamp,
    note: row.note,
    photoUri: row.photo_url ?? undefined,
  }))

  // Read local state after the fetch, so a check-in made meanwhile isn't lost.
  const { checkIns: localCheckIns, setCheckIns } = usePassportStore.getState()
  const { merged, toPush } = mergeCheckIns(localCheckIns, serverCheckIns)
  setCheckIns(merged)
  // A duplicateOf here means another device saved the same branch and day
  // since the fetch; the next sync folds it in.
  for (const ci of toPush) {
    await postCheckIn(ci).catch(() => {})
  }
}

interface ProfileApiResponse { name: string; home_branch: string }

export async function fetchProfile(): Promise<{ name: string; homeBranch: string } | null> {
  const cookie = await getAuthCookie()
  const res = await fetch(`${BASE}/api/profile`, { headers: { cookie } })
  if (!res.ok) return null
  const { name, home_branch } = await res.json() as ProfileApiResponse
  return { name, homeBranch: home_branch }
}

export async function pushProfile(name: string, homeBranch: string): Promise<void> {
  const cookie = await getAuthCookie()
  const res = await fetch(`${BASE}/api/profile`, {
    method: 'PUT',
    body: JSON.stringify({ name, homeBranch }),
    headers: { 'Content-Type': 'application/json', cookie },
  })
  if (!res.ok) throw new Error(`pushProfile failed: ${res.status}`)
}
