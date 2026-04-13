import { useEffect } from 'react'
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming } from 'react-native-reanimated'
import { TouchableOpacity } from 'react-native'
import { BadgeCard } from './BadgeCard'
import type { Badge, BadgeCtx } from '../composables/useBadges'

export function AnimatedBadgeCell({
  item, index, cellStyle, onPress, ctx,
}: {
  item: Badge
  index: number
  cellStyle: object
  onPress: () => void
  ctx: BadgeCtx
}) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(12)

  useEffect(() => {
    const delay = Math.min(index, 10) * 45
    opacity.value = withDelay(delay, withTiming(1, { duration: 260 }))
    translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 260 }))
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View style={[cellStyle, animStyle]}>
      <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.7}>
        <BadgeCard badge={item} ctx={ctx} />
      </TouchableOpacity>
    </Animated.View>
  )
}
