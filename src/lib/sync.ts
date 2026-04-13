import * as SecureStore from 'expo-secure-store'
import { getCookie } from '@better-auth/expo/client'
import type { CheckIn } from '../types/index'

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

  const key = (branchCode: string, timestamp: string) => `${branchCode}:${timestamp}`

  const serverMap = new Map(
    data.map(row => [key(row.branch_code, row.timestamp), {
      branchCode: row.branch_code,
      timestamp: row.timestamp,
      note: row.note,
      photoUri: row.photo_url ?? undefined,
    } satisfies CheckIn])
  )

  const localMap = new Map(localCheckIns.map(c => [key(c.branchCode, c.timestamp), c]))

  // Server wins on conflict, but preserve local note/photo if server has none.
  // This covers the race where a local edit hasn't been pushed yet when sync runs.
  const mergedMap = new Map(serverMap)
  for (const [k, local] of localMap) {
    const server = mergedMap.get(k)
    if (!server) {
      mergedMap.set(k, { ...local, photoUri: local.photoUri })
    } else {
      mergedMap.set(k, {
        ...server,
        note: server.note || local.note,
        photoUri: server.photoUri ?? local.photoUri,
      })
    }
  }

  // Branch+day combos that already have a canonical record on the server.
  const serverBranchDays = new Set(
    Array.from(serverMap.values()).map(c => `${c.branchCode}:${c.timestamp.slice(0, 10)}`)
  )

  // Drop local-only records that are same-branch+day duplicates of a server record.
  // These were created on a device that checked in without syncing first.
  const merged = Array.from(mergedMap.values())
    .filter(c => {
      if (serverMap.has(key(c.branchCode, c.timestamp))) return true
      return !serverBranchDays.has(`${c.branchCode}:${c.timestamp.slice(0, 10)}`)
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  setCheckIns(merged)

  // Push local-only records to server, skipping same-branch+day duplicates
  // (the server would silently ignore them anyway, but no need to send them).
  const localOnly = localCheckIns.filter(c => {
    if (serverMap.has(key(c.branchCode, c.timestamp))) return false
    return !serverBranchDays.has(`${c.branchCode}:${c.timestamp.slice(0, 10)}`)
  })
  for (const ci of localOnly) {
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
