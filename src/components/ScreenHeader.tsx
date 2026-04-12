import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/src/hooks/useTheme'
import { fonts, textSize } from '@/src/theme'
import type { ReactNode } from 'react'

type Props = {
  /** Title text. Ignored when children are provided. */
  title?: string
  /** Custom title content (e.g. wordmark). Overrides title prop. */
  children?: ReactNode
  /** Shows chevron-back and enables nav layout (centered title). */
  onBack?: () => void
  /** Shows × and enables nav layout (centered title). Takes precedence over onBack. */
  onClose?: () => void
  /** Right-side action for title-only layout (e.g. "All visits" link). */
  rightAction?: ReactNode
  /** Override insets.top (e.g. pass 0 for modal screens where the OS already offsets the content). */
  topInset?: number
}

export function ScreenHeader({ title, children, onBack, onClose, rightAction, topInset }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const top = topInset !== undefined ? topInset : insets.top

  if (onBack || onClose) {
    return (
      <View style={[styles.navHeader, { paddingTop: top + 6, backgroundColor: theme.tplNavy }]}>
        <TouchableOpacity onPress={onClose ?? onBack} hitSlop={8} style={styles.navBtn}>
          <Ionicons
            name={onClose ? 'close' : 'chevron-back'}
            size={onClose ? 22 : 24}
            color="rgba(255,255,255,0.7)"
          />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { fontFamily: fonts.display }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.navBtn} />
      </View>
    )
  }

  const titleNode = children ?? (
    <Text style={[styles.title, { fontFamily: fonts.display }]}>{title}</Text>
  )

  return (
    <View style={[styles.titleHeader, { paddingTop: top + 4, backgroundColor: theme.tplNavy }]}>
      {rightAction ? (
        <View style={styles.titleRow}>
          {titleNode}
          {rightAction}
        </View>
      ) : (
        titleNode
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  navBtn: {
    width: 30,
  },
  navTitle: {
    flex: 1,
    fontSize: textSize.lg,
    fontWeight: '600',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.92)',
  },
  titleHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: textSize.xxxl,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: -0.5,
  },
})
