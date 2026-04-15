import { StyleSheet } from 'react-native'
import { radius, textSize } from '../../theme'

export const ANIMATION_CONFIGS = { damping: 24, stiffness: 200, mass: 0.6, overshootClamping: true }

export const bottomSheetStyles = StyleSheet.create({
  sheetBg: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  sheetShadow: {
    shadowColor: '#000',  // overridden inline via theme.shadowColor
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnPrimary: {
    borderWidth: 0,
  },
  btnText: {
    fontSize: textSize.sm,
    fontWeight: '600',
  },
})
