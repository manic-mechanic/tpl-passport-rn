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

    it('pushes a local note the server copy is missing', () => {
      const local = [ci('AGO', T1, 'updated note')]
      const server = [ci('AGO', T1, '')]
      const { toPush } = mergeCheckIns(local, server)
      expect(toPush).toEqual([ci('AGO', T1, 'updated note')])
    })

    it('does not push a record the server already has in full', () => {
      const local = [ci('AGO', T1, 'note')]
      const server = [ci('AGO', T1, 'note')]
      const { toPush } = mergeCheckIns(local, server)
      expect(toPush).toEqual([])
    })

    it('pushes an uploaded photo the server copy is missing', () => {
      const url = 'https://r2.example.com/photos/u1/a.jpg'
      const { merged, toPush } = mergeCheckIns([ci('AGO', T1, '', url)], [ci('AGO', T1)])
      expect(merged[0].photoUri).toBe(url)
      expect(toPush).toEqual([ci('AGO', T1, '', url)])
    })

    it('keeps but does not push a photo still only on the device', () => {
      const file = 'file:///docs/checkin-photos/a.jpg'
      const { merged, toPush } = mergeCheckIns([ci('AGO', T1, '', file)], [ci('AGO', T1)])
      expect(merged[0].photoUri).toBe(file)
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

    it("moves the dropped duplicate's note and photo onto the server copy", () => {
      const url = 'https://r2.example.com/photos/u1/b.jpg'
      const local = [ci('AGO', T2, 'from device B', url)]
      const server = [ci('AGO', T1)]
      const { merged, toPush } = mergeCheckIns(local, server)
      expect(merged).toEqual([ci('AGO', T1, 'from device B', url)])
      expect(toPush).toEqual([ci('AGO', T1, 'from device B', url)])
    })

    it("does not overwrite the server copy's own note", () => {
      const local = [ci('AGO', T2, 'from device B')]
      const server = [ci('AGO', T1, 'from device A')]
      const { merged, toPush } = mergeCheckIns(local, server)
      expect(merged[0].note).toBe('from device A')
      expect(toPush).toEqual([])
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

  describe('library day (Toronto time)', () => {
    // Same-day dedup uses the Toronto day, like the server and hasVisitedToday,
    // not the UTC date.

    it('dedups an evening check-in that falls on the next UTC date', () => {
      const deviceA = ci('AGO', '2024-04-10T18:00:00.000Z') // 2pm Toronto, Apr 10
      const deviceB = ci('AGO', '2024-04-11T02:00:00.000Z') // 10pm Toronto, Apr 10
      const { merged, toPush } = mergeCheckIns([deviceB], [deviceA])
      expect(merged).toEqual([deviceA])
      expect(toPush).toEqual([])
    })

    it('keeps check-ins on different Toronto days that share a UTC date', () => {
      const lateApr9 = ci('AGO', '2024-04-10T03:00:00.000Z')  // 11pm Toronto, Apr 9
      const apr10 = ci('AGO', '2024-04-10T14:00:00.000Z')     // 10am Toronto, Apr 10
      const { merged, toPush } = mergeCheckIns([apr10], [lateApr9])
      expect(merged).toHaveLength(2)
      expect(toPush).toEqual([apr10])
    })
  })
})
