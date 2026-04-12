/** Returns the numeric `.code` property from an unknown error, if present. */
export function getErrorCode(err: unknown): number | undefined {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: unknown }).code
    return typeof code === 'number' ? code : undefined
  }
  return undefined
}
