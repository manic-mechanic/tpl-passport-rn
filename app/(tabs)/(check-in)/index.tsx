import { useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { CheckInForm } from '@/src/components/CheckInForm'
import { CheckInSuccess } from '@/src/components/CheckInSuccess'
import type { Branch } from '@/src/types'

type SuccessState = { branch: Branch; timestamp: string }

export default function CheckInScreen() {
  const { branch: prefillCode } = useLocalSearchParams<{ branch?: string }>()
  const [success, setSuccess] = useState<SuccessState | null>(null)

  if (success) {
    return (
      <CheckInSuccess
        branch={success.branch}
        timestamp={success.timestamp}
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
