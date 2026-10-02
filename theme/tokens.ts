// Spacing, radiusy a typografie podle spec §6.4 a §6.6, upraveno rulingem R42 (§6.8).
// Škála 4 8 16 24 40 64 104 168: za 24 roste zhruba Fibonacciho krokem.
export const space = { xs: 4, s: 8, m: 16, l: 24, xl: 40, xxl: 64, xxxl: 104, xxxxl: 168 } as const;
// R42: střídmější radiusy. Karta 12 působí jako obrobený kov, ne jako bublina; `s` drží poměr 1:2.
// `full` zůstává pro kruhové tvary (kotouč, kulaté CTA, odznak), kde tvar nese význam.
export const radius = { s: 6, l: 12, full: 999 } as const;
// Rozměry dotykových ploch a ovládacích prvků podle spec §6.6. `hit` je jediný zdroj
// minima 44 pt (dřív duplikované natvrdo ve třech komponentách).
export const size = {
  hit: 44, hitLarge: 56, control: 48, actionBar: 96, pathCard: 120, topBarBadge: 32,
  // Karta volby v onboardingu (vize těla, R36) a její glyf; glyf cesty je `glyph`.
  choiceCard: 80, choiceGlyph: 40, glyph: 48,
  // DotLoader: rozměr mřížky a průměr tečky (uživatelské zadání size={32} dotSize={4}).
  loader: 32, loaderDot: 4,
  // Liga (§7.5): řádek 56, sloupec pořadí 32, mini opice 32, odznak úrovně 72, proužek vlastního řádku 3 (v `text`, R42).
  leagueRow: 56, rankCol: 40, rowMascot: 32, tierBadge: 72, ownStripe: 3,
  // Instrument vrstva (R42): koncový tik MeasureLine, rameno registrační značky `+`, Lucide ikona v hlavičce.
  tick: 8, regMark: 8, icon: 20,
} as const;
// Tloušťky čar instrument vrstvy: Lucide obrys 1.5, aktivní úsek měřicí linky 2,
// fokus/výběr bez akcentu (spodní linka pole, proužek vybrané karty) 2, prstenec výdrže 3
// (měřidlo v `text` na stopě `rule`; tenčí než dřív, protože už ho nenese barva, ale kontrast).
export const stroke = { icon: 1.5, measure: 2, focus: 2, ring: 3 } as const;
// Geometrie materiálu (kov, ne UI): tloušťky a poloměry vycházející z fyzického tvaru
// činky/kotouče, ne ze spec §6.6 škály radiusů. Viz docs/LOG.md 2026-09-30 (ruling boss).
export const material = { collarRadius: 2 } as const;
// Názvy rodin = klíče předané do useFonts v app/_layout.tsx. Váha je součást rodiny:
// fontWeight se s nimi nekombinuje (Android u vlastních fontů váhu nesyntetizuje).
// R42: display je Inter 300 Light (místo Bebas Neue), bez nové závislosti.
export const font = {
  display: 'Inter_300Light', body: 'Inter_400Regular', bodyStrong: 'Inter_600SemiBold', mono: 'JetBrainsMono_500Medium',
} as const;
// Tracking v em; RN letterSpacing je v pt, proto `ls(size, em)`.
export const tracking = { display: -0.03, label: 0.18, telemetry: 0.2 } as const;
const ls = (fontSize: number, em: number) => Math.round(fontSize * em * 100) / 100;
export const type = {
  // Inter má proti Bebas širší znaky a vyšší x-height: menší stupeň v pt dává větší vizuální hmotu.
  // lineHeight ≥ 1.0 em, aby Android neořízl horní dotahy Interu (Bebas snesl 0.9).
  displayXL: { fontFamily: font.display, fontSize: 104, lineHeight: 108, letterSpacing: ls(104, tracking.display) },
  display: { fontFamily: font.display, fontSize: 48, lineHeight: 52, letterSpacing: ls(48, tracking.display) },
  title: { fontFamily: font.display, fontSize: 32, lineHeight: 36, letterSpacing: ls(32, tracking.display) },
  // Titulek kompaktní karty volby (onboarding, vize těla): o stupeň pod `title`.
  choiceTitle: { fontFamily: font.display, fontSize: 24, lineHeight: 28, letterSpacing: ls(24, tracking.display) },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: font.bodyStrong, fontSize: 16, lineHeight: 24 },
  // letterSpacing 0.18em při 11 pt ≈ 2.
  label: { fontFamily: font.mono, fontSize: 11, lineHeight: 14, letterSpacing: 2, textTransform: 'uppercase' as const },
  caption: { fontFamily: font.body, fontSize: 14, lineHeight: 20 },
  // Volný text ve víceřádkovém poli (TextField, onboarding dream): tělový font, větší řez.
  input: { fontFamily: font.body, fontSize: 20, lineHeight: 28 },
  inputLarge: { fontFamily: font.body, fontSize: 22, lineHeight: 32 },
  // Číslo v řádku ligy (pořadí, XP) a odpočet: display font, menší řez než `title`.
  // Tabulární číslice Interu ≈ 0.6 em: „12“ při 26 pt ≈ 31 pt, vejde se do sloupce pořadí 32 pt.
  counter: { fontFamily: font.display, fontSize: 26, lineHeight: 32, letterSpacing: ls(26, tracking.display) },
  // Název úrovně v kruhu TierBadge (72 pt): Inter je širší než Bebas, „DIAMANT“ (7 verzálek ≈ 4.6 em)
  // se do vnitřních ~64 pt vejde až při 13 pt.
  tierName: { fontFamily: font.display, fontSize: 13, lineHeight: 16, letterSpacing: 0 },
  // Telemetrický pruh (R42, instrument vrstva): mono, verzálky, tracking 0.2 em, tabulární číslice.
  telemetry: { fontFamily: font.mono, fontSize: 11, lineHeight: 16, letterSpacing: ls(11, tracking.telemetry), textTransform: 'uppercase' as const },
  // Iniciála v kruhovém odznaku ligy (TopBar TierBadge): stejný jazyk jako `label`, menší a bez rozpalu.
  badgeLabel: { fontFamily: font.mono, fontSize: 10, lineHeight: 12, letterSpacing: 0, textTransform: 'uppercase' as const },
} as const;

// Typografie pro SVG text (react-native-svg `<Text>` nepoužije lineHeight/textTransform,
// proto samostatně od `type`, které pohání `<Text>` z `components/ui/Text.tsx`).
export const svgType = {
  // Popisek "BOSS" na ose v BarbellBoss: stejné vlastnosti jako `type.label`.
  label: { fontFamily: font.mono, fontSize: 11, letterSpacing: 2 },
  // Číslo kg uprostřed kotouče v Plate.
  // Inter Light je širší než Bebas: 20 jednotek ve viewBoxu 100 drží „25“ uvnitř vnějšího prstence.
  plateKg: { fontFamily: font.display, fontSize: 20, letterSpacing: ls(20, tracking.display) },
} as const;

// Velikosti čísla ve `Stat` (M/L/XL) podle spec §6.6.
export const statSize = { M: 56, L: 88, XL: 120 } as const;

// Barvy opice (srst, obličej) — stejné v obou režimech, viz spec §8.
// `tankRim`: lem tílka Ember. Patří materiálu opice, ne UI akcentu (R42: ember jen v oslavě lekce);
// pálená siena z rodiny srsti, tlumenější než UI ember, nesleduje sezónní přepis akcentu.
export const mascot = { fur: '#7A5236', furShade: '#5E3F29', face: '#E8C7A0', tankRim: '#B4532A' } as const;

export type Space = typeof space;
export type Radius = typeof radius;
export type Size = typeof size;
export type Material = typeof material;
export type Stroke = typeof stroke;
export type Fonts = typeof font;
export type TypeVariant = keyof typeof type;
export type Mascot = typeof mascot;
export type StatSize = keyof typeof statSize;
