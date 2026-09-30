# Opice fáze 1, plán B: maskot, liga, progres, sezóna, šatník, notifikace, dev menu, README — implementační plán

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Cíl:** Dotáhnout fázi 1 do stavu „hotovo“ podle SPEC §1: celá smyčka onboarding → mapa → lekce → kotouč → odemčení → XP → **liga → progres → sezóna → šatník** běží v Expo Go, s dokončeným maskotem, notifikacemi, dev menu a README.

**Architektura:** Beze změny oproti plánu A. Obrazovka → hook → `services/index.ts` → mock → `store/db.ts`. Veškerá nová herní logika (liga, sezóna, comeback, progres, kosmetika, dev posuny času) jsou čisté funkce v `logic/` s parametrem `now`/`today`, psané TDD. Mock služby jen skládají `logic/` + `data/` a zapisují do store.

**Stack:** Expo SDK 57, RN 0.86, TS strict, expo-router, reanimated 4, react-native-svg, zustand + AsyncStorage, expo-haptics, expo-notifications (jen lokální), lucide-react-native, jest-expo.

**Spec:** `docs/SPEC.md` (kopie `docs/superpowers/specs/2026-09-29-opice-faze1-design.md`). Spec je autorita. Čísla `§` odkazují na ni. Předchozí plán: `docs/superpowers/plans/2026-09-29-opice-faze1-core-loop.md` (plán A, Tasky 1–14).

**Předpoklad:** Tasky 12 (obrazovka lekce) a 13 (oslava, `components/lesson/LessonCompleteScene.tsx`, `onContinue` v `app/lesson/[id].tsx`) z plánu A jsou hotové a schválené. Plán B je jen rozšiřuje v místech uvedených u Tasků 26 a 25.

**Rozsah:** SPEC §12 kroky 3–6. Číslování tasků navazuje na plán A (Task 15+).

| Krok §12 | Tasky | Gate |
|---|---|---|
| 3 · Maskot | 15–17 | Gate A (Task 18) |
| 4 · Liga, Progres, Sezóna + recap, Šatník, notifikace | 19–29 | Gate B (Task 30) |
| 5 · Dev menu | 31 | Gate C (Task 32) |
| 6 · README | 33 | Gate D (Task 34) |

## Tým a vlastnictví (CLAUDE.md)

- **boss** (implementer): typy, contracts, `logic/` + testy, `data/`, `store/`, mock services, hooky, routy a navigace, minimální funkční obrazovky (struktura, data, stavy loading/error).
- **design-agent**: vizuál obrazovek a komponent (`components/**` vizuální vrstvy, layout, typografie, geometrie maskota). Pracuje nad hotovou datovou vrstvou z boss části téhož tasku.
- **motion-agent**: animace, přechody, haptika, maskot v pohybu. Nikdy paralelně s design-agentem na stejném souboru: v každém tasku jde až po design části.
- **qa-agent**: v Gate taskách ověří checklist QA fokusu (níže) a edge cases. Max 3 kola oprav.
- **rating-agent**: v Gate taskách hodnotí krok 0–100, dál se jde jen při 100/100 (max 5 kol).
- Každý agent na konci své části zapíše krátký záznam do `docs/LOG.md` (co udělal, co rozhodl sám, co zůstává otevřené). Tento krok už se v jednotlivých taskách neopakuje, platí vždy.

V každém tasku je u kroků značka **[boss]**, **[design]** nebo **[motion]**. Pořadí v tasku: boss → design → motion.

## QA fokus (povinné pokrytí testy)

| QA bod | Test | Task |
|---|---|---|
| XP (rozpis, dev XP se nepočítá jako lekce) | `logic/__tests__/xp.test.ts` (plán A), `logic/__tests__/activity.test.ts` | 19 |
| Streak přes půlnoc (rollover) a zameškaný den | `logic/__tests__/streak.test.ts` (rozšíření) | 19 |
| Stage opice podle prahů 500 / 2000 | `logic/__tests__/mascot.test.ts` (plán A) + `components/mascot/__tests__/anchors.test.ts` | 15 |
| Liga: postup, sestup, hranice Dřevo/Diamant, remíza | `logic/__tests__/league.test.ts` | 20 |
| Sezóna: comeback max 3 dny zpětně | `logic/__tests__/season.test.ts` + `logic/__tests__/completion.test.ts` (rozšíření) | 23 |
| Vyhodnocení cíle sezóny (všechny 4 typy, 100 %, dosažitelnost) | `logic/__tests__/season.test.ts` | 23 |
| Graf váhy jen pro cíl lose/gain | `logic/__tests__/progress.test.ts` | 27 |

## Global Constraints

- Balíčky jen přes `npx expo install <pkg>`. Před kódem, který sahá na Expo API, ověřit docs v57: `https://docs.expo.dev/versions/v57.0.0/` (hlavně `sdk/notifications`, `router`). Nic z paměti.
- Appka musí běžet v Expo Go. `rive-react-native` se **neinstaluje**, jeho import v `RiveMascot.tsx` je zakomentovaný.
- TypeScript `strict` + `noUncheckedIndexedAccess`. Žádné `any`, `@ts-ignore`, `as unknown as`.
- Importy přes `@/`. Hranice vrstev z `eslint.config.js` platí dál: `app/**` a `components/**` neimportují `@/store`, `@/data` (kromě `@/data/copy`), `@/services/mock`. `logic/**` importuje jen `@/types`.
- Čas jen přes `lib/clock.ts` `now()`. Logika bere `now: Date` / `today: ISODate` parametrem.
- UI texty česky, všechny v `data/copy.ts`. Čeština bez emoji v UI; emoji `🐒` jen v textu systémové notifikace (§6.8).
- Barvy, fonty, spacing jen z `theme/`. Jeden akcent `#FF6B35`. Výjimky: zlatý štítek `#C6A15B` jen jako materiál SourceBadge sezónní položky (§7.8) a plošný akcent na celoobrazovkových oslavách (stage-up, §6.8). Barva `#C6A15B` se přidá jako token `seasonGold` do `theme/palettes.ts`, ne inline.
- Ikony lucide, obrysové, `strokeWidth={1.5}`.
- Pružiny (`withSpring`) jen na herní odměny (opice, stage-up, odemčení kosmetiky, postup v lize). UI: `withTiming` 150–200 ms, `motion.ui` / `motion.uiExit`.
- Reduce motion: pružiny → 200 ms fade, pulzování a opakované poskoky vypnuté.
- Dotykové plochy ≥ 44 pt, kontrast textu ≥ 4.5:1 (nové kombinace přidat do `theme/__tests__/contrast.test.ts`).
- Čísla `fontVariant: ['tabular-nums']`, statistiky přes `Stat`.
- Grafy jen čisté SVG (`react-native-svg`), žádné chart knihovny.
- Před každým „hotovo“: `npm test && npm run typecheck && npm run lint`.
- Commity: jen soubory tasku (`git add <soubory>`, nikdy `git add -A`). Message končí:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_012KWfP7hvgnkR8PU1Wf91vd
  ```

## Review Focus

1. **Týden ligy přes víc týdnů nepřítomnosti:** uživatel otevře appku po třech týdnech. Vyhodnotí se jen týden, ve kterém byl naposledy (`profile.leagueWeek`), tier se posune maximálně o jeden stupeň a nový týden začne s 0 XP. Žádná kaskáda sestupů. Test: Task 20 (`settleLeague`).
2. **Comeback kolem půlnoci a na hranici sezóny:** druhá lekce dne v 00:05 patří novému dni (opravuje z okna nového dne). Den před `startDate` sezóny ani den před založením profilu se neopravuje. Test: Task 23.
3. **Dev XP a dev posun času nerozbijí data:** `dev-xp` přidá XP (stage, liga, banány), ale nezmění mapu, počet lekcí, streak ani „první lekci dne“. Posun času na konec sezóny ukáže recap, reset posunu vrátí aktivní sezónu. Test: Task 19 (`isLessonEvent`), Task 31 (`seasonEndOffset`).
4. **Opakovaný tap na „Převzít odměnu“ / opakované otevření recapu:** `claimReward` je idempotentní, šála a odznak se v `owned`/`badges` objeví jen jednou. Test: Task 23 (`rewardFor` + `applyClaim`).
5. **Kosmetika, o kterou uživatel přišel nebo na kterou nemá:** equip nevlastněné položky služba odmítne. Nákup bez dostatku banánů odmítne s důvodem. Poškozené `equipped` s neznámým id se při migraci zahodí. Test: Task 28 (`canEquip`, `canBuy`, `sanitizeEquipped`), Task 19 (`migrateDb`).

---

## Struktura souborů (tento plán)

```
types/{user,season,league,cosmetic}.ts                  (rozšíření)
services/contracts.ts · services/mock/*.ts              (implementace plán B, notImplemented.ts se smaže)
store/{migrate,db,settings}.ts                           (DB v2, nové preference)
logic/activity.ts · league.ts · season.ts · progress.ts · cosmetics.ts · dev.ts   + __tests__
logic/{streak,completion}.ts                             (úpravy: dev-xp, comeback)
data/{cosmetics,leagueUsers,seasons,leagues,copy}.ts
hooks/{useNow,useLeague,useSeasonStatus,useSeasonProgress,useRecap,useWardrobe,useDisplayStage,useReminder}.ts
lib/notifications.ts
theme/{palettes,buildTheme}.ts                           (seasonGold, seasonThemeId v Theme)
components/mascot/{SvgMascot,anchors,geometry,RiveMascot,riveInputs}.tsx|ts · components/mascot/cosmetics/*.tsx
components/ui/{ProgressBar,DotGrid,Toggle}.tsx
components/league/{LeagueRow,ZoneDivider,Countdown,TierBadge}.tsx
components/progress/{DreamBodyCard,MilestoneRow,WeightChart,MilestoneSheet}.tsx
components/season/{SeasonHeader,SeasonGoalCard,ComebackCard,RewardCard,RecapSlide}.tsx
components/cosmetics/{CosmeticTile,SourceBadge,ProfileFrame,MapBackground}.tsx · components/lesson/LessonEffect.tsx
app/(tabs)/{_layout,league,progress,season,profile}.tsx
app/{stage-up,season-goal,season-recap,wardrobe,settings,dev}.tsx
README.md
```

---

# Krok 3 · Maskot

### Task 15: Stages 2 a 3, geometrie a kotvy

**Vlastník:** boss (kotvy + test), design-agent (geometrie).

**Files:**
- Create: `components/mascot/geometry.ts`, `components/mascot/__tests__/anchors.test.ts`
- Modify: `components/mascot/anchors.ts`, `components/mascot/SvgMascot.tsx`, `components/mascot/__tests__/SvgMascot.test.tsx`

**Interfaces:**
- Consumes: `ANCHORS`, `AnchorName`, `Anchor` (plán A), `MascotStage`.
- Produces:
  - `STAGE_GEOMETRY: Record<MascotStage, StageGeometry>` v `geometry.ts`:
    ```ts
    export interface Limb { x: number; y: number; w: number; h: number; angle: number } // x,y = rameno (bod otáčení), angle ve stupních, + = ven
    export interface StageGeometry {
      head: { cx: number; cy: number; r: number };          // obličej (oči, pusa, nos) se kreslí jako stage-1 skupina se scale = r / 54
      ears: { dx: number; dy: number; r: number };           // offset od středu hlavy, vnitřek ucha r/2
      torso: { x: number; y: number; w: number; h: number; rx: number };
      shoulders: { x: number; y: number; w: number; h: number; rx: number } | null; // jen stage 3
      armL: Limb; armR: Limb;
      legs: { y: number; dx: number; r: number };
    }
    ```
  - `ANCHORS[2]`, `ANCHORS[3]` s vlastními hodnotami (níže). `handL/handR` jsou kotvy v klidové póze. Kosmetika na rukou se kreslí uvnitř otáčené skupiny paže (Task 17), takže sleduje i zvednuté ruce.

- [ ] **Step 1 [boss]: Test kotev** (`components/mascot/__tests__/anchors.test.ts`)

```ts
import { ANCHORS } from '@/components/mascot/anchors';
import { STAGE_GEOMETRY } from '@/components/mascot/geometry';
import type { MascotStage } from '@/types';

const stages: MascotStage[] = [1, 2, 3];
test.each(stages)('stage %i: všechny kotvy uvnitř viewBoxu 200×200', (s) => {
  for (const a of Object.values(ANCHORS[s])) {
    expect(a.x).toBeGreaterThanOrEqual(0); expect(a.x).toBeLessThanOrEqual(200);
    expect(a.y).toBeGreaterThanOrEqual(0); expect(a.y).toBeLessThanOrEqual(200);
    expect(a.scale).toBeGreaterThan(0);
  }
});
test('stage 2 a 3 mají vlastní kotvy (ne sdílené se stage 1)', () => {
  expect(ANCHORS[2]).not.toBe(ANCHORS[1]);
  expect(ANCHORS[3]).not.toBe(ANCHORS[1]);
});
test('proporce: hlava se zmenšuje, ramena rostou', () => {
  expect(STAGE_GEOMETRY[1].head.r).toBeGreaterThan(STAGE_GEOMETRY[2].head.r);
  expect(STAGE_GEOMETRY[2].head.r).toBeGreaterThan(STAGE_GEOMETRY[3].head.r);
  const span = (s: MascotStage) => ANCHORS[s].handR.x - ANCHORS[s].handL.x;
  expect(span(3)).toBeGreaterThan(span(2)); expect(span(2)).toBeGreaterThan(span(1));
});
test.each(stages)('stage %i: head kotva = střed hlavy geometrie', (s) => {
  expect(ANCHORS[s].head).toMatchObject({ x: STAGE_GEOMETRY[s].head.cx, y: STAGE_GEOMETRY[s].head.cy });
});
test.each(stages)('stage %i: ruka leží na konci paže', (s) => {
  const g = STAGE_GEOMETRY[s];
  const end = (l: typeof g.armL, sign: -1 | 1) => ({
    x: l.x + sign * l.h * Math.sin((l.angle * Math.PI) / 180),
    y: l.y + l.h * Math.cos((l.angle * Math.PI) / 180),
  });
  const l = end(g.armL, -1); const r = end(g.armR, 1);
  expect(Math.abs(l.x - ANCHORS[s].handL.x)).toBeLessThanOrEqual(1.5);
  expect(Math.abs(l.y - ANCHORS[s].handL.y)).toBeLessThanOrEqual(1.5);
  expect(Math.abs(r.x - ANCHORS[s].handR.x)).toBeLessThanOrEqual(1.5);
  expect(Math.abs(r.y - ANCHORS[s].handR.y)).toBeLessThanOrEqual(1.5);
});
```

- [ ] **Step 2 [boss]:** `npx jest components/mascot/__tests__/anchors.test.ts` → FAIL (`geometry` neexistuje).

- [ ] **Step 3 [boss]: `geometry.ts` s hodnotami** (viewBox 200×200). Stage 1 přepisuje plán A 1:1, stage 2 a 3 jsou nové:

```ts
import type { MascotStage } from '@/types';
// Limb, StageGeometry: viz Interfaces
export const STAGE_GEOMETRY: Record<MascotStage, StageGeometry> = {
  1: { // velká hlava, malé tělo
    head: { cx: 100, cy: 80, r: 54 }, ears: { dx: 54, dy: -2, r: 18 },
    torso: { x: 72, y: 122, w: 56, h: 52, rx: 26 }, shoulders: null,
    armL: { x: 74, y: 128, w: 14, h: 40, angle: 18 }, armR: { x: 126, y: 128, w: 14, h: 40, angle: 18 },
    legs: { y: 176, dx: 18, r: 12 },
  },
  2: { // vyvážené proporce
    head: { cx: 100, cy: 72, r: 44 }, ears: { dx: 44, dy: -2, r: 15 },
    torso: { x: 66, y: 108, w: 68, h: 64, rx: 28 }, shoulders: null,
    armL: { x: 70, y: 114, w: 16, h: 50, angle: 14 }, armR: { x: 130, y: 114, w: 16, h: 50, angle: 14 },
    legs: { y: 178, dx: 16, r: 14 },
  },
  3: { // široká ramena, výrazné paže
    head: { cx: 100, cy: 64, r: 40 }, ears: { dx: 40, dy: -2, r: 14 },
    torso: { x: 70, y: 112, w: 60, h: 60, rx: 24 }, shoulders: { x: 50, y: 96, w: 100, h: 34, rx: 17 },
    armL: { x: 54, y: 112, w: 22, h: 56, angle: 10 }, armR: { x: 146, y: 112, w: 22, h: 56, angle: 10 },
    legs: { y: 178, dx: 17, r: 15 },
  },
};
```

Kotvy v `anchors.ts` (nahradit komentář „plán B“, stage 1 beze změny):

```ts
const STAGE_2: Record<AnchorName, Anchor> = {
  head: { x: 100, y: 72, scale: 0.815 }, neck: { x: 100, y: 108, scale: 1.1 }, body: { x: 100, y: 140, scale: 1.21 },
  handL: { x: 58, y: 162, scale: 1.14 }, handR: { x: 142, y: 162, scale: 1.14 },
};
const STAGE_3: Record<AnchorName, Anchor> = {
  head: { x: 100, y: 64, scale: 0.74 }, neck: { x: 100, y: 98, scale: 1.3 }, body: { x: 100, y: 138, scale: 1.25 },
  handL: { x: 44, y: 167, scale: 1.57 }, handR: { x: 156, y: 167, scale: 1.57 },
};
export const ANCHORS: Record<MascotStage, Record<AnchorName, Anchor>> = { 1: STAGE_1, 2: STAGE_2, 3: STAGE_3 };
```

- [ ] **Step 4 [boss]:** test → PASS. Commit `feat(mascot): geometrie a kotvy stage 2–3`.

- [ ] **Step 5 [design]: `SvgMascot` kreslí z `STAGE_GEOMETRY[stage]`.**
  - Odstranit `useStageFallbackWarning` a `console.warn`.
  - Tělo, paže (`Rect` s `rotation` kolem ramene), nohy, uši a stage 3 `shoulders` z geometrie. Paže `furShade`, trup `fur`, ramena stage 3 `fur` s `furShade` spodní polovinou (clip jako u těla v plánu A).
  - Obličej (oči, odlesky, nos, pusa, maska obličeje) zůstává kód stage 1 zabalený do `<G transform={`translate(${cx} ${cy}) scale(${r / 54}) translate(-100 -80)`}>`.
  - Stage 3 paže mají navíc biceps: `Circle` r = `w * 0.6` v 40 % délky paže, `furShade`.
  - Žádné gradienty, jen geometrické tvary a stávající paleta `MASCOT_COLORS`.
  - Upravit `SvgMascot.test.tsx`: test „stage 2/3 varují“ nahradit testem, že stage 2 a 3 renderují bez warn a s jinou hodnotou `r` hlavy.

- [ ] **Step 6 [design]: Ověření.** Dočasný soubor `app/mascot-preview.tsx` vykreslí stage 1–3 vedle sebe. Po screenshotu se smaže a necommituje se. Screenshot light + dark, velikosti S a XL. Kontrola: stage čitelné i v S (56 pt), silueta stage 3 je jasně „silnější“.

- [ ] **Step 7:** `npm test && npm run typecheck && npm run lint`. Commit `feat(mascot): SvgMascot stage 2 a 3`.

---

### Task 16: Nálady celebrate a sad

**Vlastník:** motion-agent (celý task), boss review testu.

**Files:**
- Modify: `components/mascot/SvgMascot.tsx`, `components/mascot/__tests__/SvgMascot.test.tsx`

**Interfaces:**
- Consumes: `Mood`, `motion.hop`, `useMotionSafe`, `STAGE_GEOMETRY`.
- Produces: `SvgMascot` reaguje na všechny 4 nálady podle §8. Konstanta `PLAN_A_FACE` a komentář „plán B“ zmizí. Nový export pro testy: `export const MOOD_POSE: Record<Mood, { face: 'idle' | 'happy' | 'sad'; armsUp: boolean; earsDown: boolean; breathHalfMs: number; hopRepeat: boolean }>`.

- [ ] **Step 1 [motion]: Test mapování nálad** (nahradí dvojice `['celebrate','happy']`, `['sad','idle']` v `SvgMascot.test.tsx`)

```ts
import { MOOD_POSE } from '@/components/mascot/SvgMascot';
test('celebrate: ruce nahoru, opakované poskoky, veselý obličej', () => {
  expect(MOOD_POSE.celebrate).toEqual({ face: 'happy', armsUp: true, earsDown: false, breathHalfMs: 1200, hopRepeat: true });
});
test('sad: svěšené uši, smutný obličej, pomalejší dech', () => {
  expect(MOOD_POSE.sad).toEqual({ face: 'sad', armsUp: false, earsDown: true, breathHalfMs: 1800, hopRepeat: false });
});
test('idle a happy beze změny proti plánu A', () => {
  expect(MOOD_POSE.idle).toMatchObject({ face: 'idle', armsUp: false, hopRepeat: false, breathHalfMs: 1200 });
  expect(MOOD_POSE.happy).toMatchObject({ face: 'happy', armsUp: false, hopRepeat: false });
});
```

- [ ] **Step 2:** FAIL. **Step 3: Implementace**
  - `celebrate`: paže se otočí z `angle` na `180 - 20 = 160°` (ruce nad hlavou, mírně od sebe) přes `withTiming(220 ms, motion.ui.easing)`. Poskoky: `withRepeat(withSequence(withTiming(-HOP_HEIGHT*px, {duration: 140}), withSpring(0, motion.hop), withDelay(600, withTiming(0, { duration: 0 }))), -1)`. Zruší se (`cancelAnimation`) při změně nálady.
  - `sad`: uši `translateY +8`, `translateX ±4` ven (dolů/ven), zorničky (oči) `cy +3`, pusa `SAD_MOUTH = 'M88 112 Q100 104 112 112'`, dech `BREATH_HALF_MS_SAD = 1800` a `BREATH_SCALE_SAD = 0.012`. Přechody `withTiming(300 ms)`, bez pružin (smutek nemá odskakovat).
  - Tři pusy (idle, happy, sad) jako crossfade přes opacity, stejně jako v plánu A.
  - Reduce motion: celebrate = ruce nahoru staticky, bez poskoků. Sad = statická póza, bez dechu.
  - Haptika se v maskotu **nespouští** (patří volajícímu: oslava, stage-up).
- [ ] **Step 4:** PASS. Screenshoty web: 4 nálady × stage 1/3 × light/dark (8 kombinací stačí: každá nálada ve stage 1 a 3, dark; stage 2 celebrate light).
- [ ] **Step 5:** Commit `feat(mascot): nálady celebrate a sad`.

---

### Task 17: Kosmetické vrstvy, sezónní šála, Rive stub

**Vlastník:** boss (data, `riveInputs` + test, theme `seasonThemeId`), design-agent (vrstvy).

**Files:**
- Create: `data/cosmetics.ts`, `components/mascot/cosmetics/{index.ts,OutfitTank.tsx,OutfitHoodie.tsx,OutfitScarf.tsx,AccHeadband.tsx,AccWristbands.tsx,AccBelt.tsx,SeasonScarf.tsx}`, `components/mascot/RiveMascot.tsx`, `components/mascot/riveInputs.ts`, `components/mascot/__tests__/riveInputs.test.ts`, `components/mascot/__tests__/cosmetics.test.ts`
- Modify: `components/mascot/SvgMascot.tsx`, `components/mascot/index.tsx`, `theme/buildTheme.ts`, `theme/palettes.ts`

**Interfaces:**
- Produces:
  - `COSMETICS: Cosmetic[]` v `data/cosmetics.ts` (přesně tato tabulka):

    | id | slot | name | source | pravidlo / cena | variantIndex |
    |---|---|---|---|---|---|
    | `outfit-winter-arc-scarf` | outfit | Šála Winter Arc | season (`winter-arc-2026`) | odměna sezóny | 1 |
    | `outfit-tank-ember` | outfit | Tílko Ember | shop | 60 banánů | 2 |
    | `outfit-hoodie-chalk` | outfit | Mikina Křída | milestone | `{ kind: 'milestoneCompleted', count: 1 }` | 3 |
    | `acc-headband` | accessory | Čelenka | shop | 40 | 1 |
    | `acc-wristbands` | accessory | Potítka | milestone | `{ kind: 'streak', days: 7 }` | 2 |
    | `acc-belt` | accessory | Vzpěračský pás | shop | 90 | 3 |
    | `map-chalk-dust` | mapBackground | Křídový prach | shop | 50 | 1 |
    | `map-night-gym` | mapBackground | Noční posilovna | milestone | `{ kind: 'streak', days: 14 }` | 2 |
    | `fx-sparks` | lessonEffect | Jiskry | shop | 70 | 1 |
    | `fx-chalk-burst` | lessonEffect | Oblak křídy | milestone | `{ kind: 'milestoneCompleted', count: 2 }` | 2 |
    | `frame-plate-ring` | profileFrame | Kotoučový rám | milestone | `{ kind: 'milestoneCompleted', count: 2 }` | 1 |
    | `frame-ember-ring` | profileFrame | Ember rám | shop | 80 | 2 |

  - `MASCOT_LAYERS: Partial<Record<string, { anchor: AnchorName | 'hands'; z: 'back' | 'front'; Component: ComponentType<LayerProps> }>>` v `components/mascot/cosmetics/index.ts`, klíč = cosmetic id. Jen `outfit` a `accessory` (ostatní sloty nejsou vrstvy opice, §8). `LayerProps = { anchor: Anchor; stage: MascotStage; ink: string }`.
  - `SeasonScarf` = sezónní vrstva (§6.3), vykreslí se na `neck`, když `useTheme().seasonThemeId === 'winterArc'` a outfit slot **není** `outfit-winter-arc-scarf`. Nejde o equip.
  - `Theme.seasonThemeId: SeasonThemeId | null` (přidat do `buildTheme`).
  - `riveInputs(props: Pick<MascotProps, 'stage' | 'mood' | 'cosmetics'>, variantOf: (id: string) => number): { numbers: Record<string, number>; trigger: 'happy' | 'celebrate' | 'sad' | null }`.
  - `RiveMascot(props: MascotProps & { variantOf?: (id: string) => number })`: v Expo Go vykreslí `SvgMascot`, Rive kód zakomentovaný.

- [ ] **Step 1 [boss]: Testy**

```ts
// components/mascot/__tests__/riveInputs.test.ts
import { riveInputs } from '@/components/mascot/riveInputs';
const variants: Record<string, number> = { 'outfit-tank-ember': 2, 'acc-headband': 1 };
const variantOf = (id: string) => variants[id] ?? 0;
test('stage → number input, cosmetics → variantIndex po slotech, chybějící slot = 0', () => {
  expect(riveInputs({ stage: 3, mood: 'idle', cosmetics: { outfit: 'outfit-tank-ember', accessory: 'acc-headband' } }, variantOf)).toEqual({
    numbers: { stage: 3, outfit: 2, accessory: 1, mapBackground: 0, lessonEffect: 0, profileFrame: 0 }, trigger: null,
  });
});
test.each([['happy', 'happy'], ['celebrate', 'celebrate'], ['sad', 'sad'], ['idle', null]] as const)('mood %s → trigger %s', (mood, t) => {
  expect(riveInputs({ stage: 1, mood, cosmetics: {} }, variantOf).trigger).toBe(t);
});
```

```ts
// components/mascot/__tests__/cosmetics.test.ts
import { MASCOT_LAYERS } from '@/components/mascot/cosmetics';
import { COSMETICS } from '@/data/cosmetics';
test('každá outfit/accessory položka má vrstvu, ostatní sloty žádnou', () => {
  for (const c of COSMETICS) {
    const layered = c.slot === 'outfit' || c.slot === 'accessory';
    expect(Boolean(MASCOT_LAYERS[c.id])).toBe(layered);
  }
});
test('id jsou unikátní, variantIndex unikátní v rámci slotu, shop má cenu, milestone má pravidlo, season má seasonId', () => {
  expect(new Set(COSMETICS.map((c) => c.id)).size).toBe(COSMETICS.length);
  for (const slot of new Set(COSMETICS.map((c) => c.slot))) {
    const v = COSMETICS.filter((c) => c.slot === slot).map((c) => c.variantIndex);
    expect(new Set(v).size).toBe(v.length);
  }
  for (const c of COSMETICS) {
    if (c.source === 'shop') expect(c.priceBananas).toBeGreaterThan(0);
    if (c.source === 'milestone') expect(c.milestoneRule).toBeDefined();
    if (c.source === 'season') expect(c.seasonId).toBe('winter-arc-2026');
  }
});
```

(Test v `components/**/__tests__` smí importovat `@/data/*`: ESLint hranice se na testy nevztahuje stejně jako u `logic/__tests__`. Pokud lint zahlásí chybu, přidat do `eslint.config.js` `ignores: ['**/__tests__/**']` k UI pravidlu a zmínit v LOG.)

- [ ] **Step 2:** FAIL. **Step 3 [boss]:** `data/cosmetics.ts` podle tabulky, `riveInputs.ts`:

```ts
import type { CosmeticSlot } from '@/types';
import type { MascotProps } from './types';
const SLOTS: CosmeticSlot[] = ['outfit', 'accessory', 'mapBackground', 'lessonEffect', 'profileFrame'];
export function riveInputs(p: Pick<MascotProps, 'stage' | 'mood' | 'cosmetics'>, variantOf: (id: string) => number) {
  const numbers: Record<string, number> = { stage: p.stage };
  for (const s of SLOTS) { const id = p.cosmetics[s]; numbers[s] = id ? variantOf(id) : 0; }
  return { numbers, trigger: p.mood === 'idle' ? null : p.mood };
}
```

`RiveMascot.tsx` (celý obsah komentovaný podle §8, kompilovatelný):

```tsx
// Fáze 3: přechod na Rive. Postup je v README, sekce „Přechod na Rive“.
// rive-react-native neběží v Expo Go (potřebuje development build), proto je import zakomentovaný.
// import Rive, { type RiveRef } from 'rive-react-native';
//
// Mapování (spec §8):
//   stage       → number input `stage` (1–3)
//   mood        → trigger `happy` | `celebrate` | `sad`; idle = výchozí stav state machine
//   kosmetika   → number input pro každý slot = Cosmetic.variantIndex (0 = nic)
// Výpočet vstupů je v riveInputs.ts a je pokrytý testem.
//
// export function RiveMascot(props) {
//   const ref = useRef<RiveRef>(null);
//   const { numbers, trigger } = riveInputs(props, variantOf);
//   useEffect(() => { for (const [k, v] of Object.entries(numbers)) ref.current?.setInputState('Mascot', k, v); }, [numbers]);
//   useEffect(() => { if (trigger) ref.current?.fireState('Mascot', trigger); }, [trigger]);
//   return <Rive ref={ref} resourceName="opice" stateMachineName="Mascot" style={{ width: px, height: px }} />;
// }
import { SvgMascot } from './SvgMascot';
import type { MascotProps } from './types';
/** Stub: dokud neběží Rive, vykreslí SvgMascot se stejnými props. */
export function RiveMascot(props: MascotProps) { return <SvgMascot {...props} />; }
```

`index.tsx`: beze změny exportu (`SvgMascot as Mascot`), komentář odkazuje na `RiveMascot`.

- [ ] **Step 4 [boss]:** `theme/buildTheme.ts`: `Theme` dostane `seasonThemeId: SeasonThemeId | null`. `theme/palettes.ts`: token `seasonGold: '#C6A15B'` v obou paletách + `onSeasonGold: '#131316'`, kombinace do `contrast.test.ts`. PASS. Commit `feat(mascot): katalog kosmetiky, Rive stub, seasonThemeId v theme`.

- [ ] **Step 5 [design]: Vrstvy.** Každá vrstva kreslí v souřadnicích kotvy: `<G transform={`translate(${a.x} ${a.y}) scale(${a.scale})`}>`, tvar navržený pro stage 1 kolem bodu (0,0).
  - `OutfitTank` (body, front): tílko přes trup, `accent` jen jako tenký lem 3 px, výplň `ink` 85 %. Jediný kosmetický prvek s akcentem.
  - `OutfitHoodie` (body, front): mikina, `rule` + kapuce za hlavou (`neck`, back).
  - `OutfitScarf` a `SeasonScarf` (neck, front): stejný tvar šály, modrošedé neutrály ze `theme.seasonal.headerBase` / `mapRule`, třásně 3 obdélníky.
  - `AccHeadband` (head, front): pruh přes čelo nad očima, `text`.
  - `AccWristbands` (`hands`, front): dva kroužky na koncích paží. Kreslí se **uvnitř** skupiny paže, aby se zvedaly s celebrate.
  - `AccBelt` (body, front): pás v pase, `plate20`.
  - Pořadí: back vrstvy → tělo → front vrstvy (outfit → accessory).
- [ ] **Step 6 [design]:** `SvgMascot` čte `cosmetics.outfit` / `cosmetics.accessory` a `MASCOT_LAYERS`; neznámé id se tiše přeskočí. Screenshot: stage 1–3 s každou vrstvou, dark + light, a stage 3 celebrate s potítky (musí být na zvednutých rukou).
- [ ] **Step 7:** `npm test && npm run typecheck && npm run lint`. Commit `feat(mascot): kosmetické vrstvy a sezónní šála`.

---

### Task 18: Gate A (krok 3): QA + rating

**Vlastník:** qa-agent, rating-agent. Boss opravuje.

- [ ] **Step 1 [qa]:** `npm test && npm run typecheck && npm run lint` zelené, výstup do `docs/LOG.md`.
- [ ] **Step 2 [qa]:** Ověřit QA bod „stage podle prahů“: `logic/__tests__/mascot.test.ts` obsahuje hranice 499/500/1999/2000 a `anchors.test.ts` prochází pro 1–3. Doplnit případ `stageForXp(-10)` → 1 (poškozená data), pokud chybí.
- [ ] **Step 3 [qa]:** Ruční kontrola screenshotů: 4 nálady, 3 stage, kosmetika na kotvách ve všech stage (šála nesedí v obličeji stage 3, potítka se hýbou s rukama), reduce motion (web: `prefers-reduced-motion`).
- [ ] **Step 4 [rating]:** hodnocení 0–100 proti §8 a §6.7. Pokračovat jen při 100/100 (max 5 kol, max 3 kola QA).
- [ ] **Step 5:** Shrnutí kroku 3 do `docs/LOG.md` (hotovo, rozhodnutí agentů, otevřené, skóre, počet kol, „K ruční kontrole“).

---

# Krok 4 · Liga, Progres, Sezóna + recap, Šatník, notifikace

### Task 19: Schéma v2, contracts, `logic/activity`, streak rollover, taby

**Vlastník:** boss.

**Files:**
- Create: `logic/activity.ts`, `logic/__tests__/activity.test.ts`, `hooks/useNow.ts`, `hooks/useDisplayStage.ts`, `app/(tabs)/{league,progress,season,profile}.tsx` (kostry)
- Modify: `types/{user,season,league}.ts`, `services/contracts.ts`, `store/{migrate,db,settings}.ts`, `store/__tests__/migrate.test.ts`, `logic/{streak,completion,onboarding}.ts`, `logic/__tests__/{streak,completion}.test.ts`, `hooks/useProfileStats.ts`, `app/(tabs)/_layout.tsx`, `data/copy.ts`

**Interfaces:**
- Produces (typy):
  ```ts
  // types/user.ts (rozšíření UserProfile)
  leagueWeek: ISODate;                         // pondělí týdne, ve kterém uživatel právě soutěží
  lastLeagueResult: LeagueWeekResult | null;   // pro banner v Lize po vyhodnocení
  badges: string[];
  seasonClaims: Record<string, { at: string; cosmeticIds: string[]; badgeIds: string[] }>;
  // types/league.ts
  export type LeagueOutcome = 'promote' | 'stay' | 'demote';
  export interface LeagueWeekResult { weekStart: ISODate; rank: number; outcome: LeagueOutcome; fromTier: LeagueTierId; toTier: LeagueTierId }
  // types/season.ts: milestone cíl si pamatuje startovní hodnotu (recap „před“)
  | { kind: 'milestone'; label: string; target: number; unit: 'reps' | 'seconds'; current: number; start: number }
  ```
- Produces (contracts, nahradí stávající definice):
  ```ts
  export interface MilestoneUpdateResult { completed: boolean; unlockedCosmeticIds: string[] }
  UserService.updateMilestone(id: string, current: number): Promise<MilestoneUpdateResult>;
  UserService.grantDevXp(amount: number, now: Date): Promise<void>;
  export interface LeagueWeekView { tier: LeagueTierId; entries: LeagueEntry[]; promoteCount: number; demoteCount: number; endsAt: Date; weekStart: ISODate; myRank: number; lastResult: LeagueWeekResult | null }
  LeagueService.dismissLastResult(): Promise<void>;
  export type DayState = 'active' | 'repaired' | 'missed' | 'today' | 'future';
  export interface SeasonProgress { goal: SeasonGoal; value: number; target: number; met: boolean; reachable: boolean; daysLeft: number; repairWindow: ISODate[]; dayStates: { day: ISODate; state: DayState }[] }
  export interface SeasonStatus { season: Season; phase: 'active' | 'ended'; goal: SeasonGoal | null; claimed: boolean }
  SeasonService.getLatest(now: Date): Promise<SeasonStatus | null>;
  export interface RecapBeforeAfter { kind: 'weight' | 'milestone' | 'activeDays' | 'lessons'; before: number; after: number; unit: 'kg' | 'reps' | 'seconds' | 'days' | 'lessons'; label: string }
  export interface SeasonRecap { lessons: number; longestStreak: number; stageStart: MascotStage; stageEnd: MascotStage; beforeAfter: RecapBeforeAfter | null; rewardEarned: boolean; rewardCosmeticIds: string[]; badgeIds: string[] }
  export interface WardrobeItem { cosmetic: Cosmetic; unlocked: boolean; equipped: boolean; canBuy: BuyCheck }
  export interface WardrobeView { items: WardrobeItem[]; bananas: number; equipped: Partial<Record<CosmeticSlot, string>> }
  CosmeticsService.getWardrobe(): Promise<WardrobeView>;
  ```
  (`BuyCheck` z `logic/cosmetics.ts`, Task 28. Do té doby v contracts `type BuyCheck = 'ok' | 'owned' | 'notShop' | 'insufficient'` a Task 28 ho re-exportuje z logic.)
- Produces (logic):
  - `DEV_XP_LESSON_ID = 'dev-xp'`, `isLessonEvent(e: Pick<ActivityEvent, 'lessonId'>): boolean`, `lessonEventsBetween(events, from: ISODate, to: ISODate): ActivityEvent[]`, `xpBetween(events, from, to): number` v `logic/activity.ts`.
  - `activeDays` ve `streak.ts` ignoruje `dev-xp` události. `applyLessonCompletion` počítá `isFirstToday` jen z lekčních událostí.
- Produces (store): `DB_VERSION = 2`. `useSettings` dostane `reminderEnabled: boolean` (výchozí `false`), `reminderHour: number` (výchozí `18`), `stageOverride: MascotStage | null` (výchozí `null`) + settery. Settings `version: 2`, migrace doplní výchozí hodnoty.
- Produces (hooky): `useNow(intervalMs = 30_000): Date` (překreslí se v intervalu a po změně `devTimeOffsetMs`), `useDisplayStage(real: MascotStage): MascotStage` (vrací `stageOverride ?? real`).

- [ ] **Step 1: Testy `activity` + streak rollover + zameškaný den**

```ts
// logic/__tests__/activity.test.ts
import { DEV_XP_LESSON_ID, isLessonEvent, lessonEventsBetween, xpBetween } from '@/logic/activity';
const ev = (day: string, lessonId: string, xp: number) => ({ id: `${day}-${lessonId}`, at: `${day}T10:00:00.000Z`, day, lessonId, xp });
const events = [ev('2026-09-28', 'bc-1-1', 30), ev('2026-09-29', DEV_XP_LESSON_ID, 500), ev('2026-10-05', 'bc-1-2', 22)];
test('dev-xp není lekce', () => { expect(isLessonEvent({ lessonId: DEV_XP_LESSON_ID })).toBe(false); expect(isLessonEvent({ lessonId: 'bc-1-1' })).toBe(true); });
test('lekce v rozsahu včetně hranic, bez dev-xp', () => {
  expect(lessonEventsBetween(events, '2026-09-28', '2026-10-04').map((e) => e.lessonId)).toEqual(['bc-1-1']);
});
test('XP v rozsahu počítá i dev-xp (XP je XP)', () => { expect(xpBetween(events, '2026-09-28', '2026-10-04')).toBe(530); });
```

```ts
// logic/__tests__/streak.test.ts — doplnit
import { activeDays, currentStreak, isStreakBroken } from '@/logic/streak';
import { toISODate } from '@/logic/dates';
test('rollover: lekce 23:59 a 00:01 jsou dva po sobě jdoucí dny → streak 2', () => {
  const a = toISODate(new Date(2026, 9, 1, 23, 59)); const b = toISODate(new Date(2026, 9, 2, 0, 1));
  expect(currentStreak(activeDays([{ day: a }, { day: b }]), b)).toBe(2);
});
test('rollover přes konec měsíce', () => { expect(currentStreak(['2026-09-30', '2026-10-01'], '2026-10-01')).toBe(2); });
test('zameškaný den: aktivita předevčírem → streak 0 a broken', () => {
  const days = ['2026-09-28', '2026-09-29'];
  expect(currentStreak(days, '2026-10-01')).toBe(0); expect(isStreakBroken(days, '2026-10-01')).toBe(true);
});
test('včera aktivní, dnes ještě ne → streak drží, není broken', () => {
  expect(currentStreak(['2026-09-29', '2026-09-30'], '2026-10-01')).toBe(2); expect(isStreakBroken(['2026-09-30'], '2026-10-01')).toBe(false);
});
test('mezera uprostřed: počítá se jen poslední souvislý úsek', () => { expect(currentStreak(['2026-09-26', '2026-09-28', '2026-09-29'], '2026-09-29')).toBe(2); });
test('dev-xp den se nepočítá do aktivních dní', () => {
  expect(activeDays([{ day: '2026-09-29', lessonId: 'dev-xp' }, { day: '2026-09-30', lessonId: 'bc-1-1' }])).toEqual(['2026-09-30']);
});
```

`activeDays` se změní na `activeDays(events: Pick<ActivityEvent, 'day'> & Partial<Pick<ActivityEvent, 'lessonId'>>[]): ISODate[]` a filtruje `e.lessonId === undefined || isLessonEvent(e)`. Stávající volání (`{ day }`) zůstanou platná.

```ts
// logic/__tests__/completion.test.ts — doplnit
test('dev-xp dnes nezruší bonus za první lekci dne', () => {
  const profile = { ...baseProfile, activity: [{ id: 'd1', at: '2026-10-01T08:00:00.000Z', day: '2026-10-01', lessonId: 'dev-xp', xp: 500 }] };
  const { result } = applyLessonCompletion({ ...args, profile, now: new Date(2026, 9, 1, 12) });
  expect(result.xp.firstOfDay).toBe(10);
});
```
(`baseProfile`, `args` = existující fixture v souboru; pokud se jmenují jinak, použít je.)

```ts
// store/__tests__/migrate.test.ts — doplnit
test('v1 → v2 doplní leagueWeek (pondělí týdne založení), badges, seasonClaims, lastLeagueResult', () => {
  const v1 = { profile: { ...validV1Profile, createdAt: '2026-09-30T10:00:00.000Z' } };
  const { profile } = migrateDb(v1, 1);
  expect(profile).toMatchObject({ leagueWeek: '2026-09-28', badges: [], seasonClaims: {}, lastLeagueResult: null });
});
test('v1 milestone cíl sezóny dostane start = current', () => {
  const goal = { kind: 'milestone', label: '15 shybů', target: 15, unit: 'reps', current: 4 };
  const { profile } = migrateDb({ profile: { ...validV1Profile, seasonGoals: { 'winter-arc-2026': goal } } }, 1);
  expect(profile?.seasonGoals['winter-arc-2026']).toEqual({ ...goal, start: 4 });
});
test('equipped s neznámým id se zahodí', () => {
  const { profile } = migrateDb({ profile: { ...validV2Profile, equipped: { outfit: 'neexistuje', accessory: 'acc-headband' }, owned: ['acc-headband'] } }, 2);
  expect(profile?.equipped).toEqual({ accessory: 'acc-headband' });
});
```

(`validV1Profile` = existující fixture; `validV2Profile = { ...validV1Profile, leagueWeek: '2026-09-28', lastLeagueResult: null, badges: [], seasonClaims: {} }`.) Poslední test počítá se `sanitizeEquipped` z Tasku 28. V tomto tasku ho implementovat jen jako filtr neznámých id proti `COSMETICS` (store smí importovat `data/`); Task 28 ho nahradí plnou verzí z `logic/cosmetics.ts`.

- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementace**
  - `logic/activity.ts` podle Interfaces (`between` = `from <= day && day <= to`).
  - `streak.ts`, `completion.ts` (`isFirstToday = !events.some((e) => isLessonEvent(e) && e.day === day)`).
  - `buildInitialProfile`: `leagueWeek: weekStart(now)`, `lastLeagueResult: null`, `badges: []`, `seasonClaims: {}`.
  - `migrate.ts`: `if (version < 2) profile = upgradeV1(profile)`, `isProfile` kontroluje i nová pole, pak `sanitizeEquipped`. Neznámá vyšší verze → reset jako dřív.
  - `settings.ts`: nová pole a `migrate` pro `version < 2`.
  - `useProfileStats` beze změny API (filtr dev-xp je v `activeDays`).
- [ ] **Step 4: Taby.** `app/(tabs)/_layout.tsx`: `SHOW_TAB_BAR = true`, pořadí a ikony: Trénink `Dumbbell`, Liga `Trophy`, Progres `TrendingUp`, Sezóna `CalendarRange`, Profil `CircleUser` (vše `strokeWidth={1.5}`). `copy.tabs = { training: 'Trénink', league: 'Liga', progress: 'Progres', season: 'Sezóna', profile: 'Profil' }`. Nové taby jsou kostry: `<Screen>` s `TopBar`-like mono štítkem názvu a `ErrorState`-kompatibilní strukturou; skutečný obsah dodají Tasky 21, 24, 27, 28.
- [ ] **Step 5:** `npm test && npm run typecheck && npm run lint` → PASS. Smazat `services/mock/notImplemented.ts` až v Tasku 29 (poslední, kdo ho používá). Commit `feat: schéma v2, contracts plánu B, dev-xp mimo lekce, taby`.

---

### Task 20: `logic/league` (TDD)

**Vlastník:** boss.

**Files:**
- Create: `logic/league.ts`, `logic/__tests__/league.test.ts`, `data/leagueUsers.ts`
- Modify: `data/leagues.ts`

**Interfaces:**
- Consumes: `hashString`, `mulberry32`, `parseISODate`, `addDays`, `weekStart`, `xpBetween`.
- Produces:
  ```ts
  export interface Rival { userId: string; name: string; weeklyBase: number; stage: MascotStage; cosmetics: Partial<Record<CosmeticSlot, string>> }
  export interface LeagueRules { groupSize: number; promote: number; demote: number; tierXpStep: number; weeklyNoise: number }
  export const TIER_ORDER: readonly LeagueTierId[];                   // wood … diamond
  export function rivalWeekTotal(r: Rival, tier: LeagueTierId, week: ISODate, rules: LeagueRules): number;
  export function rivalXpAt(r: Rival, tier: LeagueTierId, week: ISODate, now: Date, rules: LeagueRules): number;
  export function standings(rivals: Rival[], me: Omit<LeagueEntry, 'isMe' | 'userId'>, tier: LeagueTierId, week: ISODate, now: Date, rules: LeagueRules): LeagueEntry[];
  export function resolveWeek(entries: LeagueEntry[], tier: LeagueTierId, rules: LeagueRules): { rank: number; outcome: LeagueOutcome };
  export function nextTier(tier: LeagueTierId, outcome: LeagueOutcome): LeagueTierId;
  export function settleLeague(p: Pick<UserProfile, 'leagueTier' | 'leagueWeek' | 'activity' | 'lastLeagueResult'>, rivals: Rival[], meView: { name: string; stage: MascotStage; cosmetics: Partial<Record<CosmeticSlot, string>> }, now: Date, rules: LeagueRules): Pick<UserProfile, 'leagueTier' | 'leagueWeek' | 'lastLeagueResult'>;
  export function formatCountdown(ms: number): { d: number; h: number; m: number };
  ```
- `data/leagues.ts`: `LEAGUE_RULES = { groupSize: 16, promote: 5, demote: 3, tierXpStep: 0.03, weeklyNoise: 0.08 } as const`.
- `data/leagueUsers.ts`: `LEAGUE_RIVALS: Rival[]`, přesně 15, `weeklyBase` v tomto pořadí: `520, 450, 390, 340, 260, 230, 200, 175, 150, 125, 100, 80, 60, 40, 20`. Přezdívky: `Kuba_Shyb, Terka.hold, Dan Dřep, Míša_plank, Honza L-sit, Bára Most, Vojta_dips, Anča Klik, Petr Pistol, Lucka_hang, Ondra Crow, Zuzka Výdrž, Filip_Band, Klára Core, Tom Bez Kliků`. Stage: první 3 = 3, dalších 6 = 2, zbytek 1. Kosmetika: rozprostřít `outfit-tank-ember`, `outfit-hoodie-chalk`, `acc-headband`, `acc-wristbands`, `acc-belt` tak, aby aspoň 8 soupeřů něco mělo a aspoň 4 nic.

**Kalibrace (§4 „2–3 lekce denně stačí na postupovou zónu“):** uživatel s 2 lekcemi denně bez streak bonusu má ≥ 7 × (20 + 10 + 20) = 350 XP. Páté nejvyšší XP skupiny je ≤ max(soupeři 5–15) ≤ 260 × (1 + 6 × 0.03) × 1.08 ≈ 331 < 350. Platí pro všechny úrovně včetně Zlata (Diamant nepostupuje).

- [ ] **Step 1: Testy**

```ts
import { LEAGUE_RULES as R } from '@/data/leagues';
import { LEAGUE_RIVALS } from '@/data/leagueUsers';
import { formatCountdown, nextTier, resolveWeek, rivalWeekTotal, rivalXpAt, settleLeague, standings, TIER_ORDER } from '@/logic/league';
import type { LeagueEntry, LeagueTierId } from '@/types';

const W = '2026-09-28'; // pondělí
const me = { name: 'Ty', xpThisWeek: 0, stage: 1 as const, cosmetics: {} };
const rival = LEAGUE_RIVALS[0]!;

test('data: přesně 15 soupeřů, skupina 16', () => { expect(LEAGUE_RIVALS).toHaveLength(15); expect(R.groupSize).toBe(16); });

test('determinismus: stejný vstup = stejné XP', () => {
  const now = new Date(2026, 8, 30, 15);
  expect(rivalXpAt(rival, 'iron', W, now, R)).toBe(rivalXpAt(rival, 'iron', W, now, R));
});
test('jiný týden → jiné XP (šum)', () => {
  expect(rivalWeekTotal(rival, 'iron', W, R)).not.toBe(rivalWeekTotal(rival, 'iron', '2026-10-05', R));
});
test('průběh týdne: 0 na začátku, monotónní, na konci = celkový součet', () => {
  expect(rivalXpAt(rival, 'wood', W, new Date(2026, 8, 28, 0, 0), R)).toBe(0);
  let prev = 0;
  for (let h = 0; h <= 7 * 24; h += 5) {
    const x = rivalXpAt(rival, 'wood', W, new Date(2026, 8, 28, h), R);
    expect(x).toBeGreaterThanOrEqual(prev); prev = x;
  }
  expect(rivalXpAt(rival, 'wood', W, new Date(2026, 9, 5, 0, 0), R)).toBe(rivalWeekTotal(rival, 'wood', W, R));
});

const entries = (xpMe: number, tier: LeagueTierId, week = W) =>
  standings(LEAGUE_RIVALS, { ...me, xpThisWeek: xpMe }, tier, week, new Date(2026, 9, 5, 0, 0), R);

test('standings: 16 řádků, seřazeno sestupně, přesně jeden isMe', () => {
  const e = entries(200, 'iron');
  expect(e).toHaveLength(16); expect(e.filter((x) => x.isMe)).toHaveLength(1);
  for (let i = 1; i < e.length; i++) expect(e[i - 1]!.xpThisWeek).toBeGreaterThanOrEqual(e[i]!.xpThisWeek);
});
test('remíza: uživatel se stejným XP je nad soupeřem', () => {
  const e = entries(0, 'iron'); const top = e.find((x) => !x.isMe)!;
  const tied = standings(LEAGUE_RIVALS, { ...me, xpThisWeek: top.xpThisWeek }, 'iron', W, new Date(2026, 9, 5), R);
  expect(tied[0]!.isMe).toBe(true);
});

test.each(TIER_ORDER.filter((t) => t !== 'diamond'))('kalibrace %s: 350 XP (2 lekce denně) = postupová zóna ve 12 týdnech', (tier) => {
  for (let w = 0; w < 12; w++) {
    const week = new Date(2026, 8, 28 + 7 * w); const iso = `${week.getFullYear()}-${String(week.getMonth() + 1).padStart(2, '0')}-${String(week.getDate()).padStart(2, '0')}`;
    expect(resolveWeek(entries(350, tier, iso), tier, R).outcome).toBe('promote');
  }
});

test('postup: 5. místo postupuje, 6. zůstává', () => {
  const at = (rank: number): LeagueEntry[] => Array.from({ length: 16 }, (_, i) => ({ userId: `u${i}`, name: '', xpThisWeek: 100 - i, stage: 1, cosmetics: {}, isMe: i === rank - 1 }));
  expect(resolveWeek(at(5), 'iron', R)).toEqual({ rank: 5, outcome: 'promote' });
  expect(resolveWeek(at(6), 'iron', R)).toEqual({ rank: 6, outcome: 'stay' });
  expect(resolveWeek(at(13), 'iron', R)).toEqual({ rank: 13, outcome: 'stay' });
  expect(resolveWeek(at(14), 'iron', R)).toEqual({ rank: 14, outcome: 'demote' });
  expect(resolveWeek(at(16), 'iron', R)).toEqual({ rank: 16, outcome: 'demote' });
});
test('v Dřevu se nesestupuje, v Diamantu se nepostupuje', () => {
  const at = (rank: number): LeagueEntry[] => Array.from({ length: 16 }, (_, i) => ({ userId: `u${i}`, name: '', xpThisWeek: 100 - i, stage: 1, cosmetics: {}, isMe: i === rank - 1 }));
  expect(resolveWeek(at(16), 'wood', R).outcome).toBe('stay');
  expect(resolveWeek(at(1), 'diamond', R).outcome).toBe('stay');
});
test('nextTier', () => {
  expect(nextTier('wood', 'promote')).toBe('stone'); expect(nextTier('stone', 'demote')).toBe('wood');
  expect(nextTier('diamond', 'promote')).toBe('diamond'); expect(nextTier('wood', 'demote')).toBe('wood');
  expect(nextTier('iron', 'stay')).toBe('iron');
});

const meView = { name: 'Ty', stage: 1 as const, cosmetics: {} };
const lessonsPerDay = (from: string, days: number, perDay: number, xp = 50) => Array.from({ length: days * perDay }, (_, i) => {
  const d = new Date(2026, 8, 28 + Math.floor(i / perDay)); const day = `2026-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { id: `e${i}`, at: d.toISOString(), day, lessonId: 'bc-1-1', xp };
});

test('settleLeague: stejný týden = beze změny (idempotentní)', () => {
  const p = { leagueTier: 'iron' as const, leagueWeek: W, activity: [], lastLeagueResult: null };
  expect(settleLeague(p, LEAGUE_RIVALS, meView, new Date(2026, 8, 30), R)).toEqual({ leagueTier: 'iron', leagueWeek: W, lastLeagueResult: null });
});
test('settleLeague: nový týden po aktivním týdnu → postup o jeden stupeň', () => {
  const p = { leagueTier: 'iron' as const, leagueWeek: W, activity: lessonsPerDay(W, 7, 1, 60), lastLeagueResult: null };
  const out = settleLeague(p, LEAGUE_RIVALS, meView, new Date(2026, 9, 6, 9), R);
  expect(out).toMatchObject({ leagueTier: 'bronze', leagueWeek: '2026-10-05', lastLeagueResult: { weekStart: W, outcome: 'promote', fromTier: 'iron', toTier: 'bronze' } });
});
test('settleLeague: po 3 týdnech nepřítomnosti se vyhodnotí jen poslední týden účasti (max o 1 stupeň)', () => {
  const p = { leagueTier: 'iron' as const, leagueWeek: W, activity: [], lastLeagueResult: null };
  const out = settleLeague(p, LEAGUE_RIVALS, meView, new Date(2026, 9, 21, 9), R);
  expect(out).toMatchObject({ leagueTier: 'stone', leagueWeek: '2026-10-19', lastLeagueResult: { outcome: 'demote' } });
});

test('formatCountdown', () => {
  expect(formatCountdown(((3 * 24 + 14) * 60 + 22) * 60_000 + 59_000)).toEqual({ d: 3, h: 14, m: 22 });
  expect(formatCountdown(-5)).toEqual({ d: 0, h: 0, m: 0 });
});
```

- [ ] **Step 2:** `npx jest logic/__tests__/league.test.ts` → FAIL.
- [ ] **Step 3: Implementace**

```ts
import type { ActivityEvent, CosmeticSlot, ISODate, LeagueEntry, LeagueOutcome, LeagueTierId, MascotStage, UserProfile } from '@/types';
import { xpBetween } from './activity';
import { addDays, parseISODate, weekStart } from './dates';
import { hashString, mulberry32 } from './random';

export const TIER_ORDER = ['wood', 'stone', 'iron', 'bronze', 'silver', 'gold', 'diamond'] as const satisfies readonly LeagueTierId[];
const DAY_MS = 86_400_000;

function rng(r: Rival, tier: LeagueTierId, week: ISODate) { return mulberry32(hashString(`${r.userId}|${week}|${tier}`)); }

export function rivalWeekTotal(r: Rival, tier: LeagueTierId, week: ISODate, rules: LeagueRules): number {
  const rnd = rng(r, tier, week);
  const noise = 1 + (rnd() * 2 - 1) * rules.weeklyNoise;
  return Math.round(r.weeklyBase * (1 + TIER_ORDER.indexOf(tier) * rules.tierXpStep) * noise);
}

export function rivalXpAt(r: Rival, tier: LeagueTierId, week: ISODate, now: Date, rules: LeagueRules): number {
  const total = rivalWeekTotal(r, tier, week, rules);
  const rnd = rng(r, tier, week); rnd(); // první číslo spotřeboval šum týdne
  const w = Array.from({ length: 7 }, () => 0.6 + rnd() * 0.8); // denní šum
  const sum = w.reduce((a, b) => a + b, 0);
  const elapsed = Math.min(Math.max((now.getTime() - parseISODate(week).getTime()) / DAY_MS, 0), 7);
  const full = Math.floor(elapsed);
  const cum = w.slice(0, full).reduce((a, b) => a + b, 0) + (full < 7 ? (w[full] ?? 0) * (elapsed - full) : 0);
  return full >= 7 ? total : Math.floor((total * cum) / sum);
}

export function standings(rivals: Rival[], me: Omit<LeagueEntry, 'isMe' | 'userId'>, tier: LeagueTierId, week: ISODate, now: Date, rules: LeagueRules): LeagueEntry[] {
  const rows: LeagueEntry[] = rivals.slice(0, rules.groupSize - 1).map((r) => ({
    userId: r.userId, name: r.name, stage: r.stage, cosmetics: r.cosmetics, isMe: false, xpThisWeek: rivalXpAt(r, tier, week, now, rules),
  }));
  rows.push({ ...me, userId: 'me', isMe: true });
  return rows.sort((a, b) => b.xpThisWeek - a.xpThisWeek || Number(b.isMe) - Number(a.isMe) || a.userId.localeCompare(b.userId));
}

export function resolveWeek(entries: LeagueEntry[], tier: LeagueTierId, rules: LeagueRules) {
  const rank = entries.findIndex((e) => e.isMe) + 1;
  const outcome: LeagueOutcome =
    rank <= rules.promote && tier !== 'diamond' ? 'promote'
    : rank > entries.length - rules.demote && tier !== 'wood' ? 'demote' : 'stay';
  return { rank, outcome };
}

export function nextTier(tier: LeagueTierId, outcome: LeagueOutcome): LeagueTierId {
  const i = TIER_ORDER.indexOf(tier) + (outcome === 'promote' ? 1 : outcome === 'demote' ? -1 : 0);
  return TIER_ORDER[Math.min(Math.max(i, 0), TIER_ORDER.length - 1)]!;
}

export function settleLeague(p, rivals, meView, now, rules) {
  const current = weekStart(now);
  if (p.leagueWeek >= current) return { leagueTier: p.leagueTier, leagueWeek: p.leagueWeek, lastLeagueResult: p.lastLeagueResult };
  const end = parseISODate(addDays(p.leagueWeek, 7));
  const xp = xpBetween(p.activity, p.leagueWeek, addDays(p.leagueWeek, 6));
  const { rank, outcome } = resolveWeek(standings(rivals, { ...meView, xpThisWeek: xp }, p.leagueTier, p.leagueWeek, end, rules), p.leagueTier, rules);
  const toTier = nextTier(p.leagueTier, outcome);
  return { leagueTier: toTier, leagueWeek: current, lastLeagueResult: { weekStart: p.leagueWeek, rank, outcome, fromTier: p.leagueTier, toTier } };
}

export function formatCountdown(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60_000));
  return { d: Math.floor(m / 1440), h: Math.floor((m % 1440) / 60), m: m % 60 };
}
```
(Signatura `settleLeague` s typy podle Interfaces.)

- [ ] **Step 4:** PASS. Pokud kalibrační test selže, upravit **jen** `weeklyBase` soupeřů 5–15 v `data/leagueUsers.ts` a zapsat do LOG proč.
- [ ] **Step 5:** Commit `feat(logic): liga — soupeři, pořadí, postup a sestup`.

---

### Task 21: Liga — služba, hook, obrazovka

**Vlastník:** boss (služba, hook, obrazovka se strukturou), design-agent (komponenty `league/`), motion-agent (banner výsledku, odpočet).

**Files:**
- Create: `hooks/useLeague.ts`, `components/league/{LeagueRow,ZoneDivider,Countdown,TierBadge,LeagueResultBanner}.tsx`
- Modify: `services/mock/MockLeagueService.ts`, `app/(tabs)/league.tsx`, `app/(tabs)/index.tsx` (TopBar TierBadge beze změny API), `data/copy.ts`

**Interfaces:**
- Consumes: `settleLeague`, `standings`, `resolveWeek`, `weekEndsAt`, `xpBetween`, `stageForXp`, `LEAGUE_RIVALS`, `LEAGUE_RULES`, `useDisplayStage`, `useNow`.
- Produces: `MockLeagueService.getCurrentWeek(now)`:
  1. Načte profil, zavolá `settleLeague`. Pokud se něco změnilo, zapíše profil (`setProfile`).
  2. Sestaví `standings` pro aktuální týden s `xpBetween(activity, week, week+6)`, jménem `copy.league.me` („Ty“), stage z celkového XP a `profile.equipped`.
  3. Vrátí `LeagueWeekView` (`promoteCount: tier === 'diamond' ? 0 : 5`, `demoteCount: tier === 'wood' ? 0 : 3`, `endsAt = weekEndsAt(now)`, `myRank`, `lastResult`).
  - `dismissLastResult()` nastaví `lastLeagueResult: null`.
- `useLeague() = useServiceQuery(() => services.league.getCurrentWeek(now()), [weekStart(now())])`.
- Copy: `league = { me: 'Ty', promote: '▲ POSTUP', demote: '▼ SESTUP', explainer: 'XP za lekce a pravidelnost, ne za výkon.', endsIn: 'KONEC TÝDNE', result: { promote: (tier) => `Postup do ligy ${tier}.`, stay: (tier) => `Zůstáváš v lize ${tier}.`, demote: (tier) => `Sestup do ligy ${tier}. Tenhle týden to otočíš.` }, errorWhat: 'ligu' }`. (`▲▼` jsou typografické znaky, ne emoji.)

- [ ] **Step 1 [boss]:** Implementovat službu a hook. Test služby `services/__tests__/MockLeagueService.test.ts`: s profilem `leagueWeek` o týden starším a 7 × 60 XP aktivitou vrátí `tier` o stupeň vyšší, `lastResult.outcome === 'promote'` a druhé volání už profil nemění (`revision` stejný).
- [ ] **Step 2 [boss]:** `app/(tabs)/league.tsx`: loading / error (`ErrorState` s „Nepodařilo se načíst ligu. Zkusit znovu.“) / ready. `FlatList` 16 řádků, `ZoneDivider` za indexem `promoteCount - 1` a před indexem `16 - demoteCount` (jen když `> 0`), pod seznamem vysvětlivka.
- [ ] **Step 3 [design]:** podle §7.5:
  - `TierBadge`: kruh 72 pt, obrys `rule` 1.5, název úrovně v Bebas uvnitř, mono štítek `LIGA` nad ním.
  - `Countdown`: `3D 14H 22M` tabulární mono/Bebas, štítek `KONEC TÝDNE`.
  - `LeagueRow` výška 56: pořadí (Bebas, tabulární, šířka 32), `Mascot size={32}` s kosmetikou a `mood="idle"` (bez dechu: statický vzhled, viz motion), jméno Inter 600, XP vpravo tabulární. Vlastní řádek: pozadí `raised` + akcentový proužek 3 px vlevo. Nic jiného (jedna oddělovací technika).
  - `ZoneDivider`: mono štítek `▲ POSTUP` / `▼ SESTUP` v `muted`, hairline `rule`, zóna `success`/`danger` jen v barvě trojúhelníku (§6.2 „tlumené, jen liga“).
- [ ] **Step 4 [motion]:**
  - `Countdown` přes `useNow(30_000)`.
  - `LeagueResultBanner` (když `lastResult`): vysune se nahoře (`withTiming` motion.ui), u postupu TierBadge nové úrovně naskočí pružinou `motion.pop` + `haptics.success()`. Zavření volá `dismissLastResult`.
  - Po otevření tabu se seznam odscrolluje, aby byl vlastní řádek viditelný (`scrollToIndex`, `viewPosition: 0.5`).
  - Mini opice v řádcích: prop `static` do `Mascot`? **Ne**, rozhraní maskota se nemění. Místo toho `LeagueRow` obalí maskota do `View` s `pointerEvents="none"` a dech se nechá běžet (16 malých animací je v pořádku pro reanimated na UI vlákně). Pokud profil ukáže pád FPS pod 55 na webu, zapsat do LOG jako „K ruční kontrole“.
- [ ] **Step 5:** Screenshoty dark/light: Dřevo (bez sestupu), Železo, Diamant (bez postupu), banner postupu. Commit `feat: liga`.

---

### Task 22: TDD `logic/season` — comeback okno (a oprava v dokončení lekce)

**Vlastník:** boss.

**Files:**
- Create: `logic/season.ts` (první část), `logic/__tests__/season.test.ts`
- Modify: `logic/completion.ts`, `logic/__tests__/completion.test.ts`, `data/seasons.ts`, `services/mock/MockLessonService.ts`

**Interfaces:**
- Produces:
  ```ts
  // data/seasons.ts
  export const SEASON_RULES = { repairWindowDays: 3 } as const;
  // logic/season.ts
  export interface SeasonSpan { startDate: ISODate; endDate: ISODate }
  export function seasonDays(s: SeasonSpan): ISODate[];                 // včetně obou krajů
  export function repairableDays(events: ActivityEvent[], s: SeasonSpan, today: ISODate, windowDays: number, joinedDay: ISODate): ISODate[]; // nejstarší první
  export function repairTarget(eventsBefore: ActivityEvent[], s: SeasonSpan | null, today: ISODate, windowDays: number, joinedDay: ISODate): ISODate | null;
  // logic/completion.ts — Args rozšířit (volitelné, kvůli testům plánu A):
  season?: SeasonSpan | null; repairWindowDays?: number;
  ```
- Pravidla (§4 Comeback):
  - Okno = dny `today-1 … today-windowDays`, oříznuté na `[startDate, endDate]` sezóny a na `>= joinedDay` (den založení profilu).
  - Den je zameškaný, když v něm není žádná lekční událost (`isLessonEvent`) a žádná událost s `repairsDate === den`.
  - Opravuje **druhá a každá další** lekce dne (i opakování, ne `dev-xp`). Opraví nejstarší den z okna.
  - Oprava nemění streak (streak počítá jen skutečné dny aktivity, §4 Streak). Oprava platí jen pro cíl sezóny.

- [ ] **Step 1: Testy**

```ts
// logic/__tests__/season.test.ts (část 1)
import { repairableDays, repairTarget, seasonDays } from '@/logic/season';
const S = { startDate: '2026-09-28', endDate: '2026-12-26' };
const ev = (day: string, lessonId = 'bc-1-1', repairsDate?: string) => ({ id: `${day}-${Math.random()}`, at: `${day}T10:00:00.000Z`, day, lessonId, xp: 20, ...(repairsDate ? { repairsDate } : {}) });

test('Winter Arc má 90 dní', () => { expect(seasonDays(S)).toHaveLength(90); });

test('okno je max 3 dny zpětně, nejstarší první', () => {
  // aktivní jen 28. 9.; dnes 5. 10. → zameškané 29.9.–4.10., opravitelné jen 2.–4. 10.
  expect(repairableDays([ev('2026-09-28')], S, '2026-10-05', 3, '2026-09-28')).toEqual(['2026-10-02', '2026-10-03', '2026-10-04']);
});
test('den 4 dny zpátky už opravit nejde', () => {
  expect(repairableDays([ev('2026-10-02'), ev('2026-10-03'), ev('2026-10-04')], S, '2026-10-05', 3, '2026-09-28')).toEqual([]);
});
test('opravený den už v okně není', () => {
  expect(repairableDays([ev('2026-10-05', 'bc-1-2', '2026-10-02')], S, '2026-10-05', 3, '2026-09-28')).toEqual(['2026-10-03', '2026-10-04']);
});
test('dny před začátkem sezóny a před založením profilu se neopravují', () => {
  expect(repairableDays([], S, '2026-09-29', 3, '2026-09-20')).toEqual(['2026-09-28']);
  expect(repairableDays([], S, '2026-10-05', 3, '2026-10-04')).toEqual(['2026-10-04']);
});
test('dev-xp den je pořád zameškaný', () => {
  expect(repairableDays([ev('2026-10-04', 'dev-xp')], S, '2026-10-05', 3, '2026-09-28')).toContain('2026-10-04');
});
test('mimo sezónu (null) se neopravuje nic', () => { expect(repairTarget([ev('2026-10-05')], null, '2026-10-05', 3, '2026-09-28')).toBeNull(); });
test('první lekce dne neopravuje, druhá opraví nejstarší', () => {
  expect(repairTarget([], S, '2026-10-05', 3, '2026-09-28')).toBeNull();
  expect(repairTarget([ev('2026-10-05')], S, '2026-10-05', 3, '2026-09-28')).toBe('2026-10-02');
});
test('dev-xp dnes se jako „první lekce“ nepočítá', () => {
  expect(repairTarget([ev('2026-10-05', 'dev-xp')], S, '2026-10-05', 3, '2026-09-28')).toBeNull();
});
```

```ts
// logic/__tests__/completion.test.ts — doplnit
const season = { startDate: '2026-09-28', endDate: '2026-12-26' };
test('druhá lekce dne zapíše repairsDate nejstaršího zameškaného dne v okně', () => {
  const p1 = applyLessonCompletion({ ...args, season, repairWindowDays: 3, now: new Date(2026, 9, 5, 10), attemptId: 'a1' }).profile;
  const p2 = applyLessonCompletion({ ...args, profile: p1, season, repairWindowDays: 3, now: new Date(2026, 9, 5, 18), attemptId: 'a2' }).profile;
  expect(p1.activity.at(-1)?.repairsDate).toBeUndefined();
  expect(p2.activity.at(-1)?.repairsDate).toBe('2026-10-02');
});
test('comeback přes půlnoc: lekce 23:50 a 00:05 jsou první lekce dvou různých dní → žádná oprava', () => {
  const p1 = applyLessonCompletion({ ...args, season, repairWindowDays: 3, now: new Date(2026, 9, 4, 23, 50), attemptId: 'a1' }).profile;
  const p2 = applyLessonCompletion({ ...args, profile: p1, season, repairWindowDays: 3, now: new Date(2026, 9, 5, 0, 5), attemptId: 'a2' }).profile;
  expect(p2.activity.map((e) => e.repairsDate)).toEqual([undefined, undefined]);
});
test('bez season parametru se chování plánu A nemění', () => {
  const p1 = applyLessonCompletion({ ...args, attemptId: 'a1' }).profile;
  const p2 = applyLessonCompletion({ ...args, profile: p1, attemptId: 'a2' }).profile;
  expect(p2.activity.at(-1)?.repairsDate).toBeUndefined();
});
test('retry se stejným attemptId nevytvoří druhou opravu', () => {
  const p1 = applyLessonCompletion({ ...args, season, repairWindowDays: 3, now: new Date(2026, 9, 5, 10), attemptId: 'a1' }).profile;
  const p2 = applyLessonCompletion({ ...args, profile: p1, season, repairWindowDays: 3, now: new Date(2026, 9, 5, 18), attemptId: 'a2' }).profile;
  const p3 = applyLessonCompletion({ ...args, profile: p2, season, repairWindowDays: 3, now: new Date(2026, 9, 5, 19), attemptId: 'a2' }).profile;
  expect(p3).toBe(p2);
});
```
(`args.profile.createdAt` ve fixture musí být ≤ 2026-09-28; pokud není, přepsat v těchto testech `profile: { ...args.profile, createdAt: '2026-09-20T08:00:00.000Z' }`.)

- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementace**

```ts
export function seasonDays(s: SeasonSpan): ISODate[] {
  const n = diffDays(s.endDate, s.startDate) + 1;
  return Array.from({ length: n }, (_, i) => addDays(s.startDate, i));
}
export function repairableDays(events: ActivityEvent[], s: SeasonSpan, today: ISODate, windowDays: number, joinedDay: ISODate): ISODate[] {
  const active = new Set(events.filter(isLessonEvent).map((e) => e.day));
  const repaired = new Set(events.flatMap((e) => (e.repairsDate ? [e.repairsDate] : [])));
  const out: ISODate[] = [];
  for (let k = windowDays; k >= 1; k--) {
    const d = addDays(today, -k);
    if (d < s.startDate || d > s.endDate || d < joinedDay) continue;
    if (!active.has(d) && !repaired.has(d)) out.push(d);
  }
  return out;
}
export function repairTarget(before: ActivityEvent[], s: SeasonSpan | null, today: ISODate, windowDays: number, joinedDay: ISODate): ISODate | null {
  if (!s || today < s.startDate || today > s.endDate) return null;
  if (!before.some((e) => isLessonEvent(e) && e.day === today)) return null;
  return repairableDays(before, s, today, windowDays, joinedDay)[0] ?? null;
}
```

V `applyLessonCompletion` (jen pro nový pokus, ne retry): `const repairsDate = repairTarget(events, a.season ?? null, day, a.repairWindowDays ?? 3, toISODate(new Date(a.profile.createdAt)))` a do události `...(repairsDate ? { repairsDate } : {})`.

`MockLessonService.completeLesson`: předá `season: SEASONS.find(aktivní dle now) ?? null`, `repairWindowDays: SEASON_RULES.repairWindowDays`.

- [ ] **Step 4:** PASS. Commit `feat(logic): comeback — oprava zameškaného dne sezóny`.

---

### Task 23: TDD `logic/season` — progres cíle, dosažitelnost, recap, odměna

**Vlastník:** boss.

**Files:**
- Modify: `logic/season.ts`, `logic/__tests__/season.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface SeasonCtx { events: ActivityEvent[]; weights: WeightEntry[]; season: Season; today: ISODate; joinedDay: ISODate; windowDays: number }
  export function goalTarget(g: SeasonGoal): number;              // weight → |deltaKg|
  export function goalValue(g: SeasonGoal, ctx: SeasonCtx): number;
  export function weightBaseline(weights: WeightEntry[], s: SeasonSpan): number | null;
  export function dayStates(ctx: SeasonCtx): { day: ISODate; state: DayState }[];
  export function seasonProgress(g: SeasonGoal, ctx: SeasonCtx): SeasonProgress;
  export function buildRecap(g: SeasonGoal | null, ctx: SeasonCtx & { thresholds: readonly number[]; weightGoal: WeightGoal }): SeasonRecap;
  export function rewardFor(met: boolean, s: Season): { cosmeticIds: string[]; badgeIds: string[] };
  export function participationBadgeId(s: Season): string;       // `${s.badgeId}-ucast`
  export function applyClaim(p: Pick<UserProfile, 'owned' | 'badges' | 'seasonClaims'>, seasonId: string, reward: { cosmeticIds: string[]; badgeIds: string[] }, at: string): Pick<UserProfile, 'owned' | 'badges' | 'seasonClaims'>;
  ```
- Pravidla:
  - `activeDays`: |{lekční dny v sezóně ≤ today} ∪ {repairsDate v sezóně}|. `lessons`: počet lekčních událostí se dnem v sezóně. `milestone`: `goal.current`. `weight`: `latest − baseline` ve směru cíle (`deltaKg < 0` → `baseline − latest`), zaokrouhleno na 0.1. Bez vah → 0.
  - `weightBaseline`: první záznam s `weekStart >= weekStart(startDate)`; když není, poslední záznam před ním; když není nic, `null`. `latest` = poslední záznam s `weekStart <= endDate`.
  - `met = value >= target`.
  - `reachable`: jen `activeDays` může být matematicky nedosažitelný: `value + zbývající dny (dnes, pokud dnes ještě není aktivní, + budoucí dny sezóny) + repairWindow.length >= target`. Ostatní typy `true`.
  - `daysLeft = max(0, diffDays(endDate, today) + 1)` (dnešek se počítá). Po konci sezóny 0.
  - `dayStates`: pro každý den sezóny: `today` (dnes, přednost), `active`, `repaired`, `future` (> today), jinak `missed` (včetně dnů před založením profilu — v UI obrys, ale nejsou v okně oprav).
  - Recap `beforeAfter`: weight cíl → `{ kind: 'weight', before: baseline, after: latest, unit: 'kg' }`; milestone → `{ before: goal.start, after: goal.current, unit: goal.unit }`; activeDays/lessons → `{ before: 0, after: value, unit: 'days' | 'lessons' }`; bez cíle a s `weightGoal` lose/gain → weight; jinak `null`. `label`: u milestone vlastní název `goal.label`, jinak klíč `'weight' | 'activeDays' | 'lessons'`. Text si UI vezme z `copy.recap.labels`.
  - `longestStreak` v recapu = nejdelší streak z lekčních dnů uvnitř sezóny. `stageStart` z XP událostí se dnem `< startDate`, `stageEnd` z XP se dnem `<= endDate`.
  - `rewardFor(met)`: vždy `badgeIds` obsahuje `participationBadgeId`. Při `met` navíc `s.badgeId` a `cosmeticIds = s.rewardCosmeticIds`.
  - `applyClaim`: když `seasonClaims[seasonId]` existuje, vrátí vstup beze změny (idempotence). Jinak přidá id do `owned`/`badges` bez duplicit.

- [ ] **Step 1: Testy** (připsat do `season.test.ts`)

```ts
import { applyClaim, buildRecap, dayStates, goalTarget, goalValue, participationBadgeId, rewardFor, seasonProgress, weightBaseline } from '@/logic/season';
import { STAGE_THRESHOLDS } from '@/data/xp';
import { SEASONS } from '@/data/seasons';
const season = SEASONS[0]!;
const ctx = (over: Partial<Parameters<typeof seasonProgress>[1]> = {}) => ({ events: [], weights: [], season, today: '2026-10-05', joinedDay: '2026-09-28', windowDays: 3, ...over });

describe('goalValue všech typů', () => {
  const events = [ev('2026-09-28'), ev('2026-09-28', 'bc-1-2'), ev('2026-09-29'), ev('2026-10-01', 'bc-1-3', '2026-09-30'), ev('2026-09-27'), ev('2026-10-02', 'dev-xp')];
  test('activeDays = aktivní + opravené dny v sezóně, bez dev-xp a dnů před sezónou', () => {
    expect(goalValue({ kind: 'activeDays', days: 60 }, ctx({ events }))).toBe(4); // 28, 29, 30 (oprava), 1
  });
  test('lessons = lekční události v sezóně', () => { expect(goalValue({ kind: 'lessons', count: 50 }, ctx({ events }))).toBe(4); });
  test('milestone = ručně zadaná hodnota', () => {
    expect(goalValue({ kind: 'milestone', label: '15 shybů', target: 15, unit: 'reps', current: 7, start: 3 }, ctx())).toBe(7);
  });
  test('weight = rozdíl od první váhy v sezóně ve směru cíle', () => {
    const weights = [{ weekStart: '2026-09-21', kg: 85 }, { weekStart: '2026-09-28', kg: 84 }, { weekStart: '2026-10-05', kg: 82.4 }];
    expect(goalValue({ kind: 'weight', deltaKg: -4 }, ctx({ weights }))).toBe(1.6);
    expect(goalValue({ kind: 'weight', deltaKg: 3 }, ctx({ weights }))).toBe(-1.6);
  });
  test('weightBaseline: bez záznamu v sezóně bere poslední před ní, bez vah null', () => {
    expect(weightBaseline([{ weekStart: '2026-09-14', kg: 90 }, { weekStart: '2026-09-21', kg: 89 }], season)).toBe(89);
    expect(weightBaseline([], season)).toBeNull();
    expect(goalValue({ kind: 'weight', deltaKg: -4 }, ctx())).toBe(0);
  });
  test('goalTarget: weight bere absolutní hodnotu', () => { expect(goalTarget({ kind: 'weight', deltaKg: -4 })).toBe(4); });
});

describe('vyhodnocení cíle', () => {
  test('přesně 100 % = splněno', () => {
    expect(seasonProgress({ kind: 'lessons', count: 2 }, ctx({ events: [ev('2026-09-28'), ev('2026-09-29')] })).met).toBe(true);
  });
  test('99 % = nesplněno', () => {
    expect(seasonProgress({ kind: 'lessons', count: 3 }, ctx({ events: [ev('2026-09-28'), ev('2026-09-29')] })).met).toBe(false);
  });
  test('activeDays nedosažitelný jen když nestačí ani zbývající dny + okno oprav', () => {
    // 90denní sezóna, 12. 12.: zbývá 15 dní vč. dneška, okno 3 dny, 0 aktivních → max 18
    const late = ctx({ today: '2026-12-12' });
    expect(seasonProgress({ kind: 'activeDays', days: 18 }, late).reachable).toBe(true);
    expect(seasonProgress({ kind: 'activeDays', days: 19 }, late).reachable).toBe(false);
    expect(seasonProgress({ kind: 'activeDays', days: 19 }, late).repairWindow).toHaveLength(3);
  });
  test('lessons/milestone/weight jsou vždy dosažitelné', () => {
    expect(seasonProgress({ kind: 'lessons', count: 999 }, ctx({ today: '2026-12-26' })).reachable).toBe(true);
  });
  test('daysLeft počítá dnešek, po konci 0', () => {
    expect(seasonProgress({ kind: 'lessons', count: 1 }, ctx({ today: '2026-12-26' })).daysLeft).toBe(1);
    expect(seasonProgress({ kind: 'lessons', count: 1 }, ctx({ today: '2026-12-30' })).daysLeft).toBe(0);
  });
});

test('dayStates: 90 dní, dnes má přednost, opravené, zameškané, budoucí', () => {
  const s = dayStates(ctx({ events: [ev('2026-09-28'), ev('2026-10-05'), ev('2026-10-05', 'bc-1-2', '2026-09-30')] }));
  const at = (d: string) => s.find((x) => x.day === d)?.state;
  expect(s).toHaveLength(90);
  expect([at('2026-09-28'), at('2026-09-29'), at('2026-09-30'), at('2026-10-05'), at('2026-10-06')]).toEqual(['active', 'missed', 'repaired', 'today', 'future']);
});

describe('recap', () => {
  const events = [ev('2026-09-20', 'bc-1-1'), ...Array.from({ length: 5 }, (_, i) => ev(`2026-10-0${i + 1}`))].map((e, i) => ({ ...e, xp: i === 0 ? 450 : 30 }));
  const r = buildRecap({ kind: 'milestone', label: '15 shybů', target: 15, unit: 'reps', current: 12, start: 4 },
    { ...ctx({ events, today: '2026-12-27' }), thresholds: STAGE_THRESHOLDS, weightGoal: { kind: 'none' } });
  test('počty a stage', () => { expect(r).toMatchObject({ lessons: 5, longestStreak: 5, stageStart: 1, stageEnd: 2 }); });
  test('před/po milestone', () => { expect(r.beforeAfter).toEqual({ kind: 'milestone', before: 4, after: 12, unit: 'reps', label: '15 shybů' }); });
  test('nesplněno: bez šály, ale s odznakem účasti', () => {
    expect(r.rewardEarned).toBe(false); expect(r.rewardCosmeticIds).toEqual([]); expect(r.badgeIds).toEqual([participationBadgeId(season)]);
  });
  test('bez cíle a bez váhového cíle → beforeAfter null', () => {
    expect(buildRecap(null, { ...ctx({ today: '2026-12-27' }), thresholds: STAGE_THRESHOLDS, weightGoal: { kind: 'none' } }).beforeAfter).toBeNull();
  });
});

test('rewardFor: splněno = šála + odznak + odznak účasti', () => {
  expect(rewardFor(true, season)).toEqual({ cosmeticIds: ['outfit-winter-arc-scarf'], badgeIds: ['badge-winter-arc-2026-ucast', 'badge-winter-arc-2026'] });
});
test('applyClaim je idempotentní a bez duplicit', () => {
  const p0 = { owned: ['acc-headband'], badges: [], seasonClaims: {} };
  const p1 = applyClaim(p0, season.id, rewardFor(true, season), '2026-12-27T09:00:00.000Z');
  const p2 = applyClaim(p1, season.id, rewardFor(true, season), '2026-12-28T09:00:00.000Z');
  expect(p2).toBe(p1);
  expect(p1.owned).toEqual(['acc-headband', 'outfit-winter-arc-scarf']);
  expect(p1.badges).toEqual(['badge-winter-arc-2026-ucast', 'badge-winter-arc-2026']);
});
```

(`ev` helper je nahoře v souboru z Tasku 22.)

- [ ] **Step 2:** FAIL. **Step 3:** Implementovat podle pravidel výše. `buildRecap.rewardEarned = seasonProgress(g, ctx).met` (bez cíle `false`). **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(logic): cíl sezóny, recap a odměna`.

---

### Task 24: Sezóna — služba, hooky, tab Sezóna, nastavení cíle

**Vlastník:** boss (služba, hooky, routy), design-agent (`components/season/*`, `DotGrid`, `ProgressBar`), motion-agent (vstup Statu, „Lock in“).

**Files:**
- Create: `hooks/{useSeasonStatus,useSeasonProgress}.ts`, `components/ui/{DotGrid,ProgressBar}.tsx`, `components/season/{SeasonHeader,SeasonGoalCard,ComebackCard,RewardCard}.tsx`, `app/season-goal.tsx`, `logic/__tests__/seasonGoalInput.test.ts`
- Modify: `services/mock/MockSeasonService.ts`, `app/(tabs)/season.tsx`, `app/_layout.tsx` (Stack.Screen `season-goal` jako `modal`), `data/copy.ts`, `logic/season.ts`

**Interfaces:**
- Produces:
  - `MockSeasonService`:
    - `getActive(now)` beze změny.
    - `getLatest(now)`: aktivní sezóna → `phase: 'active'`; jinak poslední sezóna s `endDate < today` → `'ended'`; jinak `null`. `goal = profile.seasonGoals[id] ?? null`, `claimed = id in profile.seasonClaims`.
    - `setGoal(seasonId, goal)`: validuje přes `validateSeasonGoal`, u `milestone` bez `start` doplní `start = current`. Po konci sezóny cíl měnit nejde (throw).
    - `getProgress(seasonId, now)`: `seasonProgress` s ctx z profilu (`joinedDay = toISODate(new Date(createdAt))`, `windowDays = SEASON_RULES.repairWindowDays`). Bez cíle throw `Error('Cíl sezóny chybí.')` (UI ho bez cíle nevolá).
    - `getRecap`, `claimReward` → Task 25.
  - `validateSeasonGoal(g: SeasonGoal): 'ok' | 'daysRange' | 'countRange' | 'targetRange' | 'deltaRange'` v `logic/season.ts`: activeDays 1–90 (a ≤ délka sezóny), lessons 1–500, milestone target 1–1000 a `current >= 0`, weight `0 < |deltaKg| <= 30`.
  - `useSeasonStatus()`, `useSeasonProgress(seasonId | undefined)` (disabled bez id).
  - `DotGrid({ cells: { key: string; state: 'filled' | 'outline' | 'empty' | 'accent' | 'soft' }[]; columns: number; size?: number })`: `soft` = opravený den (plná tečka `muted`).
  - `ProgressBar({ value: number; max: number })`.
- Copy (`copy.season`): `lockIn: 'Lock in'`, `lockInBody: 'Vyber si jeden cíl na celou sezónu.'`, `daysLeftUnit: 'DNÍ'`, `goalKinds: { activeDays: 'Dny bez vynechání', lessons: 'Počet lekcí', milestone: 'Milník', weight: 'Váha' }`, `comebackTitle: 'Dohnat to jde'`, `comebackBody: (n) => `Zameškaný den opravíš druhou lekcí dne. V okně: ${n} ${czPlural(n, 'den', 'dny', 'dní')}.``, `comebackEmpty: 'Nic k dohnání.'`, `rewardTitle: 'Odměna'`, `rewardNever: 'Už nikdy nevyjde'`, `recapCta: 'Tvůj recap'`, `errorWhat: 'sezónu'`, `goalErrors: {...}` pro kódy z `validateSeasonGoal`. `czPlural(n, one, few, many)` přidat do `data/copy.ts` (1 → one, 2–4 → few, jinak many).

- [ ] **Step 1 [boss]: Test `validateSeasonGoal`** (`logic/__tests__/seasonGoalInput.test.ts`)

```ts
import { validateSeasonGoal } from '@/logic/season';
test.each([
  [{ kind: 'activeDays', days: 60 }, 'ok'], [{ kind: 'activeDays', days: 0 }, 'daysRange'], [{ kind: 'activeDays', days: 91 }, 'daysRange'],
  [{ kind: 'lessons', count: 120 }, 'ok'], [{ kind: 'lessons', count: 0 }, 'countRange'],
  [{ kind: 'milestone', label: '15 shybů', target: 15, unit: 'reps', current: 3, start: 3 }, 'ok'],
  [{ kind: 'milestone', label: 'x', target: 0, unit: 'reps', current: 0, start: 0 }, 'targetRange'],
  [{ kind: 'weight', deltaKg: -4 }, 'ok'], [{ kind: 'weight', deltaKg: 0 }, 'deltaRange'], [{ kind: 'weight', deltaKg: 31 }, 'deltaRange'],
] as const)('%j → %s', (g, r) => { expect(validateSeasonGoal(g)).toBe(r); });
```
FAIL → implementovat → PASS.
- [ ] **Step 2 [boss]:** Služba + hooky + test `services/__tests__/MockSeasonService.test.ts`: `getLatest` vrací `active` v 2026-10-05, `ended` v 2026-12-27, `setGoal` po konci hodí chybu, `setGoal` milestone doplní `start`.
- [ ] **Step 3 [boss]: `app/(tabs)/season.tsx`** (§7.7):
  - `null` → prázdný stav „Teď neběží žádná sezóna.“.
  - `active` + bez cíle → `SeasonHeader` + karta „Lock in“ → `router.push('/season-goal')`.
  - `active` + cíl → `Stat` `34 / 60 DNÍ` (jednotka podle typu: `DNÍ`, `LEKCÍ`, `OPAKOVÁNÍ`/`SEKUND`, `KG`), `DotGrid` 90 dní po 7 sloupcích (týdny), `ComebackCard` (když `!reachable` nebo `repairWindow.length > 0`), `RewardCard`. Milestone cíl má tlačítko „Zapsat hodnotu“ (numerické pole, `setGoal({ ...goal, current })`).
  - `ended` → hlavička + CTA „Tvůj recap“ → `/season-recap?seasonId=…`.
  - Mapování `dayStates` → `DotGrid`: active `filled`, repaired `soft`, missed `outline`, today `accent`, future `empty`.
- [ ] **Step 4 [boss]: `app/season-goal.tsx`**: `SegmentedControl` 4 typů (na úzkém displeji 2×2 karty), hodnota přes `TextField` (numeric, čárka povolena přes `parseWeight`-style parser: pro weight `parseWeight`, jinak celé číslo), pro milestone výběr z `profile.milestones` (label, target, unit) nebo vlastní. Chyba z `validateSeasonGoal` pod polem. `BigActionBar` „Lock in“ → `setGoal` → `router.back()`.
- [ ] **Step 5 [design]:** `SeasonHeader`: pozadí `seasonal.headerBase`, `WINTER ARC` Bebas, data `28. 9. – 26. 12.` mono, velké `57` + `DNÍ`. `DotGrid` tečky 10 pt, mezera 6, akcent jen „dnes“ (§6.1). `ComebackCard`: titulek „Dohnat to jde“, **nikdy** slovo „prohráno“. `RewardCard`: náhled šály = `Mascot` stage z profilu s `cosmetics={{ outfit: 'outfit-winter-arc-scarf' }}` size M + odznak (kruh `seasonGold`-lem, Bebas „WA“). Screenshoty dark/light: bez cíle, s cílem (splnitelný), s cílem nedosažitelným (comeback), po konci.
- [ ] **Step 6 [motion]:** Stat progresu count-up 400 ms `motion.ui` easing při prvním zobrazení. „Lock in“ potvrzení: karta cíle vjede `withTiming`. Dnešní tečka nepulzuje (pulz je vyhrazený aktuálnímu uzlu mapy).
- [ ] **Step 7:** Commit `feat: sezóna — cíl, progres, comeback`.

---

### Task 25: Recap sezóny a převzetí odměny

**Vlastník:** boss (služba, routa), design-agent (`RecapSlide`), motion-agent (swipe, přechody slidů).

**Files:**
- Create: `hooks/useRecap.ts`, `components/season/RecapSlide.tsx`, `app/season-recap.tsx`
- Modify: `services/mock/MockSeasonService.ts`, `app/_layout.tsx` (`season-recap` jako `fullScreenModal`), `data/copy.ts`

**Interfaces:**
- Produces:
  - `getRecap(seasonId, now)`: `buildRecap(goal, ctx)`. Před koncem sezóny throw `Error('Sezóna ještě neskončila.')`.
  - `claimReward(seasonId, now)`: jen po konci; `rewardFor(recap.rewardEarned, season)` → `applyClaim` → zápis. Vrací `cosmeticIds` z uloženého claimu (i při opakovaném volání stejné).
  - `useRecap(seasonId)`.
- Copy (`copy.recap`): slidy `beforeAfter: 'PŘED A PO'`, `lessons: 'LEKCÍ'`, `streak: 'NEJDELŠÍ STREAK'`, `growth: 'RŮST OPICE'`, `reward: 'ODMĚNA'`, `rewardEarned: 'Šála Winter Arc je tvoje.'`, `rewardMissed: 'Tentokrát bez šály. Odznak účasti máš.'`, `share: 'Sdílet'`, `shareSoon: 'Sdílení přijde brzy.'`, `claim: 'Převzít odměnu'`, `claimed: 'Převzato'`, `labels: { weight: 'Váha', activeDays: 'Aktivní dny', lessons: 'Lekce' }`.

- [ ] **Step 1 [boss]:** Test `services/__tests__/MockSeasonService.test.ts` (rozšířit): `claimReward` dvakrát po sobě → `owned` obsahuje šálu jednou, `badges` bez duplicit, obě volání vrátí stejné pole. `getRecap` před koncem hodí chybu. PASS.
- [ ] **Step 2 [boss]:** `app/season-recap.tsx`: 5 slidů v pořadí §7.7 (před/po → lekce → nejdelší streak → růst opice → odměna). Když `beforeAfter === null`, slide 1 se vynechá a recap má 4 slidy (viz „Spec ambiguity“ č. 8). Tap vpravo = další, vlevo = zpět, swipe horizontálně. Horní řada teček progresu (`DotSteps`). Poslední slide: tlačítko „Převzít odměnu“ (volá `claimReward`, pak stav „Převzato“) a „Sdílet“ (placeholder `Alert` s `shareSoon`, `// TODO(fáze 2/4): sdílení recapu`). Křížek zavře recap.
- [ ] **Step 3 [design]:** `RecapSlide`: celá plocha `base`, jeden obří údaj (Bebas 120+, tabulární) + mono štítek, zarovnání vlevo. Slide „růst opice“: dvě opice (stage start → end) vedle sebe, na střed (§6.8 výjimka pro maskota). Slide odměny: opice v šále `celebrate` (pokud splněno), odznak. Akcent plošně jen na slidu odměny při splnění (oslavná scéna).
- [ ] **Step 4 [motion]:** přechod slidů `withTiming` 200 ms (UI, bez pružin); na slidu odměny opice `celebrate` a `haptics.success()` po převzetí. Reduce motion: fade 200 ms.
- [ ] **Step 5:** Ověření s dev posunem času (dočasně `useSettings.getState().setDevTimeOffset(...)` v konzoli webu, dev menu přijde v Tasku 31). Screenshoty všech slidů dark/light. Commit `feat: recap sezóny a odměna`.

---

### Task 26: Stage-up a napojení oslavy

**Vlastník:** boss (routa, navigace), motion-agent (sekvence), design-agent (plocha, typografie).

**Files:**
- Create: `app/stage-up.tsx`
- Modify: `app/lesson/[id].tsx` (`onContinue` z Tasku 13), `app/_layout.tsx` (`stage-up` jako `fullScreenModal`, `gestureEnabled: false`), `data/copy.ts`

**Interfaces:**
- Consumes: `LessonResult.stageBefore/stageAfter/unlockedLessonId`, `Mascot`, `haptics.success`, `motion.pop`, `motion.hop`.
- Produces:
  - `onContinue()` v lekci: když `result.stageAfter > result.stageBefore` → `router.replace({ pathname: '/stage-up', params: { from: String(stageBefore), to: String(stageAfter), unlocked: result.unlockedLessonId ?? '' } })`, jinak beze změny (mapa s `?unlocked`).
  - `stage-up` CTA „Pokračovat“ → stejná navigace na mapu jako Task 13 (`dismissTo('/(tabs)', { unlocked })` nebo ekvivalent ověřený v docs SDK 57), `unlocked` jen když není prázdný.
  - `copy.stageUp = { names: { 1: 'BABY', 2: 'TEENAGER', 3: 'ALPHA' }, label: (n, name) => `STAGE ${String(n).padStart(2, '0')} · ${name}`, title: 'Opice roste.', cta: 'Pokračovat' }`.
  - Neplatné parametry (`to` mimo 2–3 nebo `to <= from`) → rovnou navigace na mapu (žádný pád).

- [ ] **Step 1 [boss]:** routa, parsování parametrů (`parseStageParam(s: string | string[] | undefined): MascotStage | null` v `logic/mascot.ts` + test: `'2'` → 2, `'4'` → null, `undefined` → null, `['3']` → 3), úprava `onContinue`. Commit.
- [ ] **Step 2 [design]:** plocha `accent` přes celou obrazovku (§7.4, §6.8 výjimka), text `onAccent`. Mono štítek `STAGE 02 · TEENAGER` pod opicí, titulek Bebas, `BigActionBar` v `onAccent` inverzi.
- [ ] **Step 3 [motion]: sekvence (§7.4)**

```ts
// t=0      stará opice (stage from, mood idle, size XL) uprostřed
// t=300ms  smrští se do kruhu: scale 1 → 0.35 (withTiming 380 ms, motion.reveal easing), kolem ní kruh r = 0.5 × XL v onAccent obrysu 2 px
// t=700ms  kruh praskne: 8 úlomků (malé kruhy r=6) letí radiálně ven (withTiming 420 ms) + fade, původní kruh scale 1 → 1.4 a opacity → 0
// t=720ms  nová opice (stage to, mood 'celebrate') scale 0 → 1 withSpring(motion.pop), haptics.success()
// t=1300ms štítek + titulek fade-in (motion.ui)
// t=1500ms CTA aktivní (disabled do té doby, stejná ochrana jako v oslavě)
```
Reduce motion: rovnou nová opice (fade 200 ms), haptika zůstává.
- [ ] **Step 4:** Ověření: dev XP (+500 přes konzoli, dev menu v Tasku 31) → dokončit lekci → stage-up → mapa s unlock sekvencí. Screenshoty 3 klíčových snímků. Commit `feat: stage-up`.

---

### Task 27: TDD `logic/progress` + tab Progres

**Vlastník:** boss (logic, hooky, obrazovka), design-agent (`components/progress/*`), motion-agent (celebrate při splnění milníku).

**Files:**
- Create: `logic/progress.ts`, `logic/__tests__/progress.test.ts`, `components/progress/{DreamBodyCard,MilestoneRow,MilestoneSheet,WeightChart}.tsx`
- Modify: `services/mock/MockUserService.ts` (`updateMilestone` vrací výsledek), `app/(tabs)/progress.tsx`, `data/copy.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface WeightChartModel { points: WeightEntry[]; targetKg: number; startKg: number; yMin: number; yMax: number; yTicks: number[] }
  export function weightChartModel(goal: WeightGoal, weights: WeightEntry[], maxPoints?: number): WeightChartModel | null; // null = graf se neukáže
  export type GridCell = { day: ISODate; state: 'active' | 'empty' | 'today' | 'future' };
  export function activityGrid(events: ActivityEvent[], today: ISODate, weeks?: number): GridCell[];     // 5 týdnů po–ne, končí nedělí tohoto týdne
  export const isMilestoneDone = (m: Milestone): boolean => m.current >= m.target;
  export function newlyCompleted(before: Milestone[], after: Milestone[]): string[];                    // id milníků, které teď nově splněny
  ```
- `updateMilestone(id, current)`: `current` se ořízne na `>= 0`, vrátí `{ completed: nově splněno, unlockedCosmeticIds }`. `unlockedCosmeticIds` = milestone kosmetika, která je po změně odemčená a předtím nebyla (`isUnlocked` z Tasku 28; v tomto tasku vracet `[]` a Task 28 doplní — test na to přidá Task 28).

- [ ] **Step 1: Testy**

```ts
import { activityGrid, newlyCompleted, weightChartModel } from '@/logic/progress';
const weights = [{ weekStart: '2026-09-21', kg: 84.2 }, { weekStart: '2026-09-28', kg: 83.6 }];

describe('graf váhy jen pro lose/gain', () => {
  test('cíl none → null (graf se neukáže), i když váhy existují', () => {
    expect(weightChartModel({ kind: 'none' }, weights)).toBeNull();
  });
  test('lose → model', () => {
    const m = weightChartModel({ kind: 'lose', startKg: 84, targetKg: 78 }, weights)!;
    expect(m.targetKg).toBe(78); expect(m.points).toHaveLength(2);
    expect(m.yMin).toBeLessThanOrEqual(78); expect(m.yMax).toBeGreaterThanOrEqual(84.2);
  });
  test('gain → model, cíl nad body', () => {
    const m = weightChartModel({ kind: 'gain', startKg: 62, targetKg: 68 }, [{ weekStart: '2026-09-28', kg: 62 }])!;
    expect(m.yMax).toBeGreaterThanOrEqual(68);
  });
  test('lose/gain bez vah → model s prázdnými body (graf ukáže jen cílovou linii a tlačítko zápisu)', () => {
    expect(weightChartModel({ kind: 'lose', startKg: 84, targetKg: 78 }, [])?.points).toEqual([]);
  });
  test('bere posledních 8 týdnů, seřazeno', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ weekStart: `2026-${String(7 + Math.floor(i / 4)).padStart(2, '0')}-0${1 + (i % 4)}`, kg: 80 + i }));
    const m = weightChartModel({ kind: 'gain', startKg: 80, targetKg: 95 }, [...many].reverse())!;
    expect(m.points).toHaveLength(8); expect(m.points[0]!.kg).toBe(84);
  });
  test('osa: celá kg, 4 tick hodnoty rostoucí v rozsahu', () => {
    const m = weightChartModel({ kind: 'lose', startKg: 84, targetKg: 78 }, weights)!;
    expect(Number.isInteger(m.yMin) && Number.isInteger(m.yMax)).toBe(true);
    expect(m.yTicks).toHaveLength(4); expect(m.yTicks[0]).toBe(m.yMin); expect(m.yTicks[3]).toBe(m.yMax);
  });
});

test('activityGrid: 35 buněk po–ne, dnes accent, budoucí prázdné, dev-xp neaktivní', () => {
  const g = activityGrid([{ id: '1', at: '', day: '2026-09-29', lessonId: 'bc-1-1', xp: 30 }, { id: '2', at: '', day: '2026-09-30', lessonId: 'dev-xp', xp: 500 }], '2026-10-01');
  expect(g).toHaveLength(35);
  expect(g[0]!.day).toBe('2026-08-31'); expect(g[34]!.day).toBe('2026-10-04');
  const at = (d: string) => g.find((c) => c.day === d)?.state;
  expect([at('2026-09-29'), at('2026-09-30'), at('2026-10-01'), at('2026-10-02')]).toEqual(['active', 'empty', 'today', 'future']);
});

test('newlyCompleted: jen přechod z nesplněného na splněný', () => {
  const m = (current: number) => [{ id: 'a', label: '', target: 10, unit: 'reps' as const, current, custom: false }];
  expect(newlyCompleted(m(9), m(10))).toEqual(['a']);
  expect(newlyCompleted(m(10), m(12))).toEqual([]);
  expect(newlyCompleted(m(10), m(3))).toEqual([]);
});
```

- [ ] **Step 2:** FAIL. **Step 3:** Implementace:
  - `weightChartModel`: `none` → `null`; body = seřazené podle `weekStart`, posledních `maxPoints = 8`; `lo = min(body, target, startKg)`, `hi = max(...)`; `yMin = floor(lo) - 1`, `yMax = ceil(hi) + 1`; `yTicks` = 4 hodnoty `yMin + i*(yMax-yMin)/3` zaokrouhlené na 0.5, první a poslední přesně `yMin`/`yMax`.
  - `activityGrid`: start = `addDays(weekStart(parseISODate(today)), -7 * (weeks - 1))`, `weeks = 5`, aktivní dny přes `activeDays` (už bez dev-xp).
- [ ] **Step 4:** PASS. Commit `feat(logic): progres — graf váhy, mřížka aktivity, milníky`.
- [ ] **Step 5 [boss]: `app/(tabs)/progress.tsx`** (§7.6): `DreamBodyCard` → `DotGrid` (`activityGrid`, 7 sloupců) → milníky (`MilestoneRow` × n, tap otevře `MilestoneSheet` s numerickým polem a „Uložit“) → `WeightChart` **jen když** `weightChartModel(...) !== null` → tlačítko „Zapsat váhu tento týden“ (numerické pole, `parseWeight`, validace 30–250, `logWeight(kg, now())`, nahradí záznam týdne).
  - Copy `copy.progress = { dreamLabel: 'DREAM BODY', activityLabel: 'POSLEDNÍCH 5 TÝDNŮ', milestonesLabel: 'MILNÍKY', weightLabel: 'VÁHA', logWeight: 'Zapsat váhu tento týden', save: 'Uložit', targetLine: (kg) => `CÍL ${kg} KG`, milestoneDone: 'Splněno.', errorWhat: 'progres' }`.
- [ ] **Step 6 [design]:**
  - `DreamBodyCard` citát Inter 20 pt, `text`, bez uvozovkových ornamentů navíc.
  - `MilestoneRow`: label, `ProgressBar` (výplň `text`, splněný `accent`), `12 / 15` tabulární.
  - `WeightChart` čisté SVG: výška 200, osa Y vlevo s `yTicks` (mono 11, tabulární), týdenní body r=4 `text`, spojnice 1.5 `text`, přerušovaná cílová linie `accentText` `strokeDasharray="4 6"` s popiskem `CÍL 78 KG`, poslední bod plný akcent (= „tento týden“).
- [ ] **Step 7 [motion]:** při `updateMilestone(...).completed` se nad řádkem ukáže `Mascot mood="celebrate" size="M"` na 1.8 s (overlay), `haptics.success()`. Když `unlockedCosmeticIds` není prázdné, pod opicí mono štítek `NOVÁ KOSMETIKA` a odkaz do Šatníku.
- [ ] **Step 8:** Screenshoty: cíl lose, gain, none (bez grafu), milník splněn. Commit `feat: tab Progres`.

---

### Task 28: TDD `logic/cosmetics` + Šatník, Profil, spotřebitelé slotů

**Vlastník:** boss (logic, služba, hooky, routy), design-agent (`CosmeticTile`, `SourceBadge`, `ProfileFrame`, `MapBackground`, `LessonEffect`, obrazovky), motion-agent (náhled opice, efekt lekce).

**Files:**
- Create: `logic/cosmetics.ts`, `logic/__tests__/cosmetics.test.ts`, `hooks/useWardrobe.ts`, `components/cosmetics/{CosmeticTile,SourceBadge,ProfileFrame,MapBackground}.tsx`, `components/lesson/LessonEffect.tsx`, `app/wardrobe.tsx`
- Modify: `services/mock/MockCosmeticsService.ts`, `services/mock/MockUserService.ts` (`unlockedCosmeticIds`), `store/migrate.ts` (plný `sanitizeEquipped`), `app/(tabs)/profile.tsx`, `components/map/LessonMap.tsx` (pozadí), `components/lesson/LessonCompleteScene.tsx` (efekt), `data/copy.ts`, `data/xp.ts`

**Interfaces:**
- Produces:
  ```ts
  // data/xp.ts
  export const BANANA_RULES = { xpPerBanana: 10 } as const;
  // logic/cosmetics.ts
  export interface OwnershipCtx { owned: string[]; milestones: Milestone[]; longestStreak: number }
  export type BuyCheck = 'ok' | 'owned' | 'notShop' | 'insufficient';
  export function isUnlocked(c: Cosmetic, ctx: OwnershipCtx): boolean;  // season/shop: v owned; milestone: pravidlo splněno
  export function bananaBalance(totalXp: number, owned: string[], catalog: Cosmetic[], xpPerBanana: number): number;
  export function canBuy(c: Cosmetic, ctx: OwnershipCtx, balance: number): BuyCheck;
  export function canEquip(c: Cosmetic | undefined, ctx: OwnershipCtx): boolean;
  export function sanitizeEquipped(eq: Partial<Record<CosmeticSlot, string>>, catalog: Cosmetic[], ctx: OwnershipCtx): Partial<Record<CosmeticSlot, string>>;
  export function newlyUnlocked(catalog: Cosmetic[], before: OwnershipCtx, after: OwnershipCtx): string[];
  ```
- `MockCosmeticsService`: `getCatalog()` = `COSMETICS`; `getWardrobe()`; `equip(slot, id)`: `id === null` sundá, jinak `canEquip` a `c.slot === slot`, jinak throw; `acquireFromShop(id)`: `canBuy === 'ok'`, jinak throw `Error(code)`; přidá do `owned`. `// TODO(fáze 3): IAP`.
- Milestone kosmetika se neukládá do `owned`: je odvozená z pravidla (stejně jako XP z aktivity). `sanitizeEquipped` v migraci a při čtení Šatníku sundá položky, které už nejsou odemčené.
- `useWardrobe()`, `useEquipped()` (= `profile.equipped` pro mapu, profil, oslavu).
- Copy `copy.wardrobe = { title: 'Šatník', slots: { outfit: 'Oblečení', accessory: 'Doplněk', mapBackground: 'Mapa', lessonEffect: 'Efekt', profileFrame: 'Rám' }, bananas: 'BANÁNŮ', buy: (p) => `Koupit za ${p}`, equip: 'Nasadit', unequip: 'Sundat', seasonNever: 'Už nikdy nevyjde', lock: { milestoneCompleted: (n) => `Splň ${n} ${czPlural(n, 'milník', 'milníky', 'milníků')}`, streak: (d) => `Streak ${d} ${czPlural(d, 'den', 'dny', 'dní')}`, season: (name) => `Odměna sezóny ${name}` }, insufficient: 'Málo banánů. Banány přibývají s XP.' }`, `copy.profile = { xp: 'XP CELKEM', stage: 'STAGE', path: 'CESTA', badges: 'ODZNAKY', wardrobe: 'Šatník', settings: 'Nastavení', noBadges: 'Zatím žádné odznaky.' }`.

- [ ] **Step 1: Testy**

```ts
import { COSMETICS } from '@/data/cosmetics';
import { bananaBalance, canBuy, canEquip, isUnlocked, newlyUnlocked, sanitizeEquipped } from '@/logic/cosmetics';
const byId = (id: string) => COSMETICS.find((c) => c.id === id)!;
const ms = (done: number) => Array.from({ length: 3 }, (_, i) => ({ id: `m${i}`, label: '', target: 10, unit: 'reps' as const, current: i < done ? 10 : 0, custom: false }));
const ctx = (over = {}) => ({ owned: [], milestones: ms(0), longestStreak: 0, ...over });

test('shop/season jen když je v owned', () => {
  expect(isUnlocked(byId('acc-headband'), ctx())).toBe(false);
  expect(isUnlocked(byId('acc-headband'), ctx({ owned: ['acc-headband'] }))).toBe(true);
  expect(isUnlocked(byId('outfit-winter-arc-scarf'), ctx())).toBe(false);
});
test('milestone pravidla: počet splněných milníků a nejdelší streak', () => {
  expect(isUnlocked(byId('outfit-hoodie-chalk'), ctx({ milestones: ms(1) }))).toBe(true);
  expect(isUnlocked(byId('fx-chalk-burst'), ctx({ milestones: ms(1) }))).toBe(false);
  expect(isUnlocked(byId('acc-wristbands'), ctx({ longestStreak: 6 }))).toBe(false);
  expect(isUnlocked(byId('acc-wristbands'), ctx({ longestStreak: 7 }))).toBe(true);
});
test('banány = floor(XP / 10) − utraceno za shop položky', () => {
  expect(bananaBalance(1234, [], COSMETICS, 10)).toBe(123);
  expect(bananaBalance(1234, ['acc-headband', 'outfit-winter-arc-scarf'], COSMETICS, 10)).toBe(83); // šála je zdarma (sezóna)
});
test('canBuy', () => {
  expect(canBuy(byId('acc-headband'), ctx(), 40)).toBe('ok');
  expect(canBuy(byId('acc-headband'), ctx(), 39)).toBe('insufficient');
  expect(canBuy(byId('acc-headband'), ctx({ owned: ['acc-headband'] }), 999)).toBe('owned');
  expect(canBuy(byId('outfit-winter-arc-scarf'), ctx(), 999)).toBe('notShop');
  expect(canBuy(byId('acc-wristbands'), ctx(), 999)).toBe('notShop');
});
test('canEquip: jen odemčené a existující', () => {
  expect(canEquip(undefined, ctx())).toBe(false);
  expect(canEquip(byId('acc-belt'), ctx())).toBe(false);
  expect(canEquip(byId('acc-belt'), ctx({ owned: ['acc-belt'] }))).toBe(true);
});
test('sanitizeEquipped: zahodí neznámé, nevlastněné a položky ve špatném slotu', () => {
  expect(sanitizeEquipped({ outfit: 'nic', accessory: 'acc-belt', profileFrame: 'acc-headband' }, COSMETICS, ctx({ owned: ['acc-belt', 'acc-headband'] })))
    .toEqual({ accessory: 'acc-belt' });
});
test('newlyUnlocked: splněním druhého milníku se odemkne efekt i rám', () => {
  expect(newlyUnlocked(COSMETICS, ctx({ milestones: ms(1) }), ctx({ milestones: ms(2) })).sort()).toEqual(['frame-plate-ring', 'fx-chalk-burst']);
});
```

Test služby (`services/__tests__/MockUserService.test.ts`): `updateMilestone` na hodnotu splňující první milník vrátí `{ completed: true, unlockedCosmeticIds: ['outfit-hoodie-chalk'] }`.

- [ ] **Step 2:** FAIL. **Step 3:** Implementace (`longestStreak` do ctx = `longestStreak(activeDays(profile.activity))`). **Step 4:** PASS. Commit `feat(logic): kosmetika — odemčení, banány, nákup`.
- [ ] **Step 5 [boss]:** služba, hooky, `app/wardrobe.tsx` (Stack, `modal`), `app/(tabs)/profile.tsx`:
  - Profil (§7.8): `ProfileFrame` kolem `Mascot size="L"` (stage přes `useDisplayStage`), cesta, `Stat` XP, stage, odznaky (`profile.badges`, prázdný stav), odkazy Šatník a Nastavení (`/settings`, vznikne v Tasku 29).
  - Šatník: nahoře živý náhled (`Mascot` s *rozpracovaným* výběrem: tap na položku ji hned nasadí přes `equip`, náhled se překreslí z hooku), zůstatek banánů, `SegmentedControl` 5 slotů (horizontálně scrollovatelný), mřížka 3 sloupce `CosmeticTile`. Nezískané položky: silueta + podmínka (`copy.wardrobe.lock`), shop položka s cenou a „Koupit“ (potvrzovací `Alert`).
  - Spotřebitelé slotů: `LessonMap` dostane prop `backgroundId?: string` a vykreslí `MapBackground`; `LessonCompleteScene` dostane `effectId?: string` a vykreslí `LessonEffect` nad scénou v okamžiku dopadu kotouče (§7.3 bod 9).
- [ ] **Step 6 [design]:** `SourceBadge` přesně podle §7.8: sezónní = plný štítek `seasonGold`, text `onSeasonGold`, název sezóny + „Už nikdy nevyjde“, ikona `Medal`; milestone = obrysový štítek `rule` s názvem pravidla + `Medal`; shop = jen cena `40 BANÁNŮ` v `muted`, bez rámečku (tišší). `CosmeticTile` 1:1, `surface`, nasazená položka = obrys `accent` 2 px (jediný akcent na dlaždici). `ProfileFrame`: `frame-plate-ring` = kotoučový prstenec (plate20 + vnitřní kruh), `frame-ember-ring` = tenký akcentový prstenec. `MapBackground`: `map-chalk-dust` = SVG pattern řídkých teček `rule` 20 % (nesmí kolidovat s mrazivou texturou sezóny: když je sezónní textura, chalk dust se kreslí pod ní), `map-night-gym` = tmavší `mapBase` + vodorovné linky `rule` 8 %.
- [ ] **Step 7 [motion]:** `LessonEffect`: `fx-sparks` = 10 jisker (malé obdélníky `accent`) z bodu dopadu po parabolách 600 ms; `fx-chalk-burst` = 6 kruhů `muted` rostoucích 0 → 1.6 a mizejících 700 ms. Reduce motion: efekt se nevykreslí. Náhled v Šatníku při nasazení opice `happy` (poskočení). Screenshoty: šatník každý slot, profil s oběma rámy, mapa s oběma pozadími, oslava s efektem (snímek v půlce efektu).
- [ ] **Step 8:** Commit `feat: šatník, profil, kosmetické sloty`.

---

### Task 29: Notifikace a Nastavení

**Vlastník:** boss (služba, lib, obrazovka), design-agent (`Toggle`, layout), motion-agent (nic kromě standardních UI přechodů).

**Files:**
- Create: `lib/notifications.ts`, `hooks/useReminder.ts`, `components/ui/Toggle.tsx`, `app/settings.tsx`
- Modify: `services/mock/LocalNotificationService.ts`, `app/_layout.tsx` (handler + přeplánování), `app.json` (plugin `expo-notifications`, jen pokud to docs SDK 57 vyžadují), `data/copy.ts`
- Delete: `services/mock/notImplemented.ts` (už ho nic nepoužívá, ověřit `grep -r notImplemented services`)

**Interfaces:**
- Consumes: `expo-notifications` (ověřit v `https://docs.expo.dev/versions/v57.0.0/sdk/notifications/`: `setNotificationHandler`, `getPermissionsAsync`, `requestPermissionsAsync`, `scheduleNotificationAsync` s `SchedulableTriggerInputTypes.DAILY`, `cancelScheduledNotificationAsync`, `setNotificationChannelAsync` pro Android, a zda lokální notifikace běží v Expo Go SDK 57).
- Produces:
  - `LocalNotificationService` implementuje contract. `setDailyReminder(true, hour)` zruší předchozí připomínku (identifier `opice-daily`) a naplánuje denní v `hour:00` s textem `copy.notifications.reminder(streak)`. `setDailyReminder(false)` zruší. `sendTest(message)` = okamžitá notifikace (`trigger: null`).
  - `lib/notifications.ts`: `configureNotifications()` (handler, Android kanál `reminders`), volá se jednou v root layoutu.
  - `useReminder()`: čte `reminderEnabled/Hour` ze settings, oprávnění ze služby, a vrací `{ enabled, hour, permission, setEnabled(b), setHour(h), openSystemSettings() }`. Když `setEnabled(true)` a oprávnění je `undetermined` → `requestPermission()`; `denied` → přepínač zůstane vypnutý a UI ukáže vysvětlení + „Otevřít nastavení“ (`Linking.openSettings()`).
  - Root layout po hydrataci a při změně streaku (`useProfileStats`) přeplánuje připomínku, pokud je zapnutá, aby text nesl aktuální streak.
  - Copy `copy.notifications = { title: 'Opice', reminder: (n) => n > 0 ? `Opice čeká. Streak ${n} ${czPlural(n, 'den', 'dny', 'dní')} je v ohrožení 🐒` : 'Opice čeká. Dnešní lekce ještě chybí 🐒', test: (n) => copy.notifications.reminder(n) }`, `copy.settings = { title: 'Nastavení', theme: 'Téma', themeOptions: { system: 'Systém', light: 'Světlý', dark: 'Tmavý' }, reminder: 'Denní připomínka', hour: 'Hodina', sendTest: 'Poslat testovací notifikaci', denied: 'Notifikace jsou v systému vypnuté.', openSettings: 'Otevřít nastavení', dev: 'Dev menu' }`.

- [ ] **Step 1 [boss]: Test textu** (`data/__tests__/copy.test.ts`):

```ts
import { copy, czPlural } from '@/data/copy';
test.each([[1, 'den'], [2, 'dny'], [4, 'dny'], [5, 'dní'], [12, 'dní'], [22, 'dní']])('czPlural %i', (n, w) => { expect(czPlural(n, 'den', 'dny', 'dní')).toBe(w); });
test('spec §7.9 text', () => { expect(copy.notifications.reminder(12)).toBe('Opice čeká. Streak 12 dní je v ohrožení 🐒'); });
test('streak 0 nemluví o ohrožení nuly', () => { expect(copy.notifications.reminder(0)).not.toMatch(/0 dní/); });
```
(Pozn.: `czPlural` s 22 vrací `dní` záměrně: jednoduché pravidlo 2–4 platí jen pro 2, 3, 4. Pro UI appky stačí.)

- [ ] **Step 2 [boss]:** `npx expo install expo-notifications` (už v plánu A Step 2 instalováno; ověřit v `package.json`), implementace služby a `lib`. Na webu `expo-notifications` plánování nepodporuje: služba na `Platform.OS === 'web'` vrací `getPermission() → 'denied'` a ostatní metody no-op, UI ukáže stav „vypnuto“.
- [ ] **Step 3 [boss]: `app/settings.tsx`** (§7.9): Téma (`SegmentedControl` → `setTheme`), Denní připomínka (`Toggle` + výběr hodiny: stepper `−`/`+` 5–22 h, tabulární `18:00`), „Poslat testovací notifikaci“ (text se skutečným streakem), vysvětlení při `denied`, odkaz „Dev menu“ (`/dev`, jen `__DEV__`; v produkci skrytý).
- [ ] **Step 4 [design]:** `Toggle` 52×32, `rule` → `accent` výplň, knoflík `raised`, plocha 44 pt. Layout nastavení: řádky oddělené jen hairline `rule` (jedna technika). Screenshoty dark/light, stav denied.
- [ ] **Step 5:** Ruční ověření v Expo Go (uživatel, „K ruční kontrole“): testovací notifikace dorazí, denní se naplánuje. Commit `feat: notifikace a nastavení`.

---

### Task 30: Gate B (krok 4): QA + rating

**Vlastník:** qa-agent, rating-agent. Boss opravuje.

- [ ] **Step 1 [qa]:** `npm test && npm run typecheck && npm run lint && npx expo-doctor`. `grep -rE "@/(store|data/(?!copy)|services/mock)" app components` (přes `rg -P`) nesmí nic najít.
- [ ] **Step 2 [qa]: Checklist QA fokusu.** U každého bodu najít konkrétní test a ověřit, že testuje hranici, ne jen šťastnou cestu:
  - XP: rozpis (plán A) + dev-xp mimo lekce (`activity.test.ts`, `completion.test.ts`).
  - Streak: rollover 23:59 → 00:01, konec měsíce, zameškaný den, mezera (`streak.test.ts`).
  - Stage: 499/500/1999/2000 (`mascot.test.ts`), stage-up param parser.
  - Liga: 5./6. a 13./14. místo, Dřevo bez sestupu, Diamant bez postupu, remíza, kalibrace, `settleLeague` po 3 týdnech (`league.test.ts`).
  - Comeback: okno 3 dny, den 4 zpátky neopravitelný, první lekce neopravuje, druhá ano, půlnoc, hranice sezóny a založení profilu, retry (`season.test.ts`, `completion.test.ts`).
  - Cíl sezóny: všechny 4 typy, 100 % vs 99 %, dosažitelnost, `daysLeft`, idempotentní claim (`season.test.ts`).
  - Graf váhy: `none` → null i s váhami; lose, gain (`progress.test.ts`).
- [ ] **Step 3 [qa]: Ruční průchod smyčkou** (web + Expo Go podle možností): onboarding → mapa → lekce → oslava (s efektem) → stage-up (po dev XP přes konzoli) → mapa → Liga (vlastní řádek, zóny) → Progres (milník splněn → celebrate + nová kosmetika) → Sezóna (Lock in, DotGrid, comeback) → Šatník (nákup, nasazení, náhled) → Profil → Nastavení (notifikace).
- [ ] **Step 4 [qa]:** Edge cases: prázdný profil bez vah (Progres bez pádu), sezóna po konci (recap), `denied` notifikace, reduce motion na všech nových animacích, dvojí tap na „Převzít odměnu“ a „Koupit“.
- [ ] **Step 5 [rating]:** Hodnocení kroku 4 proti §7.5–7.9, §6 a „Never“ ze skillu `aesthetic` (jeden akcent, jedna oddělovací technika, obrysové ikony, žádné `#000/#FFF`, žádné pružiny na UI, 44 pt, kontrast). Jen 100/100 pouští dál.
- [ ] **Step 6:** Shrnutí kroku 4 do `docs/LOG.md`.

---

# Krok 5 · Dev menu

### Task 31: Dev menu

**Vlastník:** boss (logic + test, obrazovka), design-agent (jednoduchý layout z existujících primitiv).

**Files:**
- Create: `logic/dev.ts`, `logic/__tests__/dev.test.ts`, `app/dev.tsx`
- Modify: `services/mock/MockUserService.ts` (`grantDevXp`, `reset` resetuje i settings kromě tématu), `store/settings.ts` (`resetDev()`), všechna místa s opicí uživatele (mapa, profil, šatník, vlastní řádek ligy) používají `useDisplayStage`, `app/_layout.tsx` (Stack.Screen `dev`)

**Interfaces:**
- Produces:
  ```ts
  export function devXpEvent(amount: number, now: Date): ActivityEvent;          // id `dev-xp-${now.getTime()}`, lessonId DEV_XP_LESSON_ID, day = toISODate(now)
  export function seasonEndOffset(s: SeasonSpan, realNow: Date): number;        // ms, aby now() = den po endDate 09:00 místního času
  export function streakLossOffset(currentOffset: number): number;              // currentOffset + 2 dny
  export const nextStageOverride: (o: MascotStage | null) => MascotStage | null; // null → 1 → 2 → 3 → null
  ```
- Obrazovka (§7.10), každá akce s potvrzením u destruktivních:
  - „Reset appky“ → `services.user.reset()` + `resetDev()` → `router.replace('/')` (onboarding).
  - „+500 XP“ → `services.user.grantDevXp(500, now())`.
  - „Stage opice: auto / 1 / 2 / 3“ → `setStageOverride(nextStageOverride(o))`. Jen zobrazení, stage-up ani liga ho neberou.
  - „Skok na konec sezóny“ → `setDevTimeOffset(seasonEndOffset(activeOrLatestSeason, new Date()))`. Pozn.: záměrně `new Date()` (skutečný čas), ne `now()`, výjimka z pravidla hodin s komentářem.
  - „Simulace ztráty streaku“ → `setDevTimeOffset(streakLossOffset(offset))`.
  - „Reset časového posunu“ → `setDevTimeOffset(0)`.
  - Nahoře mono štítek s aktuálním `now()` a posunem (`POSUN +2 D 0 H`).
- Copy `copy.dev = { title: 'Dev menu', reset: 'Reset appky', resetConfirm: 'Smazat všechna data?', xp: '+500 XP', stage: (s) => `Stage opice: ${s ?? 'auto'}`, seasonEnd: 'Skok na konec sezóny', streakLoss: 'Simulace ztráty streaku', resetTime: 'Reset časového posunu', now: 'TEĎ', offset: 'POSUN' }`.

- [ ] **Step 1: Testy**

```ts
import { devXpEvent, nextStageOverride, seasonEndOffset, streakLossOffset } from '@/logic/dev';
import { isLessonEvent } from '@/logic/activity';
import { toISODate } from '@/logic/dates';
import { currentStreak, isStreakBroken } from '@/logic/streak';
test('dev XP událost: 500 XP, není lekce, den podle now', () => {
  const e = devXpEvent(500, new Date(2026, 9, 5, 23, 59));
  expect(e).toMatchObject({ xp: 500, day: '2026-10-05', lessonId: 'dev-xp' }); expect(isLessonEvent(e)).toBe(false);
});
test('skok na konec sezóny: now() = 27. 12. 09:00 místního času', () => {
  const real = new Date(2026, 9, 5, 14, 30);
  const off = seasonEndOffset({ startDate: '2026-09-28', endDate: '2026-12-26' }, real);
  const shifted = new Date(real.getTime() + off);
  expect(toISODate(shifted)).toBe('2026-12-27'); expect(shifted.getHours()).toBe(9);
});
test('ztráta streaku: +2 dny od současného posunu → streak 0, broken', () => {
  const off = streakLossOffset(0); expect(off).toBe(2 * 86_400_000);
  const today = toISODate(new Date(new Date(2026, 9, 5, 12).getTime() + off));
  expect(currentStreak(['2026-10-04', '2026-10-05'], today)).toBe(0);
  expect(isStreakBroken(['2026-10-04', '2026-10-05'], today)).toBe(true);
});
test('stage override cyklus', () => {
  expect([null, 1, 2, 3].map((s) => nextStageOverride(s as never))).toEqual([1, 2, 3, null]);
});
```

Pozn. k DST: `seasonEndOffset` počítá z `parseISODate(addDays(endDate, 1))` + `setHours(9)` minus `realNow`, takže změna času 25. 10. výsledek nerozbije (test běží s TZ Europe/Prague z plánu A a přes DST hranici prochází).

- [ ] **Step 2:** FAIL. **Step 3:** Implementace. `MockUserService.grantDevXp` = připojit `devXpEvent` k aktivitě. **Step 4:** PASS.
- [ ] **Step 5 [boss]:** `app/dev.tsx` + napojení `useDisplayStage`. Po skoku na konec sezóny: ThemeProvider přejde na neutrální téma (sezóna neběží), tab Sezóna ukáže recap CTA. Po resetu posunu se vrátí.
- [ ] **Step 6 [design]:** seznam `Button variant="secondary"` pod sebou, destruktivní „Reset appky“ jako `ghost` s `danger` textem, mono štítky. Žádná nová komponenta.
- [ ] **Step 7:** Commit `feat: dev menu`.

---

### Task 32: Gate C (krok 5): QA + rating

- [ ] **Step 1 [qa]:** testy, typecheck, lint zelené.
- [ ] **Step 2 [qa]:** Průchod všech 6 akcí dev menu a kontrola konzistence dat: +500 XP nezmění mapu ani počet lekcí v sezóně, ale posune stage a ligu; ztráta streaku → opice na mapě `sad`, po lekci zpět `idle`/`happy`; skok na konec sezóny → recap → převzetí → reset posunu → aktivní sezóna, převzetí zůstává; reset appky → onboarding, settings téma zůstává.
- [ ] **Step 3 [rating]:** 100/100 proti §7.10. **Step 4:** shrnutí do `docs/LOG.md`.

---

# Krok 6 · README

### Task 33: README a závěrečné ověření

**Vlastník:** boss.

**Files:**
- Modify: `README.md` (přepsat, dnes obsahuje jen `# monkey`)

- [ ] **Step 1:** `README.md` česky, sekce v tomto pořadí:
  1. **Opice** — jedna věta co to je (§1).
  2. **Spuštění** — `npm install`, `npx expo start`, Expo Go (QR), web `npx expo start --web`.
  3. **Příkazy** — `npm test`, `npm run typecheck`, `npm run lint`, `npx expo-doctor`, `npx expo install <pkg>`.
  4. **Architektura** — strom složek (§3.1 ve zkratce), tok dat (§3.2), hranice vrstev a že je hlídá ESLint.
  5. **Výměna mock služeb za API** — jen `services/index.ts` + nové implementace `contracts.ts`; `store/db.ts` se stane cache (fáze 2).
  6. **Čas a dev menu** — `lib/clock.ts`, `devTimeOffsetMs`, co dělá každá akce.
  7. **Obsah** — kde upravit cviky, lekce, milníky, sezóny, kosmetiku, soupeře, XP pravidla (`data/*`).
  8. **Design systém** — tokeny, palety, jeden akcent, sezónní override, typografie (odkaz na SPEC §6).
  9. **Přechod na Rive** (§8): development build (`npx expo run:ios|android` nebo `bunx`/`npx eas-cli@latest build --profile development`), `npx expo install rive-react-native`, soubor `assets/opice.riv` se state machine `Mascot` (number inputy `stage`, `outfit`, `accessory`, `mapBackground`, `lessonEffect`, `profileFrame`; triggery `happy`, `celebrate`, `sad`), odkomentovat `RiveMascot.tsx`, přepnout export v `components/mascot/index.tsx`, `variantIndex` v `data/cosmetics.ts` = hodnota inputu.
  10. **Roadmapa** — TODO fáze 2/3/4 z §11.
- [ ] **Step 2:** Ověřit, že každý příkaz v README skutečně funguje (spustit `npm test`, `npm run typecheck`, `npm run lint`).
- [ ] **Step 3:** Commit `docs: README`.

### Task 34: Gate D (krok 6) a předání

- [ ] **Step 1 [qa]:** Celá sada: `npm test && npm run typecheck && npm run lint && npx expo-doctor`. SPEC §1 „Hotovo znamená“ bod po bodu.
- [ ] **Step 2 [rating]:** 100/100 za README (správnost příkazů, Rive sekce odpovídá `RiveMascot.tsx` a `riveInputs.ts`).
- [ ] **Step 3:** Závěrečné shrnutí fáze 1 do `docs/LOG.md` a `docs/STATUS.md`: hotovo, rozhodnutí agentů, otevřené, finální skóre, počet kol, „K ruční kontrole“ (Expo Go na iOS i Androidu, notifikace, haptika, FPS ligy).

---

## Spec ambiguity a navržená rozhodnutí

Každé rozhodnutí zapíše boss do `docs/LOG.md` při implementaci příslušného tasku. Pokud uživatel rozhodne jinak, mění se jen uvedený task.

| # | Nejasnost | Rozhodnutí | Task |
|---|---|---|---|
| 1 | Liga po víc týdnech nepřítomnosti: vyhodnotit každý zmeškaný týden? | Jen týden, ve kterém uživatel naposledy soutěžil (`leagueWeek`). Max ±1 stupeň, žádná kaskáda sestupů. | 20 |
| 2 | Remíza v XP | Uživatel je nad soupeřem se stejným XP (nepotrestat). | 20 |
| 3 | Kalibrace soupeřů „2–3 lekce denně stačí“ | Konkrétní `weeklyBase` + `tierXpStep 0.03` + šum ±8 %. 350 XP/týden (2 lekce denně bez streak bonusu) garantuje top 5 v každé úrovni, hlídá test. | 20 |
| 4 | Počítá oprava (comeback) i do streaku? | Ne. Oprava platí jen pro cíl sezóny. Streak = skutečné dny aktivity (§4 Streak). | 22 |
| 5 | Opravuje i opakování lekce? | Ano, každá druhá a další lekční událost dne (i replay). `dev-xp` ne. | 22 |
| 6 | Dny před založením profilu / před startem sezóny | Neopravují se (nejsou v okně). V DotGridu sezóny se zobrazí jako zameškané (obrys). | 22, 23 |
| 7 | „První váha v sezóně“, když uživatel v sezóně ještě nevážil | Baseline = první záznam od týdne startu sezóny, jinak poslední před ním, jinak progres 0. | 23 |
| 8 | Recap „před a po“ pro cíle activeDays/lessons a bez cíle | activeDays/lessons: 0 → hodnota. Bez cíle: váha, pokud má cíl lose/gain; jinak se slide vynechá (recap má 4 slidy). | 23, 25 |
| 9 | Milestone cíl sezóny nemá startovní hodnotu (recap „před“) | `SeasonGoal.milestone` dostane `start` (nastaví se při `setGoal`, migrace = `current`). Odchylka od §3.3. | 19, 24 |
| 10 | Dva odznaky? („šála + odznak“ při splnění vs. „vždy odznak účasti“) | `season.badgeId` = odznak za splnění, odznak účasti = `${badgeId}-ucast`, uděluje se vždy. | 23 |
| 11 | `daysLeft` včetně dneška? | Ano (`57 DNÍ` = dnešek + 56). Po konci 0. | 23 |
| 12 | Sezónní šála (§6.3 „nejde o equip“) vs. odměna šála (outfit) | Během sezóny se šála kreslí jako sezónní vrstva vždy. Po splnění je `outfit-winter-arc-scarf` vlastněná a jde nasadit i mimo sezónu. Když je nasazená, sezónní vrstva se nekreslí dvakrát. | 17 |
| 13 | Banány „odvozené z XP“ | `floor(totalXp / 10) − ceny koupených shop položek`. Dev XP se počítá. | 28 |
| 14 | Milestone kosmetika: ukládat do `owned`? | Ne, odvozuje se z pravidla (jako XP z aktivity). Pravidla: počet splněných milníků, nejdelší streak. | 28 |
| 15 | Kde vzít `getLatest`/ukončenou sezónu, když `getActive` po konci vrací `null` | Nová metoda `SeasonService.getLatest(now)`. Rozšíření contracts, `getActive` beze změny (theme ho používá). | 19, 24 |
| 16 | `SeasonRecap.before/after: string` v contracts plánu A | Nahradit strukturou `beforeAfter` s čísly a jednotkou; formátování patří UI (`copy`). | 19 |
| 17 | Dev XP a streak / „první lekce dne“ / počet lekcí | `dev-xp` je jen XP (stage, liga, banány). Do aktivních dní, streaku, mapy, počtu lekcí ani comebacku se nepočítá. | 19 |
| 18 | „Skok na konec sezóny“: poslední den, nebo po konci? | Den po `endDate` v 09:00, aby šel otevřít recap. | 31 |
| 19 | Názvy stage (spec uvádí jen `STAGE 02 · TEENAGER`) | `BABY`, `TEENAGER`, `ALPHA`. Anglicky podle spec příkladu, v `copy` (lokalizace fáze 4). | 26 |
| 20 | Text testovací notifikace při streaku 0 a skloňování | Streak 0: „Opice čeká. Dnešní lekce ještě chybí 🐒“. Jinak `den/dny/dní` přes `czPlural`. | 29 |
| 21 | Notifikace na webu | Web = `denied`, no-op (expo-notifications plánování na webu nepodporuje). | 29 |
| 22 | Oslava milníku „nálada celebrate“ — kde se opice ukáže, když Progres opici nemá | Krátký overlay s opicí `celebrate` nad řádkem milníku (1.8 s). | 27 |
| 23 | Stage-up: přechod mezi 2 stage najednou (1 → 3 po velkém dev XP) | Jedna obrazovka `from → to`, žádné řetězení. | 26 |
| 24 | Nastavení cíle sezóny: jde změnit během sezóny? | Ano, dokud sezóna běží (nový `setGoal` přepíše). Po konci ne. | 24 |

## Self-review

- **Pokrytí spec (kroky 3–6):**

| Spec | Task |
|---|---|
| §8 stages 2–3, kotvy | 15 |
| §8 nálady celebrate, sad | 16 |
| §8 kosmetika, §6.3 sezónní šála, RiveMascot | 17 |
| §4 Liga, §7.5 | 20, 21 |
| §4 Sezóna (comeback, progres, recap, odměna), §7.7 | 22–25 |
| §7.4 stage-up, §7.3 bod 8 | 26 |
| §7.6 Progres (DotGrid, milníky, graf váhy) | 27 |
| §7.8 Profil + Šatník, §5 kosmetika a banány, §7.3 bod 9 lessonEffect | 28 |
| §7.9 Nastavení a notifikace | 29 |
| §7.10 Dev menu | 31 |
| §8 README „Přechod na Rive“, §11 | 33 |
| §3.1 hooky (`useLeague`, `useSeason*`, `useCosmetics` → `useWardrobe`, `useNow`) | 19, 21, 24, 28 |
| §3.1 komponenty `league/`, `progress/`, `season/`, `cosmetics/`, `ui/{DotGrid,ProgressBar,Toggle}` | 21, 24, 27, 28, 29 |
| §10 testy (liga, comeback, cíle, recap) | 20, 22, 23, 27, 28, 31 |

- **QA fokus:** každý bod má test v tabulce nahoře a kontrolu v Gate B.
- **Review Focus:** 1 → Task 20 (`settleLeague` 3 týdny), 2 → Task 22 (půlnoc, hranice), 3 → Task 19 + 31, 4 → Task 23 (`applyClaim`) + 25 (služba), 5 → Task 28 + 19.
- **Konzistence typů:** `LeagueWeekResult`, `LeagueOutcome` (types/league) používají Task 19, 20, 21. `SeasonProgress` / `SeasonStatus` / `SeasonRecap.beforeAfter` definuje Task 19 a plní Task 23–25. `BuyCheck` definuje Task 19 v contracts a Task 28 ho re-exportuje z `logic/cosmetics`. `SeasonSpan` definuje Task 22 a používá Task 31. `isLessonEvent` / `DEV_XP_LESSON_ID` (Task 19) používají 20, 22, 23, 27, 31.
- **Placeholdery:** jediný záměrný placeholder je „Sdílet“ v recapu (spec §7.7) s `TODO(fáze 2/4)`. `notImplemented.ts` se maže v Tasku 29.
