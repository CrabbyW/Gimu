// Spacing, radiusy a typografie podle spec §6.4 a §6.6, upraveno rulingem R42 (§6.8).
// Škála 4 8 16 24 40 64 104 168: za 24 roste zhruba Fibonacciho krokem.
// Zlatý řez: zdroj všech R43 proporcí (typová škála, kotouč, mapa, figura oslavy).
export const PHI = (1 + Math.sqrt(5)) / 2;
export const space = { xs: 4, s: 8, m: 16, l: 24, xl: 40, xxl: 64, xxxl: 104, xxxxl: 168 } as const;
// Teplá litina §2.5: `s` 8 tlačítko/chip/pole, `l` 14 karta/popover/sheet (měkčí, „comfy“, ale ne bublina),
// `full` pro kruhové tvary (kotouč, avatar, pilulka), kde tvar nese význam.
export const radius = { s: 8, l: 14, full: 999 } as const;
// Rozměry dotykových ploch a ovládacích prvků podle spec §6.6. `hit` je jediný zdroj
// minima 44 pt (dřív duplikované natvrdo ve třech komponentách).
export const size = {
  hit: 44, hitLarge: 56, control: 48, actionBar: 96, pathCard: 120, topBarBadge: 32,
  // Karta volby v onboardingu (vize těla, R36) a její glyf; glyf cesty je `glyph`.
  choiceCard: 80, choiceGlyph: 40, glyph: 48,
  // DotLoader: rozměr mřížky a průměr tečky (uživatelské zadání size={32} dotSize={4}).
  loader: 32, loaderDot: 4,
  // Liga (§7.5): řádek 56, sloupec pořadí 40, mini opice 32, odznak úrovně 72, proužek vlastního řádku 3 (v `text`, R42).
  leagueRow: 56, rankCol: 40, rowMascot: 32, tierBadge: 72, ownStripe: 3,
  // Instrument vrstva (R42): koncový tik MeasureLine, rameno registrační značky `+`, Lucide ikona v hlavičce.
  tick: 8, regMark: 8, icon: 20,
  // Progres (§7.6): stopa milníku 4, graf váhy 200 vysoký s osou Y 40 vlevo, bod 4 (poslední 6 + prstenec 10).
  meter: 4, chartHeight: 200, chartAxis: 40, chartPoint: 4, chartPointLast: 6, chartPointRing: 10,
  // Toggle 52×32 s knoflíkem 24 (Task 29), segment slotu Šatníku min. 104 (5 slotů se scrolluje).
  toggleWidth: 52, toggleHeight: 32, toggleKnob: 24, slotSegment: 104,
  // Šatník a profil: náhled opice v Šatníku 160, mini opice na dlaždici 64, šířka kotoučového rámu 14.
  wardrobePreview: 160, tileMascot: 64, frameRing: 14, badgeIcon: 12,
  // Sezóna (§7.7): tečka DotGrid 10 a mezera 6 (spec), odznak sezóny v kartě odměny a v recapu,
  // úlomek prasknutí kruhu ve stage-up (r = 6). ProgressBar sdílí stopu `meter`.
  dot: 10, dotGap: 6, seasonBadge: 56, seasonBadgeLarge: 88, shard: 12,
  // Teplá litina §2.7: tlačítko min. 52, uzel mapy 72 (aktuální 88) s mezerou prstence 4, tab bar 64 a ikona 24,
  // tečka aktivního tabu 4, řádek TodayStatus 44 a jeho tečka 8, pilulka série 36, řádek ValueWheelSheet 44.
  button: 52, node: 72, nodeCurrent: 88, nodeRingGap: 4, tabBar: 64, tabIcon: 24, tabDot: 4,
  todayRow: 44, todayDot: 8, streakPill: 36, wheelRow: 44, sheetGrip: 32,
  // StreakBarbell: sm 28×16 (3 sloty na stranu), lg 160×56 (7 na stranu).
  streakSmW: 28, streakSmH: 16, streakLgW: 160, streakLgH: 56,
  // Pevná šířka sloupce XP v lize pro „9 999“ (stat 20 pt, tabulární číslice ≈ 0.6 em).
  leagueXpCol: 64,
} as const;
// Šířka pod `narrow` nebo fontScale nad `fontScale` skládá dvousloupcové hlavičky pod sebe (spec §2.5).
export const layout = { narrow: 360, fontScale: 1.3 } as const;
// Průhlednost zamčené položky v Šatníku (silueta náhledu pod zámkem).
// `disabled` = neaktivní ovládací prvek (stejná hodnota, jakou má Button).
export const opacity = { locked: 0.32, disabled: 0.4 } as const;
// Přerušovaná cílová linie grafu váhy (SVG strokeDasharray).
export const dash = { target: '4 6' } as const;
// Tloušťky čar instrument vrstvy: Lucide obrys 1.5, aktivní úsek měřicí linky 2,
// fokus/výběr bez akcentu (spodní linka pole, proužek vybrané karty) 2, prstenec výdrže 3
// (měřidlo v `text` na stopě `rule`; tenčí než dřív, protože už ho nenese barva, ale kontrast).
// R43: `plate` = lem a náboj kotouče, `check` = fajfka přes otvor, `hairline` = konstrukční figura oslavy.
// Teplá litina: `nodeRing` 2 = prstenec aktuálního uzlu, `streakAxis` osa StreakBarbell sm.
export const stroke = { icon: 1.5, measure: 2, focus: 2, ring: 3, chart: 1.5, plate: 1.2, check: 2.5, hairline: 1, nodeRing: 2, streakAxis: 1.5 } as const;
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
// R43 typová škála 16·√φⁿ (dva kroky = φ): 16 · 20 · 26 · 33 · 42 · 53 · 68 · 87 · 110.
// Utility stupně (label 11, caption 14, mono 10, input) stojí mimo škálu kvůli čitelnosti.
// Teplá litina §2.4: mono s rozpalem jen pro nadpisy sekcí (`label`/`section`), popisky a čísla Inter.
export const type = {
  // Jedno velké číslo obrazovky.
  hero: { fontFamily: font.display, fontSize: 64, lineHeight: 68, letterSpacing: ls(64, -0.03) },
  // Titulek karty, název lekce.
  headline: { fontFamily: font.bodyStrong, fontSize: 18, lineHeight: 24 },
  // Čísla statistik, XP v lize.
  stat: { fontFamily: font.bodyStrong, fontSize: 20, lineHeight: 24 },
  // Popisek tab baru: Inter 600 11, sentence case, bez rozpalu („Trénink“ ≈ 40 pt se vejde i na 320 pt).
  tab: { fontFamily: font.bodyStrong, fontSize: 11, lineHeight: 14 },
  // Inter má proti Bebas širší znaky a vyšší x-height: menší stupeň v pt dává větší vizuální hmotu.
  // lineHeight ≥ 1.0 em, aby Android neořízl horní dotahy Interu (Bebas snesl 0.9).
  displayXL: { fontFamily: font.display, fontSize: 110, lineHeight: 114, letterSpacing: ls(110, tracking.display) },
  display: { fontFamily: font.display, fontSize: 40, lineHeight: 44, letterSpacing: ls(40, -0.02) },
  // Nadpis obrazovky: Inter 600 24 (Teplá litina; dřív Light 33).
  title: { fontFamily: font.bodyStrong, fontSize: 24, lineHeight: 30, letterSpacing: ls(24, -0.01) },
  // Titulek kompaktní karty volby (onboarding, vize těla): o stupeň pod `title`.
  choiceTitle: { fontFamily: font.display, fontSize: 26, lineHeight: 30, letterSpacing: ls(26, tracking.display) },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: font.bodyStrong, fontSize: 16, lineHeight: 24 },
  // letterSpacing 0.18em při 11 pt ≈ 2.
  label: { fontFamily: font.mono, fontSize: 11, lineHeight: 14, letterSpacing: 2, textTransform: 'uppercase' as const },
  caption: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  // Volný text ve víceřádkovém poli (TextField, onboarding dream): tělový font, větší řez.
  input: { fontFamily: font.body, fontSize: 20, lineHeight: 28 },
  inputLarge: { fontFamily: font.body, fontSize: 22, lineHeight: 32 },
  // Číslo v řádku ligy (pořadí, XP) a odpočet: display font, menší řez než `title`.
  // Tabulární číslice Interu ≈ 0.6 em: „12“ při 26 pt ≈ 31 pt, vejde se do sloupce pořadí 40 pt.
  counter: { fontFamily: font.display, fontSize: 26, lineHeight: 32, letterSpacing: ls(26, tracking.display) },
  // Název úrovně v kruhu TierBadge (72 pt): Inter je širší než Bebas, „DIAMANT“ (7 verzálek ≈ 4.6 em)
  // se do vnitřních ~64 pt vejde až při 13 pt.
  tierName: { fontFamily: font.display, fontSize: 13, lineHeight: 16, letterSpacing: 0 },
  // Telemetrický pruh (R42, instrument vrstva): mono, verzálky, tracking 0.2 em, tabulární číslice.
  telemetry: { fontFamily: font.mono, fontSize: 11, lineHeight: 16, letterSpacing: ls(11, tracking.telemetry), textTransform: 'uppercase' as const },
  // Iniciála v kruhovém odznaku ligy (TopBar TierBadge): stejný jazyk jako `label`, menší a bez rozpalu.
  badgeLabel: { fontFamily: font.mono, fontSize: 10, lineHeight: 12, letterSpacing: 0, textTransform: 'uppercase' as const },
  // Popisek tab baru na úzkém displeji (< breakpoint.compact): mono 10 s rozpalem 0.05 em.
  // „TRÉNINK“ 7 × (0.6 × 10 + 0.5) ≈ 46 pt se vejde do pětiny 320 pt (64 pt minus vnitřní okraje).
  tabLabelCompact: { fontFamily: font.mono, fontSize: 10, lineHeight: 12, letterSpacing: ls(10, 0.05), textTransform: 'uppercase' as const },
} as const;

// Šířkové zlomy v pt. `compact` = displeje užší než 375 (iPhone SE 1. gen., 320 pt): menší stupně
// u prvků, které jinak ořezávají (tab bar, název sezóny, oslava lekce).
export const breakpoint = { compact: 375 } as const;

// Odhad šířky glyfů pro rozpočet layoutu (ne vykreslování). Inter Light, tabulární číslice a „+“
// ≈ 0.6 em, po trackingu display −0.03 em; 0.62 nechává rezervu na rozdíly renderu.
// `unit`: malá jednotka (caption) za číslem Statu včetně mezery, v pt.
export const glyph = { displayDigit: 0.62, statUnit: 32 } as const;

// Typografie pro SVG text (react-native-svg `<Text>` nepoužije lineHeight/textTransform,
// proto samostatně od `type`, které pohání `<Text>` z `components/ui/Text.tsx`).
export const svgType = {
  // Popisek "BOSS" na ose v BarbellBoss: stejné vlastnosti jako `type.label`.
  label: { fontFamily: font.mono, fontSize: 11, letterSpacing: 2 },
  // Osa Y grafu váhy: mono 11 bez rozpalu (tabulární čísla, `fontVariant` SVG nezná, JetBrains Mono je tabulární sám).
  axis: { fontFamily: font.mono, fontSize: 11, letterSpacing: 0 },
  // Číslo kg uprostřed kotouče v Plate.
  // Inter Light je širší než Bebas: 20 jednotek ve viewBoxu 100 drží „25“ uvnitř vnějšího prstence.
  plateKg: { fontFamily: font.display, fontSize: 20, letterSpacing: ls(20, tracking.display) },
} as const;

// Velikosti čísla ve `Stat` (M/L/XL) podle spec §6.6.
export const statSize = { M: 53, L: 87, XL: 110 } as const;

// Barvy opice (srst, obličej) — stejné v obou režimech, viz spec §8.
// `tankRim`: lem tílka Ember. Patří materiálu opice, ne UI akcentu (R43: akcent jen v oslavě lekce);
// pálená siena z rodiny srsti, tlumenější než UI akcent, nesleduje sezónní přepis akcentu.
// `ink`: detail obličeje (oči, nos, pusa) na světlém `face`, stejný v obou režimech.
export const mascot = { fur: '#7A5236', furShade: '#5E3F29', face: '#E8C7A0', tankRim: '#B4532A', ink: '#1E1813' } as const;

export type Space = typeof space;
export type Radius = typeof radius;
export type Size = typeof size;
export type Material = typeof material;
export type Stroke = typeof stroke;
export type Fonts = typeof font;
export type TypeVariant = keyof typeof type;
export type Mascot = typeof mascot;
export type StatSize = keyof typeof statSize;
