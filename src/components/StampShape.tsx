import { StyleSheet, Text, View } from 'react-native'
import { getStampColor, getStampFont, getStampOpacity, getStampRotation, getStampShape } from '../composables/useStamp'

interface Props {
  branchCode: string
  wardNo: number | string
  size?: number
}

export function StampShape({ branchCode, wardNo, size }: Props) {
  const shape = getStampShape(branchCode)
  const font = getStampFont(branchCode)   // returns font name string
  const rotation = getStampRotation(branchCode)
  const opacity = getStampOpacity(branchCode)
  const { color, bg, border } = getStampColor(wardNo)

  const w = size ?? parseInt(shape.width)
  const h = size ?? parseInt(shape.height)
  const br = size ? size / 2 : parseInt(shape.borderRadius)
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
      <Text style={[styles.code, { color, fontFamily: font, fontSize, opacity }]}>
        {branchCode}
      </Text>
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