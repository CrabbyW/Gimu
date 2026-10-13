// Spacing, radiusy a typografie podle spec §6.4 a §6.6, upraveno rulingem R42 (§6.8).
// Škála 4 8 16 24 40 64 104 168: za 24 roste zhruba Fibonacciho krokem.
// Zlatý řez: zdroj všech R43 proporcí (typová škála, kotouč, mapa, figura oslavy).
export const PHI = (1 + Math.sqrt(5)) / 2;
export const space = { xs: 4, s: 8, m: 16, l: 24, xl: 40, xxl: 64, xxxl: 104, xxxxl: 168 } as const;
// Teplá litina §2.5: `s` 8 tlačítko/chip/pole, `l` 14 karta/popover/sheet (měkčí, „comfy“, ale ne bublina),
// `full` pro kruhové tvary (kotouč, avatar, pilulka), kde tvar nese význam.
// Nothing Dot §2.3: `tile` 28 = dlaždice-widget (obr. 2), `full` pro pilulky (CTA, tab bar) a kruhy.
export const radius = { s: 8, l: 14, tile: 28, full: 999 } as const;
// Rozměry dotykových ploch a ovládacích prvků podle spec §6.6. `hit` je jediný zdroj
// minima 44 pt (dřív duplikované natvrdo ve třech komponentách).
export const size = {
  // Nothing Dot §2.3: pilulkové CTA 56, plovoucí tab bar 64, kulaté ikonové tlačítko 44, vnitřní okraj dlaždice 20.
  pill: 56, tabPill: 64,
  // Kurogane spodní karta startu lekce: výška (2 řádky + odsazení) a kulatá klávesa se šipkou.
  startCard: 72, startKey: 40, iconButton: 44, tilePad: 20,
  // Živá tečka stavového řádku 6, tečkový prstenec výdrže 260 (Doto 64 + jednotka se vejde do vnitřního prstence),
  // minimální výška hero dlaždice mapy (číslo nahoře, název dole jako obr. 2).
  liveDot: 6, holdRing: 260, heroTile: 148,
  // Nízký displej (useShort, 568 pt): prstenec výdrže 160 s číslem `heroShort` (Doto 42),
  // aby „10“ nesahalo na vnitřní kruh teček.
  holdRingShort: 160,
  // Kotouč oslavy na nízkém displeji (< breakpoint.short): strop průměru, ať se titulek, série a CTA nepřekrývají.
  celebratePlateShort: 128,
  // Doznění závoje pod překryvnou hlavičkou a nad plovoucí CTA (EdgeFade): mapa pod nimi mizí plynule, ne hranou.
  edgeFade: 40,
  // UX pass U1: velké [DONE] lekce 64 (zpocené prsty, celá šířka), volba pocitu po lekci 48.
  pillLarge: 64, feelChoice: 48,
  hit: 44, hitLarge: 56, control: 48, actionBar: 96, pathCard: 120, topBarBadge: 32,
  // Karta volby v onboardingu (vize těla, R36) a její glyf; glyf cesty je `glyph`.
  choiceCard: 80, choiceGlyph: 40, glyph: 48,
  // DotLoader: rozměr mřížky a průměr tečky (uživatelské zadání size={32} dotSize={4}).
  loader: 32, loaderDot: 4,
  // Liga (§7.5): řádek 56, sloupec pořadí 40, mini opice 32, odznak úrovně 72, proužek vlastního řádku 3 (v `text`, R42).
  leagueRow: 56, rankCol: 40, rowMascot: 32, tierBadge: 56, ownStripe: 3,
  // Instrument vrstva (R42): koncový tik MeasureLine, rameno registrační značky `+`, Lucide ikona v hlavičce.
  tick: 8, regMark: 8, icon: 20,
  // Progres (§7.6): stopa milníku 4, graf váhy 200 vysoký s osou Y 40 vlevo, bod 4 (poslední 6 + prstenec 10).
  meter: 6, chartHeight: 200, chartAxis: 40, chartPoint: 4, chartPointLast: 6, chartPointRing: 10,
  // Toggle 52×32 s knoflíkem 24 (Task 29), segment slotu Šatníku min. 104 (5 slotů se scrolluje).
  toggleWidth: 52, toggleHeight: 32, toggleKnob: 24, slotSegment: 104,
  // Šatník a profil: náhled opice v Šatníku 160, mini opice na dlaždici 64, šířka kotoučového rámu 14.
  wardrobePreview: 160, tileMascot: 64,
  // UX pass U5: opička v klíčových momentech — `heroMascot` v dlaždici (zamčená funkce, comeback),
  // `stateMascot` na celé obrazovce stavu (chyba, prázdno); obojí se vejde nad ohyb na 320 × 568.
  heroMascot: 96, stateMascot: 160, frameRing: 14, badgeIcon: 12,
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
  // Nothing Dot fáze 2: odznak úrovně jako tečkový prstenec 72 (vnitřní tečky ≈ 3 pt, čitelné), prstenec postupu
  // sezóny 120 (vejde se vedle Doto `displayXL` odpočtu do dlaždice na 390 pt; mono „100 %“ uvnitř 0.46 R ≈ 55 pt),
  // výška tečkového pole za opičkou profilu / šatníku (prstence stage-up jsou v `dots.stageUp`).
  tierRing: 72, seasonRing: 120, profileField: 248,
  // Mapa (Teplá litina): šířka popisku pod uzlem, náhled kotouče v kartě první lekce, dlaždice odznaku,
  // výška ghost řádku LockedPreview, počet viditelných řádků kola hodnot.
  nodeLabel: 200, previewPlate: 48, badgeTile: 64, ghostRow: 12, wheelVisible: 5,
  // Zámek vedle titulku zamčené karty 16, v náboji zamčeného uzlu a u zamčeného odznaku 12 (`badgeIcon`).
  lockIcon: 16, sheetGripH: 4,
  // UX pass U4: malý zámek v rohu ikony zamčeného tabu (Liga, Sezóna před odemčením).
  tabLock: 10,
  // Progres: sloupec data týdne vlevo od mřížky aktivity („29. 12.“ v caption).
  weekCol: 48,
  // Mřížka aktivity (§3.3): odcvičený dnešek = plná tečka + prstenec `accentGraphic` s touto mezerou.
  todayRingGap: 2,
  // Hloubka a materiál (2026-10-03): dlaždice zrna litiny 96 (dost velká, aby se opakování nečetlo jako vzor),
  // hero činka sekce 136×36, pódium ligy (šířka spodního kotouče stupně 80/72/64 — vejde se do třetiny 320 pt
  // displeje — a počet kotoučů ve stohu 5/3/2, opička 48), podstavec profilu (nejširší kotouč 176, tloušťka
  // kotouče z boku 12), panel siluety cviku 240 a krok mřížky podlahy 24, od průměru 72 kotouč nese i ražené „KG“.
  grainTile: 96, heroBarbellW: 136, heroBarbellH: 36,
  podiumFirst: 80, podiumSecond: 72, podiumThird: 64, podiumMascot: 48,
  podiumFirstCount: 5, podiumSecondCount: 3, podiumThirdCount: 2, pedestalCount: 3,
  pedestalW: 176, pedestalPlateH: 12, silhouettePanel: 240,
  // Nízký displej: panel siluety 120, aby na 320×568 nad lištou zůstal časovač, název i první řádek popisu.
  silhouettePanelShort: 120,
  // Nízký displej + bublina průvodce (first run) nad lištou: panel 80, ať název a popis nezajedou pod bublinu.
  silhouettePanelGuide: 80, floorStep: 24, floorRows: 5, plateUnitMin: 72,
} as const;
// Nothing Dot §2.4: tečkové prvky (Skia, `components/dots/`). Vše v pt, poměry (`…Frac`, ×R) vůči poloměru prvku.
export const dots = {
  /** DotField: rozteč 14 (spec §2.4), poloměr tečky, strop počtu teček (spec §7: ~600), počet pásem doznívání. */
  field: { pitch: 14, r: 1.25, max: 600, bands: 4 },
  // Reaktivní pozadí obrazovek (`ReactiveBackground`): klidové tečky na polovičním krytí, ať obsah nepřebíjí.
  background: { restOpacity: 0.5 },
  /** DotRow (obr. 5): průměr tečky a mezera mezi tečkami i řádky. */
  row: { d: 10, gap: 6 },
  /** DotMatrix (obr. 2): rozteč, poloměr zhasnuté a rozsvícené tečky, mezera prstence dneška. */
  matrix: { pitch: 10, r: 1.6, rLit: 2.2, todayGap: 2.4 },
  /** DotPlate: poloměr tečky = rFrac × R (min rMin); kometa = počet teček ohonu a zvětšení hlavy;
   *  od průměru `dotoMin` nese kotouč kg v Doto (≥ 28 pt), menší uzly mono štítek (Doto pod 28 pt zakázané). */
  plate: { rFrac: 0.036, rMin: 1, cometDots: 7, cometScale: 1.9, dotoMin: 144,
    // UX pass U5: dokončený = plný náboj (poloměr × vnitřní prstenec), fajfka v něm inverzně (`onText`).
    hubFill: 0.72 },
  /** DotRing (obr. 3): vnitřní prstenec (počet teček, poloměr ×R, tečka ×R) a vnější rozptýlený disk (od ×R, rozteč ×R, tečka ×R). */
  ring: { count: 32, inner: 0.46, innerDot: 0.042, outerFrom: 0.62, outerPitch: 0.074, outerDot: 0.013 },
  /** Tečkovaná cesta mapy: rozteč teček po křivce a poloměr. */
  path: { pitch: 10, r: 1.5 },
  /** Kurogane uzel mapy (2026-10-12), zlomky průměru uzlu: done = plný disk s otvorem, current = prstenec
   *  `ringDots` teček + živý (`live`) střed, locked = slabý obrys `lockedDots` teček. */
  node: { doneDisc: 0.6, hole: 0.22, ringR: 0.4, ringDots: 24, ringDot: 0.05, liveCore: 0.2, lockedR: 0.28, lockedDots: 14, lockedDot: 0.042 },
  /** Splash 03 „Tečkový nápis“ (2026-10-13): `head` = `imageWidth` nativního splashe v app.json (nativní je jen
   *  černý, obraz průhledný). Nápis OPICE: buňka tak, aby zabral `widthFrac` šířky (nejvýš `maxCell`), tečka `dotFrac`
   *  buňky. Opice vykoukne zpoza „O“: výřez hlavy `peekView` (x, y, šířka, výška ve viewBoxu opice 200) šíře `peekFrac`
   *  šířky nápisu (nejvýš `peekMax` pt), brada `peekSink` buňky pod horní řadou O (schová se za ni).
   *  Cíl ústupu = nadpis mapy: levý okraj `titleX`, horní hrana `titleY` pod safe area, výška `titleH`. */
  splash: {
    head: 140, widthFrac: 0.84, maxCell: 14, dotFrac: 0.72,
    peekView: [34, 20, 132, 86] as const, peekFrac: 0.32, peekMax: 120, peekSink: 0.6,
    titleX: 24, titleY: 46, titleH: 30,
  },
  /** Tečková činka bosse: rozteč 6 = dva sloupce teček na kotouč šíře 12 (tečka `path.r`). */
  boss: { pitch: 6 },
  /** Tečkový glyf cesty a vize (onboarding, SVG ve viewBoxu 48): rozteč mřížky výplně i obrysu a poloměr tečky.
   *  SVG, ne Skia: karet je až 7 na obrazovce a web drží nejvýš 12 WebGL pláten (fáze 2, Task 1). */
  glyph: { view: 48, pitch: 4, r: 1.35 },
  /** Záře aktivní tečky (jen dark): rozmazání BlurMask a poloměr záře vůči tečce. */
  glow: { blur: 4, scale: 1.8 },
  /** Pódium ligy (fáze 2): sloupec 3 tečky široký (výška = `podiumColumns().dots` řádků), tečka 8. */
  podium: { cols: 3, d: 8 },
  /** Tečková linka z RN View (bez Skia, nežere rozpočet pláten): oddělovač zóny ligy, ghost řádky, osa. */
  rule: { d: 2, gap: 4, max: 96 },
  // Opička průvodce: tečková šipka bubliny k cíli (sloupec teček + hrot ze dvou).
  // sideOffset: plovoucí šipka na nízkém displeji míří vedle opičky (S 56: polovina 28 + 8) na hranu kotouče.
  guide: { d: 4, gap: 3, count: 2, sideOffset: 36 },
  /** Replika opičky na mapě (elite fáze 3): hrot bubliny ze tří teček (2 + 1), max. šířka bubliny, okraj od hrany displeje
   *  a odhad výšky bubliny + hrotu (místo nad opičkou, které mapa při ťuknutí uvolní pod hlavičkou). */
  line: { d: 3, gap: 2, maxW: 232, edge: 16, room: 72 },
  /** Mřížka aktivity Progresu: 7 sloupců (dny) × 5 řádků (týdny), rozteč 22 (≈ 7 × 22 = 154 pt na šířku dlaždice). */
  activity: { cols: 7, rows: 5, pitch: 22 },
  /** Dny sezóny: tečka a mezera podle spec §6.4 (10 / 6), 14 na řádek (2 týdny), aby 90 dní dalo ≤ 7 řádků. */
  season: { d: 10, perRow: 14 },
  /** Tečkový graf váhy: průměr bodu a posledního (zářícího) bodu. */
  chart: { d: 6, dLast: 10 },
  /** Podstavec profilu: stoh tří `DotPlate` zploštělých na elipsu (`squash`), průměry od spodního, svislý
   *  rozestup středů elips (`step`) a kg kotoučů (počet prstenců: těžší dole). */
  pedestal: { squash: 0.35, sizes: [176, 148, 120], step: 18, kg: [25, 20, 15] },
  /** Stage-up: průměr prstence stage 240 (Doto `displayXL` číslice uvnitř vnitřního prstence 0.46 R ≈ 110)
   *  a o kolik opička (podíl své velikosti) přesahuje pod spodní hranu prstence, na které sedí. */
  stageUp: { ring: 240, mascotDrop: 0.45 },
  /** Intro OPICE (tečkové písmo 5×7): nápis nejvýš `widthFrac` šířky displeje, buňka nejvýš `maxCell`
   *  (29 sloupců × 12 = 348 pt na w430; na w320 fitCell dá 8), průměr tečky = `dotFrac` × buňka. */
  intro: { widthFrac: 0.8, maxCell: 12, dotFrac: 0.62 },
} as const;
// Šířka pod `narrow` nebo fontScale nad `fontScale` skládá dvousloupcové hlavičky pod sebe (spec §2.5).
// `statMaxScale` = strop zvětšení tokenu `stat` (1.4): pevné sloupce čísel (XP v lize) rostou jen do něj.
export const layout = { narrow: 360, fontScale: 1.3, statMaxScale: 1.4 } as const;
// Průhlednost zamčené položky v Šatníku (silueta náhledu pod zámkem).
// `disabled` = neaktivní ovládací prvek (stejná hodnota, jakou má Button).
// `future` = budoucí dny v DotGridu sezóny (`faint` na 40 %, Teplá litina §3.4).
// `grain` = celá vrstva zrna litiny přes obrazovku (2026-10-03, „hloubka a materiál“): 5 %, na hranici vnímání.
// `floor` = mřížka podlahy pod siluetou cviku (linky `rule` na `surface`, ať nepřebije postavu).
export const opacity = { locked: 0.32, cardMeta: 0.62, disabled: 0.4, future: 0.4, grain: 0.05, floor: 0.7, glint: 0.24,
  // Nothing Dot §3: rozjasněná hrana stisknuté dlaždice (vrstva `text` přes `edge`).
  edgeLit: 0.16,
  // Závoj pod překryvnou hlavičkou mapy (EdgeFade): `base` krytí na spodní hraně hlavičky; nahoře 1, pod ní doznívá do 0.
  veilEdge: 0.86 } as const;
// `glint` = odlesk na hraně litinového kotouče (`text` na 24 %): jediné místo, kde kov „chytá“ světlo.
// Přerušovaná cílová linie grafu váhy (SVG strokeDasharray).
// `dots` = tečkovaná linka v SVG (nulový úsek + kulatý konec = tečka, rozteč 6): cílová linie tečkového grafu váhy.
export const dash = { target: '4 6', dots: '0 6' } as const;
// Tloušťky čar instrument vrstvy: Lucide obrys 1.5, aktivní úsek měřicí linky 2,
// fokus/výběr bez akcentu (spodní linka pole, proužek vybrané karty) 2, prstenec výdrže 3
// (měřidlo v `text` na stopě `rule`; tenčí než dřív, protože už ho nenese barva, ale kontrast).
// R43: `plate` = lem a náboj kotouče, `check` = fajfka přes otvor, `hairline` = konstrukční figura oslavy.
// Teplá litina: `nodeRing` 2 = prstenec aktuálního uzlu, `streakAxis` osa StreakBarbell sm.
export const stroke = { icon: 1.5, measure: 2, focus: 2, ring: 3, chart: 1.5, plate: 1.2, check: 2.5, hairline: 1, nodeRing: 2, streakAxis: 1.5, streakAxisLg: 3, todayDot: 1.5, slot: 1,
  // Litinový kotouč (viewBox 100): soustružená drážka 0.5, odlesk hrany 1.6, zkosení otvoru 1.
  groove: 0.5, glint: 1.6, bevel: 1 } as const;

// Nejmenší měřítko písma jednořádkového titulku (adjustsFontSizeToFit): Doto `display` 40 → 28 pt (spodní hranice Doto).
// Elite fáze 4: dlouhé titulky se zkracují obsahem, ne písmem — názvy sekcí ≤ 12 znaků („Strength 101“ ≈ 228 pt při 28 pt)
// se na 320 pt (272 pt šířky) vejdou.
// `dotAdvance` = odhad šířky znaku Doto v em (monospace): web neumí adjustsFontSizeToFit, velikost dopočítá ScreenHeader.
export const fontScale = { titleMin: 0.7, dotAdvance: 0.68 } as const;
// Geometrie materiálu (kov, ne UI): tloušťky a poloměry vycházející z fyzického tvaru
// činky/kotouče, ne ze spec §6.6 škály radiusů. Viz docs/LOG.md 2026-09-30 (ruling boss).
// StreakBarbell: radius kotouče sm 1 / lg 2 (spec §2.7).
export const material = {
  collarRadius: 2, streakPlateSm: 1, streakPlateLg: 2,
  // Litinový kotouč (viewBox 100, 2026-10-03): poloměry soustružených drážek vnějšího lemu (mezi lemem 40 a hranou 48),
  // odsazení drážek náboje od jeho hrany, oblouk odlesku hrany ve stupních (světlo shora vlevo, 0° = vpravo, po směru
  // hodinových ručiček) a posun ražby čísla (stín dolů, světlo nahoru) ve viewBoxu.
  plateLipGrooves: [46, 44.4, 42.8, 41.4], plateHubGrooves: [2.2, 4.4], plateGlint: [195, 285], plateStamp: 0.7,
  // Hero činka sekce: tloušťka kotouče, mezera mezi kotouči a průměr osy v pt.
  heroPlateW: 6, heroPlateGap: 2, heroBar: 3,
} as const;
// Názvy rodin = klíče předané do useFonts v app/_layout.tsx. Váha je součást rodiny:
// fontWeight se s nimi nekombinuje (Android u vlastních fontů váhu nesyntetizuje).
// R42: display je Inter 300 Light (místo Bebas Neue), bez nové závislosti.
export const font = {
  // Nothing Dot §2.2: `dot` = Doto 700 (dot-matrix), jen ≥ 28 pt (hero čísla, kg, titulek obrazovky).
  dot: 'Doto_700Bold',
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
  // Nothing Dot: velká čísla a titulky v Doto (tečky), bez záporného prostrkání (tečky by se slily).
  // Doto má vysoký ascender a české háčky/čárky nad verzálkami: řádek 1.3 em, jinak glyfy přetečou box
  // a sousední text se překryje (web onboarding, 2026-10-05).
  hero: { fontFamily: font.dot, fontSize: 64, lineHeight: 84, letterSpacing: 0 },
  // Hero na nízkém displeji (568 pt): stupeň 42 škály, uvnitř menšího prstence výdrže.
  heroShort: { fontFamily: font.dot, fontSize: 42, lineHeight: 56, letterSpacing: 0 },
  // Titulek karty, název lekce.
  headline: { fontFamily: font.bodyStrong, fontSize: 18, lineHeight: 24 },
  // Čísla statistik, XP v lize.
  stat: { fontFamily: font.bodyStrong, fontSize: 20, lineHeight: 24 },
  // Popisek tab baru: Inter 600 11, sentence case, bez rozpalu („Trénink“ ≈ 40 pt se vejde i na 320 pt).
  tab: { fontFamily: font.bodyStrong, fontSize: 11, lineHeight: 14 },
  // Inter má proti Bebas širší znaky a vyšší x-height: menší stupeň v pt dává větší vizuální hmotu.
  // lineHeight ≥ 1.0 em, aby Android neořízl horní dotahy Interu (Bebas snesl 0.9).
  displayXL: { fontFamily: font.dot, fontSize: 110, lineHeight: 143, letterSpacing: 0 },
  display: { fontFamily: font.dot, fontSize: 40, lineHeight: 52, letterSpacing: 0 },
  // Titulek oslavy na nízkém displeji (< breakpoint.short): Doto 28 (spodní hranice Doto), „Plate on the bar.“ na jeden řádek v 320.
  dotTitleShort: { fontFamily: font.dot, fontSize: 28, lineHeight: 36, letterSpacing: 0 },
  // Číslo dlaždice (obr. 2 „200 lbs“): Doto 28, nejmenší povolený stupeň písma Doto.
  dotStat: { fontFamily: font.dot, fontSize: 28, lineHeight: 36, letterSpacing: 0 },
  // Nadpis obrazovky: Inter 600 24 (Teplá litina; dřív Light 33).
  title: { fontFamily: font.bodyStrong, fontSize: 24, lineHeight: 30, letterSpacing: ls(24, -0.01) },
  // Titulek kompaktní karty volby (onboarding, vize těla): o stupeň pod `title`.
  choiceTitle: { fontFamily: font.display, fontSize: 26, lineHeight: 30, letterSpacing: ls(26, tracking.display) },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: font.bodyStrong, fontSize: 16, lineHeight: 24 },
  // letterSpacing 0.18em při 11 pt ≈ 2.
  label: { fontFamily: font.mono, fontSize: 11, lineHeight: 14, letterSpacing: 2, textTransform: 'uppercase' as const },
  caption: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  // Popisek pilulkového CTA `[ZAČÍT LEKCI]` (obr. 1): mono 13 s rozpalem 0.12 em. O stupeň nad štítkem 11,
  // protože nese hlavní akci obrazovky a musí se číst i v pohybu; verzálky dodává PillButton v textu (čtečka bez závorek).
  pill: { fontFamily: font.mono, fontSize: 13, lineHeight: 16, letterSpacing: ls(13, 0.12) },
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

// Tabulární číslice jen u čísel a štítků (R18, elite fáze 4: všechna čísla XP, série, čas, liga).
// Inter v tnum rozšiřuje i spojovník, takže běžný text („muscle-up“, „-3 kg“) má proporcionální číslice.
export const tabularVariants: Record<keyof typeof type, boolean> = {
  hero: true, heroShort: true, headline: false, stat: true, tab: false,
  displayXL: true, display: true, dotTitleShort: true, title: true, choiceTitle: false, label: true, body: false, bodyStrong: false, caption: false,
  input: false, inputLarge: false, counter: true, badgeLabel: true, tierName: false, telemetry: true, tabLabelCompact: true, dotStat: true, pill: true,
};
/** Styl tabulárních číslic pro čísla v proporcionálním stupni (caption, headline): jediný zdroj `tabular-nums`. */
export const tabularNums = { fontVariant: ['tabular-nums' as const] };
// Strop systémového zvětšení písma (spec §2.4, elite fáze 4): Doto stupně rostou nejvýš 1.3×, ať při 1.4×
// zůstanou ≥ 28 pt a nepřetečou; prvky v pevné geometrii (tab bar, pilulka, štítky) taky 1.3×.
export const typeMaxScale: Partial<Record<keyof typeof type, number>> = {
  displayXL: 1, hero: 1.2, heroShort: 1.2, display: 1.3, dotTitleShort: 1.3, dotStat: 1.3, counter: 1.3,
  title: 1.5, choiceTitle: 1.3, headline: 1.6, bodyStrong: 1.6, body: 2, caption: 1.8,
  label: 1.3, tab: 1.3, stat: 1.4, pill: 1.3, telemetry: 1.3, badgeLabel: 1.2, tabLabelCompact: 1.2, tierName: 1.2,
};

// Šířkové zlomy v pt. `compact` = displeje užší než 375 (iPhone SE 1. gen., 320 pt): menší stupně
// u prvků, které jinak ořezávají (tab bar, název sezóny, oslava lekce).
// `short` = výška okna pod 640 (iPhone SE 1. gen., 568 pt): oslava a mapa prvního průchodu se zhustí.
export const breakpoint = { compact: 375, short: 640 } as const;

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
  // Ražené „KG“ ve spodním pásu kotouče (jen od `size.plateUnitMin`): mono s rozpalem jako štítky.
  plateUnit: { fontFamily: font.mono, fontSize: 7, letterSpacing: 1.4 },
} as const;

// Velikosti čísla ve `Stat` (M/L/XL) podle spec §6.6.
export const statSize = { M: 53, L: 87, XL: 110 } as const;

// Barvy opice (srst, obličej) — stejné v obou režimech, viz spec §8.
// `tankRim`: lem tílka Ember. Patří materiálu opice, ne UI akcentu (R43: akcent jen v oslavě lekce);
// pálená siena z rodiny srsti, tlumenější než UI akcent, nesleduje sezónní přepis akcentu.
// `ink`: detail obličeje (oči, nos, pusa) na světlém `face`, stejný v obou režimech.
export const mascot = { fur: '#7A5236', furShade: '#5E3F29', face: '#E8C7A0', tankRim: '#B4532A', ink: '#1E1813',
  // Šál opičky (Teplá litina §4): šedomodrá ocel, tónově opačná k jantarovému akcentu, aby akcent
  // zůstal jen na horní hraně šálu v oslavě. Stín = spodní lem a uzel (plochý, bez gradientu).
  scarf: '#6F7C86', scarfShade: '#56626B' } as const;

export type Space = typeof space;
export type Radius = typeof radius;
export type Size = typeof size;
export type Material = typeof material;
export type Stroke = typeof stroke;
export type Fonts = typeof font;
export type TypeVariant = keyof typeof type;
export type Mascot = typeof mascot;
export type StatSize = keyof typeof statSize;
