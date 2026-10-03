# Teplá litina: redesign (DRAFT, kolo 2)

Stav: návrh k revizi bossem a uživatelem. Žádný kód. Datum 2026-10-03, autor design-agent.
Nahrazuje vizuální část R42/R43 (Chalk & Iron), herní logiku a datové toky nemění.
Souběžný dokument: `2026-10-03-motion-haptics-sound-design.md` (motion-agent); pohyb, haptika a zvuk jsou tam.

---

## 0. Změny v kole 2

- **Plamen vyřazen všude.** Streak symbol = činka plná kotoučů (`StreakBarbell`, kap. 2.7): malá v pilulce, velká na Profilu, stavy prázdný / přerušený / přetečení.
- **Denní cíl vypuštěn.** Místo něj stav „Dnes hotovo / Dnes čeká“ (streak = 1 lekce denně, SPEC). Komponenta `DailyGoalBar` zaniká, nová `TodayStatus`.
- **Připomínka** je poslední krok onboardingu (volba času), ne karta na oslavě. Na oslavě řádek „Zítra: <název další lekce> · N min“.
- **Light paleta opravena:** `faint` #857B6E, nový `accentGraphic` #B86F12 (prstence, tečky, proužky, výplň progresu), `accentText` #8A500C. Všechny kontrasty přepočítány (kap. 2.1–2.3), seznam párů pro `theme/__tests__` v 2.3.
- **Žádný glow, shimmer, parallax.** Aktivní uzel = jen prstenec 2 pt.
- **Nové tokeny:** `scrim`, `scrimSoft`, `scrimDeep`, `accentPressed`, `raisedPressed`, `accentGraphic`, `celebrate.ring`, `celebrate.spark`.
- **Nová komponenta** `ValueWheelSheet`; definován z-order opičky na kotouči (sourozenec, dvě vrstvy), mezistav odemčení uzlu, tečka tabu.
- **Data místo konstant:** metadata uzlu z `estMinutes` a počtu cviků v `data/lessons`; boss odemčen po 8 lekcích (počet z dat); XP rozpis z `LessonResult.xpBreakdown`; počet odznaků z `data/badges.ts`.
- **Liga** zamčená jen při 0 lekcích za celou historii; prázdná liga = `LockedPreview` bez maskota; vlastní řádek bez stínu.
- **Smutný stav** odvozen z aktivity; karta přerušeného streaku jen při `longestStreak ≥ 2`.
- **Dynamic Type:** `maxFontSizeMultiplier`, zalamování hlavičky Sezóny, tlačítka na 2 řádky, pevný XP sloupec ligy.
- **Emoji z notifikací pryč** (odchylka od SPEC §7.9, k potvrzení). Nálady opičky v MVP: neutrální, slaví, smutná.

---

## 1. Kontext a rozhodnutí

Chalk & Iron (R43) je přesný, ale chladný. Uživatel schválil směr **Teplá litina**: stejná disciplína (monochrom + jeden akcent, vzduch, typografie nese obsah), teplejší materiál a akcent tam, kde rozhoduje.

| Rozhodnutí | Hodnota | Proč |
|---|---|---|
| Podklad | teplá tmavá litina #14110E / #1D1915 / #26211C | Teplý černý tón je „comfy“ bez pastelů. |
| Akcent | jantar #F2A33A, úplně nahrazuje #EF3E31 | Barva šálu opičky v protisvětle: akcent pochází ze světa maskota. |
| Kde akcent smí být | primární CTA, streak, progres, oslava | Zadání uživatele; čtyři role = čtyři věci, které vedou dál. |
| Povrchová úprava | plné výplně, žádný glow, shimmer ani parallax | Klid; pohyb nese motion, ne efekty povrchu. |
| Karty | tónové, bez obrysů, bez stínů | Jeden oddělovač na prvek. |
| Radius | 8 / 14 / 999 | 8 malé prvky, 14 karty a sheety, 999 tvary nesoucí význam (kotouč, pilulka). |
| Spacing | 4 8 16 24 40 64 | Méně stupňů = víc konzistence. |
| Mono | JetBrains Mono jen pro nadpisy sekcí | Mono je koření, ne hlas appky. |

Instrument layer bereme jen dvakrát: mono nadpisy sekcí a tabulární čísla. `RegMark`, `Telemetry`, `MeasureLine` z hlavních obrazovek mizí.

---

## 2. Design systém

### 2.1 Paleta: dark (výchozí)

Kontrast = (L1 + 0.05) / (L2 + 0.05), L = 0.2126 R + 0.7152 G + 0.0722 B, kanál c = v/255, lineárně c/12.92 pro c ≤ 0.04045, jinak ((c + 0.055)/1.055)^2.4. Hodnoty zaokrouhleny dolů na desetiny. Text vyžaduje ≥ 4.5:1, netextová grafika ≥ 3:1.

| Token | Hex | Rel. luminance | Role | Kontrast base / surface / raised |
|---|---|---|---|---|
| `base` | #14110E | 0.0058 | pozadí obrazovky, tab bar | n/a |
| `surface` | #1D1915 | 0.0101 | karta, sheet | n/a |
| `raised` | #26211C | 0.0158 | prvek v kartě, vlastní řádek ligy, stopa progresu | n/a |
| `raisedPressed` | #2F2924 | 0.0232 | stisk secondary tlačítka a řádků | text na něm 11.8 |
| `rule` | #332C25 | 0.0264 | jediná vlasová linka (dekor) | 1.3 / – / – |
| `text` | #EFE8DE | 0.8134 | primární text, ikony, aktivní tab | 15.4 / 14.3 / 13.1 |
| `muted` | #A39A8F | 0.3288 | sekundární text, neaktivní tab | 6.7 / 6.3 / 5.7 |
| `faint` | #6E665D | 0.1361 | zamčené siluety, prázdné sloty, budoucí dny (jen grafika, jen na base/surface) | 3.3 / 3.0 / **2.8 (na raised nepoužívat)** |
| `accent` | #F2A33A | 0.4538 | výplň CTA | 9.0 / 8.3 / 7.6 |
| `accentPressed` | #E8952A | 0.3882 | stisk CTA (o krok tmavší) | onAccent na něm 7.8 |
| `accentGraphic` | #F2A33A | 0.4538 | prstence, tečky, proužky, výplň progresu, kotouče streaku | 9.0 / 8.3 / 7.6 |
| `accentText` | #F2A33A | 0.4538 | akcent jako text (číslo streaku, +XP) | 9.0 / 8.3 / 7.6 |
| `onAccent` | #14110E | 0.0058 | text a ikona na akcentu | 9.0 na accent |
| `danger` | #E8775F | 0.3118 | chyba ve formuláři | 6.4 / 6.0 / – |
| `success` | #8DB580 | 0.4027 | potvrzení uložení | 8.1 / 7.5 / – |
| `seasonGold` | #C6A15B | 0.3825 | výjimka SourceBadge (SPEC §7.8) | 7.7 na base; **vůči accent jen 1.1:1** |
| `scrimSoft` | rgba(20,17,14,0.48) | – | pod popoverem uzlu | n/a |
| `scrim` | rgba(20,17,14,0.76) | – | pod sheetem a modálem | n/a |
| `scrimDeep` | rgba(20,17,14,0.92) | – | pod oslavou a stage-up | n/a |
| `shadow` | #060504 | – | jediný stín: kotouč na mapě | n/a |
| `celebrate.ring` | = `accentGraphic` | – | prstenec za činkou v oslavě | 9.0 na base |
| `celebrate.spark` | = `text` | – | jiskry/konfety na tmavé scéně oslavy | 15.4 na base |

V dark režimu jsou `accent`, `accentGraphic` a `accentText` stejná hodnota; samostatné tokeny existují kvůli light režimu, kde se liší. Kód je vždy volá podle role.

Kotoučové tóny `plate5..plate25`: stejné kroky světlosti jako R43, hue 55°, chroma do 0.012. `faint` se na `raised` nepoužívá (2.8:1); kde je potřeba ghost grafika v kartě, kreslí se na `surface`.

### 2.2 Paleta: light (odvozená)

Teplý papír, nikdy #FFF.

| Token | Hex | Rel. luminance | Kontrast base / surface / raised |
|---|---|---|---|
| `base` | #F4EEE5 | 0.8604 | n/a |
| `surface` | #EAE2D6 | 0.7674 | n/a |
| `raised` | #FBF7F1 | 0.9338 | n/a |
| `raisedPressed` | #EAE2D6 | 0.7674 | text na něm 13.6 |
| `rule` | #D6CCBE | – | dekor |
| `text` | #1E1813 | 0.0098 | 15.2 / 13.6 / 16.4 |
| `muted` | #6B6157 | 0.1237 | 5.2 / 4.7 / 5.6 |
| `faint` | **#857B6E** (bylo #B3A897) | 0.2028 | 3.6 / 3.2 / 3.8 |
| `accent` | #F2A33A | 0.4538 | jen výplň CTA; vůči base 1.8 (hranici tlačítka nese tvar a text 8.4:1) |
| `accentPressed` | #E8952A | 0.3882 | onAccent na něm 7.3 |
| `onAccent` | #1E1813 | 0.0098 | 8.4 na accent |
| `accentGraphic` | **#B86F12** (nové) | 0.2160 | 3.4 / 3.0 / 3.6 |
| `accentText` | **#8A500C** (bylo #9A5A0E) | 0.1117 | 5.6 / 5.0 / 6.0 |
| `danger` | #B23A22 | 0.1261 | 5.1 / 4.6 / – |
| `success` | #3F6B34 | 0.1183 | 5.4 / 4.8 / – |
| `scrimSoft` / `scrim` / `scrimDeep` | rgba(30,24,19, 0.32 / 0.56 / 0.88) | – | n/a |
| `celebrate.ring` | = `accentGraphic` | – | 3.4 na base |
| `celebrate.spark` | = `text` | – | 15.2 na base |

Pravidlo light režimu: plný jantar #F2A33A smí být **jen výplň CTA** (a plocha stage-up). Vše ostatní akcentové (prstenec uzlu, tečka tabu, proužek ligy, výplň progress baru, kotouče streaku, „dnes“ v mřížce) je `accentGraphic`. `accentGraphic` na `surface` má 3.0:1 přesně na hraně; proto progress bar v kartě má stopu `raised` (3.6:1) a ne `surface`.

### 2.3 Páry pro `theme/__tests__` (boss doplní)

Test: `contrast(fg, bg) >= min` pro obě palety, není-li uvedeno jinak.

| fg | bg | min | Režim |
|---|---|---|---|
| `text` | `base`, `surface`, `raised`, `raisedPressed` | 4.5 | oba |
| `muted` | `base`, `surface`, `raised` | 4.5 | oba |
| `accentText` | `base`, `surface`, `raised` | 4.5 | oba |
| `onAccent` | `accent`, `accentPressed` | 4.5 | oba |
| `danger`, `success` | `base`, `surface` | 4.5 | oba |
| `faint` | `base`, `surface` | 3.0 | oba |
| `faint` | `raised` | 3.0 | jen light (dark záměrně selhává, test má hlídat, že se tam nepoužije) |
| `accentGraphic` | `base`, `surface`, `raised` | 3.0 | oba |
| `raised` | `accent` | 3.0 | oba (konfety na stage-up ploše) |
| `onAccent` | `accent` | 3.0 | oba (konfety na stage-up ploše) |
| `celebrate.ring`, `celebrate.spark` | `base` | 3.0 | oba |

Dark `faint` na `surface` vychází 3.09: stojí to za zaokrouhlovací rezervu v testu (počítat bez zaokrouhlení).

### 2.4 Typografická škála

Inter (300, 400, 600) a JetBrains Mono 500. Všechna čísla `fontVariant: ['tabular-nums']`. Sentence case všude kromě mono nadpisů sekcí.

| Token | Rodina / řez | Velikost / řádek | Tracking | `maxFontSizeMultiplier` | Použití |
|---|---|---|---|---|---|
| `hero` | Inter 300 | 64 / 68 | −0.03 em | 1.2 | jedno velké číslo obrazovky |
| `display` | Inter 300 | 40 / 44 | −0.02 em | 1.3 | hlavní číslo karty |
| `title` | Inter 600 | 24 / 30 | −0.01 em | 1.5 | nadpis obrazovky |
| `headline` | Inter 600 | 18 / 24 | 0 | 1.6 | titulek karty, název lekce |
| `body` | Inter 400 | 16 / 24 | 0 | 2.0 | text |
| `bodyStrong` | Inter 600 | 16 / 24 | 0 | 1.6 | text tlačítka |
| `caption` | Inter 400 | 13 / 18 | 0 | 1.8 | popisky, metadata |
| `section` | JetBrains Mono 500 | 11 / 14 | 0.18 em, verzálky | 1.3 | nadpis sekce |
| `tab` | Inter 600 | 11 / 14 | 0 | 1.3 | popisek tab baru |
| `stat` | Inter 600 | 20 / 24 | 0 | 1.4 | čísla statistik, XP v lize |

Multiplikátor je součást tokenu (`type.x.maxFontSizeMultiplier`), aby ho komponenty nemusely znát. `tab` a `section` mají strop 1.3, protože jsou v pevné geometrii (tab bar, jeden řádek nad kartou).

**Tab bar „Trénink“:** `tab` Inter 600 11 sentence case, „Trénink“ ≈ 40 pt, vejde se do pětiny 320 pt (64 pt) i při 1.3×. Kompaktní varianta a `breakpoint.compact` zanikají.

### 2.5 Spacing a radius

- `space`: xs 4, s 8, m 16, l 24, xl 40, xxl 64. Stupně 104 a 168 jen pro scénu oslavy.
- Okraj obrazovky 24, mezera mezi kartami 16, mezi sekcemi 40, padding karty 24 (kompaktní 16).
- `radius`: s 8 (tlačítko, chip, pole), l 14 (karta, popover, sheet), full 999 (kotouč, avatar, pilulka).
- `breakpoint.narrow` 360: pod ním a při `fontScale > 1.3` se hlavičky se dvěma sloupci skládají pod sebe.

### 2.6 Ikony

Lucide, outline, `strokeWidth` 1.5, velikost 20 (tab bar 24), barva `text` nebo `muted`. Akcent jen u `Check` v `ValueWheelSheet` (výběr = progres). Plamen (`Flame`) se nepoužívá nikde. Všechny `Pressable` a navigační prvky mají explicitní barvu z theme (žádný systémový modrý tint).

### 2.7 Komponenty

**Tlačítko** (min. výška 52, min. šířka 44, radius 8, text `bodyStrong`, `numberOfLines={2}`, při dvou řádcích výška roste, padding vertikálně 14):

| Varianta | Výplň | Stisk | Text | Kdy |
|---|---|---|---|---|
| primary | `accent` | `accentPressed` | `onAccent` | jedna hlavní akce na obrazovce |
| secondary | `raised` | `raisedPressed` | `text` | vedlejší akce |
| ghost | žádná | `raised` | `text` | terciární, min. hit 44 |

Disabled = opacita 0.4; loading = `DotLoader` v barvě textu místo labelu, šířka se nemění. Stisk je změna výplně, ne glow.

**Karta:** `surface`, radius 14, padding 24, bez obrysu, bez stínu. Vnořený prvek `raised`. Zamčená karta: obsah ve `faint` (grafika) a `muted` (text), `Lock` 16 `muted` vedle titulku.

**Uzel lekce (PlateNode)** – kotouč 72 (aktuální 88), pod ním label. Metadata uzlu se skládají z dat: `${exercises.length} cviků · ${estMinutes} min` (plurál přes `data/copy`), XP z dat; nic natvrdo.

| Stav | Kotouč | Label | Doplněk |
|---|---|---|---|
| locked | obrys `faint` 1.5, bez stínu | název `caption` `muted` + metadata `caption` `muted` | `Lock` 12 `muted` v náboji |
| unlocking (mezistav) | obrys `faint` → plná litina; `Lock` zmizí; prstenec `accentGraphic` 2 pt se objeví až v cílovém stavu | label přechází z `caption muted` na `headline text` | design definuje jen počáteční a koncový snímek a pořadí vrstev: 1) obrys, 2) výplň litiny, 3) prstenec, 4) label; časování a easing v motion spec |
| current | plná litina + stín `shadow`, prstenec 2 pt `accentGraphic`, mezera 4 pt od hrany kotouče | název `headline` `text` + metadata + „+N XP“ `caption` `muted` | primary „Začít lekci“ pod labelem; opička sedí na kotouči. **Žádný trvalý glow**: motion rozdýchá jen opacitu/scale prstence. |
| done | plná litina, fajfka Lucide `Check` 20 v `text`, stroke 2 (path pro trim kreslení v motion) | název `caption` `muted` | bez metadat |
| boss | činka (BarbellBoss), zamčená ve `faint` | „Boss sekce“ `headline` + „Odemkne se po {bossUnlockAfter} lekcích“ (SPEC: 8; číslo z dat) | při current platí pravidla current |

**Z-order opičky na aktuálním kotouči.** Opička je **sourozenec** kotouče v rodiči uzlu, ne jeho dítě (kotouč se může pulzovat/škálovat, opička nesmí). Pořadí vrstev zdola:
1. stín kotouče
2. kotouč (`Plate`) + prstenec
3. `MonkeyBack` — trup, ocas, zadní část šálu (za horní hranou kotouče)
4. `MonkeyFront` — stehna a nohy přes hranu kotouče, konec šálu visící přes čelo kotouče

Tedy dvě SVG vrstvy maskota se stejným viewBoxem a kotvou (střed horní hrany kotouče), kotouč mezi nimi není: kotouč je vždy pod oběma, „přes hranu“ vzniká tím, že `MonkeyFront` kreslí nohy pod linii hrany. `pointerEvents="none"` na obou; tap jde na kotouč.

**Progress bar:** stopa 6 pt `raised`, výplň `accentGraphic`, radius full; číslo `caption` tabulárně vpravo nad. Nula = jen stopa + číslo.

**Tab bar:** výška 64 + safe area, `base`, vlasová linka `rule` nahoře. Ikona 24 + label `tab`. Aktivní: ikona a label `text` + tečka 4 pt `accentGraphic` 4 pt nad ikonou. Neaktivní: `muted`, tečka nevykreslena (ne průhledná, aby screen reader ani hit test nic nenesly). Stav tečky je čistě odvozený z `focused`; přechod řeší motion.

**StreakBarbell (nové, nahrazuje plamen).** Symbol série = malá činka, na kterou každý den série přibude kotouč. Čte se zleva doprava od středu ven, střídavě vlevo/vpravo, jako se činka nakládá doopravdy.

| Varianta | Rozměr | Sloty | Kde |
|---|---|---|---|
| `sm` | 28 × 16, osa 1.5 pt | 3 na každou stranu = 6 | streak pilulka v TopBaru, oslava |
| `lg` | 160 × 56, osa 3 pt | 7 na každou stranu = 14 | karta streaku na Profilu |

Kreslení: osa a objímky v `muted`; naložený kotouč = plný obdélník s radiusem 1 (sm) / 2 (lg) v `accentGraphic`, kotouče se směrem ven mírně zmenšují (výška 100 % / 88 % / 76 % …), aby silueta byla čitelná i 16 pt vysoká; prázdný slot = jen osa (v `lg` navíc obrys slotu `faint` 1 pt, aby bylo vidět, kolik zbývá do plné činky).

| Stav | Vizuál | Text vedle |
|---|---|---|
| prázdný (streak 0, nikdy nezačal) | holá osa v `muted`, žádné kotouče | „0“ `stat` `muted` |
| běžný (1 až počet slotů) | N kotoučů `accentGraphic` | číslo `stat` `accentText` |
| dnes čeká (série živá, dnes nic) | kotouče `accentGraphic`, poslední (dnešní) slot ve `faint` obrysu i v `sm` | číslo `accentText` + v kartě `caption muted` „Dnes čeká“ |
| přetečení (série > sloty) | činka plná; za vnější objímkou malé `×K` ve `caption` `accentText`, kde K = počet plných činek (`floor(streak / sloty)`); kotouče ukazují zbytek `streak mod sloty`, při zbytku 0 plná činka | číslo dnů zůstává hlavní údaj, `×K` je jen podpis |
| přerušený (streak 0, `longestStreak ≥ 2`) | holá osa `muted`, pod ní v `lg` „spadlé“ kotouče: počet = min(longestStreak, sloty), ležící na zemi ve `faint`, ne akcent | „0“ `muted` + v `lg` `caption muted` „Nejdelší série: {longestStreak} dní“ |

Proč činka: série je doslova „nakládání“, nová lekce přidává váhu, přerušení váhu shodí; nikdo nepočítá, jestli plamen „hoří víc“. Pilulka: radius full, `surface`, `StreakBarbell sm` + číslo `stat`, výška 36, hit 44 (přesah přes `hitSlop`). `accessibilityLabel` „Série 12 dní, dnes hotovo“ / „Série 12 dní, dnes čeká“ / „Žádná série“.

**TodayStatus (nové, nahrazuje DailyGoalBar):** jeden řádek pod TopBarem, výška 44: vlevo tečka 8 pt + `caption`.
- „Dnes čeká“: tečka obrys `accentGraphic` 1.5, text `muted`.
- „Dnes hotovo“: tečka plná `accentGraphic`, text `text`.
Žádný progress bar (jedna lekce je binární).

**ValueWheelSheet (nové):** bottom sheet pro výběr hodnoty (čas připomínky v onboardingu a nastavení, hodnota milníku, váha). `surface`, radius 14 nahoře, pod ním `scrim`. Nahoře úchyt 32 × 4 `faint`, titulek `headline`. Kolo: viditelných 5 řádků, řádek 44 pt, aktivní řádek `headline` `text` s `Check` 20 v `accentGraphic` vpravo, ostatní `body` `muted`; aktivní řádek ohraničen dvěma linkami `rule` (žádné zvýraznění plochou). Dole primary „Uložit“. Mimo kolo: číselné hodnoty tabulárně. Snap a haptika v motion spec.

**LockedPreview (nové):** karta `surface`, `Lock` 16 + `headline`, `body muted` vysvětlení, 3 ghost řádky (`faint` pruhy na `surface`), volitelné primary. **Bez maskota.**

**Ostatní nové:** `SectionLabel` (mono `section`), `StatGrid`, `DayLegend`, `EmptyHint`, `BadgeTile`.

---

## 3. Obrazovky

Pořadí: Trénink → Liga → Progres → Sezóna → Profil. Hlavička: `title` vlevo; ikona nastavení jen na Profilu.

### 3.1 Trénink (mapa)

```
┌──────────────────────────────────────┐
│ [činka 3]   [128 XP]        (Dřevo)  │ TopBar
│ ○ Dnes čeká                          │ TodayStatus
│                                      │
│ SEKCE 01 · ZÁKLADY ROVNOVÁHY         │ SectionLabel
│              ( ✓ )                   │ done
│           Dřep u zdi                 │
│     (( opička na kotouči ))          │ current, prstenec 2 pt
│        Kliky na lavičce              │ headline
│  {n} cviků · {estMinutes} min · +{xp} XP │ caption muted, z dat
│      [ Začít lekci ]                 │ primary
│                    ( zámek )         │ locked
│                 Výpady               │
│            ═══[ boss ]═══            │
│   Boss sekce · po {bossUnlockAfter} lekcích │
└──────────────────────────────────────┘
```

- Opička (S) sedí na aktuálním kotouči (z-order kap. 2.7).
- Tap na zamčený uzel: popover nad `scrimSoft` „Nejdřív dokonči předchozí lekci.“; tap na hotový: secondary „Zopakovat lekci“.
- **Nový uživatel:** pilulka s prázdnou činkou a „0“; místo TodayStatus karta nad mapou: `headline` „První lekce: {estMinutes} minut“, `body muted` „Za dokončení dostaneš kotouč na činku a +{xp} XP.“ (hodnoty z dat a `logic/`), vpravo náhled kotouče 48. Bez CTA (CTA je u uzlu).
- **Smutný stav** (odvozený z aktivity, ne z flagu): `streak == 0 && longestStreak >= 2 && dnes žádná lekce`. Opička v náladě `sad` vedle kotouče, nad mapou karta: `headline` „Série se přerušila“, `body muted` „Nejdelší série {longestStreak} dní zůstává v profilu. Jedna lekce rozjede novou.“ Při `longestStreak < 2` se karta neukazuje a opička je neutrální (jednodenní „série“ nestojí za smutek). Po dokončení lekce stav sám zmizí.
- Načítání: kostra 3 uzlů v `surface`. Chyba: ErrorState „Mapu se nepodařilo načíst.“ + secondary „Zkusit znovu“.

### 3.2 Liga

**Zamčená jen tehdy, když uživatel nemá žádnou dokončenou lekci za celou historii** (`totalLessons == 0`). Kdo už cvičil, vidí žebříček, i když tento týden má 0 XP.

Zamčený stav = `LockedPreview` bez maskota: `Lock` + „Liga se odemkne po první lekci“, `body muted` „Lekce ti dá XP a místo mezi {leagueSize} lidmi na tvé úrovni.“ (velikost z dat), 3 ghost řádky, primary „Začít první lekci“ → mapa. Nad kartou TierBadge ve `faint` a „Týden končí za …“.

Aktivní stav:
- Hlavička: TierBadge 56 + `title` + `caption muted` odpočet. Pod 360 pt nebo při `fontScale > 1.3` odpočet pod název (ne vedle).
- Řádek 56 pt (roste s písmem, min. 56): pořadí `stat` pevná šířka 32, mini opička 32, jméno `body` `numberOfLines={1}` s ellipsis, XP `stat` vpravo v **pevném sloupci** změřeném pro „9 999“ ve `stat` (≈ 64 pt při 1.0×, šířka se násobí aktuálním fontScale do stropu 1.4), zarovnání vpravo, tabulární.
- Zóny: linka `rule` + `section` „POSTUP“ / „SESTUP“, `ChevronUp/Down` 12 `muted`.
- Vlastní řádek: `raised` + proužek 3 pt `accentGraphic` vlevo, **bez stínu** a bez zvětšení.
- Mimo postupovou zónu: secondary „Jedna lekce tě posune nahoru“ → mapa. Pod tím `caption muted` „XP za lekce a pravidelnost, ne za výkon.“

### 3.3 Progres

- Dream věta `body` Inter 300 20, `muted` uvozovky.
- **AKTIVITA:** mřížka s popisky dnů, plná tečka `text` = aktivní, prstenec `accentGraphic` = dnes, `faint` = bez aktivity, budoucí dny nevykreslené. Prázdný stav: 1 týden + `caption muted` „Tady uvidíš každý den, kdy jsi trénoval. První tečka přibude po lekci.“
- **MILNÍKY:** název `body` vlevo, číslo `caption` tabulárně vpravo, progress bar; binární 0 / 1. Tap otevře `ValueWheelSheet`.
- **VÁHA** (jen lose/gain): graf + secondary „Zapsat váhu“ → `ValueWheelSheet`.

### 3.4 Sezóna

- Hlavička: mono „WINTER ARC“, `caption muted` termín, vpravo `hero` počet dní + `caption` „dní do konce“. **Pod 360 pt nebo při `fontScale > 1.3` se hlavička skládá pod sebe**: název a termín nahoře, číslo pod nimi zarovnané vlevo.
- Bez cíle: karta + primary „Nastavit cíl“.
- S cílem: `display` „{done} / {total} dní“ + progress bar; karta milníku s primary „Zapsat hodnotu“ přes celou šířku → `ValueWheelSheet`; DotGrid sezóny; legenda 2 × 2 (plná tečka `text` Odcvičeno, tečka s vnitřním prstencem `base` Dohnáno, obrys `faint` Zmeškáno, prstenec `accentGraphic` Dnes). Rozlišení tvarem, ne barvou.
- Budoucí dny `faint` 40 % (grafika; nekontrastní záměrně, nenese informaci k přečtení).
- SourceBadge: zlatá `seasonGold` ponechána podle SPEC §7.8 (viz riziko v kap. 6).

### 3.5 Profil

```
┌──────────────────────────────────────┐
│ Profil                        [⚙]    │ Settings 20 text, hit 44, otázka 6.1
│ [opička M 96]  David                 │
│                Cesta: …              │
│ ┌──────────────────────────────────┐ │
│ │ SÉRIE                            │ │ karta streaku
│ │ [ StreakBarbell lg ]   12 dní    │ │ display accentText
│ │ Nejdelší série: 21 dní · Dnes hotovo │
│ └──────────────────────────────────┘ │
│ ┌──────────┬──────────┐              │
│ │ 1 240 XP │ Stage 2  │              │ StatGrid 2 × 1
│ └──────────┴──────────┘              │
│ ODZNAKY                {earned} / {total} │
│ [◯][◯][◯][siluety…]                  │
│ Šatník                          >    │
└──────────────────────────────────────┘
```

- Karta série je nový nositel streaku na profilu (místo buňky ve statistikách): `StreakBarbell lg` vlevo, číslo `display` v `accentText` vpravo, pod tím `caption muted`. Stavy podle tabulky StreakBarbell. Pod 360 pt číslo pod činkou.
- **Odznaky:** jen vizuál, katalog a pravidla v `data/badges.ts` (boss). Počet „{earned} / {total}“ z katalogu, nikdy konstanta. `BadgeTile` 64:
  - získaný: odznak v plné litině (`plate*` tóny), symbol v `text`, pod ním `caption` název;
  - zamčený: silueta odznaku ve `faint` (na `surface`), `Lock` 12 `muted`, pod ní `caption muted` podmínka z katalogu („7 dní v řadě“);
  - tap: popover s názvem, podmínkou a datem získání (pokud je).
  Mřížka 4 sloupce, zalamuje se; zobrazit vše, katalog má ~12 položek.
- Nový uživatel: XP 0, Stage 1, prázdná činka, „0 / {total}“; nuly se neschovávají.

### 3.6 Oslava lekce (statická kompozice; pohyb v motion spec)

Pod scénou `scrimDeep`. Shora:
1. činka s nově nacvaknutým kotoučem, za ní `celebrate.ring`; opička `celebrate` (s jantarovou hranou šálu, platí pro **každou** oslavu, ne jen stage-up);
2. `hero` „+{xpBreakdown.total} XP“ v `accentText`;
3. rozpis z `LessonResult.xpBreakdown`: každá položka `caption muted` („Lekce +20“, „První dnes +10“ …), oddělené „ · “, zalamují se; žádné položky natvrdo, popisky přes `data/copy` podle klíče položky;
4. pilulka streaku s novým číslem (kotouč přibude v `StreakBarbell sm`);
5. řádek „Zítra: {název další lekce} · {estMinutes} min“ `caption muted` (když další lekce neexistuje: „Sekce hotová. Další se odemkne v mapě.“);
6. primary „Pokračovat“.
Jiskry `celebrate.spark`. Žádná karta připomínky.

**Stage-up** (SPEC §7.4): celoobrazovková plocha `accent`, text `onAccent` (9.0:1 dark / 8.4:1 light), konfety jen v `onAccent` a `raised` (obě ≥ 3:1 na accent), opička `celebrate`.

### 3.7 Onboarding: poslední krok „Připomínka“

Po volbě cesty a před zrozením opice: `title` „Kdy ti máme připomenout lekci?“, `body muted` „Jedna zpráva denně, jen když ještě nemáš hotovo.“, řádek s časem (výchozí 18:00) → `ValueWheelSheet`, primary „Pokračovat“, ghost „Bez připomínky“. V Nastavení přepínač + čas (SPEC §7.9).
Text notifikace (tichý tón, **bez emoji**): „Opice čeká na dnešní lekci. Série {streak} dní.“; při streaku 0: „Opice čeká na dnešní lekci. Stačí {estMinutes} minut.“

---

## 4. Opička: MVP nálady

Velikost S na mapě, M na profilu a v oslavě. Šál šedomodrý; jantar jen jako horní hrana šálu v náladě `celebrate`.

| Nálada | Kdy | Pozice | Výraz | Šál |
|---|---|---|---|---|
| neutrální (`idle`) | výchozí | sedí na aktuálním kotouči, nohy přes hranu (`MonkeyFront`) | oči dopředu, ústa rovná, ruce na kolenou | volně, konec visí přes kotouč |
| slaví (`celebrate`) | každá oslava lekce, milník, stage-up | stojí na ose činky | ruce nahoře, oči obloučky | vlaje, horní hrana `accentGraphic` |
| smutná (`sad`) | odvozený smutný stav (3.1) | sedí vedle kotouče, opřená | uši svěšené, pohled dolů | omotaný k bradě |

**Později (ne v MVP):** `curious`, `focused`, `sleeping`. Kód je nesmí vyžadovat; chybějící nálada padá na `idle`.

---

## 5. Mapování na kód

**`theme/` (design-agent):**
- `palettes.ts`: hodnoty 2.1 a 2.2; nové `faint`, `accentGraphic`, `accentPressed`, `raisedPressed`, `scrim`, `scrimSoft`, `scrimDeep`, `celebrate: { ring, spark }`; přepočítat `plate*`.
- `tokens.ts`: `radius { s: 8, l: 14, full: 999 }`; `space` 4–64; `type` podle 2.4 včetně `maxFontSizeMultiplier`; `size`: `nodeCurrent 88`, `node 72`, `nodeRingGap 4`, `nodeRing 2`, `button 52`, `meter 6`, `tabDot 4`, `todayDot 8`, `profileMascot 96`, `streakSm {w:28,h:16}`, `streakLg {w:160,h:56}`, `streakSlotsSm 6`, `streakSlotsLg 14`, `wheelRow 44`, `badgeTile 64`, `leagueXpCol 64`, `leagueRankCol 32`; `breakpoint.narrow 360`; odstranit `tabLabelCompact`, `breakpoint.compact`.
- `seasons.ts`: přepočítat proti novým neutrálům; žádná sezóna nepřepisuje akcent.
- `buildTheme.ts`: alias starých názvů typů po dobu migrace.

**Upravit:** `app/(tabs)/_layout.tsx` (label `type.tab`, tečka přes `tabBarIcon`), `components/map/PlateNode.tsx` (prstenec `accentGraphic`, label z dat, stav unlocking, fajfka path), `components/map/LessonMap.tsx` (opička jako sourozenec ve dvou vrstvách, primary u aktuálního uzlu), `TopBar` (StreakBarbell místo Flame, TodayStatus), `app/(tabs)/profile.tsx`, `league.tsx`, `progress.tsx`, `season.tsx`, oslava, onboarding (krok Připomínka).

**Nové v `components/ui/`:** `StreakBarbell`, `TodayStatus`, `ValueWheelSheet`, `LockedPreview`, `SectionLabel`, `StatGrid`, `DayLegend`, `EmptyHint`, `BadgeTile`. SVG maskota: `MonkeyBack`, `MonkeyFront`.

**Zrušit:** `DailyGoalBar` (nebyl implementován), veškeré použití `Flame`, glow/shimmer/parallax efekty. `RegMark`, `Telemetry`, `MeasureLine` z hlavních obrazovek (o smazání rozhodne boss).

**Boss (`data/`, `logic/`, `services/`):** `estMinutes` v `data/lessons`; `data/badges.ts`; `bossUnlockAfter` (8) a velikost ligy jako data; `totalLessons`, `longestStreak`, „dnes hotovo“ jako selektory; `LessonResult.xpBreakdown`; čas připomínky v onboardingu; páry kontrastů do `theme/__tests__` (2.3).

---

## 6. Otevřené otázky a odchylky od docs/SPEC.md

1. **Modré ozubené kolo:** v kódu nenalezeno (TabHeader ikonu nemá, Settings je jen LinkRow v `profile.tsx`). Čeká se na screenshot od uživatele. Návrh (jen Profil, outline, `text`) platí tak jako tak.
2. **SPEC §6 a ruling R43** („akcent jen v oslavě“): po schválení boss přepíše na čtyři role akcentu.
3. **`seasonGold` #C6A15B zůstává** (SPEC §7.8), ale riziko trvá: vůči jantaru má jen 1.1:1, oko je čte jako dva odstíny jednoho akcentu. Pokud po renderu bude splývat, návrh je SourceBadge v obrysu `text` s mono názvem sezóny. K rozhodnutí po screenshotu.
4. **Emoji v notifikaci odstraněno** — odchylka od SPEC §7.9, potřebuje potvrzení uživatele.
5. **Liga zamčená při 0 lekcích** — odchylka od SPEC §7.5 (seznam 16 řádků vždy).
6. **Mapa §7.2:** opička na kotouči místo vedle uzlu; přímé primary „Začít lekci“ u aktuálního uzlu místo jen v popoveru.
7. **Připomínka v onboardingu** — SPEC ji má jen v Nastavení; nový krok onboardingu je odchylka.
8. **Streak symbol činka místo plamene** — rozhodnutí uživatele, SPEC zmiňuje plamen; boss aktualizuje SPEC.
9. **Profil §7.8:** opice M (96) místo L.
10. **Light `accentGraphic` na `surface` = 3.0:1** přesně na hraně; pokud test s nezaokrouhlenou hodnotou selže, ztmavit na #B26A10.
11. Doladit `plate*` tóny, `seasonGold` a sezónní přepisy reálným renderem (dark i light).
