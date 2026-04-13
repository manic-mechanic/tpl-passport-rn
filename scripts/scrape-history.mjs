// Scrapes branch history from tpl.ca/locations/{BranchCode}/ for all 100 physical branches.
// Parses the History accordion table (year / detail rows).
// Writes src/data/branch-history.json keyed by BranchCode.
//
// Usage: node scripts/scrape-history.mjs
//
// Re-run whenever branch histories are updated. No external dependencies needed.

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const branchData = JSON.parse(readFileSync(join(__dirname, '../src/data/branch-info.json'), 'utf8'))
const physical   = branchData.filter(b => b.PhysicalBranch === 1)

const DELAY_MS = 300  // be polite — ~30 seconds total for 100 branches

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Strip HTML tags and decode basic entities from a string
function stripHtml(str) {
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim()
}

// Find the History accordion panel and parse its year/detail table
function parseHistory(html) {
  // Locate the "History" accordion button label
  const labelIdx = html.indexOf('fl-accordion-button-label"> History ')
  if (labelIdx === -1) return null

  // The panel div (fl-accordion-content) immediately follows the button
  const contentIdx = html.indexOf('fl-accordion-content', labelIdx)
  if (contentIdx === -1) return null

  // Extract the <tbody> from that panel's table
  const tbodyStart = html.indexOf('<tbody>', contentIdx)
  if (tbodyStart === -1) return null
  const tbodyEnd = html.indexOf('</tbody>', tbodyStart)
  if (tbodyEnd === -1) return null

  const tbody = html.slice(tbodyStart, tbodyEnd)

  // Parse year/detail rows — year cell contains <strong>YYYY</strong>
  const rows = [...tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
  const entries = []

  for (const [, rowHtml] of rows) {
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
    if (cells.length < 2) continue

    const year   = stripHtml(cells[0][1])
    const detail = stripHtml(cells[1][1])

    // Only keep rows with a 4-digit year
    if (!year || !/^\d{4}$/.test(year)) continue

    entries.push({ year, detail })
  }

  return entries.length ? entries : null
}

async function fetchHistory(branchCode) {
  const url = `https://tpl.ca/locations/${branchCode}/`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'tpl-passport-app/1.0 (branch history scraper)' },
      redirect: 'follow',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html    = await res.text()
    const entries = parseHistory(html)
    if (!entries) throw new Error('no history table found')
    return entries
  } catch (err) {
    console.warn(`  ✗ ${branchCode}: ${err.message}`)
    return null
  }
}

const results = {}
let ok = 0, fail = 0

for (let i = 0; i < physical.length; i++) {
  const branch = physical[i]
  process.stdout.write(`[${i + 1}/${physical.length}] ${branch.BranchCode} ${branch.BranchName}… `)
  const entries = await fetchHistory(branch.BranchCode)
  if (entries) {
    results[branch.BranchCode] = entries
    console.log(`✓ (${entries.length} entries)`)
    ok++
  } else {
    fail++
  }
  if (i < physical.length - 1) await sleep(DELAY_MS)
}

const outPath = join(__dirname, '../src/data/branch-history.json')
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(results, null, 2))
console.log(`\nDone. ${ok} ok, ${fail} failed → ${outPath}`)
