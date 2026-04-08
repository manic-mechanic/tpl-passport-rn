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
  // actions
  checkIn: (branchCode: string, note?: string) => string | null
  setCheckInPhoto: (timestamp: string, uri: string) => void
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

      checkIn: (branchCode, note = '') => {
        if (get().hasVisitedToday(branchCode)) return null
        const timestamp = new Date().toISOString()
        set(s => ({ checkIns: [{ branchCode, timestamp, note }, ...s.checkIns] }))
        return timestamp
      },
      setCheckInPhoto: (timestamp, uri) =>
        set(s => ({
          checkIns: s.checkIns.map(c =>
            c.timestamp === timestamp ? { ...c, photoUri: uri } : c
          )
        })),
      updateProfile: (patch) =>
        set(s => ({ profile: { ...s.profile, ...patch } })),
    }),
    {
      name: 'tpl-passport',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)