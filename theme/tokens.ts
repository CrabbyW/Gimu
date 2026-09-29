// Spacing, radiusy a typografie podle spec §6.4 a §6.6.
export const space = { xs: 4, s: 8, m: 16, l: 24, xl: 40, xxl: 64, xxxl: 104 } as const;
export const radius = { s: 8, m: 12, l: 20, full: 999 } as const;
// Názvy rodin = klíče předané do useFonts v app/_layout.tsx. Váha je součást rodiny:
// fontWeight se s nimi nekombinuje (Android u vlastních fontů váhu nesyntetizuje).
export const font = {
  display: 'BebasNeue_400Regular', body: 'Inter_400Regular', bodyStrong: 'Inter_600SemiBold', mono: 'JetBrainsMono_500Medium',
} as const;
export const type = {
  displayXL: { fontFamily: font.display, fontSize: 120, lineHeight: 108 },
  display: { fontFamily: font.display, fontSize: 56, lineHeight: 54 },
  title: { fontFamily: font.display, fontSize: 36, lineHeight: 38 },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: font.bodyStrong, fontSize: 16, lineHeight: 24 },
  // letterSpacing 0.18em při 11 pt ≈ 2.
  label: { fontFamily: font.mono, fontSize: 11, lineHeight: 14, letterSpacing: 2, textTransform: 'uppercase' as const },
  caption: { fontFamily: font.body, fontSize: 14, lineHeight: 20 },
} as const;

export type Space = typeof space;
export type Radius = typeof radius;
export type Fonts = typeof font;
export type TypeVariant = keyof typeof type;
