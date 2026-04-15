export const colors = {
  tplBlue: '#005fc0',
  tplNavy: '#001c71',
  bg: '#f2ede3',
  surface: '#ffffff',
  textPrimary: '#1a1a1a',
  textMuted: '#767676',
  border: '#d4cfc4',
  borderSoft: '#e8e3d8',
  shadowColor: '#001c71',
  error: '#c0392b',
}

export const dark = {
  ...colors,
  tplNavy: '#111850',
  tplBlue: '#6aaaf8',
  bg: '#121212',
  surface: '#1e1e1e',
  textPrimary: '#f0f0f0',
  textMuted: '#999999',
  border: '#333333',
  borderSoft: '#2a2a2a',
  shadowColor: '#000000',
  error: '#e74c3c',
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }
export const radius  = { sm: 8, md: 12, lg: 16, pill: 999 }

export const textSize = {
  xs:   10,   // micro: MRZ, stamp dates, uppercase field labels
  sm:   12,   // small: captions, hints, secondary meta
  md:   14,   // medium: body, settings rows, subtitles
  base: 16,   // base: standard text, buttons, inputs
  lg:   18,   // large: subheadings, branch names
  xl:   20,   // xlarge: screen titles, wordmark
  xxl:  24,   // 2xlarge: display numbers, success headline
  xxxl: 28,   // 3xlarge: page hero titles
}

export const fonts = {
  display: 'Fraunces',
  body: 'Roboto',
  stampCondensed: 'RobotoCondensed',
  stampElite: 'SpecialElite',
  stampStencil: 'AllertaStencil',
}