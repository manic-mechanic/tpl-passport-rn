// Generates display strings in a simplified passport MRZ (Machine Readable Zone) format.
// These are for visual display only — not a real ICAO 9303 travel document.
//
// Line 1: P<TPL + surname<<given, padded to 30 chars (ICAO field 1)
// Line 2: TPLnnnnn + CAN + YYMMDD + M + pctPCT (custom encoding)
export function generateMRZ(
  name: string,
  visitCount: number,
  progressPct: number,
  issueYear: number,
): { line1: string; line2: string } {
  const raw = (name || 'TRAVELLER').toUpperCase()
  const parts = raw.replace(/[^A-Z ]/g, '').split(' ').filter(Boolean)
  const surname = parts[0] ?? 'TRAVELLER'
  const given = parts.slice(1).join('<') || ''
  const nameField = given ? `${surname}<<${given}` : surname
  const line1 = `P<TPL${nameField}`.slice(0, 30)

  const num = `TPL${String(visitCount).padStart(5, '0')}`
  const dob = String(issueYear % 100).padStart(2, '0') + '0101'
  const pct = String(progressPct).padStart(3, '0')
  const line2 = `${num}CAN${dob}M${pct}PCT`

  return { line1, line2 }
}
