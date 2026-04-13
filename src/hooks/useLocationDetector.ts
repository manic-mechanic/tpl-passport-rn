import * as Location from 'expo-location'
import { useState } from 'react'
import { getErrorCode } from '../lib/errors'
import { haversineKm, sortedBranches } from '../composables/useRegion'
import { FALLBACK_BRANCH_CODE } from '../constants'

const LOCATION_TIMEOUT_CODE = 3 // GeolocationPositionError.TIMEOUT

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
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setLocationError('Location access denied — showing default branch.')
        return { type: 'code', code: FALLBACK_BRANCH_CODE }
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const nearest = sortedBranches
        .map(b => ({ ...b, distKm: haversineKm(pos.coords.latitude, pos.coords.longitude, b.Lat, b.Long) }))
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
