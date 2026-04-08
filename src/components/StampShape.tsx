import { StyleSheet, Text, View } from 'react-native'
import { getStampColor, getStampFont, getStampOpacity, getStampRotation, getStampShape } from '../composables/useStamp'

interface Props {
  branchCode: string
  wardNo: number | string
  size?: number
  hideCode?: boolean
  ghost?: boolean
}

const GHOST_COLORS = { color: '#b0b0b0', bg: '#f0f0f0', border: '#cccccc' }

export function StampShape({ branchCode, wardNo, size, hideCode, ghost }: Props) {
  const shape = getStampShape(branchCode)
  const font = getStampFont(branchCode)   // returns font name string
  const rotation = getStampRotation(branchCode)
  const opacity = getStampOpacity(branchCode)
  const { color, bg, border } = ghost ? GHOST_COLORS : getStampColor(wardNo)

  const shapeW = parseInt(shape.width)
  const shapeH = parseInt(shape.height)
  const scale = size != null ? size / Math.max(shapeW, shapeH) : 1
  const w = Math.round(shapeW * scale)
  const h = Math.round(shapeH * scale)
  const isPercent = shape.borderRadius.includes('%')
  const rawBr = isPercent ? Math.min(w, h) / 2 : Math.round(parseInt(shape.borderRadius) * scale)
  const br = Math.min(rawBr, Math.min(w, h) / 2)
  const fontSize = Math.round(Math.min(w, h) * 0.30)

  return (
    <View style={[
      styles.stamp,
      {
        width: w, height: h, borderRadius: br, backgroundColor: bg, borderColor: border,
        transform: [{ rotate: `${rotation}deg` }]
      }
    ]}>
      <View style={[styles.ring, { borderRadius: br - 6, borderColor: color, opacity: 0.22 }]} />
      {!hideCode && (
        <Text style={[styles.code, { color, fontFamily: font, fontSize, opacity }]}>
          {branchCode}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  stamp: {
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    top: 6, bottom: 6, left: 6, right: 6,
    borderWidth: 1.5,
  },
  code: {
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
})