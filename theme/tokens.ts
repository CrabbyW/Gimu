// Spacing, radiusy a typografie podle spec §6.4 a §6.6.
export const space = { xs: 4, s: 8, m: 16, l: 24, xl: 40, xxl: 64, xxxl: 104 } as const;
export const radius = { s: 8, l: 20, full: 999 } as const;
// Rozměry dotykových ploch a ovládacích prvků podle spec §6.6. `hit` je jediný zdroj
// minima 44 pt (dřív duplikované natvrdo ve třech komponentách).
export const size = {
  hit: 44, hitLarge: 56, control: 48, actionBar: 96, pathCard: 120, topBarBadge: 32,
} as const;
// Geometrie materiálu (kov, ne UI): tloušťky a poloměry vycházející z fyzického tvaru
// činky/kotouče, ne ze spec §6.6 škály radiusů. Viz docs/LOG.md 2026-09-30 (ruling boss).
export const material = { collarRadius: 2 } as const;
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
  // Volný text ve víceřádkovém poli (TextField, onboarding dream): tělový font, větší řez.
  input: { fontFamily: font.body, fontSize: 20, lineHeight: 28 },
  inputLarge: { fontFamily: font.body, fontSize: 22, lineHeight: 32 },
  // Velké číslo v TopBaru (streak, XP): display font, menší řez než `display`.
  counter: { fontFamily: font.display, fontSize: 32, lineHeight: 32 },
  // Iniciála v kruhovém odznaku ligy (TopBar TierBadge): stejný jazyk jako `label`, menší a bez rozpalu.
  badgeLabel: { fontFamily: font.mono, fontSize: 10, lineHeight: 12, letterSpacing: 0, textTransform: 'uppercase' as const },
} as const;

// Typografie pro SVG text (react-native-svg `<Text>` nepoužije lineHeight/textTransform,
// proto samostatně od `type`, které pohání `<Text>` z `components/ui/Text.tsx`).
export const svgType = {
  // Popisek "BOSS" na ose v BarbellBoss: stejné vlastnosti jako `type.label`.
  label: { fontFamily: font.mono, fontSize: 11, letterSpacing: 2 },
  // Číslo kg uprostřed kotouče v Plate.
  plateKg: { fontFamily: font.display, fontSize: 22 },
} as const;

// Velikosti čísla ve `Stat` (M/L/XL) podle spec §6.6.
export const statSize = { M: 56, L: 88, XL: 120 } as const;

// Barvy opice (srst, obličej) — stejné v obou režimech, viz spec §8.
export const mascot = { fur: '#7A5236', furShade: '#5E3F29', face: '#E8C7A0' } as const;

export type Space = typeof space;
export type Radius = typeof radius;
export type Size = typeof size;
export type Material = typeof material;
export type Fonts = typeof font;
export type TypeVariant = keyof typeof type;
export type Mascot = typeof mascot;
export type StatSize = keyof typeof statSize;
