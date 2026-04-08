import { useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { CheckInForm } from '@/src/components/CheckInForm'
import { CheckInSuccess } from '@/src/components/CheckInSuccess'
import type { Branch } from '@/src/types'

export default function CheckInScreen() {
  const { branch: prefillCode } = useLocalSearchParams<{ branch?: string }>()
  const [successBranch, setSuccessBranch] = useState<Branch | null>(null)

  if (successBranch) {
    return <CheckInSuccess branch={successBranch} onDone={() => setSuccessBranch(null)} />
  }
  return <CheckInForm prefillCode={prefillCode} onSuccess={setSuccessBranch} />
}
