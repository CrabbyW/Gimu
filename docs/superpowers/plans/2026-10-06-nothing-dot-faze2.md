# Nothing Dot — fáze 2 (zbylé obrazovky) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Převést ligu, progres, sezónu, profil a šatník, nastavení a cíle, stage-up a onboarding do tečkového jazyka Nothing Dot z fáze 1. Zároveň vyřešit limit WebGL pláten na webu.

**Architecture:** Obrazovky skládají hotové primitivy z fáze 1:
- `components/dots/*`: `DotPlate`, `DotRing`, `DotRow`, `DotMatrix`, `DotField`, `SkiaGuard`;
- `Tile`, `PillButton`, `StatusLine`, `ScreenHeader`, `FloatingTabBar`.

Nová čistá logika (výšky pódia, rozpad aktivity do mřížky, rozpočet pláten) leží v malých testovaných modulech. Obrazovky jen kreslí. Pohyb používá hotové hooky z fáze 1 (`useTilePress`, `useDotReveal`, `Reveal`, `motion.screenIn`).

**Tech Stack:** Expo 57, expo-router, Reanimated 4.5, Gesture Handler 2.32, `@shopify/react-native-skia` 2.6, Doto/Inter/JetBrains Mono, Jest.

**Spec:** `docs/superpowers/specs/2026-10-05-nothing-dot-redesign-design.md` (§6 Obrazovky, §2–4). Navazuje na `docs/superpowers/plans/2026-10-05-nothing-dot-faze1.md` (hotovo, rating 100/100).

## Global Constraints
- Žádný akcent: „aktivní“ = `text`. Barvu v UI nese jen opička. `seasonGold` jen u sezónního odznaku a stage-up (spec §2.1).
- Žádný čistý #000 / #FFF. Tokeny jen z `theme/`, pohyb jen z `lib/motion.ts`, copy česky v `data/copy.ts`.
- Doto jen ≥ 28 pt (varianty `hero`, `display`, `displayXL`, `dotStat`); mono štítky VERZÁLKY; akce `[V ZÁVORKÁCH]` přes `PillButton`.
- Dlaždice `Tile`: radius 28, padding 20, `tile` + vlasová `edge`, žádný stín, jediné oddělení.
- Žádný spring/bounce na klikatelném; Reduce Motion vždy (200 ms fade, ambient stop).
- Ikony Lucide outline 1.5 px. Dark i light plnohodnotné, kontrast textu ≥ 4.5:1.
- Logika jen v `logic/` nebo čistých `*.ts` modulech u komponent, data přes `services/`. `logic/` a `services/` se v této fázi nemění.
- Web: najednou smí žít nejvýš 12 Skia pláten (Chrome zahazuje WebGL kontexty nad ~16).
- Každý agent zapisuje do `docs/LOG.md`. Workflow: boss → design → motion → QA → rating 100/100.

## Review Focus
- Web, přepnutí přes všech 5 tabů a zpět na mapu → žádné bílé „rozbité“ plátno (rozpočet pláten, Task 1).
- Liga s méně než 3 hráči nebo s nulovým XP → pódium se nevykreslí rozbité. Test `podiumColumns` pro 0, 1, 2 hráče.
- Progres bez aktivity a bez váhy → prázdné stavy s reálnou copy, `DotMatrix` celý zhasnutý, žádné NaN. Test `activityCells([])`.
- fontScale > 1.3 a šířka 320 pt → dlaždicová mřížka progresu spadne do jednoho sloupce (`tileColumns`). Test `tileColumns(320, 1)` a `tileColumns(390, 1.4)`.
- Onboarding na 320 × 568 → lead text se nepřekrývá s první kartou a mezi kartami nejsou díry. Ověřit screenshotem v Task 2.

---

### Task 1: Rozpočet Skia pláten na webu

**Files:**
- Create: `components/dots/canvasBudget.ts`, `components/dots/__tests__/canvasBudget.test.ts`
- Modify: `components/dots/SkiaGuard.tsx`

**Interfaces:**
- Produces:
  - `shouldMountCanvas(platform: string, focused: boolean): boolean`: web → `focused`, nativ → `true`.
  - `SkiaGuard` na webu kreslí plátno jen na zaostřené obrazovce. Používá `useIsFocused` z `expo-router` (`@react-navigation/native`). Mimo navigační kontext se bere `true` přes `NavigationContext` null-check. Rozostřená obrazovka dostane fallback stejného rozměru, takže se layout neposune.

- [ ] **Step 1: Test**
```ts
import { shouldMountCanvas } from '../canvasBudget';
it('nativ vždy kreslí', () => { expect(shouldMountCanvas('ios', false)).toBe(true); expect(shouldMountCanvas('android', false)).toBe(true); });
it('web jen na zaostřené obrazovce', () => { expect(shouldMountCanvas('web', true)).toBe(true); expect(shouldMountCanvas('web', false)).toBe(false); });
```
- [ ] **Step 2:** `npx jest components/dots/__tests__/canvasBudget` → FAIL.
- [ ] **Step 3:**
```ts
/** Chrome drží ~16 WebGL kontextů; taby zůstávají připojené, takže na webu kreslí plátna jen zaostřená obrazovka. */
export function shouldMountCanvas(platform: string, focused: boolean): boolean {
  return platform !== 'web' || focused;
}
```
`SkiaGuard`: `const nav = useContext(NavigationContext); const focused = nav ? nav.isFocused() : true;` plus odběr `focus`/`blur` přes `nav.addListener`, který přerenderuje. Kreslí, když `skiaState.ready && shouldMountCanvas(Platform.OS, focused)`.
- [ ] **Step 4:** PASS a `tsc`. Web: projít všech 5 tabů dvakrát dokola a vrátit se na mapu. Žádné prázdné plátno, v konzoli žádné „Too many active WebGL contexts“.
- [ ] **Step 5:** Commit `fix(nothing): rozpočet Skia pláten na webu`.

### Task 2: Onboarding

**Files:**
- Modify: `components/onboarding/OnboardingFrame.tsx`, `PathCard.tsx`, `ChoiceCard.tsx`, `MilestoneChip.tsx`, `app/onboarding/{path,dream,milestones,weight,birth,reminder}.tsx`

- [ ] **Step 1:** Rám: stavový řádek `StatusLine` (`KROK` vlevo, `01/05` vpravo) a pod ním `DotRow` o 5 tečkách místo linky. Titulek Doto `display`, lead Inter `body muted`. Mezi leadem a obsahem `space.l`. Dole `PillButton` primární `[POKRAČOVAT]` a sekundární `[ZPĚT]`.
- [ ] **Step 2:** Karty volby = `Tile` s `onPress`. Vybraná karta má hranu `text` (2 px) a mono štítek `VYBRÁNO`, ne výplň. Glyfy cest a snů převést na tečkové (`ringDots` / `DotRow` mini), outline 1.5 px.
- [ ] **Step 3: Bug z fáze 1.** Lead se překrývá s 1. kartou a mezi 1. a 2. kartou je díra. Najdi příčinu: pravděpodobně `entering` layout animace na webu nechává obal `position: absolute`. Motion-agent ve fázi 1 totéž řešil na mapě náhradou za `Reveal`. Oprav stejně.
- [ ] **Step 4:** Screenshot 320 × 568 a 390 × 844, dark i light, kroky path, dream, milestones, weight, birth, reminder.
- [ ] **Step 5:** `npx jest components/onboarding` PASS (stávající testy). Commit `feat(nothing): onboarding`.

### Task 3: Liga

**Files:**
- Create: `components/league/podium.ts`, `components/league/__tests__/podium.test.ts`
- Modify: `components/league/Podium.tsx`, `LeagueRow.tsx`, `TierBadge.tsx`, `LeagueResultBanner.tsx`, `ZoneDivider.tsx`, `app/(tabs)/league.tsx`

**Interfaces:**
- Produces: `podiumColumns(count: number): { rank: 1 | 2 | 3; order: number; dots: number }[]`. Vrací pořadí sloupců zleva 2·1·3 jen pro existující hráče. Výška sloupce v tečkách: 1. místo 9, 2. místo 6, 3. místo 4.

- [ ] **Step 1: Test**
```ts
import { podiumColumns } from '../podium';
it('tři hráči: pořadí 2·1·3 a výšky 6·9·4', () => {
  expect(podiumColumns(3)).toEqual([{ rank: 2, order: 0, dots: 6 }, { rank: 1, order: 1, dots: 9 }, { rank: 3, order: 2, dots: 4 }]);
});
it('dva hráči: jen 2·1', () => expect(podiumColumns(2).map((c) => c.rank)).toEqual([2, 1]));
it('jeden hráč: jen 1', () => expect(podiumColumns(1).map((c) => c.rank)).toEqual([1]));
it('nikdo: prázdné', () => expect(podiumColumns(0)).toEqual([]));
```
- [ ] **Step 2:** FAIL. **Step 3:**
```ts
const HEIGHT = { 1: 9, 2: 6, 3: 4 } as const;
const ORDER: (1 | 2 | 3)[] = [2, 1, 3];
export function podiumColumns(count: number) {
  return ORDER.filter((r) => r <= count).map((rank, order) => ({ rank, order, dots: HEIGHT[rank] }));
}
```
- [ ] **Step 4:** Vzhled ligy:
  - Hlavička `ScreenHeader` „Liga“ a `StatusLine`: tier vlevo, `● 6 D 2 H` live vpravo.
  - Pódium = 3 sloupce `DotRow`, `columns=3`, `total = dots × 3`, všechny rozsvícené. Nad sloupcem mini opička, pod ním Doto `dotStat` pořadí a jméno.
  - Řádky ligy = kompaktní řádky na `base` s vlasovou linkou `rule`. Vlastní řádek = `Tile` s hranou `text`.
  - Zóna postupu a sestupu: mono štítek s tečkovou linkou.
  - TierBadge = `DotRing` s mono iniciálou.
- [ ] **Step 5:** PASS, screenshot dark i light (demo profil). Commit `feat(nothing): liga`.

### Task 4: Progres

**Files:**
- Create: `components/progress/layout.ts`, `components/progress/__tests__/layout.test.ts`
- Modify: `components/progress/ActivityGrid.tsx`, `MilestoneRow.tsx`, `DreamBodyCard.tsx`, `WeightChart.tsx`, `app/(tabs)/progress.tsx`

**Interfaces:**
- Produces:
  - `tileColumns(width: number, fontScale: number): 1 | 2`: 2 při `width ≥ 360` a `fontScale ≤ 1.3`, jinak 1.
  - `activityCells(days: { date: string; active: boolean }[], todayIndex: number | null): { lit: boolean[]; today: number | undefined }`: prázdný vstup vrátí 35 zhasnutých buněk a `today` undefined.

- [ ] **Step 1: Test**
```ts
import { activityCells, tileColumns } from '../layout';
it('tileColumns', () => { expect(tileColumns(390, 1)).toBe(2); expect(tileColumns(320, 1)).toBe(1); expect(tileColumns(390, 1.4)).toBe(1); });
it('activityCells prázdné', () => { const r = activityCells([], null); expect(r.lit).toHaveLength(35); expect(r.lit.some(Boolean)).toBe(false); expect(r.today).toBeUndefined(); });
it('activityCells mapuje aktivní dny', () => {
  const days = Array.from({ length: 35 }, (_, i) => ({ date: `d${i}`, active: i % 2 === 0 }));
  const r = activityCells(days, 34); expect(r.lit[0]).toBe(true); expect(r.lit[1]).toBe(false); expect(r.today).toBe(34);
});
```
- [ ] **Step 2:** FAIL. **Step 3:** Implementace:
  - `tileColumns`: dvě podmínky z rozhraní výše.
  - `activityCells`: doplní pole na 35 položek, `lit = active`, `today = todayIndex ?? undefined`.
- [ ] **Step 4:** Vzhled podle obr. 2 (mřížka dlaždic 2×N přes `tileColumns`):
  - **Hero:** dlaždice „aktivních dní“ (Doto `hero` a jednotka) a dlaždice nejdelší série.
  - **Aktivita:** celoplošná dlaždice s `DotMatrix` 7×5, osa dnů mono, dnešek s prstencem.
  - **Milníky:** dlaždice s `DotRow` pokroku a `n / cíl` mono.
  - **Váha:** dlaždice s tečkovým grafem (body = tečky, poslední zářící) a Doto aktuální hodnotou.
  - **Vize těla:** dlaždice s mono štítkem `VIZE` a názvem.

  Prázdné stavy mají reálnou copy z `copy.progress`.
- [ ] **Step 5:** PASS, screenshot dark i light. Commit `feat(nothing): progres`.

### Task 5: Sezóna (tab, cíl sezóny, recap)

**Files:**
- Modify: `components/season/*` (SeasonHeader, SeasonDays, SeasonGoalCard, RewardCard, SeasonBadge, ComebackCard, RecapSlide), `app/(tabs)/season.tsx`, `app/season-goal.tsx`, `app/season-recap.tsx`

- [ ] **Step 1:** Vzhled sezónního tabu:
  - Odpočet Doto `displayXL` (pod 360 pt `hero`) a mono „DNÍ DO KONCE“.
  - Postup sezóny = `DotRing` s % uprostřed.
  - Dny sezóny = `DotRow` (spec §6.4 `dot` 10 a `dotGap` 6 zachovat jako `dot` prop).
  - Odměny jako dlaždice, zamčené ve `dotDim`.
  - `SeasonBadge` jediné místo se `seasonGold`.
- [ ] **Step 2:** Cíl sezóny: volby jako `Tile` (vybraná = hrana `text`), CTA `PillButton`. Recap: slidy na `DotField` pozadí, čísla Doto.
- [ ] **Step 3:** Stávající testy `components/season` a `app` musí projít. Screenshot dark i light. Commit `feat(nothing): sezóna`.

### Task 6: Profil a šatník

**Files:**
- Modify: `app/(tabs)/profile.tsx`, `app/wardrobe.tsx`, `components/cosmetics/{CosmeticTile,ProfileFrame,SourceBadge}.tsx`, `components/ui/{PlateStack,BadgeTile,StatGrid}.tsx`

- [ ] **Step 1:** Profil:
  - Opička velká (`size.wardrobePreview`) na `DotField`, které reaguje na dotek (`useDotTouch`).
  - Podstavec `PlateStack` převést na stoh tří `DotPlate` z profilu: 3 elipsy přes `scaleY: 0.35`, `state="done"`, `decorative`, bez rotace.
  - Statistiky jako dlaždice 2×N.
  - Ozubené kolo nastavení = kulaté ikonové tlačítko 44 v `ScreenHeader`.
- [ ] **Step 2:** Šatník:
  - Náhled opičky nahoře na `DotField`.
  - Sloty jako `SegmentedControl` v pilulce.
  - Položky = `Tile` s mini opičkou. Vybraná položka má hranu `text`, zamčená je ve `dotDim` s mono „ZAMČENO“.
  - `SourceBadge` sezónní = `seasonGold`.
- [ ] **Step 3:** Testy PASS, screenshot. Commit `feat(nothing): profil a šatník`.

### Task 7: Nastavení a cíle

**Files:**
- Modify: `app/settings.tsx`, `app/goals/*.tsx`, `components/goals/GoalEditorFrame.tsx`, `components/ui/{Toggle,SegmentedControl,TextField}.tsx`

- [ ] **Step 1:** Nastavení:
  - Sekce s mono štítky. Řádky v jedné dlaždici na sekci, oddělené vlasovou linkou `rule`.
  - Toggle = pilulka, aktivní výplň `text` a knoflík `onText`.
  - Volba vzhledu `Systém / Světlý / Tmavý` jako `SegmentedControl` v pilulce (`THEMES` už existují).
- [ ] **Step 2:** Editory cílů: `GoalEditorFrame` (kicker mono, Doto titulek, `PillButton` Zrušit / Uložit). Pole `TextField` jako pilulka `tile` s hranou, focus = hrana `text`.
- [ ] **Step 3:** Testy `app/goals` a `components/goals` PASS, screenshot. Commit `feat(nothing): nastavení a cíle`.

### Task 8: Stage-up

**Files:**
- Modify: `app/stage-up.tsx`

- [ ] **Step 1:** Plocha `seasonGold` zůstává (spec §2.1, jediná výjimka).
  - Dva `DotRing` pro nový a starý stage. Starý se „rozpadne“: tečky se rozletí a prolnou do nového, s pohybem z `motion.stageUp`, pokud existuje, jinak `motion.reveal`.
  - Číslo stage je Doto `displayXL`, opička ve stavu `celebrate`, CTA `PillButton` `onAccent`.
  - Reduce Motion: finální stav s 200 ms fade.
- [ ] **Step 2:** Stávající testy PASS, screenshot. Commit `feat(nothing): stage-up`.

### Task 9: Pohybový průchod (motion-agent)

**Files:**
- Modify: obrazovky z Tasků 2–8

- [ ] **Step 1:** Každá obrazovka dostane jeden orchestrovaný nástup podle `motion.screenIn` (hlavička → hero → dlaždice po 60 ms) přes `Reveal`, ne přes layout `entering`, který se na webu rozbíjí.
- [ ] **Step 2:** Všechny klikatelné `Tile` dostanou `useTilePress` (naklopení). Tečkové prvky mají nástup skenem nebo spirálou (`intro`).
- [ ] **Step 3:** Liga: sloupce pódia vyrostou zdola tečku po tečce, potom dosedne opička. Progres: `DotMatrix` sken. Sezóna: `DotRing` spirála a odpočet `DotNumber`, případně Doto count-down.
- [ ] **Step 4:** Reduce Motion všude. `tsc`, `jest`, `eslint`. Commit `feat(nothing): pohyb fáze 2`.

### Task 10: SPEC, LOG, QA, rating

- [ ] **Step 1:** Přepsat `docs/SPEC.md` §6.1–6.9 podle spec dokumentu (dosud odloženo z fáze 1) a §7 obrazovky na Nothing Dot.
- [ ] **Step 2:** `npx tsc --noEmit && npx jest && npx eslint .` zelené.
- [ ] **Step 3:** qa-agent (max 3 kola), rating-agent (100/100, max 5 kol).
- [ ] **Step 4:** `docs/LOG.md`, `docs/HANDOFF.md`, `README.md`. Commit `docs(nothing): fáze 2`.
