import { physicalBranches } from '../composables/useRegion'

export function branchNameForCode(code: string): string {
  return physicalBranches.find(b => b.BranchCode === code)?.BranchName ?? code
}
