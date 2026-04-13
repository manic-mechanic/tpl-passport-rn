import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { physicalBranches } from '../composables/useRegion'
import type { CheckIn, Profile } from '../types'

export type { CheckIn, Profile }

interface PassportStore {
  anonymousId: string
  checkIns: CheckIn[]
  profile: Profile
  completedChallenges: string[]
  // getters
  visitCount: () => number
  hasVisited: (branchCode: string) => boolean
  hasVisitedToday: (branchCode: string) => boolean
  visitedBranchCodes: () => Set<string>
  progressPct: () => number
  documentedCount: () => number
  overallPct: () => number
  // actions
  checkIn: (branchCode: string, note?: string) => string | null
  setCheckIns: (checkIns: CheckIn[]) => void
  setCheckInPhoto: (timestamp: string, uri: string) => void
  updateCheckIn: (timestamp: string, patch: { note?: string; photoUri?: string }) => void
  updateProfile: (patch: Partial<Profile>) => void
}

export const usePassportStore = create<PassportStore>()(
  persist(
    (set, get) => ({
      anonymousId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
      checkIns: [],
      profile: {
        name: '', homeBranch: '', theme: '', bypassLocationFence: false, hasSeenOnboarding: false,
      },
      completedChallenges: [],

      visitCount: () => get().visitedBranchCodes().size,
      visitedBranchCodes: () => new Set(get().checkIns.map(c => c.branchCode)),
      hasVisited: (code) => get().visitedBranchCodes().has(code),
      hasVisitedToday: (code) => {
        const today = new Date().toLocaleDateString('en-CA')
        return get().checkIns.some(c =>
          c.branchCode === code &&
          new Date(c.timestamp).toLocaleDateString('en-CA') === today
        )
      },
      progressPct: () =>
        Math.round((get().visitCount() / physicalBranches.length) * 100),
      documentedCount: () =>
        new Set(get().checkIns.filter(c => c.note && c.photoUri).map(c => c.branchCode)).size,
      overallPct: () => {
        const total = physicalBranches.length
        return Math.round((get().visitCount() / total) * 75 + (get().documentedCount() / total) * 25)
      },

      checkIn: (branchCode, note = '') => {
        if (get().hasVisitedToday(branchCode)) return null
        const timestamp = new Date().toISOString()
        const newCheckIn = { branchCode, timestamp, note }
        set(s => ({ checkIns: [newCheckIn, ...s.checkIns] }))
        import('../lib/sync').then(({ pushCheckIn }) => pushCheckIn(newCheckIn).catch(() => {}))
        return timestamp
      },
      setCheckIns: (checkIns) => set({ checkIns }),
      setCheckInPhoto: (timestamp, uri) =>
        set(s => ({
          checkIns: s.checkIns.map(c =>
            c.timestamp === timestamp ? { ...c, photoUri: uri } : c
          )
        })),
      updateCheckIn: (timestamp, patch) => {
        set(s => ({
          checkIns: s.checkIns.map(c =>
            c.timestamp === timestamp ? { ...c, ...patch } : c
          )
        }))
        const updated = get().checkIns.find(c => c.timestamp === timestamp)
        if (updated) {
          import('../lib/sync').then(({ pushCheckIn }) => pushCheckIn(updated).catch(() => {}))
        }
      },
      updateProfile: (patch) => {
        const current = get().profile
        set(s => ({ profile: { ...s.profile, ...patch } }))
        if ('name' in patch || 'homeBranch' in patch) {
          const name = 'name' in patch ? patch.name! : current.name
          const homeBranch = 'homeBranch' in patch ? patch.homeBranch! : current.homeBranch
          import('../lib/sync').then(({ pushProfile }) =>
            pushProfile(name, homeBranch).catch(() => {})
          )
        }
      },
    }),
    {
      name: 'tpl-passport',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)