import { useColorScheme } from 'react-native'
import { usePassportStore } from '../stores/passport'
import { colors, dark } from '../theme'

export function useTheme() {
  const systemScheme = useColorScheme()
  const preference = usePassportStore(s => s.profile.theme)
  const isDark = preference === 'dark' || (preference === '' && systemScheme === 'dark')
  return isDark ? dark : colors
}
