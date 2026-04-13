import { describe, it, expect } from 'vitest'
import {
  maxBranchesInOneDay,
  branchVisitCounts,
  homeVisitCount,
  maxNonHomeVisitCount,
  fullyDocumentedCount,
  buildBadgeCtx,
  compassPoints,
  BADGES,
} from './badges'
import { branchesByAlphaPage } from './region'
import type { CheckIn } from '../types'

// ─── Fixtures ────────────────────────────────────────────────────────────────

function ci(branchCode: string, timestamp: string, note = '', photoUri?: string): CheckIn {
  return { branchCode, timestamp, note, ...(photoUri ? { photoUri } : {}) }
}

// Spread across two calendar days (UTC)
const DAY1_A = '2024-04-10T10:00:00.000Z'
const DAY1_B = '2024-04-10T14:00:00.000Z'
const DAY2_A = '2024-04-11T09:00:00.000Z'

function ctx(checkIns: CheckIn[], homeBranch = '') {
  return buildBadgeCtx({
    checkIns,
    visitedBranchCodes: new Set(checkIns.map(c => c.branchCode)),
    completedChallenges: [],
    homeBranch,
  })
}

function badge(id: string) {
  const b = BADGES.find(b => b.id === id)
  if (!b) throw new Error(`Badge not found: ${id}`)
  return b
}

// ─── Helper functions ─────────────────────────────────────────────────────────

describe('maxBranchesInOneDay', () => {
  it('returns 0 for no check-ins', () => {
    expect(maxBranchesInOneDay([])).toBe(0)
  })

  it('returns 1 for a single check-in', () => {
    expect(maxBranchesInOneDay([ci('AGO', DAY1_A)])).toBe(1)
  })

  it('counts unique branches per day', () => {
    const checkIns = [ci('AGO', DAY1_A), ci('BRO', DAY1_B)]
    expect(maxBranchesInOneDay(checkIns)).toBe(2)
  })

  it('does not double-count the same branch visited twice in one day', () => {
    const checkIns = [ci('AGO', DAY1_A), ci('AGO', DAY1_B)]
    expect(maxBranchesInOneDay(checkIns)).toBe(1)
  })

  it('returns the max across days', () => {
    const checkIns = [ci('AGO', DAY1_A), ci('BRO', DAY1_B), ci('CLO', DAY2_A)]
    expect(maxBranchesInOneDay(checkIns)).toBe(2)
  })
})

describe('branchVisitCounts', () => {
  it('returns empty object for no check-ins', () => {
    expect(branchVisitCounts([])).toEqual({})
  })

  it('counts visits per branch', () => {
    const checkIns = [ci('AGO', DAY1_A), ci('AGO', DAY2_A), ci('BRO', DAY1_B)]
    expect(branchVisitCounts(checkIns)).toEqual({ AGO: 2, BRO: 1 })
  })
})

describe('homeVisitCount', () => {
  it('returns 0 when home branch is empty string', () => {
    expect(homeVisitCount({ AGO: 3 }, '')).toBe(0)
  })

  it('returns visit count for the home branch', () => {
    expect(homeVisitCount({ AGO: 3, BRO: 1 }, 'AGO')).toBe(3)
  })

  it('returns 0 when home branch has no visits', () => {
    expect(homeVisitCount({ BRO: 1 }, 'AGO')).toBe(0)
  })
})

describe('maxNonHomeVisitCount', () => {
  it('returns 0 for no visits', () => {
    expect(maxNonHomeVisitCount({}, 'AGO')).toBe(0)
  })

  it('excludes the home branch', () => {
    expect(maxNonHomeVisitCount({ AGO: 10, BRO: 2 }, 'AGO')).toBe(2)
  })

  it('returns the highest non-home count', () => {
    expect(maxNonHomeVisitCount({ AGO: 5, BRO: 3, CLO: 4 }, 'AGO')).toBe(4)
  })
})

describe('fullyDocumentedCount', () => {
  it('returns 0 when no check-ins have both note and photo', () => {
    expect(fullyDocumentedCount([ci('AGO', DAY1_A, 'note'), ci('BRO', DAY1_B, '', 'photo://')])).toBe(0)
  })

  it('counts check-ins with both a non-empty note and photoUri', () => {
    const checkIns = [
      ci('AGO', DAY1_A, 'great visit', 'https://r2.example.com/a.jpg'),
      ci('BRO', DAY1_B, '', 'https://r2.example.com/b.jpg'),
      ci('CLO', DAY2_A, 'nice', undefined),
    ]
    expect(fullyDocumentedCount(checkIns)).toBe(1)
  })
})

// ─── Badge earned conditions ──────────────────────────────────────────────────

describe('first (1 branch)', () => {
  it('not earned at 0 visits', () => expect(badge('first').earned(ctx([]))).toBe(false))
  it('earned at 1 visit',       () => expect(badge('first').earned(ctx([ci('AGO', DAY1_A)]))).toBe(true))
  it('progress: 0/1',           () => expect(badge('first').progress!(ctx([]))).toEqual({ current: 0, total: 1 }))
})

describe('explorer (10 branches)', () => {
  const tenBranches = Array.from({ length: 10 }, (_, i) => ci(`B${i}`, DAY1_A))
  it('not earned at 9',  () => expect(badge('explorer').earned(ctx(tenBranches.slice(0, 9)))).toBe(false))
  it('earned at 10',     () => expect(badge('explorer').earned(ctx(tenBranches))).toBe(true))
  it('progress tracks',  () => expect(badge('explorer').progress!(ctx(tenBranches.slice(0, 7)))).toEqual({ current: 7, total: 10 }))
})

describe('adventurer (25 branches)', () => {
  const twentyFive = Array.from({ length: 25 }, (_, i) => ci(`B${i}`, DAY1_A))
  it('not earned at 24', () => expect(badge('adventurer').earned(ctx(twentyFive.slice(0, 24)))).toBe(false))
  it('earned at 25',     () => expect(badge('adventurer').earned(ctx(twentyFive))).toBe(true))
})

describe('globetrotter (50 branches)', () => {
  const fifty = Array.from({ length: 50 }, (_, i) => ci(`B${i}`, DAY1_A))
  it('not earned at 49', () => expect(badge('globetrotter').earned(ctx(fifty.slice(0, 49)))).toBe(false))
  it('earned at 50',     () => expect(badge('globetrotter').earned(ctx(fifty))).toBe(true))
})

describe('day_tripper (2+ branches in one day)', () => {
  it('not earned with 1 branch per day', () => {
    const checkIns = [ci('AGO', DAY1_A), ci('BRO', DAY2_A)]
    expect(badge('day_tripper').earned(ctx(checkIns))).toBe(false)
  })

  it('earned with 2 branches in one day', () => {
    const checkIns = [ci('AGO', DAY1_A), ci('BRO', DAY1_B)]
    expect(badge('day_tripper').earned(ctx(checkIns))).toBe(true)
  })

  it('progress tracks max branches in one day', () => {
    const checkIns = [ci('AGO', DAY1_A)]
    expect(badge('day_tripper').progress!(ctx(checkIns))).toEqual({ current: 1, total: 2 })
  })
})

describe('archivist (note + photo on any check-in)', () => {
  it('not earned with only a note', () => {
    expect(badge('archivist').earned(ctx([ci('AGO', DAY1_A, 'note')]))).toBe(false)
  })

  it('not earned with only a photo', () => {
    expect(badge('archivist').earned(ctx([ci('AGO', DAY1_A, '', 'https://r2/a.jpg')]))).toBe(false)
  })

  it('earned with both note and photo', () => {
    expect(badge('archivist').earned(ctx([ci('AGO', DAY1_A, 'note', 'https://r2/a.jpg')]))).toBe(true)
  })
})

describe('familiar_face (5 home-branch visits)', () => {
  const HOME = 'AGO'
  const visits = (n: number) => Array.from({ length: n }, (_, i) =>
    ci(HOME, `2024-04-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`)
  )

  it('not earned at 4 visits', () => {
    expect(badge('familiar_face').earned(ctx(visits(4), HOME))).toBe(false)
  })

  it('earned at 5 visits', () => {
    expect(badge('familiar_face').earned(ctx(visits(5), HOME))).toBe(true)
  })

  it('not earned when home branch is unset', () => {
    expect(badge('familiar_face').earned(ctx(visits(5), ''))).toBe(false)
  })

  it('home visits do not count toward other branches', () => {
    const mixed = [...visits(5), ci('BRO', DAY2_A)]
    const c = ctx(mixed, HOME)
    expect(c.homeVisitCount).toBe(5)
    expect(c.maxNonHomeVisitCount).toBe(1)
  })

  it('progress: 3/5', () => {
    expect(badge('familiar_face').progress!(ctx(visits(3), HOME))).toEqual({ current: 3, total: 5 })
  })
})

describe('return_visitor (3 visits to any non-home branch)', () => {
  const HOME = 'AGO'
  const threeVisits = [
    ci('BRO', '2024-04-01T10:00:00.000Z'),
    ci('BRO', '2024-04-02T10:00:00.000Z'),
    ci('BRO', '2024-04-03T10:00:00.000Z'),
  ]

  it('not earned at 2 visits', () => {
    expect(badge('return_visitor').earned(ctx(threeVisits.slice(0, 2), HOME))).toBe(false)
  })

  it('earned at 3 visits to a non-home branch', () => {
    expect(badge('return_visitor').earned(ctx(threeVisits, HOME))).toBe(true)
  })

  it('home-branch visits do not count', () => {
    const homeVisits = Array.from({ length: 5 }, (_, i) =>
      ci(HOME, `2024-04-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`)
    )
    expect(badge('return_visitor').earned(ctx(homeVisits, HOME))).toBe(false)
  })
})

describe('navigator (all four compass branches)', () => {
  const { n, s, e, w } = compassPoints

  it('not earned with only 3 compass branches', () => {
    const checkIns = [ci(n, DAY1_A), ci(s, DAY1_B), ci(e, DAY2_A)]
    expect(badge('navigator').earned(ctx(checkIns))).toBe(false)
  })

  it('earned with all four compass branches', () => {
    const checkIns = [ci(n, DAY1_A), ci(s, DAY1_B), ci(e, DAY2_A), ci(w, DAY2_A)]
    expect(badge('navigator').earned(ctx(checkIns))).toBe(true)
  })
})

describe('page_turner (one branch per alpha page)', () => {
  it('not earned when a page has no visits', () => {
    // Visit first branch on all pages except the last
    const allButLast = branchesByAlphaPage.slice(0, -1).map(p => ci(p.branches[0].BranchCode, DAY1_A))
    expect(badge('page_turner').earned(ctx(allButLast))).toBe(false)
  })

  it('earned with at least one visit per page', () => {
    const onePerPage = branchesByAlphaPage.map(p => ci(p.branches[0].BranchCode, DAY1_A))
    expect(badge('page_turner').earned(ctx(onePerPage))).toBe(true)
  })
})

describe('page_filler (complete one full alpha page)', () => {
  it('not earned when no page is fully visited', () => {
    // Visit all but one on the smallest page
    const smallest = [...branchesByAlphaPage].sort((a, b) => a.branches.length - b.branches.length)[0]
    const allButOne = smallest.branches.slice(0, -1).map(b => ci(b.BranchCode, DAY1_A))
    expect(badge('page_filler').earned(ctx(allButOne))).toBe(false)
  })

  it('earned when one full page is visited', () => {
    const smallest = [...branchesByAlphaPage].sort((a, b) => a.branches.length - b.branches.length)[0]
    const allBranches = smallest.branches.map(b => ci(b.BranchCode, DAY1_A))
    expect(badge('page_filler').earned(ctx(allBranches))).toBe(true)
  })
})
