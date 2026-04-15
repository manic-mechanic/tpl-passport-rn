import { useState } from 'react'
import { getErrorCode } from '../lib/errors'
import { requestLocation } from '../lib/location'
import { haversineKm, sortedBranches } from '../composables/useRegion'
import { FALLBACK_BRANCH_CODE, LOCATION_TIMEOUT_CODE } from '../constants'

type DetectResult =
  | { type: 'code'; code: string }
  | { type: 'picker' }
  | { type: 'error' }

export function useLocationDetector(hasVisitedToday: (code: string) => boolean) {
  const [detecting, setDetecting] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  async function detect(): Promise<DetectResult> {
    setDetecting(true)
    setLocationError(null)
    try {
      const coords = await requestLocation()
      if (!coords) {
        setLocationError('Location access denied — showing default branch.')
        return { type: 'code', code: FALLBACK_BRANCH_CODE }
      }
      const nearest = sortedBranches
        .map(b => ({ ...b, distKm: haversineKm(coords.latitude, coords.longitude, b.Lat, b.Long) }))
        .sort((a, b) => a.distKm - b.distKm)[0]
      if (hasVisitedToday(nearest.BranchCode)) {
        return { type: 'picker' }
      }
      return { type: 'code', code: nearest.BranchCode }
    } catch (err) {
      if (getErrorCode(err) === LOCATION_TIMEOUT_CODE) {
        setLocationError('Location check timed out — try again.')
        return { type: 'error' }
      } else {
        setLocationError('Could not determine location — showing default branch.')
        return { type: 'code', code: FALLBACK_BRANCH_CODE }
      }
    } finally {
      setDetecting(false)
    }
  }

  return { detecting, locationError, setLocationError, detect }
}
