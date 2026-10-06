# Nothing Dot — fáze 1 (systém + vlajková loď) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přestavět vizuální systém na monochromní tečkový jazyk (Nothing Dot) s dlaždicemi, Skia tečkovou grafikou, dotykovou interaktivitou a novou oslavou dokončení lekce.

**Architecture:** Palety si ponechají existující klíče (`base`, `surface`, `raised`, `rule`, `text`, `muted`, `faint`, `accent*`…), jen dostanou monochromní hodnoty a pár nových klíčů — celá appka se tak přebarví naráz bez lámání stovek použití. Tečková grafika je nová vrstva `components/dots/` (čistá geometrie v `geometry.ts` + Skia komponenty); interakce přes Gesture Handler + Reanimated shared values na UI vlákně. Obrazovky fáze 1 (mapa, lekce, oslava) přecházejí na nové primitivy.

**Tech Stack:** Expo 57, expo-router, Reanimated 4.5, Gesture Handler 2.32, `@shopify/react-native-skia` 2.x, `@expo-google-fonts/doto`, Jest (jest-expo).

**Spec:** `docs/superpowers/specs/2026-10-05-nothing-dot-redesign-design.md`

## Global Constraints
- Žádný akcent: „aktivní“ = `text` (dark #EDEDEF, light #131316). Barvu nese jen opička.
- Žádný čistý #000 / #FFF. Tokeny jen z `theme/`, pohybové hodnoty jen z `lib/motion.ts`.
- Doto jen ≥ 28 pt; mono štítky VERZÁLKY 11 pt tracking 0.18em; akce v `[ZÁVORKÁCH]`.
- Dlaždice: radius 28, padding 20, pozadí `tile` + 1 px `edge`, žádný stín.
- Žádný spring/bounce na klikatelném; Reduce Motion vždy (fallback 200 ms fade, ambient stop, vlna vypnutá).
- Ikony Lucide outline 1.5 px. Reálná česká copy v `data/copy.ts`.
- Oba režimy (dark i light) plnohodnotné; kontrast textu ≥ 4.5:1.
- Logika jen v `logic/`, data přes `services/` (beze změny v této fázi kromě `logic/mascotReactions.ts` až ve fázi 3).
- Každý agent zapisuje do `docs/LOG.md`.

## Review Focus
- Web bez načteného CanvasKit → tečkové komponenty nesmí shodit obrazovku; UI zůstane funkční (test: render `DotPlate` s mockem, kde `Skia` chybí → vrací `View` fallback).
- Roztočení kotouče uvnitř ScrollView mapy → vertikální scroll musí dál fungovat (gesto kotouče aktivní jen po obvodu a po 8 pt horizontálního/úhlového pohybu).
- Reduce Motion zapnuté → žádná ambientní rotace ani vlna, oslava skočí na finální stav (test na `useReducedMotion` mock).
- Light režim → `glow` se nekreslí, aktivní tečky jsou plné `text`; kontrastní test palet pro oba režimy.
- Kotouč s neznámou hmotností (kg mimo tabulku) → nejbližší nižší počet prstenců, min 2 (test v geometry).

---

### Task 1: Závislosti, fonty, Skia na webu, jest mock

**Files:**
- Modify: `package.json` (přes `npx expo install`)
- Modify: `app/_layout.tsx` (Doto do `useFonts`)
- Create: `lib/skiaWeb.ts`; Modify: `app/_layout.tsx` (web: čekat na CanvasKit)
- Modify: `jest.setup.ts` (mock Skia)

- [ ] **Step 1:** `npx expo install @shopify/react-native-skia @expo-google-fonts/doto`
- [ ] **Step 2:** `lib/skiaWeb.ts`:
```ts
import { Platform } from 'react-native';
/** Na webu musí být CanvasKit (wasm) načtený před prvním <Canvas>. Na nativu hned true. */
export async function loadSkia(): Promise<boolean> {
  if (Platform.OS !== 'web') return true;
  try {
    const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
    await LoadSkiaWeb({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/canvaskit-wasm@0.40.0/bin/full/${file}` });
    return true;
  } catch (e) {
    console.warn('[skia] CanvasKit se nenačetl, tečková grafika se vypne', e);
    return false;
  }
}
```
Modul `lib/skiaReady.ts` drží výsledek: `export const skiaState = { ready: Platform.OS !== 'web' }` a `_layout` po `loadSkia()` nastaví `skiaState.ready`. `ready` v `RootLayout` = fonty + hydratace + `skiaLoaded` (state z `useEffect(() => { loadSkia().then(ok => { skiaState.ready = ok; setSkiaLoaded(true); }); }, [])`).
- [ ] **Step 3:** `useFonts` přidat `Doto_700Bold` z `@expo-google-fonts/doto/700Bold`.
- [ ] **Step 4:** `jest.setup.ts`: `jest.mock('@shopify/react-native-skia', () => require('@shopify/react-native-skia/lib/commonjs/mock').Skia ? require('@shopify/react-native-skia/lib/commonjs/mock') : {});` — ověřit cestu mocku v nainstalované verzi (`node_modules/@shopify/react-native-skia/lib/commonjs/mock`), případně `jestSetup.js` z balíčku.
- [ ] **Step 5:** `npx tsc --noEmit && npx jest` → zelené. `npx expo start --web` → appka naběhne, v konzoli žádná chyba Skia.
- [ ] **Step 6:** Commit `chore(nothing): Skia, Doto, CanvasKit na webu, jest mock`.

### Task 2: Monochromní palety (dark + light)

**Files:**
- Modify: `theme/palettes.ts`
- Modify: `theme/__tests__/contrast.test.ts`

**Interfaces:**
- Produces: `Colors` s novými klíči `tile`, `tilePressed`, `edge`, `dotOff`, `dotDim`, `glow`, `onText` vedle stávajících.

- [ ] **Step 1: Test** — do `contrast.test.ts` přidat:
```ts
import { contrastRatio } from '../ink'; // pokud helper neexistuje, použít existující výpočet v testu
import { dark, light } from '../palettes';
describe.each([['dark', dark], ['light', light]] as const)('Nothing Dot %s', (_n, p) => {
  it('text na base i tile ≥ 4.5', () => {
    expect(contrastRatio(p.text, p.base)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.text, p.tile)).toBeGreaterThanOrEqual(4.5);
  });
  it('muted na tile ≥ 4.5', () => expect(contrastRatio(p.muted, p.tile)).toBeGreaterThanOrEqual(4.5));
  it('onText na text (CTA) ≥ 4.5', () => expect(contrastRatio(p.onText, p.text)).toBeGreaterThanOrEqual(4.5));
  it('žádný akcent: accent == text', () => { expect(p.accent).toBe(p.text); expect(p.accentGraphic).toBe(p.text); });
  it('žádná čistá čerň/bílá', () => Object.values(p).forEach((v) => expect(['#000000', '#FFFFFF', '#000', '#FFF']).not.toContain(String(v).toUpperCase())));
});
```
- [ ] **Step 2:** `npx jest theme` → FAIL (chybí `tile`, accent ≠ text).
- [ ] **Step 3:** Přepsat hodnoty podle spec §2.1. Mapování starých klíčů: `surface`=`tile`, `raised`=`tilePressed`(dark #1C1C1F)/`tile`(light), `raisedPressed`=`tilePressed`, `rule`=dark #232326 / light #DEDEDA, `edge` podle spec, `faint`=`dotDim`, `accent`/`accentGraphic`/`accentText`=`text`, `accentPressed`=dark #D4D4D7 / light #2A2A2E, `onAccent`=`onText`, `plate5…plate25` = stupně šedi (dark #8A8A90→#2A2A2E, light #6B6B70→#D6D6D2), `danger`, `success`=`text`, `shadow` dark #050506 / light #CFCFCB, scrimy na bázi base. `seasonGold` ponechat (jen sezónní odznak).
- [ ] **Step 4:** `npx jest theme` → PASS; celé `npx jest` → oprav testy, které natvrdo čekaly staré hex hodnoty (jen očekávání, ne logiku).
- [ ] **Step 5:** Commit `feat(nothing): monochromní palety bez akcentu`.

### Task 3: Tokeny typografie, tvarů a pohybu

**Files:**
- Modify: `theme/tokens.ts`, `lib/motion.ts`, `components/ui/Text.tsx` (varianty)

**Interfaces:**
- Produces: `font.dot = 'Doto_700Bold'`; Doto typové varianty `hero` (64), `display` (40), `displayXL` (110), `dotStat` (28) s `fontFamily: font.dot` a řádkem 1.3 em (rozhodnutí design-agent 2026-10-06: plánované `dotHero`/`dotDisplay` nahrazeny přímo variantami `hero`/`display`, aliasy by duplikovaly dva názvy pro jeden styl); `radius.tile = 28`, `radius.pill = 999`; `size.pill = 56`, `size.tabPill = 64`, `size.iconButton = 44`, `space.tilePad = 20`; `motion.plateSpin = { idleMs: 40000, currentMs: 24000, decay: 0.997, tickDeg: 30 }`, `motion.liveBlinkMs = 1200`, `motion.tilePress = { scale: 0.97, tiltMaxDeg: 6, releaseMs: 200 }`, `motion.dotScanMs = 600`, `motion.ripple = { radius: 64, push: 4, decayMs: 500 }`, `motion.tabSlideMs = 260`, `motion.screenIn = { headerAt: 0, heroAt: 80, step: 60, durationMs: 480, rise: 12 }`.

- [ ] **Step 1:** Přidat tokeny výše (s komentářem odkazujícím na spec §2–3). `font.display` přepnout na Doto jen pro varianty `dot*`; stávající `display`/`hero` varianty přepnout na `font.dot` pokud velikost ≥ 28, jinak Inter 600.
- [ ] **Step 2:** `Text` podporuje nové varianty; `Stat` použije `dotStat`/`dotHero`.
- [ ] **Step 3:** `npx tsc --noEmit && npx jest` → zelené.
- [ ] **Step 4:** Commit `feat(nothing): tokeny Doto, dlaždice, pohyb`.

### Task 4: Tečková geometrie (čistá, TDD)

**Files:**
- Create: `components/dots/geometry.ts`
- Test: `components/dots/__tests__/geometry.test.ts`

**Interfaces:**
- Produces:
  - `ringCountForKg(kg: number): number`
  - `plateDots(kg: number, radius: number): { x: number; y: number; ring: number; angle: number }[]` (střed 0,0)
  - `ringDots(count: number, radius: number, phase?: number): { x: number; y: number; angle: number }[]`
  - `rowLit(total: number, fraction: number): boolean[]`
  - `gridDots(cols: number, rows: number, pitch: number): { x: number; y: number; i: number }[]`
  - `rippleOffset(dx: number, dy: number, radius: number, push: number): { ox: number; oy: number; boost: number }` (worklet)
  - `spiralOrder<T extends { angle: number; ring?: number }>(dots: T[]): number[]` — pořadí indexů pro nástup spirálou

- [ ] **Step 1: Test**
```ts
import { gridDots, plateDots, rippleOffset, ringCountForKg, ringDots, rowLit, spiralOrder } from '../geometry';
describe('ringCountForKg', () => {
  it.each([[2.5, 2], [5, 3], [10, 4], [15, 5], [20, 6], [25, 7]])('%p kg → %p', (kg, n) => expect(ringCountForKg(kg)).toBe(n));
  it('neznámá hmotnost → nejbližší nižší, min 2', () => { expect(ringCountForKg(12)).toBe(4); expect(ringCountForKg(1)).toBe(2); expect(ringCountForKg(40)).toBe(7); });
});
describe('plateDots', () => {
  it('vnější prstenec leží na poloměru', () => {
    const d = plateDots(20, 100); const outer = d.filter((p) => p.ring === 0);
    outer.forEach((p) => expect(Math.hypot(p.x, p.y)).toBeCloseTo(100, 5));
  });
  it('počet prstenců odpovídá kg', () => expect(new Set(plateDots(10, 100).map((p) => p.ring)).size).toBe(4));
  it('rozteč teček v prstenci je přibližně stejná napříč prstenci', () => {
    const d = plateDots(25, 100);
    const gap = (r: number) => { const ps = d.filter((p) => p.ring === r); return (2 * Math.PI * Math.hypot(ps[0].x, ps[0].y)) / ps.length; };
    expect(Math.abs(gap(0) - gap(3))).toBeLessThan(gap(0) * 0.35);
  });
});
it('ringDots rovnoměrně', () => { const r = ringDots(4, 10); expect(r[1].x).toBeCloseTo(0, 5); expect(r[1].y).toBeCloseTo(10, 5); });
describe('rowLit', () => {
  it('zaokrouhluje dolů a clampuje', () => { expect(rowLit(24, 0.67).filter(Boolean).length).toBe(16); expect(rowLit(5, 2).every(Boolean)).toBe(true); expect(rowLit(5, -1).some(Boolean)).toBe(false); expect(rowLit(5, NaN).some(Boolean)).toBe(false); });
});
it('gridDots', () => { const g = gridDots(3, 2, 10); expect(g).toHaveLength(6); expect(g[5]).toEqual({ x: 20, y: 10, i: 5 }); });
describe('rippleOffset', () => {
  it('mimo poloměr nic', () => expect(rippleOffset(100, 0, 64, 4)).toEqual({ ox: 0, oy: 0, boost: 0 }));
  it('blízko odsune od prstu, max push', () => { const r = rippleOffset(10, 0, 64, 4); expect(r.ox).toBeGreaterThan(0); expect(r.ox).toBeLessThanOrEqual(4); expect(r.boost).toBeGreaterThan(0.5); });
  it('přesně na prstu bez NaN', () => { const r = rippleOffset(0, 0, 64, 4); expect(Number.isFinite(r.ox)).toBe(true); expect(r.boost).toBe(1); });
});
it('spiralOrder: vnější prstenec první, uvnitř podle úhlu', () => {
  const d = plateDots(5, 50); const o = spiralOrder(d);
  expect(o).toHaveLength(d.length); expect(d[o[0]].ring).toBe(0); expect(d[o[o.length - 1]].ring).toBe(2);
});
```
- [ ] **Step 2:** `npx jest components/dots` → FAIL (modul chybí).
- [ ] **Step 3: Implementace**
```ts
const KG_RINGS: [number, number][] = [[25, 7], [20, 6], [15, 5], [10, 4], [5, 3], [2.5, 2]];
export function ringCountForKg(kg: number): number {
  for (const [k, n] of KG_RINGS) if (kg >= k) return n;
  return 2;
}
/** Prstence od vnějšího (ring 0) dovnitř; vnitřní poloměr = R/φ² (náboj, viz SPEC §6.5). Rozteč ~ stejná. */
export function plateDots(kg: number, radius: number) {
  const rings = ringCountForKg(kg);
  const inner = radius / 2.618;
  const step = rings > 1 ? (radius - inner) / (rings - 1) : 0;
  const pitch = (2 * Math.PI * radius) / 48;
  const out: { x: number; y: number; ring: number; angle: number }[] = [];
  for (let ring = 0; ring < rings; ring++) {
    const r = radius - ring * step;
    const n = Math.max(8, Math.round((2 * Math.PI * r) / pitch));
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 + (ring % 2 ? Math.PI / n : 0);
      out.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r, ring, angle });
    }
  }
  return out;
}
export function ringDots(count: number, radius: number, phase = 0) {
  return Array.from({ length: count }, (_, i) => {
    const angle = phase + (i / count) * Math.PI * 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, angle };
  });
}
export function rowLit(total: number, fraction: number): boolean[] {
  const f = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;
  const k = Math.floor(total * f + 1e-9);
  return Array.from({ length: total }, (_, i) => i < k);
}
export function gridDots(cols: number, rows: number, pitch: number) {
  const out: { x: number; y: number; i: number }[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push({ x: c * pitch, y: r * pitch, i: r * cols + c });
  return out;
}
export function rippleOffset(dx: number, dy: number, radius: number, push: number) {
  'worklet';
  const d = Math.hypot(dx, dy);
  if (d >= radius) return { ox: 0, oy: 0, boost: 0 };
  const t = 1 - d / radius;
  if (d === 0) return { ox: 0, oy: 0, boost: 1 };
  const k = (push * t) / d;
  return { ox: dx * k, oy: dy * k, boost: t };
}
export function spiralOrder<T extends { angle: number; ring?: number }>(dots: T[]): number[] {
  const norm = (a: number) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return dots.map((d, i) => i).sort((a, b) => (dots[a].ring ?? 0) - (dots[b].ring ?? 0) || norm(dots[a].angle) - norm(dots[b].angle));
}
```
- [ ] **Step 4:** `npx jest components/dots` → PASS.
- [ ] **Step 5:** Commit `feat(nothing): tečková geometrie`.

### Task 5: Skia tečkové komponenty + dotyková vlna

**Files:**
- Create: `components/dots/DotPlate.tsx`, `DotRing.tsx`, `DotRow.tsx`, `DotMatrix.tsx`, `DotField.tsx`, `useDotTouch.ts`, `SkiaGuard.tsx`, `index.ts`
- Test: `components/dots/__tests__/render.test.tsx`

**Interfaces:**
- Consumes: geometry (Task 4), tokeny (Task 2–3), `useReducedMotion` z Reanimated.
- Produces:
  - `<SkiaGuard fallback?>{children}</SkiaGuard>` — když `skiaState.ready === false`, vykreslí `fallback` (výchozí prázdný `View` stejné velikosti).
  - `useDotTouch(): { gesture: GestureType; x: SharedValue<number>; y: SharedValue<number>; strength: SharedValue<number> }` — Pan+Tap `simultaneousWithExternalGesture` vůči scrollu, `strength` 1 při dotyku, po puštění `withTiming(0, motion.ripple.decayMs)`; Reduce Motion → strength zůstává 0.
  - `<DotPlate kg size state: 'locked'|'current'|'done' spin?: SharedValue<number> intro?: boolean showKg?: boolean />` — rotace = ambient (`withRepeat(withTiming(2π, plateSpin.currentMs|idleMs, linear))`) + `spin` offset; `current` = obíhající kometa (jas teček podle úhlové vzdálenosti od fáze); `done` = plné; kg uprostřed Doto (`useFont(Doto_700Bold)`); `intro` = nástup spirálou (`spiralOrder`, `dotScanMs`).
  - `<DotRing progress size dotsOuter? />`, `<DotRow total fraction size? />`, `<DotMatrix cols rows lit: boolean[] today?: number pitch? />`, `<DotField width height pitch? touch?: ReturnType<typeof useDotTouch> />`.
  - Glow: v dark `<Circle>` s `<BlurMask blur={4} style="normal">` v barvě `c.glow` pod aktivními tečkami; v light se nevykreslí.

- [ ] **Step 1: Test** (s jest mockem Skia):
```tsx
import { render } from '@testing-library/react-native';
import { DotPlate, DotRow, SkiaGuard } from '@/components/dots';
import { skiaState } from '@/lib/skiaReady';
import { renderWithTheme } from '@/test-utils'; // pokud neexistuje, obalit ThemeProvider ručně
it('SkiaGuard bez Skia vykreslí fallback', () => {
  skiaState.ready = false;
  const { getByTestId } = renderWithTheme(<SkiaGuard fallback={<></>}><DotRow total={5} fraction={0.4} /></SkiaGuard>);
  expect(() => getByTestId('dotrow-canvas')).toThrow();
  skiaState.ready = true;
});
it('DotPlate má accessibilityLabel s kg', () => {
  const { getByLabelText } = renderWithTheme(<DotPlate kg={20} size={88} state="current" />);
  expect(getByLabelText(/20 kg/)).toBeTruthy();
});
```
- [ ] **Step 2:** FAIL → **Step 3:** implementovat komponenty (každá obalená `SkiaGuard`, `accessible` popisky česky z `copy`).
- [ ] **Step 4:** `npx jest components/dots && npx tsc --noEmit` → PASS.
- [ ] **Step 5:** Vizuálně: dočasná dev obrazovka `app/dev.tsx` sekce „Tečky“ se všemi komponentami (oba režimy). Spustit web, zkontrolovat.
- [ ] **Step 6:** Commit `feat(nothing): Skia tečkové komponenty a dotyková vlna`.

### Task 6: UI primitivy — Tile, PillButton, StatusLine, ScreenHeader

**Files:**
- Create: `components/ui/Tile.tsx`, `components/ui/PillButton.tsx`, `components/ui/StatusLine.tsx`, `components/ui/ScreenHeader.tsx`
- Modify: `components/ui/Card.tsx` (deleguje na Tile), `Button.tsx`, `BigActionBar.tsx`, `RoundCta.tsx` (vzhled pilulky), `TabHeader.tsx` (deleguje na ScreenHeader)
- Remove use: `components/ui/Grain.tsx` z `Screen` a tabů (materiál litiny končí)

**Interfaces:**
- Produces:
  - `<Tile onPress? tone?='tile'|'base' style? children />` — pressable: scale `tilePress.scale`, `rotateX/rotateY` k bodu dotyku (max `tiltMaxDeg`, `perspective: 600`), edge → `text` na 0.16 opacitě; release `releaseMs` ease. Bez `onPress` statická.
  - `<PillButton label variant='primary'|'secondary' onPress disabled? />` — label automaticky `[LABEL]` mono verzálky; primary výplň `text`, text `onText`; haptika `light`.
  - `<StatusLine left: string right?: string live?: boolean />` — mono 11 pt; `live` = tečka bliká `liveBlinkMs`.
  - `<ScreenHeader title: string actions?: {icon: LucideIcon; label: string; onPress}[] status?: StatusLineProps />` — Doto titulek `dotDisplay` vlevo, kulatá tlačítka 44 vpravo (`tile` výplň).
- [ ] **Step 1:** Test `components/ui/__tests__/PillButton.test.tsx`: label se vykreslí jako `[ZAČÍT LEKCI]` pro `label="Začít lekci"`; disabled nevolá onPress; `accessibilityRole="button"` a čtečka dostane label bez závorek.
- [ ] **Step 2:** FAIL → **Step 3:** implementace → **Step 4:** PASS + `tsc`.
- [ ] **Step 5:** Commit `feat(nothing): Tile, PillButton, StatusLine, ScreenHeader`.

### Task 7: Plovoucí tab bar

**Files:**
- Create: `components/ui/FloatingTabBar.tsx`; Modify: `app/(tabs)/_layout.tsx` (`tabBar={(p) => <FloatingTabBar {...p} />}`, scény dostanou spodní padding `size.tabPill + space.m + insets.bottom`)

- [ ] **Step 1:** Pilulka `tile` + `edge`, radius `size.tabPill/2`, výška 64, 16 od okrajů a nad safe area; ikony Lucide 24/1.5; aktivní = posuvná podložka `tilePressed` (absolutní, `left` animovaný `withTiming(tabSlideMs, ease.out)`), ikona `text`, neaktivní `muted`; bez popisků pod 360 pt, jinak popisek mono 10 pt pod ikonou jen u aktivního. `feedback('tab')` + guard z `isNavigationGuarded` zachovat.
- [ ] **Step 2:** Test: render s mock props, tap na 2. tab volá `navigation.navigate('league')`; aktivní tab má `accessibilityState.selected`.
- [ ] **Step 3:** PASS + vizuální kontrola web 320 a 390 px. Commit `feat(nothing): plovoucí tab bar`.

### Task 8: Mapa — tečkové kotouče, roztočení, tečková cesta, hero

**Files:**
- Modify: `components/map/PlateNode.tsx` (vykreslení přes `DotPlate`; zachovat props a unlock/shake/check API), `components/map/PathLine.tsx` (tečkovaná linka: `ringDots`-like vzorkování křivky, rozsvícená do aktuálního uzlu), `components/map/SectionHero.tsx` (hero `Tile`: Doto `3` + jednotka „/ 8 lekcí“, `DotRow`), `components/map/BarbellBoss.tsx` (tečková činka), `app/(tabs)/index.tsx` (ScreenHeader + StatusLine `SEKCE 01` · `● {série} DNÍ` live, DotField pozadí s `useDotTouch`, PillButton CTA)
- Create: `components/map/usePlateSpin.ts`
- Test: `components/map/__tests__/usePlateSpin.test.ts`

**Interfaces:**
- Produces: `usePlateSpin(enabled: boolean): { gesture: GestureType; spin: SharedValue<number>; velocity: SharedValue<number> }` — Pan aktivní po `activeOffsetX([-8, 8])`, úhel z polohy vůči středu, při puštění `withDecay({ velocity, deceleration: plateSpin.decay })`; haptika `selection` při překročení každých `tickDeg` (runOnJS); `failOffsetY([-12, 12])` aby vertikální scroll vyhrál.
- [ ] **Step 1: Test** čisté funkce `angleDelta(prev, next)` (export z `usePlateSpin.ts`) — přechod přes ±π nedá skok: `angleDelta(3.1, -3.1)` ≈ 0.083; a `ticksCrossed(0, 65, 30) === 2`.
- [ ] **Step 2:** FAIL → **Step 3:** implementace → PASS.
- [ ] **Step 4:** Opička sedí na aktuálním kotouči (zachovat `MonkeyBack/MonkeyFront` kotvu `mascotSeatY` — přepočítat podle vnějšího poloměru `DotPlate`).
- [ ] **Step 5:** Vizuálně web: rotace, roztočení myší, scroll mapy funguje, oba režimy. Commit `feat(nothing): mapa v tečkách, roztočitelné kotouče`.

### Task 9: Lekce — DotRing, dlaždice cviku, HoldTimer

**Files:**
- Modify: `components/lesson/LessonProgress.tsx` (→ `DotRow` počet cviků), `components/lesson/ExerciseCard.tsx` (panel = `Tile`, mřížku podlahy nahradit `DotField` bez dotyku, čísla Doto), `components/lesson/HoldTimer.tsx` (→ `DotRing` odpočet + Doto sekundy), `app/lesson/[id].tsx` (PillButton akce)
- [ ] **Step 1:** Stávající testy `components/lesson/__tests__` musí projít (API beze změny). Přidat test: HoldTimer při 50 % zobrazuje polovinu rozsvícených teček (přes prop `progress` předaný do `DotRing`, testovat props mocku).
- [ ] **Step 2:** Implementace → `npx jest components/lesson` PASS.
- [ ] **Step 3:** Commit `feat(nothing): lekce v tečkách`.

### Task 10: Vlajková loď — oslava dokončení lekce

**Files:**
- Modify: `components/lesson/LessonCompleteScene.tsx`, `components/lesson/celebration.ts` (časová osa), `lib/motion.ts` (`lessonDone` → nová osa: `fieldAt 0`, `gatherAt 200`, `gatherMs 700`, `snapAt 900`, `snapScale 1.08`, `mascotAt 1000`, `ctaAt 1600`)
- Test: `components/lesson/__tests__/celebration.test.ts`

- [ ] **Step 1: Test** — `celebrationTimeline(reduced: boolean)` vrací kroky v pořadí `field → gather → snap → mascot → cta` s časy z `motion.lessonDone`; při `reduced` všechny `at = 0` a `durationMs = 200`.
- [ ] **Step 2:** FAIL → **Step 3:** implementace osy + scény: `DotField` vlna od středu → tečky letí z pozic pole na pozice `plateDots(kg)` (interpolace pozic, pořadí `spiralOrder`) → snap s haptikou `success` → `Mascot mood="celebrate"` + `scarfEdge` → `DotRow` série +1, XP `DotNumber` → `PillButton [POKRAČOVAT]`.
- [ ] **Step 4:** PASS; vizuálně web oba režimy + Reduce Motion (emulace v DevTools `prefers-reduced-motion`).
- [ ] **Step 5:** Commit `feat(nothing): oslava dokončení lekce z teček`.

### Task 11: SPEC, LOG, QA, rating

- [ ] **Step 1:** Přepsat `docs/SPEC.md` §6.1–6.9 podle spec dokumentu (zdroj pravdy), §6.5 kotouče = tečkové.
- [ ] **Step 2:** `npx tsc --noEmit && npx jest && npx eslint .` → zelené.
- [ ] **Step 3:** qa-agent (max 3 kola), rating-agent (100/100, max 5 kol). Dokončení lekce zvlášť pečlivě.
- [ ] **Step 4:** Zápis do `docs/LOG.md`, commit `docs(nothing): SPEC §6, LOG fáze 1`.

## Fáze 2 a 3
Samostatné plány po dokončení fáze 1: `2026-10-xx-nothing-dot-faze2.md` (liga, progres, sezóna, profil/šatník, nastavení/cíle, onboarding, stage-up) a `…-faze3.md` (15 reakcí opičky, `logic/mascotReactions.ts`).
