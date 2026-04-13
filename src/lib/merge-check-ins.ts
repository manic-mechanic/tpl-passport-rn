import type { CheckIn } from '../types'

// Pure merge logic for syncCheckIns. Kept in its own file so it can be
// unit-tested without dragging in React Native / Expo native modules.
export function mergeCheckIns(
  localCheckIns: CheckIn[],
  serverCheckIns: CheckIn[],
): { merged: CheckIn[]; toPush: CheckIn[] } {
  const key = (branchCode: string, timestamp: string) => `${branchCode}:${timestamp}`

  const serverMap = new Map(serverCheckIns.map(c => [key(c.branchCode, c.timestamp), c]))
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

  // Push local-only records to server, skipping same-branch+day duplicates
  // (the server would silently ignore them anyway, but no need to send them).
  const toPush = localCheckIns.filter(c => {
    if (serverMap.has(key(c.branchCode, c.timestamp))) return false
    return !serverBranchDays.has(`${c.branchCode}:${c.timestamp.slice(0, 10)}`)
  })

  return { merged, toPush }
}
