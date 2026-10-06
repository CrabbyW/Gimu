# QA: Nothing Dot fáze 1, po ratingu kola 1

Datum: 2026-10-06 · qa-agent · větev `faze1/core-loop` · rozsah: plán `docs/superpowers/plans/2026-10-05-nothing-dot-faze1.md` úkoly 1–10 a Review Focus, porovnané bod po bodu se spec `docs/superpowers/specs/2026-10-05-nothing-dot-redesign-design.md`; opravy `87f436a` a `85b4493`.

**Verdikt: NESCHVÁLENO** (2 vizuální vady v hlavním flow a rozbitá dev sekce Tečky; logiku jsem opravil, viz níže)

## Build a testy (spuštěno znovu)
- `npx tsc --noEmit` ✅ 0 chyb
- `npx jest` ✅ 59 sad / 535 testů
- `npx eslint .` ✅ bez chyb
- Web (Playwright, Chrome, 390×844, dark i light): žádný pageerror. V konzoli jen hláška Skia „Shader compilation error“ (`fwidth`) z CanvasKit, appka běží dál.

## Úkoly plánu vs. spec

| Úkol | Spec | Stav | Důkaz |
|---|---|---|---|
| 1. Skia, Doto, CanvasKit na webu, jest mock | §7 | ✅ | `Doto_700Bold` v `app/_layout.tsx`; CanvasKit přes `index.web.js` + `lib/skiaReady.ts` (plán chtěl `lib/skiaWeb.ts`, odchylka zapsaná bossem v LOG); vlastní mock Skia v `jest.setup.ts` |
| 2. Monochromní palety | §2.1 | ✅ | `theme/palettes.ts` má `tile/tilePressed/edge/dotOff/dotDim/glow/onText`; `theme/__tests__/contrast.test.ts` zelený; v kódu není čistý #000/#FFF |
| 3. Tokeny typografie, tvarů, pohybu | §2.2, §2.3, §3 | ⚠️ | `motion.plateSpin/liveBlinkMs/tilePress/screenIn` jsou v `lib/motion.ts`; `dotStat` je, ale `dotHero` (64) a `dotDisplay` (40) jako varianty neexistují (Doto ve velkých titulcích se řeší jinak). Odchylka nesráží funkci, chybí jen pojmenování podle plánu |
| 4. Tečková geometrie (TDD) | §2.4 | ✅ | `components/dots/__tests__/geometry.test.ts`: 2.5→2 … 25→7, neznámé kg |
| 5. Skia komponenty + vlna + dev „Tečky“ | §2.4, §4.1 | ❌ | Komponenty a testy ✅ (`render.test.tsx`). Dev sekce Tečky v `/dev`: řada „ZAMČENÝ“ se na webu vykreslí jako bílé obdélníky s ikonou rozbitého obrázku (dark i light, i po 5 s) — viz nález N2 |
| 6. Tile, PillButton, StatusLine, ScreenHeader | §2.3 | ✅ | `PillButton.test.tsx` (`[ZAČÍT LEKCI]`, čtečka bez závorek, disabled); Grain z `Screen` pryč |
| 7. Plovoucí tab bar | §2.3 | ✅ | `FloatingTabBar.test.tsx` (navigate + `selected`); snímky: pilulka, podložka aktivního tabu |
| 8. Mapa: kotouče, roztočení, cesta, hero | §2.4, §4, §6 | ✅ po opravě | `usePlateSpin.test.ts` (`angleDelta`, `ticksCrossed`); `activeOffsetX`/`failOffsetY` v `usePlateSpin.ts`. Popover uzlu se ale schovával pod pruh s CTA — opraveno (N1) |
| 9. Lekce: DotRing, dlaždice, HoldTimer | §6 | ❌ | `HoldTimer.test.tsx` zelený, ale na snímku je popisek „PŘIPRAV SE“ přes Doto číslici a tečky prstence a prstenec není vodorovně na středu (střed ~x 153 z 390) — N3 |
| 10. Oslava dokončení lekce | §5 | ✅ | `celebration.test.ts`: osa field→gather→snap→mascot→cta 0/200/900/1000/1600, reduced = vše 0 a 200 ms. Snímek 1800 ms dark i light: rozpis „lekce 10 · první dnes +10 · / streak +14“ se láme jen mezi položkami, „streak +14“ drží pohromadě (NBSP oprava funguje). Copy „Zítra · Boss: Plná osa“ ✅ |

## Review Focus

| Bod | Stav | Důkaz |
|---|---|---|
| Web bez CanvasKit → fallback `View` | ✅ | `render.test.tsx` (SkiaGuard fallback); `DotPlate` má `FallbackRim` |
| Roztočení kotouče vs. scroll mapy | ✅ (kód) | `activeOffsetX([-8,8])` + `failOffsetY([-12,12])`; na zařízení k ruční kontrole |
| Reduce Motion | ✅ | `celebrationTimeline(true)` test; ambient přes `useMotionSafe` |
| Light bez záře | ✅ | `components/dots/ink.ts:8` `glow: scheme === 'dark' ? c.glow : null`; `DotPlate`/`DotMatrix` kreslí `BlurMask` jen když `glow`; test „záře jen v dark: light nekreslí BlurMask“ v `render.test.tsx`; light paleta má navíc `glow` s alfou 0 |
| kg mimo tabulku | ✅ | `geometry.test.ts`: `ringCountForKg(12)=4`, `(1)=2`, `(40)=7`, `(NaN)=2` |

## Nálezy

- **N1 (logika, OPRAVENO v `components/map/LessonMap.tsx`)**: popover uzlu na mapě byl vidět jen nadpisem, zbytek (údaje, `[ZOPAKOVAT LEKCI]`) pod pruhem s CTA. Repro: demo profil → mapa → klepnout na „Lekce 5 Nad hlavou“. Příčina: `popoverSide` dostával spodek výřezu bez odečtení `footerSpace`, a když se popover nevešel na žádnou stranu (viditelný výřez mapy je jen ~276 px), nic mapu neposunulo. Oprava: `viewportBottom` = výřez − `footerSpace` a při nedostatku místa `scrollTo` o chybějící kus (bez animace při Reduce Motion). Ověřeno snímkem dark i light na čerstvém Metru (port 8099).
- **N2 (design-agent / boss)**: `/dev` sekce Tečky, řada „ZAMČENÝ“ = rozbité bílé plochy. Pravděpodobně limit WebGL kontextů v Chrome (~16; sekce má 18 kotoučů + prstenec, řada, matice, pole = 22 Canvasů, nejstarší kontexty prohlížeč zahodí). Týká se jen webu, ale stejné riziko hrozí na mapě s více sekcemi. Návrh: v dev sekci méně kotoučů nebo jeden společný Canvas.
- **N3 (design-agent)**: obrazovka lekce, HoldTimer: „PŘIPRAV SE“ přes číslici a tečky prstence, prstenec mimo střed.
- **N4 (design-agent)**: závoj popoveru v light je středně šedá plocha jen přes oblast mapy (hlavička, hero a CTA zůstávají světlé), vypadá jako chyba vykreslení. V dark je závoj skoro neviditelný.
- **N5 (boss, info)**: Metro `:8081` nebere změny souborů (ani `touch`); bundle `index.web.bundle` zůstal starý. Nové změny ověřuj na čerstvém serveru.
- **N6 (design, nízká)**: varianty `dotHero`/`dotDisplay` z plánu úkolu 3 chybí.

## K ruční kontrole
- Popover u uzlu těsně nad CTA: po automatickém posunu je kotouč napůl pod pruhem (snímek `qa-pop-done-*`), zkontrolovat, jestli to působí přirozeně.
- Tap na zamčený boss uzel: popover se neotevřel (jen zatřesení?), ověřit zamýšlené chování.
- Scroll mapy vs. roztočení prstem, haptika tick/success, 44 pt dotykové plochy, Doto s diakritikou na zařízení.
