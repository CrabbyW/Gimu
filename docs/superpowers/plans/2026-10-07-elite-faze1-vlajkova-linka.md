# Elite fáze 1 — vlajková linka Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Krátký first run (cesta → narození → mapa → první lekce do ~30 s), kotouč jako pojivo mapa → lekce → oslava, opička průvodce a „doplň cíle“ po první oslavě.

**Architecture:** Čistá logika v `logic/onboarding.ts` (výchozí profil) a `logic/guide.ts` (bubliny průvodce). Příznak `setupDone` v profilu. Let kotouče je overlay v kořenovém layoutu řízený malým storem `lib/plateFlight.ts` (pozice změřená na mapě → cílová pozice v lekci). UI má komponenty `GuideBubble` a `FinishSetupTile`.

**Tech Stack:** Expo Router, Reanimated 4, Skia (DotPlate), zustand (settings store), Jest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-07-elite-faze1-vlajkova-linka-design.md`

## Global Constraints
- Nothing Dot jazyk, monochrom, opička jediná barva. Tokeny z `theme/`, pohyb z `lib/motion.ts`, copy anglicky v `data/copy.ts`.
- Logika jen v `logic/`, data přes `services/`, UI čte přes `hooks/`.
- Worklet pravidlo (ESLint), porty 8081/8082, append-only QA/LOG, agenti ověřují sami (tsc, jest, eslint, e2e).
- Reduce Motion vždy (let kotouče → prolnutí).

## Review Focus
- Starý profil (bez `setupDone`, `guideSeen`) nesmí po updatu vidět onboarding bubliny ani dlaždici „Finish setup“ (test migrace v Task 1).
- Reset app → nový first run (bubliny i setup znovu). Test v Task 1 a e2e v Task 5.
- Let kotouče, když `measureInWindow` vrátí nulu nebo selže → normální přechod bez pádu. Test store v Task 4.
- Dvojí ťuknutí na Start lesson během letu → jen jedna navigace. Task 4.
- First run e2e: čas od prvního otevření po start lekce ≤ 30 s. Task 5.

---

### Task 1: Logika (boss, TDD)
**Files:** Create `logic/onboarding.ts`, `logic/guide.ts` + testy; Modify `types/user.ts` (`setupDone?: boolean`), `services/mock/MockUserService.ts` (create s výchozími daty), `store/settings.ts` (`guideSeen: string[]` + reset).
**Interfaces:**
- `defaultGoalsForPath(path: PathId): { dreamBody: string; milestones: Milestone[]; weightGoal: WeightGoal }`: vize = první sen cesty, milníky = první 2 předvolby cesty, váha `{ kind: 'none' }` (nebo existující „bez cíle“).
- `needsSetup(profile: UserProfile): boolean`: `profile.setupDone === false`; chybějící pole = false (starý profil).
- `GuideId = 'mapStart' | 'lessonHold' | 'celebrationFirst'`; `nextGuide(screen: 'map'|'lesson'|'celebration', seen: readonly GuideId[], firstRun: boolean): GuideId | null`.
- [ ] Testy:
  - výchozí data pro všechny 3 cesty;
  - `needsSetup` pro starý profil, nový profil a hotový profil;
  - `nextGuide` jen jednou a jen při first run;
  - reset vynuluje `guideSeen`.
- [ ] Implementace a testy zelené. Commit.

### Task 2: Krátký onboarding + „doplň cíle“ (design-agent)
**Files:** `app/onboarding/*` (_layout pořadí, path → birth → `/`), `components/lesson/LessonCompleteScene.tsx` (sekundární pilulka „Set your goals“ při první oslavě, pod CTA), `components/map/FinishSetupTile.tsx` (dlaždice na mapě „Finish setup · N steps“ → editory cílů a připomínka; zmizí po dokončení → `services.user.updateGoals({ setupDone: true })` nebo nová metoda), `app/(tabs)/index.tsx` (zobrazení dlaždice, nesmí vrátit „málo místa pro cestu“: kompaktní 1 řádek), `data/copy.ts`.
- [ ] Onboarding bez kroků dream, milestones, weight, reminder (soubory a routy zůstanou dostupné z „Finish setup“: připomínka přes Settings).
- [ ] Zachovat narození opičky (birth) jako vrchol onboardingu.
- [ ] Tsc, jest, eslint, `npm run e2e` (aktualizovat toky onboardingu a vědomě baseline). LOG.

### Task 3: Opička průvodce (design-agent)
**Files:** Create `components/mascot/GuideBubble.tsx`; Modify mapa, lekce, oslava (zobrazení podle `nextGuide`), hook `hooks/useGuide.ts` (čte settings přes hooks/, ne ze store v UI).
- [ ] Bublina: dlaždice s mono textem a tečkovou šipkou k opičce (nebo k cíli), max. 1 na obrazovku. Zmizí na tap nebo po akci a zapíše se jako „viděno“. Nesmí překrýt CTA ani tab bar.
- [ ] Tsc, jest, eslint, e2e. LOG.

### Task 4: Let kotouče (motion-agent)
**Files:** Create `lib/plateFlight.ts` (store: `launch({ from: Rect, kg, state })`, `land(to: Rect)`, `clear()`), `components/transition/PlateFlight.tsx` (overlay v `app/_layout.tsx` nad Stackem, pointerEvents none); Modify `components/map/PlateNode.tsx` / `app/(tabs)/index.tsx` (při Start lesson změřit kotouč a `launch`), `components/lesson/LessonProgress.tsx` (`land` na pozici řady teček), `LessonCompleteScene` (start slétání z poslední pozice kotouče, pokud je).
- [ ] Let: 450–600 ms, ease z `lib/motion`, kotouč se zmenšuje a rotuje. Při `measure` = 0 nebo chybě se let přeskočí. Dvojí tap = jedna navigace. Reduce Motion = prolnutí.
- [ ] Test store (Jest). Tsc, jest, eslint, `npm run e2e` a `e2e:perf` (fps ≥ 55). LOG.

### Task 5: E2E a QA (qa-agent)
- [ ] `e2e/flows/first-run.spec.ts`: reset → path → birth → mapa → start → skip ×N → oslava → „Set your goals“ → editor. Čas do startu lekce ≤ 30 s.
- [ ] `e2e/flows/map-ripple.spec.ts`: tah po pozadí mapy změní pixely canvasu oproti klidu (dluh z fáze 0).
- [ ] Vědomé baseline pro změněné obrazovky. QA report (připsat), iPhone checklist, nativní log.

### Task 6: Rating (rating-agent) a HANDOFF/README/SPEC §7.1 (boss)
