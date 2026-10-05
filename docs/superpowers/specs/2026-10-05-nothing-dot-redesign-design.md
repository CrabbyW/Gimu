# Redesign „Nothing Dot“ — design spec

Datum: 2026-10-05 · Zdroj: `docs/prompts/2026-10-05-redesign-nothing-dot.md`, reference `images/1–5.png`.
Nahrazuje směr „Teplá litina / Chalk & Iron“ (SPEC §6.1–6.9). Logika, služby, data a navigace beze změny.

## 1. Cíl
Wow první dojem na úrovni Nothing OS / Apple widgetů. Monochromní tečkový jazyk, dlaždice jako widgety,
barevná opička jako jediný barevný subjekt, živé a dotykově reaktivní UI. Animace a design mají prioritu.

## 2. Vizuální jazyk

### 2.1 Barvy (`theme/palettes.ts`) — žádný akcent
| Token | Dark | Light | Role |
|---|---|---|---|
| base | #0B0B0C | #F2F2EF | pozadí |
| tile | #151517 | #FBFBF9 | dlaždice |
| tilePressed | #1C1C1F | #EDEDEA | stisk |
| edge | rgba(255,255,255,0.08) | rgba(0,0,0,0.06) | vlasová hrana dlaždice (jediné oddělení) |
| text | #EDEDEF | #131316 | text, „aktivní“ (dot on, CTA výplň) |
| muted | #8A8A90 | #6B6B70 | sekundární text |
| dotOff | #2A2A2E | #D6D6D2 | zhasnutá tečka |
| dotDim | #4A4A50 | #B4B4AF | tlumená (zamčené, ghost) |
| glow | rgba(237,237,239,0.55) | rgba(19,19,22,0.0) | záře aktivní tečky (v light bez záře, místo ní plná čerň) |
| onText | #0B0B0C | #F2F2EF | text na plné CTA |
| danger | #E5484D | #C9353A | jen chybové stavy (není akcent) |

Barvu jinak nese jen opička (`components/mascot/palette.ts`, beze změny). Sezónní override (`theme/seasons.ts`)
se přesouvá jen na kosmetiku opičky a sezónní odznak; UI zůstává monochromní.

### 2.2 Typografie
- **Doto** (OFL, `@expo-google-fonts/doto`) — dot-matrix display: hero čísla, kg na kotouči, velká statistika, titulek obrazovky. Váha 700 (tečky čitelné), nikdy pod 28 pt.
- **Inter** 400/600 — tělo, názvy dlaždic (obr. 2), popisky.
- **JetBrains Mono** 500 — utility štítky VERZÁLKY, 11 pt, tracking 0.18em; akce v závorkách `[ZAČÍT]`.
- Bebas Neue odstranit.

### 2.3 Tvary a dlaždice
- Dlaždice: radius 28, padding 20, pozadí `tile` + 1 px `edge` (žádný stín). Velké číslo + malá jednotka vlevo nahoře, název + podtitulek vlevo dole (obr. 2).
- Primární CTA: pilulka plné šířky, výška 56, výplň `text`, popisek mono `[ZAČÍT LEKCI]` v `onText` (obr. 1). Sekundární: pilulka `tile`.
- Tab bar: plovoucí pilulka (radius 32, výška 64, 16 od okrajů), aktivní tab = posuvná podložka `tilePressed` + ikona `text`.
- Hlavička: Doto titulek vlevo, kulatá ikonová tlačítka 44 vpravo (obr. 2). Stavový řádek: mono štítek vlevo, živý údaj vpravo s blikající tečkou (série / čas do konce týdne).
- Ikony Lucide outline 1.5 px.

### 2.4 Tečkové prvky (Skia, `components/dots/`)
| Komponenta | Popis |
|---|---|
| `DotField` | pole teček v pozadí obrazovky (rozteč 14), reaguje na dotek vlnou (2.6) |
| `DotPlate` | kotouč: soustředné prstence teček; počet prstenců = kg (2.5→2, 5→3, 10→4, 15→5, 20→6, 25→7), číslo kg v Doto uprostřed; pomalá rotace |
| `DotRing` | progresový prstenec (obr. 3): vnější rozptýlené tečky + vnitřní prstenec rozsvícený do % |
| `DotRow` | řádek progresu (obr. 5), N teček, k rozsvícených |
| `DotMatrix` | mřížka aktivity (obr. 2), zářící aktivní tečky, dnešek s prstencem |
| `DotNumber` | animované číslo (tečky se překlápí při změně) — jen kde je číslo hero |

Stavy kotouče: zamčený = `dotDim` jen vnější prstenec; aktuální = všechny prstence `text` + glow, obíhající „kometa“ jasu; dokončený = plný `text`, bez komety, fajfka v otvoru.

## 3. Pohyb (`lib/motion.ts`)
- **Ambient:** kotouč rotuje 360° / 40 s (aktuální 24 s); živá tečka stavového řádku bliká 1.2 s; aktivní uzel dýchá (stávající `motion.breath`).
- **Nástup obrazovky:** jedna sekvence — hlavička (0) → hero (80) → dlaždice ve vlně po 60 ms; 480 ms, ease-out `(0.22,1,0.36,1)`, posun 12. Tečky se při nástupu rozsvěcují skenem zleva (DotRow, DotMatrix) nebo spirálou (DotRing, DotPlate), 600 ms.
- **Mikrointerakce:** dlaždice stisk = scale 0.97 + 3D naklopení k bodu dotyku (max 6°) + rozjasnění `edge`; puštění 200 ms ease. Tab podložka klouže 260 ms. Haptika: selection na tab, light na CTA, success na dokončení.
- **Žádný spring/bounce na klikatelném.** Spring jen u setrvačnosti kotouče a u opičky.
- **Reduce Motion:** ambient rotace stop, nástupy = 200 ms fade, vlna vypnutá, oslava = statický výsledek + fade.

## 4. Interaktivita
1. **Dotyková vlna:** `DotField`, `DotMatrix`, `DotPlate` — tečky v okruhu 64 od prstu se rozjasní a odsunou (max 4 px), vlna se šíří a doznívá 500 ms. Přes Gesture Handler (Pan + Tap, simultánně se scrollem), shared values na UI vlákně.
2. **Roztočení kotouče:** pan po obvodu aktuálního / dokončeného kotouče → úhlová rychlost, setrvačnost (`withDecay`), pak plynulý návrat na ambientní rychlost. Haptika tick každých 30°. Tap dál otevírá popover.
3. **3D naklopení dlaždic** (viz 3).
4. **Opička — 15 reakcí** (`components/mascot/reactions.ts`, mapovaná na existující nálady + transformace, bez nových kreseb):
   1 ťuknutí → poskok, 2 trojité ťuknutí → salto, 3 dlouhý stisk → mazlení (oči zavřené, happy), 4 sledování prstu očima (pupily), 5 scroll dolů → podívá se dolů, 6 scroll rychle → zatočí se jí hlava (wobble), 7 nečinnost 20 s → zívne/usne, 8 návrat do appky → zamává, 9 start lekce → kývne, 10 dokončení lekce → celebrate, 11 série +1 → hrdě vypne hruď, 12 ztráta série → sad, 13 povýšení v lize → skok radosti, 14 sestup v lize → pokrčí rameny, 15 roztočený kotouč → točí hlavou za ním.
   Logika výběru reakce jako čistá funkce `logic/mascotReactions.ts` (testovaná); animace v komponentě.

## 5. Vlajková loď: dokončení lekce
1. 0 ms: obrazovka ztmavne do `base`, `DotField` se rozsvítí ve vlně od středu.
2. 200 ms: tečky se slétají do prstenců `DotPlate` (spirála, 700 ms).
3. 900 ms: kotouč „nacvakne“ (scale 1.08 → 1, haptika success), číslo kg v Doto naskočí.
4. 1000 ms: opička celebrate (reakce 10), série `DotRow` +1 se rozsvítí, XP `DotNumber` napočítá.
5. 1600 ms: CTA `[POKRAČOVAT]` nastoupí zdola.
Reduce Motion: finální stav s fade 200 ms.

## 6. Obrazovky
- **Trénink (mapa):** stavový řádek (SEKCE 01 · ● série), Doto titulek sekce, hero dlaždice „3/8 lekcí“ s `DotRow`; cesta mezi uzly jako tečkovaná linka (rozsvícená do aktuálního), uzly = `DotPlate`; opička sedí na aktuálním kotouči; CTA pilulka dole.
- **Lekce:** `DotRing` progresu cviků nahoře, karta cviku = dlaždice, silueta zůstává, čísla opakování Doto, HoldTimer = `DotRing` odpočet.
- **Liga:** pódium = tři sloupce z teček (výška = pořadí), řádky jako dlaždice, vlastní řádek zvýrazněn `text` hranou.
- **Progres:** dlaždicová mřížka 2×N (obr. 2): váha, série, aktivita `DotMatrix` 5 týdnů, milníky `DotRow`, vize těla.
- **Sezóna:** odpočet Doto hero, `DotRing` postupu, odměny jako dlaždice.
- **Profil/Šatník:** opička velká na `DotField`, statistiky dlaždice.
- **Nastavení/Cíle/Onboarding:** seznamy v dlaždicích, mono sekční štítky, pilulková CTA; přepínač vzhledu Dark / Light / Systém.

## 7. Technika
- `@shopify/react-native-skia` přes `npx expo install`; na webu načíst CanvasKit (`LoadSkiaWeb`) v `app/_layout.tsx` před renderem.
- `@expo-google-fonts/doto`; Skia text načte font přes `useFont`.
- Jedno Skia `Canvas` na komponentu, tečky jako `Points`/`Circle` v `Group` s transformací; animace přes Reanimated shared values (Skia ≥ 2 je přijímá přímo).
- Výkon: cíl 60 fps na středním Androidu; `DotField` max ~600 teček, mimo viewport se nekreslí.
- Testy: Skia v jestu mockovat (`@shopify/react-native-skia/lib/module/mock`); testy čisté geometrie (`components/dots/geometry.ts`: rozložení prstenců, počty) a `logic/mascotReactions.ts`.

## 8. Fáze
1. **Systém + vlajková loď:** tokeny, oba režimy, fonty, Skia, `components/dots/*`, Tile, PillButton, tab bar, hlavička, mapa, lekce, dokončení lekce, interaktivita 1–3.
2. **Zbytek obrazovek:** liga, progres, sezóna, profil/šatník, nastavení/cíle, onboarding, stage-up.
3. **Opička:** 15 reakcí.
Každá fáze: design-agent → motion-agent → qa-agent → rating-agent (CLAUDE.md).

## 9. Chyby a okraje
- Skia selže na webu (CanvasKit nenačten) → loader `DotLoader`, pak fallback na prázdné pozadí, UI funkční.
- fontScale > 1.3: Doto hero se zmenší o krok, dlaždice se skládají do jednoho sloupce.
- 320 pt šířka: tab bar ikony bez popisků, dlaždice jednosloupcově.
- Light režim: záře vypnutá, aktivní = plná čerň; kontrast textu ≥ 4.5:1 v obou režimech.

## 10. SPEC
Po fázi 1 přepsat `docs/SPEC.md` §6 podle tohoto dokumentu (zdroj pravdy zůstává SPEC).
