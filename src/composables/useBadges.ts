// Ported from tpl-passport/app/composables/useBadges.js
// Vue refs and computed() replaced with React useMemo + Zustand selectors.

import { useMemo } from 'react'
import { usePassportStore } from '../stores/passport'
import { physicalBranches, branchesByAlphaPage } from './useRegion'

// ─── Compass points (furthest branch in each cardinal direction) ─────────────

export const compassPoints = (() => {
  const geo = (physicalBranches as any[]).filter(b => b.Lat != null && b.Long != null)
  let n = geo[0], s = geo[0], e = geo[0], w = geo[0]
  for (const b of geo) {
    if (parseFloat(b.Lat) > parseFloat(n.Lat)) n = b
    if (parseFloat(b.Lat) < parseFloat(s.Lat)) s = b
    if (parseFloat(b.Long) > parseFloat(e.Long)) e = b
    if (parseFloat(b.Long) < parseFloat(w.Long)) w = b
  }
  return { n: n.BranchCode, s: s.BranchCode, e: e.BranchCode, w: w.BranchCode }
})()

export const compassBranches = new Set(Object.values(compassPoints))

// ─── Pure helper functions ────────────────────────────────────────────────────

export function maxBranchesInOneDay(checkIns: any[]) {
  const byDay: Record<string, Set<string>> = {}
  for (const c of checkIns) {
    const day = new Date(c.timestamp).toLocaleDateString('en-CA')
    if (!byDay[day]) byDay[day] = new Set()
    byDay[day].add(c.branchCode)
  }
  const sizes = Object.values(byDay).map(s => s.size)
  return sizes.length ? Math.max(...sizes) : 0
}

export function branchVisitCounts(checkIns: any[]) {
  const counts: Record<string, number> = {}
  for (const c of checkIns) counts[c.branchCode] = (counts[c.branchCode] ?? 0) + 1
  return counts
}

export function homeVisitCount(counts: Record<string, number>, homeBranch: string) {
  return homeBranch ? (counts[homeBranch] ?? 0) : 0
}

export function maxNonHomeVisitCount(counts: Record<string, number>, homeBranch: string) {
  let max = 0
  for (const [code, count] of Object.entries(counts)) {
    if (code !== homeBranch && count > max) max = count
  }
  return max
}

export function fullyDocumentedCount(checkIns: any[]) {
  return checkIns.filter(c => c.note?.trim() && c.hasPhoto).length
}

const fmtDate = (ts: string) =>
  new Date(ts).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })

function nthUniqueDate(checkIns: any[], n: number): string | null {
  const sorted = [...checkIns].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const seen = new Set<string>()
  for (const ci of sorted) {
    if (!seen.has(ci.branchCode)) {
      seen.add(ci.branchCode)
      if (seen.size === n) return fmtDate(ci.timestamp)
    }
  }
  return null
}

// ─── Badge context builder ────────────────────────────────────────────────────

export interface BadgeCtx {
  visitCount: number
  branchVisitCounts: Record<string, number>
  maxBranchesInOneDay: number
  homeVisitCount: number
  maxNonHomeVisitCount: number
  fullyDocumentedCount: number
  visitedBranchCodes: Set<string>
  completedChallenges: string[]
  checkIns: any[]
  homeBranch: string
}

export function buildBadgeCtx({
  checkIns,
  visitedBranchCodes,
  completedChallenges,
  homeBranch,
}: {
  checkIns: any[]
  visitedBranchCodes: Set<string>
  completedChallenges: string[]
  homeBranch: string
}): BadgeCtx {
  const counts = branchVisitCounts(checkIns)
  return {
    visitCount:           visitedBranchCodes.size,
    branchVisitCounts:    counts,
    maxBranchesInOneDay:  maxBranchesInOneDay(checkIns),
    homeVisitCount:       homeVisitCount(counts, homeBranch),
    maxNonHomeVisitCount: maxNonHomeVisitCount(counts, homeBranch),
    fullyDocumentedCount: fullyDocumentedCount(checkIns),
    visitedBranchCodes,
    completedChallenges,
    checkIns,
    homeBranch,
  }
}

// React hook — builds badge context from the Zustand passport store.
export function useBadgeCtx(): BadgeCtx {
  const checkIns           = usePassportStore(s => s.checkIns)
  const completedChallenges = usePassportStore(s => s.completedChallenges)
  const homeBranch         = usePassportStore(s => s.profile.homeBranch)

  return useMemo(() => {
    const visitedBranchCodes = new Set(checkIns.map((c: any) => c.branchCode))
    return buildBadgeCtx({ checkIns, visitedBranchCodes, completedChallenges, homeBranch })
  }, [checkIns, completedChallenges, homeBranch])
}

// ─── Badge colors (solid; CSS gradients don't exist in RN) ───────────────────

export const BADGE_COLORS: Record<string, string> = {
  first:          '#3878c4',
  explorer:       '#0048a8',
  adventurer:     '#0030a0',
  globetrotter:   '#001e78',
  complete:       '#000640',
  page_filler:    '#1a6640',
  page_turner:    '#1a6640',
  day_tripper:    '#9e3c14',
  archivist:      '#9e3c14',
  familiar_face:  '#9e3c14',
  return_visitor: '#9e3c14',
  navigator:      '#1a4490',
}

// ─── Badge definitions ────────────────────────────────────────────────────────

export const BADGES = [
  { id: 'first',         shape: 'octagon', title: 'First Stamp',   label: '1st', desc: 'Check in at your first branch',
    earned:   (ctx: BadgeCtx) => ctx.visitCount >= 1,
    progress: (ctx: BadgeCtx) => ({ current: ctx.visitCount, total: 1 }),
    earnedAt: (ctx: BadgeCtx) => nthUniqueDate(ctx.checkIns, 1),
    suggest:  ()              => ({ pct: 0, message: 'Check in at your first branch', branches: [] }) },

  { id: 'page_turner',   shape: 'circle',  title: 'Page Turner',                 desc: 'Visit one branch on each page',
    earned: (ctx: BadgeCtx) => (branchesByAlphaPage as any[]).every((page: any) => page.branches.some((b: any) => ctx.visitedBranchCodes.has(b.BranchCode))),
    suggest: (ctx: BadgeCtx) => {
      const emptyPages = (branchesByAlphaPage as any[]).filter((page: any) =>
        !page.branches.some((b: any) => ctx.visitedBranchCodes.has(b.BranchCode))
      )
      const visitedPageCount = (branchesByAlphaPage as any[]).length - emptyPages.length
      return {
        pct:      visitedPageCount / (branchesByAlphaPage as any[]).length,
        message:  `Visit a branch on ${emptyPages.length} more page${emptyPages.length === 1 ? '' : 's'}`,
        branches: emptyPages.slice(0, 3).map((p: any) => p.branches[0]),
      }
    } },

  { id: 'day_tripper',   shape: 'star',    title: 'Day Tripper',                 desc: 'Visit 2+ branches in one day',
    earned:   (ctx: BadgeCtx) => ctx.maxBranchesInOneDay >= 2,
    progress: (ctx: BadgeCtx) => ({ current: ctx.maxBranchesInOneDay, total: 2 }),
    earnedAt: (ctx: BadgeCtx) => {
      const sorted = [...ctx.checkIns].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      const byDay: Record<string, Set<string>> = {}
      for (const ci of sorted) {
        const day = new Date(ci.timestamp).toLocaleDateString('en-CA')
        if (!byDay[day]) byDay[day] = new Set()
        byDay[day].add(ci.branchCode)
        if (byDay[day].size >= 2) return fmtDate(ci.timestamp)
      }
      return null
    },
    suggest: (ctx: BadgeCtx) => ({
      pct:      ctx.maxBranchesInOneDay / 2,
      message:  'Check in at 2 or more branches in one day',
      branches: [],
    }) },

  { id: 'explorer',      shape: 'octagon', title: 'Explorer',      label: '10',  desc: 'Visit 10 branches',
    earned:   (ctx: BadgeCtx) => ctx.visitCount >= 10,
    progress: (ctx: BadgeCtx) => ({ current: ctx.visitCount, total: 10 }),
    earnedAt: (ctx: BadgeCtx) => nthUniqueDate(ctx.checkIns, 10),
    suggest:  (ctx: BadgeCtx) => {
      const rem = 10 - ctx.visitCount
      return { pct: ctx.visitCount / 10, message: `${rem} more branch${rem === 1 ? '' : 'es'} to go`, branches: [] }
    } },

  { id: 'page_filler',   shape: 'circle',  title: 'Page Filler',   label: '★',   desc: 'Fill one complete page',
    earned: (ctx: BadgeCtx) => (branchesByAlphaPage as any[]).some((page: any) => page.branches.every((b: any) => ctx.visitedBranchCodes.has(b.BranchCode))),
    suggest: (ctx: BadgeCtx) => {
      const pages = (branchesByAlphaPage as any[])
        .map((page: any) => {
          const visitedCount = page.branches.filter((b: any) => ctx.visitedBranchCodes.has(b.BranchCode)).length
          return { page, visitedCount, pct: visitedCount / page.branches.length }
        })
        .filter((p: any) => p.pct < 1)
        .sort((a: any, b: any) => b.pct - a.pct)
      if (!pages.length) return { pct: 1, message: '', branches: [] }
      const best = pages[0]
      const unvisited = best.page.branches.filter((b: any) => !ctx.visitedBranchCodes.has(b.BranchCode))
      return {
        pct:      best.pct,
        message:  `Fill the ${best.page.label} page — ${best.visitedCount}/${best.page.branches.length} done`,
        branches: unvisited.slice(0, 3),
      }
    } },

  { id: 'archivist',     shape: 'star',    title: 'Archivist',     label: '✎',   desc: 'Add a note and photo to any check-in',
    earned:   (ctx: BadgeCtx) => ctx.fullyDocumentedCount >= 1,
    progress: (ctx: BadgeCtx) => ({ current: Math.min(ctx.fullyDocumentedCount, 1), total: 1 }),
    earnedAt: (ctx: BadgeCtx) => {
      const ci = [...ctx.checkIns].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).find((c: any) => c.note?.trim() && c.hasPhoto)
      return ci ? fmtDate(ci.timestamp) : null
    },
    suggest: () => ({ pct: 0, message: 'Add a note and photo to any check-in', branches: [] }) },

  { id: 'adventurer',    shape: 'octagon', title: 'Adventurer',    label: '25',  desc: 'Visit 25 branches',
    earned:   (ctx: BadgeCtx) => ctx.visitCount >= 25,
    progress: (ctx: BadgeCtx) => ({ current: ctx.visitCount, total: 25 }),
    earnedAt: (ctx: BadgeCtx) => nthUniqueDate(ctx.checkIns, 25),
    suggest:  (ctx: BadgeCtx) => ({ pct: ctx.visitCount / 25, message: `${25 - ctx.visitCount} more branches to go`, branches: [] }) },

  { id: 'navigator',     shape: 'circle',  title: 'Navigator',                   desc: 'Visit the furthest branch in each direction',
    earned: (ctx: BadgeCtx) => [...compassBranches].every(code => ctx.visitedBranchCodes.has(code)),
    suggest: (ctx: BadgeCtx) => {
      const remaining = Object.values(compassPoints)
        .filter(code => !ctx.visitedBranchCodes.has(code as string))
        .map(code => (physicalBranches as any[]).find((b: any) => b.BranchCode === code))
        .filter(Boolean)
      return {
        pct:      (4 - remaining.length) / 4,
        message:  `Visit ${remaining.length} more compass branch${remaining.length === 1 ? '' : 'es'}`,
        branches: remaining,
      }
    } },

  { id: 'familiar_face', shape: 'star',    title: 'Familiar Face',               desc: 'Check in at your home branch 5 times',
    earned:   (ctx: BadgeCtx) => ctx.homeVisitCount >= 5,
    progress: (ctx: BadgeCtx) => ({ current: ctx.homeVisitCount, total: 5 }),
    earnedAt: (ctx: BadgeCtx) => {
      if (!ctx.homeBranch) return null
      const sorted = [...ctx.checkIns].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      let count = 0
      for (const ci of sorted) {
        if (ci.branchCode === ctx.homeBranch && ++count === 5) return fmtDate(ci.timestamp)
      }
      return null
    },
    suggest: (ctx: BadgeCtx) => {
      const home = (physicalBranches as any[]).find((b: any) => b.BranchCode === ctx.homeBranch)
      if (home) {
        const rem = 5 - ctx.homeVisitCount
        return { pct: ctx.homeVisitCount / 5, message: `${rem} more visit${rem === 1 ? '' : 's'} to ${home.BranchName}`, branches: [home] }
      }
      return { pct: 0, message: 'Set a home branch on your passport to track this', branches: [] }
    } },

  { id: 'globetrotter',  shape: 'octagon', title: 'Globetrotter',  label: '50',  desc: 'Visit 50 branches',
    earned:   (ctx: BadgeCtx) => ctx.visitCount >= 50,
    progress: (ctx: BadgeCtx) => ({ current: ctx.visitCount, total: 50 }),
    earnedAt: (ctx: BadgeCtx) => nthUniqueDate(ctx.checkIns, 50),
    suggest:  (ctx: BadgeCtx) => ({ pct: ctx.visitCount / 50, message: `${50 - ctx.visitCount} more branches to go`, branches: [] }) },

  { id: 'return_visitor', shape: 'star',   title: 'Return Visitor',              desc: 'Check in at any non-home branch 3+ times',
    earned:   (ctx: BadgeCtx) => ctx.maxNonHomeVisitCount >= 3,
    progress: (ctx: BadgeCtx) => ({ current: ctx.maxNonHomeVisitCount, total: 3 }),
    earnedAt: (ctx: BadgeCtx) => {
      const sorted = [...ctx.checkIns].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      const counts: Record<string, number> = {}
      for (const ci of sorted) {
        if (ci.branchCode === ctx.homeBranch) continue
        counts[ci.branchCode] = (counts[ci.branchCode] ?? 0) + 1
        if (counts[ci.branchCode] === 3) return fmtDate(ci.timestamp)
      }
      return null
    },
    suggest: (ctx: BadgeCtx) => {
      const best = Object.entries(ctx.branchVisitCounts)
        .filter(([code, count]) => (count as number) < 3 && code !== ctx.homeBranch)
        .sort((a, b) => (b[1] as number) - (a[1] as number))[0]
      if (best) {
        const [code, count] = best
        const branch = (physicalBranches as any[]).find((b: any) => b.BranchCode === code)
        if (branch) {
          const rem = 3 - (count as number)
          return { pct: ctx.maxNonHomeVisitCount / 3, message: `${rem} more visit${rem === 1 ? '' : 's'} to ${branch.BranchName}`, branches: [branch] }
        }
      }
      return { pct: 0, message: 'Check in at any branch 3 times', branches: [] }
    } },

  { id: 'complete',      shape: 'octagon', title: 'Full Passport',  label: '100', desc: `Visit all ${(physicalBranches as any[]).length} branches`,
    earned:   (ctx: BadgeCtx) => ctx.visitCount >= 100,
    progress: (ctx: BadgeCtx) => ({ current: ctx.visitCount, total: 100 }),
    earnedAt: (ctx: BadgeCtx) => nthUniqueDate(ctx.checkIns, 100),
    suggest:  (ctx: BadgeCtx) => ({ pct: ctx.visitCount / 100, message: `${100 - ctx.visitCount} more branches to go`, branches: [] }) },
]
