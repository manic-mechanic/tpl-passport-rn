import { branchesByCode } from '../composables/useRegion'

export function branchNameForCode(code: string): string {
  return branchesByCode[code]?.BranchName ?? code
}
