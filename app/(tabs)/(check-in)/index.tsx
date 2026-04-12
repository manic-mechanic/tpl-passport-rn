import { useState, useEffect } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { CheckInForm } from '@/src/components/CheckInForm'
import { CheckInSuccess } from '@/src/components/CheckInSuccess'
import type { Branch } from '@/src/types'

type Origin = 'explore' | 'passport' | undefined
type SuccessState = { branch: Branch; timestamp: string }

export default function CheckInScreen() {
  const { branch: prefillCode, origin } = useLocalSearchParams<{ branch?: string; origin?: string }>()
  const [success, setSuccess] = useState<SuccessState | null>(null)

  // Reset success when navigating here for a different branch (e.g. tab is still
  // mounted from a prior check-in but the user tapped "Check In Here" on a new branch).
  useEffect(() => {
    setSuccess(null)
  }, [prefillCode])

  if (success) {
    return (
      <CheckInSuccess
        branch={success.branch}
        timestamp={success.timestamp}
        origin={origin as Origin}
        onDone={() => setSuccess(null)}
      />
    )
  }
  return (
    <CheckInForm
      prefillCode={prefillCode}
      onSuccess={(branch, timestamp) => setSuccess({ branch, timestamp })}
    />
  )
}
