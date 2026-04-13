import { describe, it, expect } from 'vitest'
import { mergeCheckIns } from './merge-check-ins'
import type { CheckIn } from '../types'

function ci(branchCode: string, timestamp: string, note = '', photoUri?: string): CheckIn {
  return { branchCode, timestamp, note, ...(photoUri ? { photoUri } : {}) }
}

// Timestamps on different days
const T1 = '2024-04-10T10:00:00.000Z' // Apr 10
const T2 = '2024-04-10T14:00:00.000Z' // Apr 10, same day as T1, different device
const T3 = '2024-04-11T09:00:00.000Z' // Apr 11

describe('mergeCheckIns', () => {
  describe('basic merge', () => {
    it('returns server records when local is empty', () => {
      const server = [ci('AGO', T1)]
      const { merged, toPush } = mergeCheckIns([], server)
      expect(merged).toEqual([ci('AGO', T1)])
      expect(toPush).toEqual([])
    })

    it('returns local records when server is empty', () => {
      const local = [ci('AGO', T1)]
      const { merged, toPush } = mergeCheckIns(local, [])
      expect(merged).toEqual([ci('AGO', T1)])
      expect(toPush).toEqual([ci('AGO', T1)])
    })

    it('includes records from both sides', () => {
      const local = [ci('AGO', T1)]
      const server = [ci('BRO', T3)]
      const { merged } = mergeCheckIns(local, server)
      expect(merged).toHaveLength(2)
    })

    it('sorts merged records newest-first', () => {
      const local = [ci('AGO', T1)]
      const server = [ci('BRO', T3)]
      const { merged } = mergeCheckIns(local, server)
      expect(merged[0].timestamp).toBe(T3)
      expect(merged[1].timestamp).toBe(T1)
    })
  })

  describe('server wins on conflict', () => {
    it("server's note overwrites local when server has one", () => {
      const local = [ci('AGO', T1, 'local note')]
      const server = [ci('AGO', T1, 'server note')]
      const { merged } = mergeCheckIns(local, server)
      expect(merged[0].note).toBe('server note')
    })

    it("server's photoUri overwrites local when server has one", () => {
      const local = [ci('AGO', T1, '', 'local://photo')]
      const server = [ci('AGO', T1, '', 'https://r2.example.com/photo.jpg')]
      const { merged } = mergeCheckIns(local, server)
      expect(merged[0].photoUri).toBe('https://r2.example.com/photo.jpg')
    })
  })

  describe('local edits preserved when server has none', () => {
    it('keeps local note when server note is empty', () => {
      const local = [ci('AGO', T1, 'my note')]
      const server = [ci('AGO', T1, '')]
      const { merged } = mergeCheckIns(local, server)
      expect(merged[0].note).toBe('my note')
    })

    it('keeps local photoUri when server has none', () => {
      const local = [ci('AGO', T1, '', 'local://photo')]
      const server = [ci('AGO', T1, '')]
      const { merged } = mergeCheckIns(local, server)
      expect(merged[0].photoUri).toBe('local://photo')
    })

    it('does not push a record that already exists on server', () => {
      const local = [ci('AGO', T1, 'updated note')]
      const server = [ci('AGO', T1, '')]
      const { toPush } = mergeCheckIns(local, server)
      expect(toPush).toEqual([])
    })
  })

  describe('same-branch+day dedup (concurrent device sessions)', () => {
    it('drops the local-only duplicate when server has a record for that branch+day', () => {
      // Device A checked in at T1, synced to server.
      // Device B checked in at T2 (same day) without syncing first.
      const local = [ci('AGO', T2)]        // Device B's local duplicate
      const server = [ci('AGO', T1)]       // Device A's canonical record
      const { merged } = mergeCheckIns(local, server)
      expect(merged).toHaveLength(1)
      expect(merged[0].timestamp).toBe(T1) // canonical record kept, duplicate dropped
    })

    it('does not push the duplicate to server', () => {
      const local = [ci('AGO', T2)]
      const server = [ci('AGO', T1)]
      const { toPush } = mergeCheckIns(local, server)
      expect(toPush).toEqual([])
    })

    it('keeps a local-only record for a different branch on the same day', () => {
      const local = [ci('BRO', T2)]        // different branch, same day
      const server = [ci('AGO', T1)]       // AGO on Apr 10
      const { merged, toPush } = mergeCheckIns(local, server)
      expect(merged).toHaveLength(2)
      expect(toPush).toEqual([ci('BRO', T2)])
    })

    it('keeps a local-only record for the same branch on a different day', () => {
      const local = [ci('AGO', T3)]        // same branch, different day
      const server = [ci('AGO', T1)]       // AGO on Apr 10
      const { merged, toPush } = mergeCheckIns(local, server)
      expect(merged).toHaveLength(2)
      expect(toPush).toEqual([ci('AGO', T3)])
    })

    it('handles multiple concurrent duplicates', () => {
      // Three devices all checked in to AGO on Apr 10
      const T4 = '2024-04-10T18:00:00.000Z'
      const local = [ci('AGO', T2), ci('AGO', T4)]
      const server = [ci('AGO', T1)]
      const { merged, toPush } = mergeCheckIns(local, server)
      expect(merged).toHaveLength(1)
      expect(merged[0].timestamp).toBe(T1)
      expect(toPush).toEqual([])
    })
  })

  describe('timezone edge case', () => {
    // mergeCheckIns dedup uses UTC date (timestamp.slice(0,10)).
    // hasVisitedToday uses local time (toLocaleDateString).
    // For users in UTC- timezones, a check-in late at night local time
    // falls on the *next* UTC day, creating a mismatch.
    //
    // Example: Toronto (UTC-4), check-in at 10pm local = 2am UTC next day.
    //   Device A: 2pm local Apr 10 → UTC 2024-04-10T18:00Z  (slice: 2024-04-10)
    //   Device B: 10pm local Apr 10 → UTC 2024-04-11T02:00Z (slice: 2024-04-11)
    //
    // These are the SAME local day but DIFFERENT UTC dates, so the dedup
    // does NOT catch this case. Documenting as a known limitation.

    it('does NOT dedup a same-local-day check-in that crosses the UTC midnight boundary', () => {
      const deviceA = ci('AGO', '2024-04-10T18:00:00.000Z') // 2pm Toronto = Apr 10 UTC
      const deviceB = ci('AGO', '2024-04-11T02:00:00.000Z') // 10pm Toronto = Apr 11 UTC

      const { merged } = mergeCheckIns([deviceB], [deviceA])

      // Both records survive because their UTC date prefixes differ (Apr 10 vs Apr 11).
      // In a UTC-4 timezone, a user would see two check-ins for the same local day.
      expect(merged).toHaveLength(2)
    })
  })
})
