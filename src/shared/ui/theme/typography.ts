import type { TextStyle } from 'react-native';

// Swapping a client's font is a change to this map, plus the font files in
// shared/assets/native/fonts.
export const fontFamilies = {
  regular: 'OpenSans-Regular',
  medium: 'OpenSans-Medium',
  semiBold: 'OpenSans-SemiBold',
  bold: 'OpenSans-Bold',
} as const;

export const typography = {
  title: { fontFamily: fontFamilies.bold, fontSize: 24, lineHeight: 32 },
  subtitle: { fontFamily: fontFamilies.semiBold, fontSize: 18, lineHeight: 26 },
  body: { fontFamily: fontFamilies.regular, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fontFamilies.medium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fontFamilies.regular, fontSize: 13, lineHeight: 18 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
