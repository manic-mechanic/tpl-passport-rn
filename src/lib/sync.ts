import * as SecureStore from 'expo-secure-store'
import { getCookie } from '@better-auth/expo/client'
import type { CheckIn } from '../types/index'
import { mergeCheckIns } from './merge-check-ins'

const BASE = 'https://auth.librarypassport.ca'
const SESSION_COOKIE_KEY = 'tplpassport_cookie'

async function getAuthCookie(): Promise<string> {
  const stored = await SecureStore.getItemAsync(SESSION_COOKIE_KEY)
  const cookie = getCookie(stored ?? '{}')
  if (!cookie) throw new Error('No active session')
  return cookie
}

export async function pushCheckIn(checkIn: CheckIn): Promise<void> {
  const cookie = await getAuthCookie()
  const res = await fetch(`${BASE}/api/checkins`, {
    method: 'POST',
    body: JSON.stringify({
      branchCode: checkIn.branchCode,
      timestamp: checkIn.timestamp,
      note: checkIn.note,
      photoUri: checkIn.photoUri ?? null,
    }),
    headers: { 'Content-Type': 'application/json', cookie },
  })
  if (!res.ok) throw new Error(`pushCheckIn failed: ${res.status}`)
}

export { mergeCheckIns } from './merge-check-ins'

export async function syncCheckIns(
  localCheckIns: CheckIn[],
  setCheckIns: (checkIns: CheckIn[]) => void
): Promise<void> {
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

  const { merged, toPush } = mergeCheckIns(localCheckIns, serverCheckIns)
  setCheckIns(merged)
  for (const ci of toPush) {
    pushCheckIn(ci).catch(() => {})
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
