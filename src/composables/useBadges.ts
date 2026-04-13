// React wrapper around the shared badge logic.
// Pure functions and types are in @tpl-passport/shared.

import { useMemo } from 'react'
import { usePassportStore } from '../stores/passport'
import { buildBadgeCtx } from '@tpl-passport/shared'

export * from '@tpl-passport/shared'

// React hook — builds badge context from the Zustand passport store.
export function useBadgeCtx() {
  const checkIns            = usePassportStore(s => s.checkIns)
  const completedChallenges = usePassportStore(s => s.completedChallenges)
  const homeBranch          = usePassportStore(s => s.profile.homeBranch)

  return useMemo(() => {
    const visitedBranchCodes = new Set(checkIns.map(c => c.branchCode))
    return buildBadgeCtx({ checkIns, visitedBranchCodes, completedChallenges, homeBranch })
  }, [checkIns, completedChallenges, homeBranch])
}
