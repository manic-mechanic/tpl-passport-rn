import { useRef } from 'react'

/**
 * Returns the last non-null value seen. Useful for keeping content visible
 * during a dismiss animation where the value is cleared before animation ends.
 */
export function useLastNonNull<T>(value: T | null): T | null {
  const ref = useRef<T | null>(null)
  if (value !== null) ref.current = value
  return ref.current
}
