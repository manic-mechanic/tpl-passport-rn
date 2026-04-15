import { describe, it, expect } from 'vitest'
import { normalize } from './useAllEvents'

function rawEvent(locationName: string | null | undefined) {
  return {
    _id: 1,
    EventName: 'Test Event',
    StartDateLocal: '2026-04-15',
    LocationName: locationName ?? undefined,
  }
}

describe('normalize()', () => {
  it('matches a known branch by LocationName', () => {
    const result = normalize(rawEvent('Bloor/Gladstone'))
    expect(result.branch?.BranchCode).toBe('BL')
  })

  it('matches Dufferin/St.Clair (no space after dot, as CKAN sends it)', () => {
    const result = normalize(rawEvent('Dufferin/St.Clair'))
    expect(result.branch?.BranchCode).toBe('DU')
  })

  it('returns null branch for null LocationName without crashing', () => {
    const result = normalize(rawEvent(null))
    expect(result.branch).toBeNull()
  })

  it('returns null branch for empty LocationName', () => {
    const result = normalize(rawEvent(''))
    expect(result.branch).toBeNull()
  })

  it('returns null branch for unrecognised LocationName', () => {
    const result = normalize(rawEvent('City of Toronto'))
    expect(result.branch).toBeNull()
  })
})
