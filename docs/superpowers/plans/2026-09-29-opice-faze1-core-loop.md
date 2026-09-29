# Opice fáze 1, plán A: základ + core loop — implementační plán

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Cíl:** Spustitelná Expo appka, která projde celou smyčkou onboarding → mapa kotoučů → lekce → nacvaknutí kotouče → animované odemčení dalšího uzlu. Pod ní je produkční architektura (typy, services, čistá logika s testy, theme light/dark).

**Architektura:**
- expo-router obrazovky volají hooky, hooky volají `services/index.ts`, ten volá mock implementace.
- Mock implementace zapisují do persistovaného zustand store (AsyncStorage).
- Veškerá herní logika jsou čisté funkce v `logic/` s parametrem `now`. Obsah je v `data/`.
- Komponenty nesmí importovat `store/`, `data/` ani `services/mock/` (hlídá ESLint).

**Stack:** Expo SDK 57, React Native 0.86, TypeScript strict, expo-router, reanimated 4 + react-native-worklets, gesture-handler, react-native-svg, zustand, AsyncStorage, expo-haptics, expo-font + Google Fonts, lucide-react-native, jest-expo.

**Spec:** `docs/superpowers/specs/2026-09-29-opice-faze1-design.md`. Executor ho čte spolu s tímto plánem. Čísla sekcí `§` odkazují na spec.

**Rozsah:**
- Tento plán = kroky 1–2 ze spec §12, plus maskot stage 1 (idle, happy).
- Plán B (samostatný dokument) = maskot kompletně, Liga, Progres, Sezóna + recap, Šatník, notifikace, Dev menu, README.
- Contracts v tomto plánu už definují všechny služby, aby se plán B do rozhraní nemusel vracet.

## Global Constraints

- Balíčky se instalují jen přes `npx expo install <pkg>`. Před použitím Expo API se ověří docs v57: `https://docs.expo.dev/versions/v57.0.0/`.
- Appka musí běžet v Expo Go. Žádný balíček vyžadující development build (Rive jen jako komentovaný stub, v plánu B).
- TypeScript `strict: true` + `noUncheckedIndexedAccess: true`. Žádné `any`, žádné `// @ts-ignore`.
- Importy přes alias `@/` (kořen projektu).
- `app/**` a `components/**` nesmí importovat `@/store/*`, `@/data/*` (výjimka `@/data/copy`) ani `@/services/mock/*`. `hooks/`, `theme/`, `lib/` a `services/` smí. Vynuceno v `eslint.config.js`.
- `logic/**` neimportuje nic z `react`, `react-native`, `expo*`, `@/store`, `@/services`. Importovat smí jen `@/types`.
- Veškerý čas jde přes `lib/clock.ts` (`now()`). Logika bere `now: Date` nebo `today: ISODate` parametrem.
- UI texty v češtině, všechny v `data/copy.ts`.
- Barvy jen z theme tokenů (§6.2). Jeden akcent `#FF6B35`. Ikony lucide, obrysové, `strokeWidth={1.5}`.
- Fonty: display Bebas Neue (jediný display font), text Inter 400/600, utility JetBrains Mono 500 (velká písmena, `letterSpacing` 0.18em, tj. ~2 při 11 pt). Čísla `fontVariant: ['tabular-nums']`.
- Pružiny (`withSpring`) jen na herní odměny (kotouč, +XP, opice, odemčení uzlu). UI prvky používají `withTiming` 150–200 ms s `Easing.bezier(0.22,1,0.36,1)`.
- Dotykové plochy min. 44×44 pt. Kontrast textu ≥ 4.5:1.
- Při zapnutém omezení pohybu (`useReducedMotion()` z reanimated) se pružiny nahradí 200ms fade a pulzování se vypne.
- Commit message končí řádkem `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Lekce dokončená kolem půlnoci / v jiném dni:** streak i „první lekce dne“ se počítají podle místního kalendářního dne, ne UTC. Test: Task 3 (`dates`), Task 4 (`streak`).
2. **Opakování už dokončené lekce:** dá 10 XP, neposune mapu a nevrátí `unlockedLessonId`. Test: Task 6 (`applyLessonCompletion`).
3. **Dvojí tap na „Hotovo“ / „Pokračovat“:** `completeLesson` se zavolá jen jednou a XP se nepřičte dvakrát. Guard v obrazovce lekce (Task 13), idempotence podle `attemptId` v `applyLessonCompletion` (Task 6).
4. **Zabití appky a nové spuštění:** po onboardingu se onboarding znovu neukáže, stav se hydratuje. Poškozená nebo neznámá verze dat vede k resetu na onboarding, ne k pádu. Test: Task 7 (`migrateDb`).
5. **Zadání váhy s čárkou („72,5“) nebo cíl proti směru:** `72,5` se přijme jako 72.5. Cíl vyšší než aktuální váha při hubnutí je chyba s vysvětlujícím textem. Test: Task 10 (`parseWeight`, `validateWeightGoal`).

---

## Struktura souborů (tento plán)

```
app.json · package.json · tsconfig.json · eslint.config.js · jest.config.js · babel.config.js (jen pokud ho SDK vyžaduje)
app/_layout.tsx · app/index.tsx
app/onboarding/_layout.tsx · path.tsx · dream.tsx · milestones.tsx · weight.tsx · birth.tsx
app/(tabs)/_layout.tsx · app/(tabs)/index.tsx
app/lesson/[id].tsx
components/ui/{Text,Button,BigActionBar,Stat,DotSteps,Screen,TopBar,Card,TextField,SegmentedControl}.tsx
components/map/{Plate,PlateNode,BarbellBoss,PathLine,LessonMap,NodePopover}.tsx · components/map/geometry.ts
components/lesson/{ExerciseCard,ExerciseSilhouette,HoldTimer,LessonProgress,LessonCompleteScene,XpPop}.tsx · components/lesson/silhouettes.ts
components/mascot/{index.tsx,types.ts,SvgMascot.tsx,anchors.ts,palette.ts}
components/onboarding/PathGlyph.tsx
types/{index.ts,user.ts,lesson.ts,league.ts,season.ts,cosmetic.ts,activity.ts}
data/{exercises.ts,paths.ts,lessons/bodyControl.ts,lessons/power.ts,lessons/strength.ts,lessons/index.ts,milestones.ts,xp.ts,leagues.ts,seasons.ts,copy.ts}
logic/{dates.ts,random.ts,xp.ts,streak.ts,map.ts,mascot.ts,completion.ts,onboarding.ts} + logic/__tests__/*.test.ts
theme/{tokens.ts,palettes.ts,seasons.ts,ThemeProvider.tsx,useTheme.ts}
store/{db.ts,settings.ts,migrate.ts} + store/__tests__/migrate.test.ts
services/{contracts.ts,index.ts} · services/mock/{MockUserService.ts,MockLessonService.ts,MockSeasonService.ts,notImplemented.ts}
hooks/{useServiceQuery.ts,useProfile.ts,useLessonPath.ts,useLesson.ts,useActiveSeason.ts,useOnboardingDraft.ts,useHydrated.ts}
lib/{clock.ts,haptics.ts,motion.ts}
```

---

### Task 1: Scaffolding a nástroje

**Files:**
- Create: celý Expo projekt v kořeni `appka/`, `tsconfig.json`, `eslint.config.js`, `jest.config.js`, `logic/__tests__/smoke.test.ts`
- Modify: `app.json`, `package.json`

**Interfaces:**
- Produces: alias `@/…`, skripty `npm test`, `npm run typecheck`, `npm run lint`

- [ ] **Step 1: Vytvořit projekt vedle a přesunout ho do kořene** (kořen není prázdný: `.git`, `docs`, `.claude`)

```bash
cd /c/Users/david/Desktop
npx --yes create-expo-app@latest opice-scaffold --template blank-typescript --no-install
cp -r opice-scaffold/assets appka/ && cp opice-scaffold/{app.json,package.json,tsconfig.json,AGENTS.md} appka/
rm -rf opice-scaffold
cd appka && rm -f App.tsx index.ts
```

- [ ] **Step 2: Nainstalovat závislosti**

```bash
npm install
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar \
  react-native-reanimated react-native-worklets react-native-gesture-handler react-native-svg \
  @react-native-async-storage/async-storage expo-haptics expo-font expo-splash-screen expo-notifications \
  @expo-google-fonts/bebas-neue @expo-google-fonts/inter @expo-google-fonts/jetbrains-mono lucide-react-native
npm install zustand
npx expo install react-dom react-native-web @expo/metro-runtime   # web build pro screenshoty design review
npx expo install jest-expo jest @types/jest -- --save-dev
npx expo lint   # vygeneruje eslint.config.js s eslint-config-expo
```

- [ ] **Step 3: `package.json`** nastavit `"main": "expo-router/entry"`, `"name": "opice"` a skripty:

```json
"scripts": {
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "test": "jest",
  "typecheck": "tsc --noEmit",
  "lint": "expo lint"
},
"jest": { "preset": "jest-expo", "testPathIgnorePatterns": ["/node_modules/", "/docs/"] }
```

- [ ] **Step 4: `tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "paths": { "@/*": ["./*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 5: `app.json`**

```json
{
  "expo": {
    "name": "Opice",
    "slug": "opice",
    "scheme": "opice",
    "version": "0.1.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "ios": { "supportsTablet": false, "bundleIdentifier": "app.opice" },
    "android": {
      "package": "app.opice",
      "adaptiveIcon": {
        "backgroundColor": "#0E0D0C",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      },
      "predictiveBackGestureEnabled": false
    },
    "web": { "favicon": "./assets/favicon.png", "output": "single" },
    "plugins": [
      "expo-router",
      "expo-font",
      ["expo-splash-screen", { "backgroundColor": "#0E0D0C", "image": "./assets/splash-icon.png", "imageWidth": 120 }],
      "expo-notifications"
    ],
    "experiments": { "typedRoutes": true }
  }
}
```

(Pokud v šabloně chybí `assets/splash-icon.png`, vynechat klíč `image`.)

- [ ] **Step 6: ESLint hranice vrstev.** Do vygenerovaného `eslint.config.js` přidat:

```js
const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

const uiBoundaries = {
  patterns: [
    { group: ['@/store/*', '@/store'], message: 'UI čte data přes hooks/, ne ze store.' },
    { group: ['@/data/*', '@/data', '!@/data/copy'], message: 'UI čte obsah přes services/, ne z data/ (výjimka: @/data/copy = UI texty).' },
    { group: ['@/services/mock/*'], message: 'Implementaci volí jen services/index.ts.' },
  ],
};
const logicBoundaries = {
  patterns: [
    { group: ['react', 'react-native', 'expo*', '@/store*', '@/services*', '@/data*', '@/theme*'], message: 'logic/ je čistá: jen @/types.' },
  ],
};

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'docs/*'] },
  { files: ['app/**', 'components/**'], rules: { 'no-restricted-imports': ['error', uiBoundaries] } },
  { files: ['logic/**'], ignores: ['logic/__tests__/**'], rules: { 'no-restricted-imports': ['error', logicBoundaries] } },
]);
```

- [ ] **Step 7: Smoke test** `logic/__tests__/smoke.test.ts`

```ts
test('jest běží', () => { expect(1 + 1).toBe(2); });
```

- [ ] **Step 8: Ověřit.** Spustit `npm test && npm run typecheck`. Očekáváno: 1 passed, tsc bez chyb (bez `app/` je typecheck prázdný, to je v pořádku).

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "chore: scaffold Expo SDK 57 projektu, lint hranice, jest" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Doménové typy a obsah

**Files:**
- Create: `types/*.ts`, `data/*.ts`, `data/lessons/*.ts`

**Interfaces:**
- Produces (exportováno z `@/types`): `PathId, ISODate, PlateKg, CosmeticSlot, MascotStage, Mood, SilhouetteId, Exercise, Lesson, Milestone, MilestoneUnit, WeightGoal, WeightEntry, ActivityEvent, UserProfile, SeasonGoal, Season, SeasonThemeId, Cosmetic, MilestoneRule, LeagueTierId, LeagueEntry, OnboardingInput, XpRules`
- Produces (data): `EXERCISES: Record<string, Exercise>`, `PATHS: Record<PathId, PathMeta>`, `LESSONS: Lesson[]`, `MILESTONE_PRESETS: Record<PathId | 'general', MilestonePreset[]>`, `XP_RULES: XpRules`, `STAGE_THRESHOLDS: readonly [0, 500, 2000]`, `LEAGUE_TIERS: LeagueTier[]`, `SEASONS: Season[]`, `copy`

- [ ] **Step 1: `types/lesson.ts`**

```ts
export type PathId = 'power' | 'bodyControl' | 'strength';
export type PlateKg = 5 | 10 | 15 | 20 | 25;
export type SilhouetteId =
  | 'plank' | 'sidePlank' | 'pushup' | 'squat' | 'lunge' | 'hollow' | 'superman'
  | 'handstandWall' | 'lsit' | 'dip' | 'pullup' | 'hang' | 'bridge' | 'crow' | 'jump';

export interface Exercise {
  id: string;
  name: string;
  type: 'reps' | 'hold';
  /** Opakování, nebo sekundy výdrže. */
  amount: number;
  description: string;
  silhouette: SilhouetteId;
}

export interface Lesson {
  id: string;
  pathId: PathId;
  section: number;
  /** Pořadí v sekci od 1, boss je poslední. */
  order: number;
  title: string;
  plateKg: PlateKg;
  exerciseIds: string[];
  isBoss: boolean;
}

export interface PathMeta { id: PathId; name: string; tagline: string; sections: { index: number; title: string }[] }
```

- [ ] **Step 2: `types/activity.ts`, `types/user.ts`**

```ts
// activity.ts
import type { ISODate } from './common';
export interface ActivityEvent {
  id: string;
  /** ISO datetime vzniku (UTC řetězec z Date#toISOString). */
  at: string;
  /** Místní kalendářní den, ke kterému se aktivita počítá. Ukládá se při zápisu, aby změna časové zóny nepřepisovala historii. */
  day: ISODate;
  lessonId: string;
  xp: number;
  /** Den sezóny opravený touto aktivitou (comeback, plán B). */
  repairsDate?: ISODate;
}
```

```ts
// common.ts
/** Místní datum 'YYYY-MM-DD'. */
export type ISODate = string;
export type MascotStage = 1 | 2 | 3;
export type Mood = 'idle' | 'happy' | 'celebrate' | 'sad';
```

```ts
// user.ts
import type { ActivityEvent } from './activity';
import type { ISODate } from './common';
import type { CosmeticSlot } from './cosmetic';
import type { LeagueTierId } from './league';
import type { PathId } from './lesson';
import type { SeasonGoal } from './season';

export type MilestoneUnit = 'reps' | 'seconds' | 'kg' | 'done';
export interface Milestone { id: string; label: string; target: number; unit: MilestoneUnit; current: number; custom: boolean }
export type WeightGoal = { kind: 'none' } | { kind: 'lose' | 'gain'; startKg: number; targetKg: number };
export interface WeightEntry { weekStart: ISODate; kg: number }

export interface UserProfile {
  path: PathId;
  dreamBody: string;
  milestones: Milestone[];
  weightGoal: WeightGoal;
  weights: WeightEntry[];
  activity: ActivityEvent[];
  equipped: Partial<Record<CosmeticSlot, string>>;
  owned: string[];
  seasonGoals: Record<string, SeasonGoal>;
  leagueTier: LeagueTierId;
  createdAt: string;
}

export interface OnboardingInput {
  path: PathId;
  dreamBody: string;
  milestones: Milestone[];
  weightGoal: WeightGoal;
}
```

- [ ] **Step 3: `types/cosmetic.ts`, `types/league.ts`, `types/season.ts`, `types/xp.ts`, `types/index.ts`**

```ts
// cosmetic.ts
export type CosmeticSlot = 'outfit' | 'accessory' | 'mapBackground' | 'lessonEffect' | 'profileFrame';
export type MilestoneRule = { kind: 'milestoneCompleted'; count: number } | { kind: 'streak'; days: number };
export interface Cosmetic {
  id: string; slot: CosmeticSlot; name: string;
  source: 'season' | 'milestone' | 'shop';
  seasonId?: string; milestoneRule?: MilestoneRule; priceBananas?: number;
  /** Index varianty pro Rive number input daného slotu. */
  variantIndex: number;
}
```

```ts
// league.ts
import type { MascotStage } from './common';
import type { CosmeticSlot } from './cosmetic';
export type LeagueTierId = 'wood' | 'stone' | 'iron' | 'bronze' | 'silver' | 'gold' | 'diamond';
export interface LeagueTier { id: LeagueTierId; name: string; order: number }
export interface LeagueEntry {
  userId: string; name: string; xpThisWeek: number; stage: MascotStage;
  cosmetics: Partial<Record<CosmeticSlot, string>>; isMe: boolean;
}
```

```ts
// season.ts
import type { ISODate } from './common';
export type SeasonThemeId = 'winterArc' | 'summerBody';
export type SeasonGoal =
  | { kind: 'activeDays'; days: number }
  | { kind: 'lessons'; count: number }
  | { kind: 'milestone'; label: string; target: number; unit: 'reps' | 'seconds'; current: number }
  | { kind: 'weight'; deltaKg: number };
export interface Season {
  id: string; name: string; startDate: ISODate; endDate: ISODate;
  themeId: SeasonThemeId; rewardCosmeticIds: string[]; badgeId: string;
}
```

```ts
// xp.ts
export interface XpRules {
  lesson: number; boss: number; replay: number; firstOfDay: number;
  streakPerDay: number; streakBonusCap: number;
}
```

`types/index.ts` re-exportuje všechny moduly (`export * from './common'` atd.).

- [ ] **Step 4: `data/xp.ts`, `data/leagues.ts`, `data/seasons.ts`**

```ts
// xp.ts
import type { XpRules } from '@/types';
export const XP_RULES: XpRules = { lesson: 20, boss: 40, replay: 10, firstOfDay: 10, streakPerDay: 2, streakBonusCap: 14 };
/** Minimální celkové XP pro stage 1, 2, 3. */
export const STAGE_THRESHOLDS = [0, 500, 2000] as const;
```

```ts
// leagues.ts
import type { LeagueTier } from '@/types';
export const LEAGUE_TIERS: LeagueTier[] = [
  { id: 'wood', name: 'Dřevo', order: 0 }, { id: 'stone', name: 'Kámen', order: 1 },
  { id: 'iron', name: 'Železo', order: 2 }, { id: 'bronze', name: 'Bronz', order: 3 },
  { id: 'silver', name: 'Stříbro', order: 4 }, { id: 'gold', name: 'Zlato', order: 5 },
  { id: 'diamond', name: 'Diamant', order: 6 },
];
export const LEAGUE_RULES = { groupSize: 16, promote: 5, demote: 3 } as const;
```

```ts
// seasons.ts
import type { Season } from '@/types';
export const SEASONS: Season[] = [
  { id: 'winter-arc-2026', name: 'Winter Arc', startDate: '2026-09-28', endDate: '2026-12-26',
    themeId: 'winterArc', rewardCosmeticIds: ['outfit-winter-arc-scarf'], badgeId: 'badge-winter-arc-2026' },
];
```

- [ ] **Step 5: `data/exercises.ts`.** Knihovna 20 cviků. Všechny záznamy v tomto tvaru:

```ts
import type { Exercise } from '@/types';
const list: Exercise[] = [
  { id: 'plank', name: 'Plank na předloktích', type: 'hold', amount: 30, silhouette: 'plank',
    description: 'Lokty pod rameny, pánev v linii. Zatni zadek i břicho a dýchej.' },
  { id: 'side-plank', name: 'Boční plank', type: 'hold', amount: 20, silhouette: 'sidePlank',
    description: 'Loket pod ramenem, boky nahoře. Tělo tvoří jednu přímku od hlavy k patám.' },
  { id: 'hollow-hold', name: 'Hollow hold', type: 'hold', amount: 20, silhouette: 'hollow',
    description: 'Bedra přitisknutá k zemi, ruce a nohy natažené nízko nad zemí.' },
  { id: 'superman', name: 'Superman', type: 'hold', amount: 20, silhouette: 'superman',
    description: 'Leh na břiše, zvedni ruce i nohy. Krk nech v prodloužení páteře.' },
  { id: 'pushup', name: 'Klik', type: 'reps', amount: 8, silhouette: 'pushup',
    description: 'Ruce na šířku ramen, lokty pod úhlem 45°. Hrudník až k zemi.' },
  { id: 'incline-pushup', name: 'Klik s oporou', type: 'reps', amount: 10, silhouette: 'pushup',
    description: 'Ruce na lavičce nebo stole. Tělo drž rovné jako prkno.' },
  { id: 'squat', name: 'Dřep', type: 'reps', amount: 15, silhouette: 'squat',
    description: 'Chodidla na šířku ramen, kolena ve směru špiček. Pánev pod úroveň kolen.' },
  { id: 'lunge', name: 'Výpad', type: 'reps', amount: 10, silhouette: 'lunge',
    description: 'Dlouhý krok vpřed, zadní koleno těsně nad zem. Střídej nohy.' },
  { id: 'glute-bridge', name: 'Hip bridge', type: 'reps', amount: 12, silhouette: 'bridge',
    description: 'Leh na zádech, paty u zadku. Zvedni pánev a nahoře zatni hýždě.' },
  { id: 'wall-handstand', name: 'Stoj u zdi', type: 'hold', amount: 20, silhouette: 'handstandWall',
    description: 'Břichem ke zdi, ruce na šířku ramen. Tlač zem od sebe, ramena k uším.' },
  { id: 'pike-hold', name: 'Pike výdrž', type: 'hold', amount: 20, silhouette: 'handstandWall',
    description: 'Ruce na zemi, pánev vysoko, váha nad dlaněmi. Příprava na stojku.' },
  { id: 'crow-hold', name: 'Vrána', type: 'hold', amount: 10, silhouette: 'crow',
    description: 'Kolena opřená o lokty, přenes váhu dopředu, dokud se špičky nezvednou.' },
  { id: 'tuck-lsit', name: 'Skrčený L-sit', type: 'hold', amount: 10, silhouette: 'lsit',
    description: 'Opři se o dlaně, stlač ramena dolů a zvedni skrčené nohy od země.' },
  { id: 'dead-hang', name: 'Vis na hrazdě', type: 'hold', amount: 25, silhouette: 'hang',
    description: 'Nadhmat na šířku ramen, uvolněné tělo. Drž pevný úchop.' },
  { id: 'scap-pull', name: 'Stažení lopatek ve visu', type: 'reps', amount: 8, silhouette: 'hang',
    description: 'Ve visu stáhni lopatky dolů a k sobě, lokty zůstávají natažené.' },
  { id: 'negative-pullup', name: 'Negativní shyb', type: 'reps', amount: 4, silhouette: 'pullup',
    description: 'Vyskoč nad hrazdu a spouštěj se pomalu, aspoň 4 sekundy.' },
  { id: 'bench-dip', name: 'Dip o lavičku', type: 'reps', amount: 10, silhouette: 'dip',
    description: 'Dlaně na hraně lavičky, lokty jdou dozadu, ne do stran.' },
  { id: 'jump-squat', name: 'Výskok z dřepu', type: 'reps', amount: 8, silhouette: 'jump',
    description: 'Z dřepu výbušně nahoru, dopadni měkce na špičky a pokračuj do dřepu.' },
  { id: 'burpee', name: 'Angličák', type: 'reps', amount: 6, silhouette: 'jump',
    description: 'Dřep, výkop do planku, klik, návrat a výskok. Plynule a bez pauzy.' },
  { id: 'hollow-rock', name: 'Hollow rock', type: 'reps', amount: 12, silhouette: 'hollow',
    description: 'Z pozice hollow se houpej jako kolébka a drž tvar těla.' },
];
export const EXERCISES: Record<string, Exercise> = Object.fromEntries(list.map((e) => [e.id, e]));
```

- [ ] **Step 6: `data/paths.ts` a `data/lessons/*.ts`**

```ts
// paths.ts
import type { PathMeta } from '@/types';
export const PATHS: Record<PathMeta['id'], PathMeta> = {
  power: { id: 'power', name: 'Power', tagline: 'Výbušnost a síla v tahu. Shyby, dipy, první muscle-up.',
    sections: [{ index: 1, title: 'Základy tahu' }] },
  bodyControl: { id: 'bodyControl', name: 'Body control', tagline: 'Rovnováha a kontrola těla. Plank, stojka, L-sit.',
    sections: [{ index: 1, title: 'Základy rovnováhy' }] },
  strength: { id: 'strength', name: 'Strength', tagline: 'Hrubá síla vlastní vahou. Kliky, dřepy, pistol.',
    sections: [{ index: 1, title: 'Základy síly' }] },
};
```

```ts
// lessons/bodyControl.ts
import type { Lesson } from '@/types';
const L = (order: number, title: string, plateKg: Lesson['plateKg'], exerciseIds: string[], isBoss = false): Lesson =>
  ({ id: `bc-1-${isBoss ? 'boss' : order}`, pathId: 'bodyControl', section: 1, order, title, plateKg, exerciseIds, isBoss });

export const BODY_CONTROL_LESSONS: Lesson[] = [
  L(1, 'Pevný střed', 5, ['plank', 'hollow-hold', 'glute-bridge']),
  L(2, 'Linie těla', 5, ['plank', 'superman', 'side-plank']),
  L(3, 'Opora v dlaních', 10, ['incline-pushup', 'plank', 'pike-hold']),
  L(4, 'Hollow', 10, ['hollow-hold', 'hollow-rock', 'superman', 'side-plank']),
  L(5, 'Nad hlavou', 15, ['pike-hold', 'pushup', 'hollow-hold', 'plank']),
  L(6, 'Stlač ramena', 15, ['tuck-lsit', 'bench-dip', 'hollow-rock', 'side-plank']),
  L(7, 'Vzhůru nohama', 20, ['wall-handstand', 'pike-hold', 'hollow-hold', 'tuck-lsit']),
  L(8, 'Balanc', 20, ['crow-hold', 'wall-handstand', 'hollow-rock', 'plank']),
  L(9, 'Boss: Plná osa', 25, ['wall-handstand', 'crow-hold', 'tuck-lsit', 'hollow-rock', 'plank'], true),
];
```

`lessons/power.ts` (id prefix `pw-1-`) a `lessons/strength.ts` (`st-1-`) mají stejnou strukturu: 8 lekcí + boss, kg `5,5,10,10,15,15,20,20,25`.

```ts
// power.ts
export const POWER_LESSONS: Lesson[] = [
  L(1, 'Úchop', 5, ['dead-hang', 'scap-pull', 'hollow-hold']),
  L(2, 'Lopatky', 5, ['scap-pull', 'incline-pushup', 'plank']),
  L(3, 'Odraz', 10, ['jump-squat', 'dead-hang', 'bench-dip']),
  L(4, 'Tah dolů', 10, ['negative-pullup', 'scap-pull', 'hollow-rock']),
  L(5, 'Výbuch', 15, ['burpee', 'negative-pullup', 'bench-dip']),
  L(6, 'Tlak a tah', 15, ['pushup', 'negative-pullup', 'dead-hang', 'hollow-hold']),
  L(7, 'Tempo', 20, ['burpee', 'jump-squat', 'negative-pullup', 'bench-dip']),
  L(8, 'Kontrola', 20, ['negative-pullup', 'pushup', 'dead-hang', 'hollow-rock']),
  L(9, 'Boss: Plná osa', 25, ['negative-pullup', 'burpee', 'bench-dip', 'dead-hang', 'hollow-rock'], true),
];
// strength.ts
export const STRENGTH_LESSONS: Lesson[] = [
  L(1, 'Základ', 5, ['squat', 'incline-pushup', 'plank']),
  L(2, 'Nohy', 5, ['squat', 'lunge', 'glute-bridge']),
  L(3, 'Tlak', 10, ['pushup', 'bench-dip', 'plank']),
  L(4, 'Stabilita', 10, ['lunge', 'side-plank', 'glute-bridge', 'squat']),
  L(5, 'Objem', 15, ['pushup', 'squat', 'bench-dip', 'hollow-hold']),
  L(6, 'Unilaterál', 15, ['lunge', 'glute-bridge', 'pushup', 'side-plank']),
  L(7, 'Hustota', 20, ['squat', 'pushup', 'lunge', 'bench-dip']),
  L(8, 'Výdrž pod tlakem', 20, ['pushup', 'jump-squat', 'bench-dip', 'plank']),
  L(9, 'Boss: Plná osa', 25, ['pushup', 'squat', 'bench-dip', 'lunge', 'plank'], true),
];
```

(Helper `L` se definuje v každém souboru s příslušným `pathId` a prefixem.)

```ts
// lessons/index.ts
import type { Lesson, PathId } from '@/types';
import { BODY_CONTROL_LESSONS } from './bodyControl';
import { POWER_LESSONS } from './power';
import { STRENGTH_LESSONS } from './strength';
export const LESSONS_BY_PATH: Record<PathId, Lesson[]> = {
  bodyControl: BODY_CONTROL_LESSONS, power: POWER_LESSONS, strength: STRENGTH_LESSONS,
};
export const LESSONS: Lesson[] = Object.values(LESSONS_BY_PATH).flat();
```

- [ ] **Step 7: `data/milestones.ts`**

```ts
import type { MilestoneUnit, PathId } from '@/types';
export interface MilestonePreset { id: string; label: string; target: number; unit: MilestoneUnit }
export const MILESTONE_PRESETS: Record<PathId | 'general', MilestonePreset[]> = {
  power: [
    { id: 'pullups-10', label: '10 shybů', target: 10, unit: 'reps' },
    { id: 'pushups-20', label: '20 kliků', target: 20, unit: 'reps' },
    { id: 'dips-10', label: '10 dipů', target: 10, unit: 'reps' },
    { id: 'first-muscleup', label: 'První muscle-up', target: 1, unit: 'done' },
  ],
  bodyControl: [
    { id: 'plank-60', label: '60s plank', target: 60, unit: 'seconds' },
    { id: 'first-handstand', label: 'První stojka u zdi', target: 1, unit: 'done' },
    { id: 'lsit-10', label: 'L-sit 10 s', target: 10, unit: 'seconds' },
    { id: 'crow-15', label: 'Vrána 15 s', target: 15, unit: 'seconds' },
  ],
  strength: [
    { id: 'pushups-30', label: '30 kliků', target: 30, unit: 'reps' },
    { id: 'pistol-1', label: 'První pistol squat', target: 1, unit: 'done' },
    { id: 'dips-5', label: '5 dipů na bradlech', target: 5, unit: 'reps' },
  ],
  general: [{ id: 'minus-3kg', label: '-3 kg', target: 3, unit: 'kg' }],
};
```

- [ ] **Step 8: `data/copy.ts`.** Obsahuje všechny texty použité v tomto plánu, strukturované podle obrazovek. Klíče, které používají další tasky:

```ts
export const copy = {
  common: { continue: 'Pokračovat', back: 'Zpět', done: 'Hotovo', start: 'Start', pause: 'Pauza', resume: 'Pokračovat', retry: 'Zkusit znovu', loadError: (what: string) => `Nepodařilo se načíst ${what}.` },
  onboarding: {
    stepLabel: (n: number, total: number) => `KROK ${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
    path: { title: 'Vyber si cestu', lead: 'Cestu můžeš později změnit. Opice půjde s tebou.' },
    dream: { title: 'Jaké tělo chceš?', lead: 'Jedna nebo dvě věty. Tohle budeš vídat nahoře v Progresu.', placeholder: 'Chci udělat muscle-up a mít viditelný sixpack.' },
    milestones: { title: 'První milníky', lead: 'Vyber 2 až 3. Můžeš napsat i vlastní.', addCustom: 'Vlastní milník', customLabel: 'Název', customTarget: 'Cíl', pickCount: (n: number) => `${n} / 3 vybráno` },
    weight: { title: 'Cíl váhy', lead: 'Volitelné. Graf váhy uvidíš jen s cílem.', lose: 'Hubnutí', gain: 'Nabírání', none: 'Neřeším', current: 'Aktuální váha', target: 'Cílová váha', unit: 'kg',
      errors: { invalid: 'Zadej číslo mezi 30 a 250 kg.', loseDirection: 'Při hubnutí musí být cíl nižší než aktuální váha.', gainDirection: 'Při nabírání musí být cíl vyšší než aktuální váha.' } },
    birth: { title: 'Tohle je tvoje opice.', lead: 'Poroste s každou lekcí.', cta: 'Jdeme trénovat', bornLabel: (date: string) => `NAROZENA ${date}` },
  },
  map: { sectionLabel: (n: number, title: string) => `SEKCE ${String(n).padStart(2, '0')} · ${title.toUpperCase()}`, start: 'Začít', replay: 'Zopakovat', locked: 'Nejdřív dokonči předchozí lekci.', exercises: (n: number) => `${n} cviky`, streak: 'STREAK', xp: 'XP', days: 'dní' },
  lesson: { reps: 'OPAKOVÁNÍ', seconds: 'SEKUND', quitTitle: 'Ukončit lekci?', quitBody: 'Progres této lekce se neuloží.', quitConfirm: 'Ukončit', quitCancel: 'Trénovat dál', holdReady: 'Připrav se', nextExercise: 'Další cvik' },
  complete: { title: 'Kotouč na ose.', xpLesson: 'lekce', xpBoss: 'boss', xpReplay: 'opakování', xpFirst: 'první dnes', xpStreak: 'streak', cta: 'Pokračovat' },
  leagueTier: 'LIGA',
} as const;
```

(Přesný tvar se může rozšířit, ale klíče výše musí existovat.)

- [ ] **Step 9: Ověřit a commitnout.** `npm run typecheck` projde bez chyb.

```bash
git add types data && git commit -m "feat: doménové typy a obsah fáze 1" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `logic/dates` a `logic/random` (TDD)

**Files:**
- Create: `logic/dates.ts`, `logic/random.ts`, `logic/__tests__/dates.test.ts`, `logic/__tests__/random.test.ts`

**Interfaces:**
- Produces: `toISODate(d: Date): ISODate`, `parseISODate(iso: ISODate): Date` (místní půlnoc), `addDays(iso: ISODate, n: number): ISODate`, `diffDays(a: ISODate, b: ISODate): number` (a − b), `weekStart(d: Date): ISODate` (pondělí), `weekEndsAt(d: Date): Date` (příští pondělí 00:00), `formatCzDate(iso: ISODate): string` (`29. 9. 2026`)
- Produces: `hashString(s: string): number`, `mulberry32(seed: number): () => number`

- [ ] **Step 1: Failing testy**

```ts
// logic/__tests__/dates.test.ts
import { addDays, diffDays, formatCzDate, parseISODate, toISODate, weekEndsAt, weekStart } from '@/logic/dates';

describe('dates', () => {
  test('toISODate používá místní den, ne UTC', () => {
    expect(toISODate(new Date(2026, 8, 29, 23, 59))).toBe('2026-09-29');
    expect(toISODate(new Date(2026, 8, 30, 0, 1))).toBe('2026-09-30');
  });
  test('addDays přes hranici měsíce a roku', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  test('diffDays je odolné vůči změně letního času', () => {
    expect(diffDays('2026-10-26', '2026-10-24')).toBe(2); // přechod na zimní čas 25. 10.
    expect(diffDays('2026-09-28', '2026-09-29')).toBe(-1);
  });
  test('weekStart je pondělí', () => {
    expect(weekStart(new Date(2026, 8, 29))).toBe('2026-09-28'); // úterý
    expect(weekStart(new Date(2026, 9, 4, 23))).toBe('2026-09-28'); // neděle
    expect(weekStart(new Date(2026, 9, 5))).toBe('2026-10-05'); // pondělí
  });
  test('weekEndsAt je příští pondělí 00:00', () => {
    expect(weekEndsAt(new Date(2026, 8, 29, 12)).getTime()).toBe(new Date(2026, 9, 5).getTime());
  });
  test('parseISODate vrací místní půlnoc', () => {
    expect(parseISODate('2026-09-29').getTime()).toBe(new Date(2026, 8, 29).getTime());
  });
  test('formatCzDate', () => { expect(formatCzDate('2026-09-29')).toBe('29. 9. 2026'); });
});
```

```ts
// logic/__tests__/random.test.ts
import { hashString, mulberry32 } from '@/logic/random';
test('mulberry32 je deterministický a v [0,1)', () => {
  const a = mulberry32(hashString('opice')); const b = mulberry32(hashString('opice'));
  const xs = Array.from({ length: 50 }, () => a());
  expect(xs).toEqual(Array.from({ length: 50 }, () => b()));
  expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
});
test('hashString rozlišuje vstupy', () => { expect(hashString('a')).not.toBe(hashString('b')); });
```

- [ ] **Step 2:** Spustit `npx jest logic/__tests__/dates.test.ts logic/__tests__/random.test.ts`. Očekáváno: FAIL, modul nenalezen.

- [ ] **Step 3: Implementace**

```ts
// logic/dates.ts
import type { ISODate } from '@/types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  if (y === undefined || m === undefined || d === undefined || Number.isNaN(y + m + d)) {
    throw new Error(`Neplatné datum: ${iso}`);
  }
  return new Date(y, m - 1, d);
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Počet kalendářních dní a − b. Počítá se v UTC z data, takže DST neovlivní výsledek. */
export function diffDays(a: ISODate, b: ISODate): number {
  const ua = Date.UTC(...ymd(a)); const ub = Date.UTC(...ymd(b));
  return Math.round((ua - ub) / 86_400_000);
}

function ymd(iso: ISODate): [number, number, number] {
  const d = parseISODate(iso);
  return [d.getFullYear(), d.getMonth(), d.getDate()];
}

export function weekStart(d: Date): ISODate {
  const day = (d.getDay() + 6) % 7; // pondělí = 0
  return addDays(toISODate(d), -day);
}

export function weekEndsAt(d: Date): Date {
  return parseISODate(addDays(weekStart(d), 7));
}

export function formatCzDate(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}
```

```ts
// logic/random.ts
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 4:** Znovu spustit testy. Očekáváno: PASS. Pozor: jest používá systémovou TZ. Test DST počítá s Europe/Prague, proto v `package.json` nastavit `"test": "TZ=Europe/Prague jest"`. Na Windows to nefunguje, takže použít `cross-env` (`npm i -D cross-env`, `"test": "cross-env TZ=Europe/Prague jest"`).

- [ ] **Step 5:** Commit `feat(logic): data a deterministický random`.

---

### Task 4: `logic/streak` a `logic/xp` (TDD)

**Files:**
- Create: `logic/streak.ts`, `logic/xp.ts`, `logic/__tests__/streak.test.ts`, `logic/__tests__/xp.test.ts`

**Interfaces:**
- Consumes: `addDays`, `diffDays` z Task 3
- Produces:
  - `activeDays(events: Pick<ActivityEvent,'day'>[]): ISODate[]` (seřazené unikátní)
  - `currentStreak(days: ISODate[], today: ISODate): number`
  - `longestStreak(days: ISODate[]): number`
  - `isStreakBroken(days: ISODate[], today: ISODate): boolean`
  - `totalXp(events: Pick<ActivityEvent,'xp'>[]): number`
  - `lessonXp(input: LessonXpInput, rules: XpRules): XpBreakdown`
  - `interface LessonXpInput { isBoss: boolean; isReplay: boolean; isFirstToday: boolean; streakDays: number }`
  - `interface XpBreakdown { base: number; baseKind: 'lesson' | 'boss' | 'replay'; firstOfDay: number; streak: number; total: number }`

- [ ] **Step 1: Failing testy**

```ts
// streak.test.ts
import { activeDays, currentStreak, isStreakBroken, longestStreak } from '@/logic/streak';
const d = (...xs: string[]) => xs;
describe('streak', () => {
  test('activeDays deduplikuje a řadí', () => {
    expect(activeDays([{ day: '2026-09-29' }, { day: '2026-09-27' }, { day: '2026-09-29' }])).toEqual(['2026-09-27', '2026-09-29']);
  });
  test('streak končící dnes', () => { expect(currentStreak(d('2026-09-27', '2026-09-28', '2026-09-29'), '2026-09-29')).toBe(3); });
  test('streak končící včera ještě platí', () => { expect(currentStreak(d('2026-09-27', '2026-09-28'), '2026-09-29')).toBe(2); });
  test('mezera streak přeruší', () => { expect(currentStreak(d('2026-09-25', '2026-09-27', '2026-09-28'), '2026-09-29')).toBe(2); });
  test('předevčírem = 0', () => { expect(currentStreak(d('2026-09-27'), '2026-09-29')).toBe(0); });
  test('přes hranici měsíce', () => { expect(currentStreak(d('2026-09-30', '2026-10-01'), '2026-10-01')).toBe(2); });
  test('prázdná historie', () => { expect(currentStreak([], '2026-09-29')).toBe(0); expect(isStreakBroken([], '2026-09-29')).toBe(false); });
  test('longestStreak', () => { expect(longestStreak(d('2026-09-01', '2026-09-02', '2026-09-03', '2026-09-10', '2026-09-11'))).toBe(3); });
  test('isStreakBroken jen když historie existuje a poslední den < včera', () => {
    expect(isStreakBroken(d('2026-09-27'), '2026-09-29')).toBe(true);
    expect(isStreakBroken(d('2026-09-28'), '2026-09-29')).toBe(false);
  });
});
```

```ts
// xp.test.ts
import { XP_RULES } from '@/data/xp';
import { lessonXp, totalXp } from '@/logic/xp';
describe('xp', () => {
  test('běžná lekce, první dnes, streak 1', () => {
    expect(lessonXp({ isBoss: false, isReplay: false, isFirstToday: true, streakDays: 1 }, XP_RULES))
      .toEqual({ base: 20, baseKind: 'lesson', firstOfDay: 10, streak: 2, total: 32 });
  });
  test('boss', () => { expect(lessonXp({ isBoss: true, isReplay: false, isFirstToday: false, streakDays: 0 }, XP_RULES).total).toBe(40); });
  test('opakování dá 10 i u bosse', () => {
    expect(lessonXp({ isBoss: true, isReplay: true, isFirstToday: false, streakDays: 0 }, XP_RULES)).toMatchObject({ base: 10, baseKind: 'replay' });
  });
  test('streak bonus je zastropovaný', () => { expect(lessonXp({ isBoss: false, isReplay: false, isFirstToday: false, streakDays: 30 }, XP_RULES).streak).toBe(14); });
  test('totalXp', () => { expect(totalXp([{ xp: 32 }, { xp: 10 }])).toBe(42); });
});
```

(Testy smí importovat `@/data`, výjimka platí jen pro `__tests__`.)

- [ ] **Step 2:** Spustit, očekáváno FAIL.

- [ ] **Step 3: Implementace**

```ts
// logic/streak.ts
import type { ActivityEvent, ISODate } from '@/types';
import { addDays, diffDays } from './dates';

export function activeDays(events: Pick<ActivityEvent, 'day'>[]): ISODate[] {
  return [...new Set(events.map((e) => e.day))].sort();
}

export function currentStreak(days: ISODate[], today: ISODate): number {
  const set = new Set(days);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(cursor)) { n++; cursor = addDays(cursor, -1); }
  return n;
}

export function longestStreak(days: ISODate[]): number {
  let best = 0; let run = 0; let prev: ISODate | undefined;
  for (const day of [...days].sort()) {
    run = prev !== undefined && diffDays(day, prev) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = day;
  }
  return best;
}

export function isStreakBroken(days: ISODate[], today: ISODate): boolean {
  const last = days.at(-1);
  return last !== undefined && diffDays(today, last) >= 2;
}
```

```ts
// logic/xp.ts
import type { ActivityEvent, XpRules } from '@/types';
export interface LessonXpInput { isBoss: boolean; isReplay: boolean; isFirstToday: boolean; streakDays: number }
export interface XpBreakdown { base: number; baseKind: 'lesson' | 'boss' | 'replay'; firstOfDay: number; streak: number; total: number }

export function lessonXp(i: LessonXpInput, r: XpRules): XpBreakdown {
  const baseKind = i.isReplay ? 'replay' : i.isBoss ? 'boss' : 'lesson';
  const base = baseKind === 'replay' ? r.replay : baseKind === 'boss' ? r.boss : r.lesson;
  const firstOfDay = i.isFirstToday ? r.firstOfDay : 0;
  const streak = Math.min(i.streakDays * r.streakPerDay, r.streakBonusCap);
  return { base, baseKind, firstOfDay, streak, total: base + firstOfDay + streak };
}

export function totalXp(events: Pick<ActivityEvent, 'xp'>[]): number {
  return events.reduce((s, e) => s + e.xp, 0);
}
```

- [ ] **Step 4:** Očekáváno PASS.
- [ ] **Step 5:** Commit `feat(logic): streak a XP`.

---

### Task 5: `logic/map` a `logic/mascot` (TDD)

**Files:**
- Create: `logic/map.ts`, `logic/mascot.ts` + testy

**Interfaces:**
- Produces:
  - `type NodeState = 'locked' | 'current' | 'done'`
  - `nodeStates(lessons: Lesson[], completed: ReadonlySet<string>): Map<string, NodeState>` (lekce seřazené podle `order`)
  - `nextLessonId(lessons: Lesson[], completed: ReadonlySet<string>): string | null`
  - `stageForXp(xp: number, thresholds: readonly number[]): MascotStage`
  - `stageProgress(xp: number, thresholds: readonly number[]): { stage: MascotStage; into: number; span: number | null }`

- [ ] **Step 1: Testy**

```ts
// map.test.ts
import { LESSONS_BY_PATH } from '@/data/lessons';
import { nextLessonId, nodeStates } from '@/logic/map';
const lessons = LESSONS_BY_PATH.bodyControl;
test('nový uživatel: první current, zbytek locked', () => {
  const s = nodeStates(lessons, new Set());
  expect(s.get('bc-1-1')).toBe('current');
  expect([...s.values()].filter((v) => v === 'locked')).toHaveLength(8);
});
test('po dvou lekcích je třetí current', () => {
  const s = nodeStates(lessons, new Set(['bc-1-1', 'bc-1-2']));
  expect(s.get('bc-1-2')).toBe('done'); expect(s.get('bc-1-3')).toBe('current'); expect(s.get('bc-1-boss')).toBe('locked');
});
test('boss je current až po všech 8', () => {
  const done = new Set(lessons.filter((l) => !l.isBoss).map((l) => l.id));
  expect(nodeStates(lessons, done).get('bc-1-boss')).toBe('current');
});
test('vše hotovo: žádný current, next = null', () => {
  const all = new Set(lessons.map((l) => l.id));
  expect([...nodeStates(lessons, all).values()].every((v) => v === 'done')).toBe(true);
  expect(nextLessonId(lessons, all)).toBeNull();
});
test('neřazený vstup se seřadí podle order', () => {
  expect(nextLessonId([...lessons].reverse(), new Set())).toBe('bc-1-1');
});
```

```ts
// mascot.test.ts
import { STAGE_THRESHOLDS } from '@/data/xp';
import { stageForXp, stageProgress } from '@/logic/mascot';
test.each([[0, 1], [499, 1], [500, 2], [1999, 2], [2000, 3], [99999, 3]])('xp %i → stage %i', (xp, st) => {
  expect(stageForXp(xp, STAGE_THRESHOLDS)).toBe(st);
});
test('stageProgress', () => {
  expect(stageProgress(600, STAGE_THRESHOLDS)).toEqual({ stage: 2, into: 100, span: 1500 });
  expect(stageProgress(2500, STAGE_THRESHOLDS)).toEqual({ stage: 3, into: 500, span: null });
});
```

- [ ] **Step 2:** FAIL.

- [ ] **Step 3: Implementace**

```ts
// logic/map.ts
import type { Lesson } from '@/types';
export type NodeState = 'locked' | 'current' | 'done';
const sorted = (ls: Lesson[]) => [...ls].sort((a, b) => a.section - b.section || a.order - b.order);

export function nextLessonId(lessons: Lesson[], completed: ReadonlySet<string>): string | null {
  return sorted(lessons).find((l) => !completed.has(l.id))?.id ?? null;
}

export function nodeStates(lessons: Lesson[], completed: ReadonlySet<string>): Map<string, NodeState> {
  const next = nextLessonId(lessons, completed);
  return new Map(sorted(lessons).map((l) => [l.id, completed.has(l.id) ? 'done' : l.id === next ? 'current' : 'locked']));
}
```

Poznámka: odemykání je striktně sekvenční. Když uživatel dokončí lekci mimo pořadí (to UI nedovolí), `done` zůstane a `current` je první nedokončená.

```ts
// logic/mascot.ts
import type { MascotStage } from '@/types';
export function stageForXp(xp: number, t: readonly number[]): MascotStage {
  const s = t.filter((min) => xp >= min).length;
  return Math.min(Math.max(s, 1), 3) as MascotStage;
}
export function stageProgress(xp: number, t: readonly number[]) {
  const stage = stageForXp(xp, t);
  const from = t[stage - 1] ?? 0; const to = t[stage];
  return { stage, into: xp - from, span: to === undefined ? null : to - from };
}
```

- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(logic): stavy mapy a stage opice`.

---

### Task 6: `logic/completion` + `logic/onboarding` (TDD)

**Files:**
- Create: `logic/completion.ts`, `logic/onboarding.ts` + testy

**Interfaces:**
- Consumes: Task 3–5
- Produces:
  - `applyLessonCompletion(args: { profile: UserProfile; lesson: Lesson; pathLessons: Lesson[]; now: Date; attemptId: string; rules: XpRules; thresholds: readonly number[] }): { profile: UserProfile; result: LessonResult }`
  - `interface LessonResult { attemptId: string; lessonId: string; xp: XpBreakdown; totalXpBefore: number; totalXpAfter: number; stageBefore: MascotStage; stageAfter: MascotStage; unlockedLessonId: string | null; streak: number; completedPlates: PlateKg[] }` (`completedPlates` = kg všech dokončených lekcí sekce včetně této, bez bosse, v pořadí)
  - `buildInitialProfile(input: OnboardingInput, now: Date): UserProfile`
  - `mockWeightHistory(goal: WeightGoal, now: Date, seed: number): WeightEntry[]` (8 týdnů)
  - `parseWeight(raw: string): number | null`
  - `validateWeightGoal(kind: 'lose' | 'gain', currentKg: number | null, targetKg: number | null): 'ok' | 'invalid' | 'loseDirection' | 'gainDirection'`

- [ ] **Step 1: Testy** `logic/__tests__/completion.test.ts`

```ts
import { LESSONS_BY_PATH } from '@/data/lessons';
import { STAGE_THRESHOLDS, XP_RULES } from '@/data/xp';
import { applyLessonCompletion } from '@/logic/completion';
import { buildInitialProfile } from '@/logic/onboarding';
import type { UserProfile } from '@/types';

const path = LESSONS_BY_PATH.bodyControl;
const lesson = (id: string) => path.find((l) => l.id === id)!;
const base = (): UserProfile => buildInitialProfile({ path: 'bodyControl', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } }, new Date(2026, 8, 29, 10));
const run = (profile: UserProfile, id: string, now: Date, attemptId = `a-${id}-${now.getTime()}`) =>
  applyLessonCompletion({ profile, lesson: lesson(id), pathLessons: path, now, attemptId, rules: XP_RULES, thresholds: STAGE_THRESHOLDS });

test('první lekce: 32 XP, odemkne druhou, streak 1', () => {
  const { profile, result } = run(base(), 'bc-1-1', new Date(2026, 8, 29, 10));
  expect(result.xp.total).toBe(32); expect(result.unlockedLessonId).toBe('bc-1-2'); expect(result.streak).toBe(1);
  expect(profile.activity).toHaveLength(1); expect(profile.activity[0]!.day).toBe('2026-09-29');
  expect(result.completedPlates).toEqual([5]);
});
test('druhá lekce týž den: bez bonusu první dnes', () => {
  const a = run(base(), 'bc-1-1', new Date(2026, 8, 29, 10));
  const b = run(a.profile, 'bc-1-2', new Date(2026, 8, 29, 18));
  expect(b.result.xp).toMatchObject({ base: 20, firstOfDay: 0, streak: 2 });
  expect(b.result.completedPlates).toEqual([5, 5]);
});
test('opakování hotové lekce: 10 XP základ, nic neodemkne', () => {
  const a = run(base(), 'bc-1-1', new Date(2026, 8, 29, 10));
  const b = run(a.profile, 'bc-1-1', new Date(2026, 8, 29, 11));
  expect(b.result.xp.baseKind).toBe('replay'); expect(b.result.unlockedLessonId).toBeNull();
});
test('stejný attemptId dvakrát: idempotentní, XP se nepřičte dvakrát', () => {
  const now = new Date(2026, 8, 29, 10);
  const a = run(base(), 'bc-1-1', now, 'attempt-1');
  const b = run(a.profile, 'bc-1-1', now, 'attempt-1');
  expect(b.profile.activity).toHaveLength(1); expect(b.result).toEqual(a.result);
});
test('lekce ve 23:59 a 00:01 jsou dva různé dny (streak 2, obě first-of-day)', () => {
  const a = run(base(), 'bc-1-1', new Date(2026, 8, 29, 23, 59));
  const b = run(a.profile, 'bc-1-2', new Date(2026, 8, 30, 0, 1));
  expect(b.result.xp.firstOfDay).toBe(10); expect(b.result.streak).toBe(2);
});
test('přechod stage se hlásí', () => {
  let p = base();
  p = { ...p, activity: [{ id: 'dev', at: new Date(2026, 8, 28).toISOString(), day: '2026-09-28', lessonId: 'dev-xp', xp: 480 }] };
  const r = run(p, 'bc-1-1', new Date(2026, 8, 29, 10));
  expect(r.result.stageBefore).toBe(1); expect(r.result.stageAfter).toBe(2);
});
```

`logic/__tests__/onboarding.test.ts`:

```ts
import { buildInitialProfile, mockWeightHistory, parseWeight, validateWeightGoal } from '@/logic/onboarding';
test('parseWeight přijme čárku i tečku a odmítne nesmysly', () => {
  expect(parseWeight('72,5')).toBe(72.5); expect(parseWeight(' 80 ')).toBe(80);
  expect(parseWeight('')).toBeNull(); expect(parseWeight('abc')).toBeNull(); expect(parseWeight('7O')).toBeNull();
});
test.each([
  ['lose', 80, 75, 'ok'], ['lose', 80, 85, 'loseDirection'], ['gain', 70, 75, 'ok'], ['gain', 70, 65, 'gainDirection'],
  ['lose', 20, 15, 'invalid'], ['gain', null, 75, 'invalid'], ['lose', 80, 80, 'loseDirection'],
] as const)('%s %p → %p = %s', (kind, cur, tgt, out) => { expect(validateWeightGoal(kind, cur, tgt)).toBe(out); });
test('mockWeightHistory: 8 týdnů, pondělky, trend k cíli, poslední týden je aktuální', () => {
  const now = new Date(2026, 8, 29);
  const h = mockWeightHistory({ kind: 'lose', startKg: 84, targetKg: 78 }, now, 1);
  expect(h).toHaveLength(8); expect(h.at(-1)!.weekStart).toBe('2026-09-28');
  expect(h[0]!.kg).toBeGreaterThan(h.at(-1)!.kg);
  expect(h.at(-1)!.kg).toBe(84);
});
test('bez cíle se historie váhy negeneruje', () => {
  const p = buildInitialProfile({ path: 'power', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } }, new Date());
  expect(p.weights).toEqual([]); expect(p.leagueTier).toBe('wood'); expect(p.activity).toEqual([]);
});
```

Rozhodnutí: historie váhy se generuje *zpětně* tak, aby poslední záznam (tento týden) byl aktuální zadaná váha. Předchozí týdny ukazují mírný trend směrem k cíli, tedy „už jsi na cestě“. `startKg` je váha z onboardingu.

- [ ] **Step 2:** FAIL.

- [ ] **Step 3: Implementace**

```ts
// logic/completion.ts
import type { Lesson, MascotStage, PlateKg, UserProfile, XpRules } from '@/types';
import { toISODate } from './dates';
import { nextLessonId } from './map';
import { stageForXp } from './mascot';
import { activeDays, currentStreak } from './streak';
import { lessonXp, totalXp, type XpBreakdown } from './xp';

export interface LessonResult {
  attemptId: string; lessonId: string; xp: XpBreakdown;
  totalXpBefore: number; totalXpAfter: number;
  stageBefore: MascotStage; stageAfter: MascotStage;
  unlockedLessonId: string | null; streak: number; completedPlates: PlateKg[];
}

interface Args {
  profile: UserProfile; lesson: Lesson; pathLessons: Lesson[]; now: Date;
  attemptId: string; rules: XpRules; thresholds: readonly number[];
}

export function applyLessonCompletion(a: Args): { profile: UserProfile; result: LessonResult } {
  const prior = a.profile.activity.find((e) => e.id === a.attemptId);
  const events = prior ? a.profile.activity.filter((e) => e.id !== a.attemptId) : a.profile.activity;

  const day = toISODate(a.now);
  const completedBefore = new Set(events.map((e) => e.lessonId));
  const isReplay = completedBefore.has(a.lesson.id);
  const isFirstToday = !events.some((e) => e.day === day);
  const daysAfter = activeDays([...events, { day }]);
  const streak = currentStreak(daysAfter, day);
  const xp = lessonXp({ isBoss: a.lesson.isBoss, isReplay, isFirstToday, streakDays: streak }, a.rules);

  const totalXpBefore = totalXp(events);
  const totalXpAfter = totalXpBefore + xp.total;
  const completedAfter = new Set([...completedBefore, a.lesson.id]);
  const sectionLessons = a.pathLessons.filter((l) => l.section === a.lesson.section);

  const result: LessonResult = {
    attemptId: a.attemptId, lessonId: a.lesson.id, xp, totalXpBefore, totalXpAfter,
    stageBefore: stageForXp(totalXpBefore, a.thresholds), stageAfter: stageForXp(totalXpAfter, a.thresholds),
    unlockedLessonId: isReplay ? null : nextLessonId(a.pathLessons, completedAfter),
    streak,
    completedPlates: [...sectionLessons].sort((x, y) => x.order - y.order)
      .filter((l) => !l.isBoss && completedAfter.has(l.id)).map((l) => l.plateKg),
  };

  if (prior) return { profile: a.profile, result: { ...result, xp: { ...xp, total: prior.xp } } };
  const event = { id: a.attemptId, at: a.now.toISOString(), day, lessonId: a.lesson.id, xp: xp.total };
  return { profile: { ...a.profile, activity: [...a.profile.activity, event] }, result };
}
```

Idempotence: pokud `attemptId` už existuje, profil se nemění. Výsledek se přepočítá proti stavu *bez* té události, takže je identický s prvním voláním (test `toEqual`). Pokud by se lišil `xp.total` (například kvůli změně pravidel), použije se uložené `prior.xp`.

```ts
// logic/onboarding.ts
import type { OnboardingInput, UserProfile, WeightEntry, WeightGoal } from '@/types';
import { addDays, weekStart } from './dates';
import { mulberry32 } from './random';

export function parseWeight(raw: string): number | null {
  const s = raw.trim().replace(',', '.');
  if (!/^\d{2,3}(\.\d{1,2})?$/.test(s)) return null;
  return Number(s);
}

const inRange = (kg: number | null): kg is number => kg !== null && kg >= 30 && kg <= 250;

export function validateWeightGoal(kind: 'lose' | 'gain', current: number | null, target: number | null) {
  if (!inRange(current) || !inRange(target)) return 'invalid' as const;
  if (kind === 'lose' && target >= current) return 'loseDirection' as const;
  if (kind === 'gain' && target <= current) return 'gainDirection' as const;
  return 'ok' as const;
}

export function mockWeightHistory(goal: WeightGoal, now: Date, seed: number): WeightEntry[] {
  if (goal.kind === 'none') return [];
  const rnd = mulberry32(seed);
  const dir = goal.kind === 'lose' ? -1 : 1;
  const thisWeek = weekStart(now);
  return Array.from({ length: 8 }, (_, i) => {
    const weeksAgo = 7 - i;
    const trend = -dir * weeksAgo * 0.35; // o 0.35 kg týdně "před" aktuální vahou
    const noise = weeksAgo === 0 ? 0 : (rnd() - 0.5) * 0.6;
    return { weekStart: addDays(thisWeek, -7 * weeksAgo), kg: Math.round((goal.startKg + trend + noise) * 10) / 10 };
  });
}

export function buildInitialProfile(input: OnboardingInput, now: Date): UserProfile {
  return {
    path: input.path, dreamBody: input.dreamBody.trim(), milestones: input.milestones,
    weightGoal: input.weightGoal, weights: mockWeightHistory(input.weightGoal, now, now.getTime() % 100_000),
    activity: [], equipped: {}, owned: [], seasonGoals: {}, leagueTier: 'wood', createdAt: now.toISOString(),
  };
}
```

- [ ] **Step 4:** PASS (`npm test`, všechny sady).
- [ ] **Step 5:** Commit `feat(logic): dokončení lekce, onboarding profil, validace váhy`.

---

### Task 7: Store, migrace, clock, contracts, mock services, hooky

**Files:**
- Create: `store/db.ts`, `store/settings.ts`, `store/migrate.ts`, `store/__tests__/migrate.test.ts`, `lib/clock.ts`, `services/contracts.ts`, `services/index.ts`, `services/mock/*.ts`, `hooks/*.ts`

**Interfaces:**
- Consumes: logic z Task 3–6, data z Task 2
- Produces:
  - `services.user.getProfile(): Promise<UserProfile | null>`, `completeOnboarding(input): Promise<UserProfile>`, `logWeight`, `updateMilestone`, `reset`
  - `services.lessons.getPath(pathId, now): Promise<LessonPathView>`, `getLesson(id): Promise<LessonDetail>`, `completeLesson(id, attemptId, now): Promise<LessonResult>`
  - `services.season.getActive(now): Promise<Season | null>`
  - `LessonPathView = { path: PathMeta; sections: { index: number; title: string; nodes: MapNode[] }[]; currentLessonId: string | null }`
  - `MapNode = { lesson: Lesson; state: NodeState; exerciseCount: number }`
  - `LessonDetail = { lesson: Lesson; exercises: Exercise[] }`
  - hooky: `useProfile(): Query<UserProfile | null>`, `useLessonPath(): Query<LessonPathView>`, `useLesson(id): Query<LessonDetail>`, `useActiveSeason(): Query<Season | null>`, `useHydrated(): boolean`, `useOnboardingDraft()` (zustand selektory + settery), `useProfileStats(): { totalXp: number; streak: number; stage: MascotStage; streakBroken: boolean } | null`
  - `Query<T> = { status: 'loading' } | { status: 'error'; error: Error; retry(): void } | { status: 'ready'; data: T; refresh(): void }`
  - `now(): Date` z `lib/clock.ts`

Poznámka k rozhraní: oproti spec §3.4 dostává `completeLesson` navíc `attemptId` (idempotence, Review Focus 3). Upraví se i spec.

- [ ] **Step 1: Failing test migrace** `store/__tests__/migrate.test.ts`

```ts
import { DB_VERSION, migrateDb } from '@/store/migrate';
test('aktuální verze projde beze změny', () => {
  const s = { profile: null };
  expect(migrateDb(s, DB_VERSION)).toEqual(s);
});
test('neznámá budoucí verze nebo nesmysl → čistý stav', () => {
  expect(migrateDb({ foo: 1 }, DB_VERSION + 5)).toEqual({ profile: null });
  expect(migrateDb('garbage', 0)).toEqual({ profile: null });
});
test('profil bez pole activity se zahodí (poškozená data)', () => {
  expect(migrateDb({ profile: { path: 'power' } }, DB_VERSION)).toEqual({ profile: null });
});
```

- [ ] **Step 2:** Spustit, očekáváno FAIL. Pak implementovat:

```ts
// store/migrate.ts
import type { UserProfile } from '@/types';
export const DB_VERSION = 1;
export interface PersistedDb { profile: UserProfile | null }
const EMPTY: PersistedDb = { profile: null };

function isProfile(p: unknown): p is UserProfile {
  if (typeof p !== 'object' || p === null) return false;
  const o = p as Record<string, unknown>;
  return typeof o.path === 'string' && Array.isArray(o.activity) && Array.isArray(o.milestones) && typeof o.weightGoal === 'object';
}

export function migrateDb(persisted: unknown, version: number): PersistedDb {
  if (version > DB_VERSION || typeof persisted !== 'object' || persisted === null) return EMPTY;
  const profile = (persisted as { profile?: unknown }).profile ?? null;
  // TODO(fáze 2): migrace mezi verzemi schématu přidávat jako if (version < N) {...}
  if (profile === null) return EMPTY;
  return isProfile(profile) ? { profile } : EMPTY;
}
```

- [ ] **Step 3: `store/db.ts`**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { UserProfile } from '@/types';
import { DB_VERSION, migrateDb, type PersistedDb } from './migrate';

interface DbState extends PersistedDb {
  hydrated: boolean;
  /** Roste s každým zápisem. Hooky podle něj znovu načtou data ze services. */
  revision: number;
  setProfile(profile: UserProfile | null): void;
}

export const useDb = create<DbState>()(
  persist(
    (set) => ({
      profile: null, hydrated: false, revision: 0,
      setProfile: (profile) => set((s) => ({ profile, revision: s.revision + 1 })),
    }),
    {
      name: 'opice-db',
      version: DB_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): PersistedDb => ({ profile: s.profile }),
      migrate: (persisted, version) => migrateDb(persisted, version),
      merge: (persisted, current) => ({ ...current, ...migrateDb(persisted, DB_VERSION) }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.warn('[db] hydratace selhala, začínám načisto', error);
        useDb.setState({ hydrated: true });
      },
    },
  ),
);
```

- [ ] **Step 4: `store/settings.ts`** (preference; dev offset slouží pro plán B)

```ts
export type ThemePreference = 'system' | 'light' | 'dark';
interface SettingsState { theme: ThemePreference; devTimeOffsetMs: number; setTheme(t: ThemePreference): void; setDevTimeOffset(ms: number): void }
export const useSettings = create<SettingsState>()(persist((set) => ({
  theme: 'system', devTimeOffsetMs: 0,
  setTheme: (theme) => set({ theme }), setDevTimeOffset: (devTimeOffsetMs) => set({ devTimeOffsetMs }),
}), { name: 'opice-settings', version: 1, storage: createJSONStorage(() => AsyncStorage) }));
```

(Importy stejné jako v `db.ts`.)

- [ ] **Step 5: `lib/clock.ts`**

```ts
import { useSettings } from '@/store/settings';
/** Jediný zdroj "teď" v appce. Dev menu posouvá čas přes devTimeOffsetMs. */
export function now(): Date { return new Date(Date.now() + useSettings.getState().devTimeOffsetMs); }
```

(`lib/` smí importovat store, ESLint hranice platí jen pro `app/` a `components/`.)

- [ ] **Step 6: `services/contracts.ts`.** Všechna rozhraní ze spec §3.4 plus view typy výše. Plná podoba:

```ts
import type { LessonResult } from '@/logic/completion';
import type { NodeState } from '@/logic/map';
import type {
  Cosmetic, CosmeticSlot, Exercise, LeagueEntry, LeagueTierId, Lesson, OnboardingInput, PathId, PathMeta,
  Season, SeasonGoal, UserProfile, ISODate, MascotStage,
} from '@/types';

export type { LessonResult, NodeState };
export interface MapNode { lesson: Lesson; state: NodeState; exerciseCount: number }
export interface LessonPathView { path: PathMeta; sections: { index: number; title: string; nodes: MapNode[] }[]; currentLessonId: string | null }
export interface LessonDetail { lesson: Lesson; exercises: Exercise[] }

export interface UserService {
  getProfile(): Promise<UserProfile | null>;
  completeOnboarding(input: OnboardingInput): Promise<UserProfile>;
  logWeight(kg: number, now: Date): Promise<void>;
  updateMilestone(id: string, current: number): Promise<void>;
  reset(): Promise<void>;
}
export interface LessonService {
  getPath(pathId: PathId, now: Date): Promise<LessonPathView>;
  getLesson(id: string): Promise<LessonDetail>;
  completeLesson(id: string, attemptId: string, now: Date): Promise<LessonResult>;
}
export interface LeagueWeekView {
  tier: LeagueTierId; entries: LeagueEntry[]; promoteCount: number; demoteCount: number;
  endsAt: Date; weekStart: ISODate;
}
export interface LeagueService { getCurrentWeek(now: Date): Promise<LeagueWeekView> }
export interface SeasonProgress { value: number; target: number; unit: string; daysLeft: number; repairWindow: ISODate[]; dayStates: { day: ISODate; state: 'active' | 'repaired' | 'missed' | 'today' | 'future' }[] }
export interface SeasonRecap { lessons: number; longestStreak: number; stageStart: MascotStage; stageEnd: MascotStage; before: string; after: string; rewardEarned: boolean; rewardCosmeticIds: string[] }
export interface SeasonService {
  getActive(now: Date): Promise<Season | null>;
  setGoal(seasonId: string, goal: SeasonGoal): Promise<void>;
  getProgress(seasonId: string, now: Date): Promise<SeasonProgress>;
  getRecap(seasonId: string, now: Date): Promise<SeasonRecap>;
  claimReward(seasonId: string, now: Date): Promise<string[]>;
}
export interface CosmeticsService {
  getCatalog(): Promise<Cosmetic[]>;
  equip(slot: CosmeticSlot, id: string | null): Promise<void>;
  /** TODO(fáze 3): nahradit IAP. */
  acquireFromShop(id: string): Promise<void>;
}
export interface NotificationService {
  getPermission(): Promise<'granted' | 'denied' | 'undetermined'>;
  requestPermission(): Promise<boolean>;
  /** TODO(fáze 2): serverové push notifikace. */
  setDailyReminder(enabled: boolean, hour: number): Promise<void>;
  sendTest(message: string): Promise<void>;
}
export interface Services {
  user: UserService; lessons: LessonService; league: LeagueService;
  season: SeasonService; cosmetics: CosmeticsService; notifications: NotificationService;
}
```

- [ ] **Step 7: Mock implementace**

```ts
// services/mock/MockUserService.ts
import { buildInitialProfile } from '@/logic/onboarding';
import { weekStart } from '@/logic/dates';
import { now } from '@/lib/clock';
import { useDb } from '@/store/db';
import type { UserService } from '../contracts';

const requireProfile = () => {
  const p = useDb.getState().profile;
  if (!p) throw new Error('Profil neexistuje, nejdřív onboarding.');
  return p;
};

export class MockUserService implements UserService {
  async getProfile() { return useDb.getState().profile; }
  async completeOnboarding(input: Parameters<UserService['completeOnboarding']>[0]) {
    const profile = buildInitialProfile(input, now());
    useDb.getState().setProfile(profile);
    return profile;
  }
  async logWeight(kg: number, now: Date) {
    const p = requireProfile(); const ws = weekStart(now);
    useDb.getState().setProfile({ ...p, weights: [...p.weights.filter((w) => w.weekStart !== ws), { weekStart: ws, kg }].sort((a, b) => a.weekStart.localeCompare(b.weekStart)) });
  }
  async updateMilestone(id: string, current: number) {
    const p = requireProfile();
    useDb.getState().setProfile({ ...p, milestones: p.milestones.map((m) => (m.id === id ? { ...m, current } : m)) });
  }
  async reset() { useDb.getState().setProfile(null); }
}
```

```ts
// services/mock/MockLessonService.ts
import { EXERCISES } from '@/data/exercises';
import { LESSONS, LESSONS_BY_PATH } from '@/data/lessons';
import { PATHS } from '@/data/paths';
import { STAGE_THRESHOLDS, XP_RULES } from '@/data/xp';
import { applyLessonCompletion } from '@/logic/completion';
import { nodeStates, nextLessonId } from '@/logic/map';
import { useDb } from '@/store/db';
import type { Exercise, PathId } from '@/types';
import type { LessonService, LessonPathView } from '../contracts';

export class MockLessonService implements LessonService {
  async getPath(pathId: PathId): Promise<LessonPathView> {
    const lessons = LESSONS_BY_PATH[pathId];
    const completed = new Set(useDb.getState().profile?.activity.map((e) => e.lessonId) ?? []);
    const states = nodeStates(lessons, completed);
    const meta = PATHS[pathId];
    return {
      path: meta,
      currentLessonId: nextLessonId(lessons, completed),
      sections: meta.sections.map((s) => ({
        index: s.index, title: s.title,
        nodes: lessons.filter((l) => l.section === s.index).sort((a, b) => a.order - b.order)
          .map((lesson) => ({ lesson, state: states.get(lesson.id) ?? 'locked', exerciseCount: lesson.exerciseIds.length })),
      })),
    };
  }
  async getLesson(id: string) {
    const lesson = LESSONS.find((l) => l.id === id);
    if (!lesson) throw new Error(`Lekce ${id} neexistuje.`);
    const exercises = lesson.exerciseIds.map((eid) => {
      const e: Exercise | undefined = EXERCISES[eid];
      if (!e) throw new Error(`Cvik ${eid} v lekci ${id} neexistuje.`);
      return e;
    });
    return { lesson, exercises };
  }
  async completeLesson(id: string, attemptId: string, now: Date) {
    const profile = useDb.getState().profile;
    if (!profile) throw new Error('Profil neexistuje.');
    const { lesson } = await this.getLesson(id);
    const out = applyLessonCompletion({ profile, lesson, pathLessons: LESSONS_BY_PATH[lesson.pathId], now, attemptId, rules: XP_RULES, thresholds: STAGE_THRESHOLDS });
    if (out.profile !== profile) useDb.getState().setProfile(out.profile);
    return out.result;
  }
}
```

```ts
// services/mock/MockSeasonService.ts: v tomto plánu jen getActive, zbytek v plánu B
import { SEASONS } from '@/data/seasons';
import { toISODate } from '@/logic/dates';
import type { SeasonService } from '../contracts';
import { notImplemented } from './notImplemented';
export class MockSeasonService implements SeasonService {
  async getActive(now: Date) {
    const today = toISODate(now);
    return SEASONS.find((s) => s.startDate <= today && today <= s.endDate) ?? null;
  }
  setGoal = notImplemented('season.setGoal');
  getProgress = notImplemented('season.getProgress');
  getRecap = notImplemented('season.getRecap');
  claimReward = notImplemented('season.claimReward');
}
```

```ts
// services/mock/notImplemented.ts: dočasné, odstraní ho plán B
export const notImplemented = (name: string) => async (): Promise<never> => { throw new Error(`${name}: implementuje plán B`); };
```

`MockLeagueService`, `MockCosmeticsService` a `LocalNotificationService` se v tomto plánu vytvoří jako třídy implementující rozhraní, kde každá metoda je `notImplemented(...)`. Plán B je nahradí. Rozdíl od placeholderu: nic v UI tohoto plánu je nevolá.

- [ ] **Step 8: `services/index.ts`**

```ts
import type { Services } from './contracts';
import { MockLessonService } from './mock/MockLessonService';
// …ostatní mock importy
// Fáze 2: tady se mock implementace vymění za HTTP klienty. UI se nemění.
export const services: Services = {
  user: new MockUserService(), lessons: new MockLessonService(), league: new MockLeagueService(),
  season: new MockSeasonService(), cosmetics: new MockCosmeticsService(), notifications: new LocalNotificationService(),
};
export type * from './contracts';
```

- [ ] **Step 9: Hooky**

```ts
// hooks/useServiceQuery.ts
import { useCallback, useEffect, useState } from 'react';
import { useDb } from '@/store/db';
export type Query<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error; retry(): void }
  | { status: 'ready'; data: T; refresh(): void };

/** Načte data ze service a znovu je načte po každém zápisu do lokální DB.
 *  TODO(fáze 2): nahradit cache vrstvou (TanStack Query); signatura hooků zůstane. */
export function useServiceQuery<T>(fetcher: () => Promise<T>, deps: readonly unknown[]): Query<T> {
  const revision = useDb((s) => s.revision);
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<{ status: 'loading' } | { status: 'error'; error: Error } | { status: 'ready'; data: T }>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    fetcher().then((data) => alive && setState({ status: 'ready', data }))
      .catch((e: unknown) => alive && setState({ status: 'error', error: e instanceof Error ? e : new Error(String(e)) }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, tick, ...deps]);
  const again = useCallback(() => setTick((t) => t + 1), []);
  return state.status === 'ready' ? { ...state, refresh: again } : state.status === 'error' ? { ...state, retry: again } : state;
}
```

Při refetchi po zápisu zůstávají stará data (`ready`), dokud nedorazí nová. Nepřepíná se do `loading`, takže mapa neblikne.

```ts
// hooks/useProfile.ts
export const useProfile = () => useServiceQuery(() => services.user.getProfile(), []);
// hooks/useLessonPath.ts: cesta z profilu
export function useLessonPath(pathId: PathId | undefined) {
  return useServiceQuery(() => (pathId ? services.lessons.getPath(pathId, now()) : Promise.reject(new Error('Chybí cesta'))), [pathId]);
}
// hooks/useLesson.ts
export const useLesson = (id: string) => useServiceQuery(() => services.lessons.getLesson(id), [id]);
// hooks/useActiveSeason.ts
export const useActiveSeason = () => useServiceQuery(() => services.season.getActive(now()), []);
// hooks/useHydrated.ts
export const useHydrated = () => useDb((s) => s.hydrated);
// hooks/useProfileStats.ts: odvozené metriky pro TopBar
export function useProfileStats(profile: UserProfile | null | undefined) {
  return useMemo(() => {
    if (!profile) return null;
    const today = toISODate(now()); const days = activeDays(profile.activity);
    const xp = totalXp(profile.activity);
    return { totalXp: xp, streak: currentStreak(days, today), streakBroken: isStreakBroken(days, today), stage: stageForXp(xp, STAGE_THRESHOLDS) };
  }, [profile]);
}
```

`STAGE_THRESHOLDS` v hooku: hooky smí importovat `data/`, hranice platí pro `app/` a `components/`.

```ts
// hooks/useOnboardingDraft.ts: nepersistovaný koncept onboardingu
interface Draft {
  path: PathId | null; dreamBody: string; milestones: Milestone[];
  weightKind: 'lose' | 'gain' | 'none'; currentKg: string; targetKg: string;
  set(patch: Partial<Omit<Draft, 'set' | 'reset'>>): void; reset(): void;
}
const initial = { path: null, dreamBody: '', milestones: [], weightKind: 'none' as const, currentKg: '', targetKg: '' };
export const useOnboardingDraft = create<Draft>()((set) => ({ ...initial, set: (p) => set(p), reset: () => set(initial) }));
export function useMilestonePresets(path: PathId | null) { return path ? [...MILESTONE_PRESETS[path], ...MILESTONE_PRESETS.general] : []; }
```

- [ ] **Step 10: Test mock služby.** `services/__tests__/MockLessonService.test.ts` ověří integraci store ↔ logika a AsyncStorage mock:

```ts
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { services } from '@/services';
import { useDb } from '@/store/db';
beforeEach(() => useDb.setState({ profile: null, revision: 0 }));
test('onboarding → dokončení lekce → mapa ukáže další uzel jako current', async () => {
  await services.user.completeOnboarding({ path: 'bodyControl', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } });
  const r = await services.lessons.completeLesson('bc-1-1', 'att-1', new Date(2026, 8, 29, 10));
  expect(r.unlockedLessonId).toBe('bc-1-2');
  const view = await services.lessons.getPath('bodyControl', new Date(2026, 8, 29, 10));
  expect(view.currentLessonId).toBe('bc-1-2');
  await services.lessons.completeLesson('bc-1-1', 'att-1', new Date(2026, 8, 29, 10));
  expect(useDb.getState().profile!.activity).toHaveLength(1);
});
```

- [ ] **Step 11:** Spustit `npm test && npm run typecheck && npm run lint`. Očekáváno: vše zelené.
- [ ] **Step 12:** Commit `feat: store, mock services, hooky`.

---

### Task 8: Theme (light/dark + sezónní override), fonty, root layout, UI primitiva

**Files:**
- Create: `theme/*`, `lib/haptics.ts`, `lib/motion.ts`, `components/ui/*`, `app/_layout.tsx`, `app/index.tsx`, `app/(tabs)/_layout.tsx`

**Interfaces:**
- Produces:
  - `useTheme(): Theme`, kde `Theme = { scheme: 'light' | 'dark'; c: Colors; space: Space; radius: Radius; font: Fonts; seasonal: SeasonalColors }`
  - `Colors` klíče: `base surface raised rule text muted accent onAccent accentText plate5 plate10 plate15 plate20 plate25 plateRim plateHighlight danger success`
  - `SeasonalColors = { headerBase: string; mapBase: string; mapRule: string; mapTexture: string | null }`
  - `<Text variant="display" | "displayXL" | "title" | "body" | "bodyStrong" | "label" | "caption" tone="text" | "muted" | "accent" | "onAccent">`
  - `<Button label onPress variant="primary" | "secondary" | "ghost" disabled?>`
  - `<BigActionBar primary={{ label, onPress, disabled? }} secondary?={{ label, onPress }} />`
  - `<Stat value unit label? size="M" | "L" | "XL" />`
  - `<DotSteps total current />`
  - `<Screen edges? scroll?>`, `<Card>`, `<TextField>`, `<SegmentedControl options value onChange>`
  - `haptics.snap()` (Heavy + Success s odstupem 90 ms), `haptics.unlock()` (Light), `haptics.tick()` (selection), `haptics.holdDone()` (Medium), `haptics.success()`
  - `motion.ui` (timing config), `motion.snap`, `motion.pop`, `motion.unlock` (spring configy), `useMotionSafe()` → `{ reduced: boolean }`

- [ ] **Step 1: `theme/palettes.ts`** s hodnotami přesně podle spec §6.2:

```ts
export const dark = {
  base: '#0E0D0C', surface: '#171615', raised: '#201E1C', rule: '#2C2926', text: '#EFEDE8', muted: '#8C8780',
  accent: '#FF6B35', onAccent: '#131316', accentText: '#FF6B35',
  plate5: '#6B6660', plate10: '#57534E', plate15: '#46423E', plate20: '#36332F', plate25: '#2A2724',
  plateRim: '#3A3632', plateHighlight: 'rgba(255,255,255,0.10)', danger: '#EB5E62', success: '#46A758',
} as const;
export const light: Record<keyof typeof dark, string> = {
  base: '#EFEEEA', surface: '#E5E4DF', raised: '#F6F5F2', rule: '#C9C7C0', text: '#131316', muted: '#5E5E63',
  accent: '#FF6B35', onAccent: '#131316', accentText: '#AE3A0B',
  plate5: '#A29E97', plate10: '#7D7A74', plate15: '#5A5752', plate20: '#353331', plate25: '#131316',
  plateRim: '#8E8A83', plateHighlight: 'rgba(255,255,255,0.18)', danger: '#B42328', success: '#2A7E3B',
};
export type Colors = Record<keyof typeof dark, string>;
```

- [ ] **Step 2: `theme/tokens.ts`**

```ts
export const space = { xs: 4, s: 8, m: 16, l: 24, xl: 40, xxl: 64, xxxl: 104 } as const;
export const radius = { s: 8, m: 12, l: 20, full: 999 } as const;
export const font = {
  display: 'BebasNeue_400Regular', body: 'Inter_400Regular', bodyStrong: 'Inter_600SemiBold', mono: 'JetBrainsMono_500Medium',
} as const;
export const type = {
  displayXL: { fontFamily: font.display, fontSize: 120, lineHeight: 108 },
  display: { fontFamily: font.display, fontSize: 56, lineHeight: 54 },
  title: { fontFamily: font.display, fontSize: 36, lineHeight: 38 },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: font.bodyStrong, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: font.mono, fontSize: 11, lineHeight: 14, letterSpacing: 2, textTransform: 'uppercase' as const },
  caption: { fontFamily: font.body, fontSize: 14, lineHeight: 20 },
} as const;
```

- [ ] **Step 3: `theme/seasons.ts`**

```ts
import type { SeasonThemeId } from '@/types';
export interface SeasonalColors { headerBase: string; mapBase: string; mapRule: string; mapTexture: string | null }
export const neutralSeasonal = (c: Colors): SeasonalColors => ({ headerBase: c.base, mapBase: c.base, mapRule: c.rule, mapTexture: null });
export const SEASON_OVERRIDES: Record<SeasonThemeId, { dark: SeasonalColors; light: SeasonalColors }> = {
  winterArc: {
    dark: { headerBase: '#0F1418', mapBase: '#0C1115', mapRule: '#243039', mapTexture: 'rgba(170,205,230,0.07)' },
    light: { headerBase: '#E6ECEF', mapBase: '#E9EEF1', mapRule: '#BCC8CF', mapTexture: 'rgba(40,80,110,0.08)' },
  },
  summerBody: {
    dark: { headerBase: '#15110C', mapBase: '#120F0B', mapRule: '#322A20', mapTexture: null },
    light: { headerBase: '#F2EEE6', mapBase: '#F3EFE7', mapRule: '#D2C8B8', mapTexture: null },
  },
};
```

- [ ] **Step 4: `theme/ThemeProvider.tsx` + `useTheme.ts`.** Provider čte `useSettings(s => s.theme)` a `useColorScheme()` z RN. `seasonThemeId` dostává jako prop, root layout ho získá přes `useActiveSeason()`. Výsledek se memoizuje přes `useMemo`. Provider je v `theme/` a smí importovat store, protože hranice ESLint platí pro `app/` a `components/`. `useTheme` vyhodí chybu mimo provider.

- [ ] **Step 5: `lib/haptics.ts`, `lib/motion.ts`**

```ts
// haptics.ts
import * as Haptics from 'expo-haptics';
const safe = (p: Promise<void>) => { p.catch(() => undefined); };
export const haptics = {
  snap() { safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)); setTimeout(() => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)), 90); },
  unlock() { safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)); },
  holdDone() { safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)); },
  tick() { safe(Haptics.selectionAsync()); },
  success() { safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)); },
};
```

```ts
// motion.ts
import { Easing, useReducedMotion, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';
export const motion = {
  ui: { duration: 180, easing: Easing.bezier(0.22, 1, 0.36, 1) } satisfies WithTimingConfig,
  uiExit: { duration: 150, easing: Easing.bezier(0.4, 0, 0.2, 1) } satisfies WithTimingConfig,
  reveal: { duration: 480, easing: Easing.bezier(0.22, 1, 0.36, 1) } satisfies WithTimingConfig,
  snap: { damping: 11, stiffness: 180, mass: 1.1 } satisfies WithSpringConfig,   // kotouč: znatelný přestřel
  pop: { damping: 9, stiffness: 260, mass: 0.8 } satisfies WithSpringConfig,     // +XP
  unlock: { damping: 14, stiffness: 200 } satisfies WithSpringConfig,            // odemčení uzlu
  hop: { damping: 12, stiffness: 240 } satisfies WithSpringConfig,               // opice
};
export const useMotionSafe = () => ({ reduced: useReducedMotion() });
```

- [ ] **Step 6: UI primitiva.** Každé primitivum je malý soubor, barvy jen z `useTheme().c`.

**`Button`:**
- `Pressable` s min. výškou 56, `radius.full`.
- Primary: pozadí `accent`, text `onAccent` v `bodyStrong`.
- Secondary: jen 1px obrys `rule`.
- Ghost: bez pozadí.
- Stisk: `withTiming` scale 0.97 (`motion.ui`), bez pružiny.
- `accessibilityRole="button"`, `accessibilityState={{ disabled }}`. Disabled má opacity 0.4.

**`BigActionBar`** (ref. 3):

```tsx
export function BigActionBar({ primary, secondary }: Props) {
  const { c, space } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule, paddingBottom: insets.bottom, backgroundColor: c.base }}>
      {secondary ? (
        <Pressable onPress={secondary.onPress} accessibilityRole="button" style={{ flex: 1, minHeight: 96, justifyContent: 'center', paddingHorizontal: space.l, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: c.rule }}>
          <Text variant="label" tone="muted">{secondary.label}</Text>
        </Pressable>
      ) : <View style={{ flex: 1 }} />}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: space.m }}>
        <RoundCta {...primary} />
      </View>
    </View>
  );
}
```

`RoundCta` je kulaté tlačítko o průměru 88 pt v akcentu, text `bodyStrong` `onAccent`, na tap scale 0.96 v timingu. Když text přesáhne 10 znaků, tlačítko se změní na pilulku výšky 64 a šířky 100 % buňky.

**`Stat`:** hodnota v Bebas (M 56 / L 88 / XL 120) s `tabular-nums`. Jednotka je `caption` `muted` zarovnaná na baseline čísla (`flexDirection: 'row', alignItems: 'flex-end'`, jednotka `marginBottom` = 0.12 × velikost). Volitelný `label` v `label` stylu nad číslem.

**`DotSteps`:** řada 8pt teček, mezera 6. Hotové `text`, aktuální `accent` (šířka 20, pilulka, `withTiming` šířky), budoucí obrys `rule`.

**`Screen`:** `SafeAreaView` (react-native-safe-area-context) s `backgroundColor: c.base`, volitelný `ScrollView`. Horizontální padding `space.l`.

**`Card`:** `surface`, `radius.l`, padding `space.m`, bez okraje i stínu (pravidlo jedné oddělovací věci).

**`TextField`:** label v `label` stylu nad polem. Pole má spodní 1px linku `rule`, při fokusu `accent`. Text `body` 20 pt, `selectionColor={c.accent}`. Chyba je `caption` v `danger` pod polem s `accessibilityLiveRegion="polite"`.

**`SegmentedControl`:** segmenty s min. výškou 48. Vybraný segment má pozadí `text` a text `base` (inverze), ostatní obrys `rule`. Posun pozadí je `withTiming`.

- [ ] **Step 7: `app/_layout.tsx`**

```tsx
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useActiveSeason } from '@/hooks/useActiveSeason';
import { useHydrated } from '@/hooks/useHydrated';
import { ThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ BebasNeue_400Regular, Inter_400Regular, Inter_600SemiBold, JetBrainsMono_500Medium });
  const hydrated = useHydrated();
  const season = useActiveSeason();
  const ready = fontsLoaded && hydrated;
  useEffect(() => { if (ready) SplashScreen.hideAsync().catch(() => undefined); }, [ready]);
  if (!ready) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider seasonThemeId={season.status === 'ready' ? season.data?.themeId ?? null : null}>
          <RootStack />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { c, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.base }, animation: 'fade' }}>
        <Stack.Screen name="lesson/[id]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
      </Stack>
    </>
  );
}
```

`theme/index.ts` re-exportuje `ThemeProvider`, `useTheme` a typy.

- [ ] **Step 8: `app/index.tsx`** (gate)

```tsx
export default function Index() {
  const profile = useProfile();
  if (profile.status === 'loading') return null;
  if (profile.status === 'error') return <ErrorState what="profil" onRetry={profile.retry} />;
  return <Redirect href={profile.data ? '/(tabs)' : '/onboarding/path'} />;
}
```

`components/ui/ErrorState.tsx` zobrazí `copy.common.loadError(what)` a tlačítko „Zkusit znovu“.

- [ ] **Step 9: `app/(tabs)/_layout.tsx`**

- expo-router `Tabs`, v tomto plánu jen `index` (Trénink).
- Tab bar: pozadí `base`, horní hairline `rule`, bez stínu.
- Ikona lucide `Dumbbell` (`strokeWidth={1.5}`), aktivní v `text`, neaktivní `muted`.
- Label v `label` stylu, výška 64 + safe area.
- Protože je tu jen jeden tab, tab bar se v tomto plánu skrývá (`tabBarStyle: { display: 'none' }`). Plán B přidá ostatní taby a zobrazí ho. Vede se jako konstanta `SHOW_TAB_BAR = false` s komentářem.

- [ ] **Step 10:** Spustit `npm run typecheck && npm run lint`. Pak `npx expo start --web` (nebo `npx expo export -p web`) ověří, že bundle se sestaví. Na hlavní obrazovce se zobrazí redirect na onboarding, který v tuhle chvíli neexistuje. Commit `feat: theme light/dark, fonty, UI primitiva, root layout`.

---

### Task 9: Maskot stage 1 (idle, happy)

**Files:**
- Create: `components/mascot/types.ts`, `anchors.ts`, `palette.ts`, `SvgMascot.tsx`, `index.tsx`

**Interfaces:**
- Produces:
  - `MascotProps = { stage: MascotStage; cosmetics: Partial<Record<CosmeticSlot, string>>; mood: Mood; size: number | 'S' | 'M' | 'L' | 'XL'; accessibilityLabel?: string }`
  - `MASCOT_SIZES = { S: 56, M: 120, L: 200, XL: 280 }`
  - `export { SvgMascot as Mascot }` z `components/mascot/index.tsx`
  - `ANCHORS: Record<MascotStage, Record<'head' | 'neck' | 'body' | 'handL' | 'handR', { x: number; y: number; scale: number }>>` (viewBox 200×200)
- Stages 2–3, celebrate, sad a kosmetické vrstvy doplní plán B. V tomto plánu stage 2/3 vykreslí stage 1 geometrii s `console.warn` jen v `__DEV__`, mood `celebrate` se chová jako `happy` a `sad` jako `idle`, obojí s komentářem `// plán B`.

- [ ] **Step 1: `palette.ts`.** Barvy opice jsou v obou režimech stejné, detail (oči, linky) bere `text` z theme.

```ts
export const MASCOT_COLORS = { fur: '#7A5236', furShade: '#5E3F29', face: '#E8C7A0' } as const;
```

- [ ] **Step 2: Geometrie stage 1 v SVG (viewBox 0 0 200 200).** Hmotu tvoří geometrické tvary, žádné volné křivky:
  - Tělo: `Rect x=72 y=122 w=56 h=52 rx=26` (fur).
  - Nohy: dvě `Circle` r=12 na (82,176) a (118,176) (furShade).
  - Paže: `Rect` 14×40 rx=7, pootočené ±18° od ramen (70,128) a (130,128) (furShade).
  - Hlava: `Circle cx=100 cy=80 r=54` (fur).
  - Uši: `Circle` r=18 na (46,78) a (154,78) (fur) + vnitřek r=9 (face).
  - Obličej: dva kruhy r=24 na (82,78) a (118,78) + elipsa (100,102) rx=34 ry=22 (face).
  - Oči: `AnimatedEllipse` na (84,78) a (116,78), rx=5, ry animované 6 → 0.6 (mrknutí), fill `text` z theme.
  - Nos: dvě tečky r=2 na (95,96) a (105,96).
  - Pusa: `Path`. Pro idle `M88 108 Q100 112 112 108`, pro happy `M86 104 Q100 122 114 104 Z` s fill `text`. Přechod přes opacity crossfade dvou cest (`withTiming` 180 ms).
  - Hmotnost dodává jen `furShade` na spodní straně, bez gradientu.

- [ ] **Step 3: Animace**

```tsx
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// dýchání: celé tělo (Animated.View kolem Svg)
const breath = useSharedValue(0);
useEffect(() => {
  if (reduced) return;
  breath.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }), -1, true);
}, [reduced]);
const bodyStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -breath.value * size * 0.01 }, { scaleY: 1 + breath.value * 0.015 }] }));

// mrknutí: náhodný interval 3–6 s, JS timer spouští withSequence
const eyeRy = useSharedValue(6);
useEffect(() => {
  let t: ReturnType<typeof setTimeout>;
  const loop = () => { t = setTimeout(() => { eyeRy.value = withSequence(withTiming(0.6, { duration: 70 }), withTiming(6, { duration: 110 })); loop(); }, 3000 + Math.random() * 3000); };
  loop(); return () => clearTimeout(t);
}, []);
const eyeProps = useAnimatedProps(() => ({ ry: eyeRy.value }));

// happy: poskočení pružinou při změně mood na happy
const hop = useSharedValue(0);
useEffect(() => {
  if (mood !== 'happy' && mood !== 'celebrate') return;
  hop.value = reduced ? 0 : withSequence(withTiming(-size * 0.12, { duration: 140 }), withSpring(0, motion.hop));
}, [mood]);
```

- [ ] **Step 4: `index.tsx`**

```tsx
// Jediný vstupní bod pro maskota. Celá appka importuje odsud.
// Fáze 3: přepnout na `export { RiveMascot as Mascot } from './RiveMascot'`.
export { SvgMascot as Mascot } from './SvgMascot';
export type { MascotProps } from './types';
export { MASCOT_SIZES } from './types';
```

- [ ] **Step 5: Ověření.** Dočasná obrazovka `app/(tabs)/index.tsx` (přepíše ji Task 11) vykreslí `<Mascot stage={1} mood="idle" size="L" cosmetics={{}} />` a tlačítko pro přepnutí na happy. Screenshot přes web v light i dark. Kontrola: čitelnost na obou podkladech, tvary souměrné a bez kostrbatých křivek.

- [ ] **Step 6:** Commit `feat(mascot): SvgMascot stage 1 s idle a happy`.

---

### Task 10: Onboarding

**Files:**
- Create: `app/onboarding/_layout.tsx`, `path.tsx`, `dream.tsx`, `milestones.tsx`, `weight.tsx`, `birth.tsx`, `components/onboarding/PathGlyph.tsx`, `components/onboarding/OnboardingFrame.tsx`, `components/onboarding/PathCard.tsx`, `components/onboarding/MilestoneChip.tsx`
- Modify: `hooks/useOnboardingDraft.ts` (přidat `usePathOptions()`, který vrací `PATHS` přes hook, protože UI nesmí importovat `data/`)

**Interfaces:**
- Consumes: `useOnboardingDraft`, `useMilestonePresets`, `usePathOptions`, `services.user.completeOnboarding`, `parseWeight`, `validateWeightGoal`, UI primitiva, `Mascot`
- Produces: po dokončení existuje profil a `router.replace('/(tabs)')`

Obrazovky smí importovat `@/logic/*` (čisté funkce, ne data). Hranice ESLint to dovolují.

- [ ] **Step 1: `OnboardingFrame`**
  - Nahoře `copy.onboarding.stepLabel(n, 5)` v `label` `muted` a `DotSteps total=5 current=n-1`.
  - Pod tím titulek v `display` (zarovnání vlevo) a `lead` v `body` `muted`.
  - Obsah (`children`), dole `BigActionBar`: vlevo `Zpět` (kromě kroku 1), vpravo `Pokračovat` s `disabled` podle validace.
  - `KeyboardAvoidingView` (`behavior="padding"` na iOS).

- [ ] **Step 2: `PathGlyph`** (48×48 SVG, geometrie podle spec §7.1, barva `text`, vybraná karta `accent`):

```tsx
// power: kruh s vyříznutou výsečí 90° (ukazuje směr/výbuch)
<Path d="M24 24 L24 4 A20 20 0 1 1 4 24 Z" fill={color} />
// bodyControl: dva kruhy v rovnováze nad sebou
<Circle cx={24} cy={14} r={9} fill={color} /><Circle cx={24} cy={35} r={11} fill="none" stroke={color} strokeWidth={2} />
// strength: plný kotouč s otvorem
<Circle cx={24} cy={24} r={21} fill={color} /><Circle cx={24} cy={24} r={5} fill={bg} />
```

- [ ] **Step 3: `path.tsx`**
  - 3 `PathCard` pod sebou: `surface`, `radius.l`, min. výška 120.
  - V kartě glyf, název v `title`, `tagline` v `caption` `muted`.
  - Vybraná karta dostane 2px levý proužek v `accent` a glyf v `accent`. Proužek je jediný oddělovač, který přibyde.
  - Tap: `haptics.tick()`, `draft.set({ path })`. Pokud se cesta změní, vymažou se vybrané milníky z předvoleb.
  - `accessibilityRole="radio"`, `accessibilityState={{ selected }}`.
  - Pokračovat je aktivní, když `path !== null`.

- [ ] **Step 4: `dream.tsx`**
  - `TextInput multiline`, `maxLength=140`, placeholder z copy (skutečná ukázková vize).
  - Počítadlo `n / 140` v `label` `muted` vpravo dole.
  - Pokračovat je aktivní, když `dreamBody.trim().length >= 3`.

- [ ] **Step 5: `milestones.tsx`**
  - Předvolby jako chips (min. výška 44, `radius.full`). Vybraný chip má pozadí `text` a text `base`.
  - Maximálně 3. Při pokusu o 4. se chip krátce zatřese (`withSequence` translateX ±4, timing) a zobrazí se `pickCount`.
  - „+ Vlastní milník“ rozbalí inline formulář: název (`TextField`), cíl (numerický), jednotka (`SegmentedControl`: opakování / sekundy / kg / splněno).
  - Vlastní milník dostane `id: custom-${Date.now()}`, `custom: true`, `current: 0`.
  - Pokračovat je aktivní při 2–3 vybraných.

- [ ] **Step 6: `weight.tsx`**
  - `SegmentedControl` Hubnutí / Nabírání / Neřeším.
  - U lose/gain dvě pole `TextField keyboardType="decimal-pad"` s jednotkou `kg` vpravo.
  - Validace na blur a při pokusu o pokračování přes `parseWeight` + `validateWeightGoal`, chyba z `copy.onboarding.weight.errors[...]`.
  - Neřeším: pokračování povoleno hned.

- [ ] **Step 7: `birth.tsx`** (moment „tohle je moje opice“)
  - Sekvence:
    1. 300 ms prázdno.
    2. Uprostřed se nafoukne akcentový kruh ze scale 0 na 1 (`withSpring motion.pop`) do průměru 220.
    3. Po 450 ms kruh „praskne“: scale 1.15 + opacity 0 za 220 ms. Zároveň `Mascot` stage 1 vyskočí ze scale 0.6 a translateY 40 (`withSpring motion.hop`), `haptics.success()`.
    4. Po 900 ms mood přejde na happy (poskočení).
    5. Po 1400 ms fade-in titulku, `lead` a štítku `copy.onboarding.birth.bornLabel(formatCzDate(today))` + název cesty.
    6. Po 1800 ms se zobrazí `BigActionBar` s CTA „Jdeme trénovat“.
  - S omezeným pohybem se vše zobrazí přes 200ms fade.
  - Na CTA:
    - Guard `submitting` ref.
    - Sestavit `OnboardingInput`: `weightGoal` z draftu (`{ kind: 'none' }`, nebo `{ kind, startKg, targetKg }` z parsovaných hodnot).
    - `await services.user.completeOnboarding(input)`, `draft.reset()`, `router.replace('/(tabs)')`.
    - Při chybě se zobrazí `ErrorState` inline s „Zkusit znovu“.

- [ ] **Step 8: `_layout.tsx`:** `Stack` s `headerShown: false`, `animation: 'slide_from_right'`, `gestureEnabled: true` (kromě `birth`, kde `gestureEnabled: false`).

- [ ] **Step 9: Ověření.**
  - `npm run typecheck && npm run lint`.
  - Na webu projít všech 5 kroků v obou režimech, screenshoty.
  - Ručně ověřit Review Focus 5: `72,5` projde, cíl proti směru ukáže chybu.
  - Commit `feat: onboarding`.

---

### Task 11: Mapa lekcí

**Files:**
- Create: `hooks/useTierName.ts` (čte `LEAGUE_TIERS`, vrací název úrovně), `components/map/geometry.ts`, `Plate.tsx`, `PlateNode.tsx`, `BarbellBoss.tsx`, `PathLine.tsx`, `NodePopover.tsx`, `LessonMap.tsx`, `components/ui/TopBar.tsx`, `logic/__tests__/geometry.test.ts` (geometrie je čistá, proto test)
- Modify: `app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `useProfile`, `useProfileStats`, `useLessonPath`, `Mascot`, `haptics`, `motion`
- Produces:
  - `layoutNodes(nodes: { id: string; plateKg: PlateKg; isBoss: boolean }[], width: number): { positions: { id: string; x: number; y: number; size: number }[]; height: number }`
  - `plateSize(kg: PlateKg): number` (5→56, 10→60, 15→64, 20→72, 25→80)
  - `<Plate kg size state="locked" | "current" | "done" />`
  - `<LessonMap view unlockedLessonId? onOpenLesson(id) />`
  - route param `unlocked?: string` na `/(tabs)`

- [ ] **Step 1: Test geometrie** (soubor `components/map/geometry.ts` je čistý, test v `logic/__tests__/geometry.test.ts` ho importuje přes `@/components/map/geometry`):

```ts
import { layoutNodes, plateSize } from '@/components/map/geometry';
const nodes = Array.from({ length: 9 }, (_, i) => ({ id: `n${i}`, plateKg: ([5, 5, 10, 10, 15, 15, 20, 20, 25] as const)[i]!, isBoss: i === 8 }));
test('uzly jdou shora dolů a vlní se do stran v mezích šířky', () => {
  const { positions, height } = layoutNodes(nodes, 390);
  positions.forEach((p, i) => { if (i > 0) expect(p.y).toBeGreaterThan(positions[i - 1]!.y); expect(p.x - p.size / 2).toBeGreaterThanOrEqual(16); expect(p.x + p.size / 2).toBeLessThanOrEqual(374); });
  expect(new Set(positions.map((p) => Math.round(p.x))).size).toBeGreaterThan(3);
  expect(height).toBeGreaterThan(positions.at(-1)!.y);
});
test('plateSize roste s kg', () => { expect(plateSize(5)).toBeLessThan(plateSize(25)); });
```

- [ ] **Step 2: `geometry.ts`**

```ts
import type { PlateKg } from '@/types';
const SIZES: Record<PlateKg, number> = { 5: 56, 10: 60, 15: 64, 20: 72, 25: 80 };
export const plateSize = (kg: PlateKg) => SIZES[kg];
export const BOSS_SIZE = { w: 220, h: 88 };
const STEP = 112; const TOP = 96; const GUTTER = 16;

export function layoutNodes(nodes: { id: string; plateKg: PlateKg; isBoss: boolean }[], width: number) {
  const cx = width / 2;
  const amp = Math.min(width * 0.28, 120);
  const positions = nodes.map((n, i) => {
    const size = n.isBoss ? BOSS_SIZE.h : plateSize(n.plateKg);
    const half = n.isBoss ? BOSS_SIZE.w / 2 : size / 2;
    const raw = n.isBoss ? cx : cx + Math.sin(i * 0.9) * amp;
    const x = Math.min(Math.max(raw, GUTTER + half), width - GUTTER - half);
    return { id: n.id, x, y: TOP + i * STEP + (n.isBoss ? 24 : 0), size };
  });
  return { positions, height: (positions.at(-1)?.y ?? 0) + 160 };
}
```

- [ ] **Step 3: `Plate.tsx`.** Kotouč zepředu v čistém SVG, viewBox 100×100:

```tsx
export function Plate({ kg, size, state }: { kg: PlateKg; size: number; state: NodeState }) {
  const { c } = useTheme();
  const fill = c[`plate${kg}`];
  const gid = `pl-${kg}`;
  if (state === 'locked') {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx={50} cy={50} r={48} fill="none" stroke={c.rule} strokeWidth={2} />
        <Circle cx={50} cy={50} r={9} fill="none" stroke={c.rule} strokeWidth={2} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        {/* Gradient dělá hloubku: světlo shora vlevo, jako lité železo. */}
        <RadialGradient id={gid} cx="38%" cy="32%" r="75%">
          <Stop offset="0" stopColor={c.plateHighlight} stopOpacity={1} />
          <Stop offset="1" stopColor="#000" stopOpacity={0.18} />
        </RadialGradient>
        <Pattern id="grain" width={4} height={4} patternUnits="userSpaceOnUse">
          <Rect width={1} height={1} fill="#fff" opacity={0.05} />
          <Rect x={2} y={3} width={1} height={1} fill="#000" opacity={0.08} />
        </Pattern>
      </Defs>
      <Circle cx={50} cy={50} r={48} fill={fill} />
      <Circle cx={50} cy={50} r={48} fill={`url(#${gid})`} />
      <Circle cx={50} cy={50} r={48} fill="url(#grain)" />
      <Circle cx={50} cy={50} r={40} fill="none" stroke={c.plateRim} strokeWidth={1.2} />
      <Circle cx={50} cy={50} r={20} fill="none" stroke={c.plateRim} strokeWidth={1.2} />
      <Circle cx={50} cy={50} r={9} fill={c.base} />
      <SvgText x={50} y={33} fontFamily="BebasNeue_400Regular" fontSize={15} fill={c.text} opacity={0.9} textAnchor="middle">{kg}</SvgText>
      <SvgText x={50} y={77} fontFamily="JetBrainsMono_500Medium" fontSize={7} fill={c.text} opacity={0.55} textAnchor="middle" letterSpacing={1.5}>KG</SvgText>
      {state === 'done' && <Path d="M44 50 l4 4 l8 -9" stroke={c.accent} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    </Svg>
  );
}
```

Pozn.: v `done` se fajfka kreslí přes středový otvor (§6.5).

Stín: `PlateNode` obalí kotouč do `View` s jedním měkkým stínem. iOS: `shadowOpacity 0.35, radius 10, offset y 6`, Android: `elevation 6`. Jen u `current` a `done`. Kotouč nemá okraj ani pozadí, stín je jediný oddělovač. Id gradientu a patternu musí být unikátní per instance (`useId()`), jinak se SVG defs v RN na některých platformách přebíjí.

- [ ] **Step 4: `PlateNode.tsx`**
  - `Pressable` přes celý kotouč, hit slop tak, aby plocha byla ≥ 56.
  - `accessibilityLabel` = `Lekce ${order}, ${title}, ${kg} kilogramů, ${stavČesky}`.
  - `current`: akcentový prstenec (`View` o velikosti `size + 14`, `borderWidth 2`, `borderColor accent`, `radius.full`) pulzuje scale 1 → 1.08 a opacity 1 → 0.4, `withRepeat(withTiming(..., {duration: 1100}))`. S omezeným pohybem statický.
  - Prop `unlocking: boolean`: při true se přehraje odemykací animace.
    - Obrys → plný kotouč: crossfade `locked` a `current` vrstvy + scale 0.8 → 1 (`withSpring(motion.unlock)`).
    - Po dopadu `haptics.unlock()` přes `scheduleOnRN` z `react-native-worklets` v callbacku `withSpring`.
    - Vrací `onUnlocked()`.
  - Prop `justCompleted: boolean`: fajfka se vykreslí s `strokeDashoffset` 20 → 0 za 280 ms (AnimatedPath).

- [ ] **Step 5: `BarbellBoss.tsx`.** Plně naložená osa v SVG 220×88:
  - Tyč `Rect` přes celou šířku, výška 6, `plateRim`.
  - Na každé straně 4 kotouče jako svislé zaoblené obdélníky: výšky 80/70/60/50, šířky 12, barvy plate25 → plate10.
  - Objímky jsou malé obdélníky v `muted`.
  - Uprostřed text `BOSS` v `label`.
  - `locked`: vše obrysově v `rule`. `current`: akcentový pulz jako obdélník `radius.l` kolem. `done`: fajfka v akcentu nad středem.

- [ ] **Step 6: `PathLine.tsx`**
  - SVG přes celou výšku mapy, `Path` spojující středy uzlů kubickými Bézierovými křivkami (kontrolní body svisle v polovině mezery).
  - `stroke = seasonal.mapRule`, `strokeWidth 3`, `strokeDasharray "2 10"`, `strokeLinecap round` (tečkovaná, hmotnější než čárkovaná).
  - Úsek mezi dokončenými uzly je v `muted`, úsek k zamčeným v `mapRule`.
  - Při odemčení se úsek k novému uzlu „dokreslí“ animací `strokeDashoffset` (AnimatedPath, 420 ms timing).

- [ ] **Step 7: `NodePopover.tsx`**
  - Karta (`raised`, `radius.l`) pod nebo nad uzlem, šipka k uzlu.
  - Obsah: `title` v `title`, řádek `label` `${kg} KG · ${exercises(n)} · +${xp} XP`, tlačítko `Začít` (current) / `Zopakovat` (done) / text `copy.map.locked` (locked).
  - Otevření scale 0.95 → 1 + opacity (`motion.ui`), zavření tapem mimo.
  - U locked uzlu se místo popoveru uzel zatřese (±6 px, timing) a zobrazí se text v popoveru.

- [ ] **Step 8: `TopBar.tsx`**
  - Pozadí `seasonal.headerBase`, výška 56 + inset, zarovnání vlevo, 3 položky v řadě se svislými hairline oddělovači (instrument vrstva):
    - `Flame` (lucide, obrys) + `Stat size=M` streak + label `STREAK`
    - XP číslo + `XP`
    - kruh 20 pt v barvě `plate25` s iniciálou úrovně + label `LIGA · DŘEVO`
  - Pokud je `streakBroken`, plamen a číslo jsou v `muted`.

- [ ] **Step 9: `LessonMap.tsx`**
  - `ScrollView` s pozadím `seasonal.mapBase`. Pokud `mapTexture`, podkladová SVG tečková mřížka (4px tečky po 24 px v barvě `mapTexture`).
  - Pro každou sekci štítek `copy.map.sectionLabel` vlevo nad prvním uzlem.
  - Uzly absolutně podle `layoutNodes`.
  - `Mascot size="S"` u `current` uzlu, na opačné straně vlny (`x < cx` → vpravo od uzlu, jinak vlevo), `mood` = `streakBroken ? 'sad' : 'idle'`.
  - Po mountu `scrollTo` na current uzel (y − výška viewportu × 0.4, animated).

**Unlock sekvence** (když `unlockedLessonId` přijde z route param):

```ts
// fáze: 0 = počáteční stav, jako by nový uzel byl ještě zamčený a předchozí bez fajfky
// 1 (t=0): scroll na předchozí uzel (animated), 2 (t=350ms): fajfka předchozího (justCompleted)
// 3 (t=700ms): dokreslení úseku čáry, 4 (t=1100ms): unlocking=true u nového uzlu
// 5 (onUnlocked): opice přeskočí na nový uzel. Pozice přes withSpring(motion.hop) po oblouku:
//     translateY -24 v polovině pomocí withSequence, pak mood 'happy' na 900 ms → 'idle'
// 6: router.setParams({ unlocked: undefined }), aby se sekvence nepřehrála při návratu na tab
```

Implementace přes `useState<number>` fáze + `setTimeout` řetěz uklízený v cleanupu. Pozice opice je sdílená hodnota `x`/`y` animovaná z předchozího uzlu na nový. S omezeným pohybem se sekvence zkrátí na okamžitý stav + `haptics.unlock()`.

- [ ] **Step 10: `app/(tabs)/index.tsx`**

```tsx
export default function TrainingScreen() {
  const { unlocked } = useLocalSearchParams<{ unlocked?: string }>();
  const profile = useProfile();
  const pathId = profile.status === 'ready' ? profile.data?.path : undefined;
  const view = useLessonPath(pathId);
  const stats = useProfileStats(profile.status === 'ready' ? profile.data : null);
  if (profile.status === 'error') return <ErrorState what="profil" onRetry={profile.retry} />;
  if (view.status === 'error') return <ErrorState what="mapu" onRetry={view.retry} />;
  if (view.status !== 'ready' || !stats) return <View style={{ flex: 1, backgroundColor: useTheme().c.base }} />;
  return (
    <View style={{ flex: 1 }}>
      <TopBar streak={stats.streak} streakBroken={stats.streakBroken} xp={stats.totalXp} tierLabel="Dřevo" />
      <LessonMap view={view.data} stats={stats} unlockedLessonId={unlocked ?? null}
        onOpenLesson={(id) => router.push({ pathname: '/lesson/[id]', params: { id } })} />
    </View>
  );
}
```

`tierLabel` se v plánu B nahradí `useLeague()`. Zde ho dodá `useProfile().data.leagueTier` přes pomocný hook `useTierName(tierId)` v `hooks/` (čte `LEAGUE_TIERS`). Ve výsledném kódu tedy není natvrdo „Dřevo“: `tierLabel={tierName}`.

Poznámka: `useTheme()` nesmí být volaný podmíněně. V kódu vytáhnout `const { c } = useTheme()` na začátek komponenty.

- [ ] **Step 11: Ověření.**
  - `npm test` (geometrie), `typecheck`, `lint`.
  - Web screenshot mapy v light i dark, nový profil i profil po 3 lekcích (lekce přes dev skript v konzoli: `services.lessons.completeLesson(...)` přes dočasné tlačítko v `__DEV__`, které se po ověření odstraní).
  - Kontrola proti „Never“: jeden akcent, žádný dvojitý oddělovač, obrysové ikony.
  - Commit `feat: mapa lekcí s kotouči a unlock sekvencí`.

---

### Task 12: Obrazovka lekce: cviky

**Files:**
- Create: `components/lesson/silhouettes.ts`, `ExerciseSilhouette.tsx`, `ExerciseCard.tsx`, `HoldTimer.tsx`, `LessonProgress.tsx`, `app/lesson/[id].tsx`, `logic/lessonFlow.ts`, `logic/__tests__/lessonFlow.test.ts`

**Interfaces:**
- Produces:
  - `type LessonPhase = { kind: 'exercise'; index: number } | { kind: 'completing' } | { kind: 'celebrate' }`
  - `nextPhase(p: LessonPhase, exerciseCount: number): LessonPhase` (poslední cvik → `completing`)
  - `interface Pose { head: [number, number]; joints: Record<'neck' | 'hip' | 'handL' | 'handR' | 'elbowL' | 'elbowR' | 'kneeL' | 'kneeR' | 'footL' | 'footR', [number, number]> }`
  - `SILHOUETTES: Record<SilhouetteId, [Pose, Pose]>`
  - `<HoldTimer seconds onDone />`

- [ ] **Step 1: Test `lessonFlow`**

```ts
import { nextPhase } from '@/logic/lessonFlow';
test('postup cviky a konec', () => {
  expect(nextPhase({ kind: 'exercise', index: 0 }, 3)).toEqual({ kind: 'exercise', index: 1 });
  expect(nextPhase({ kind: 'exercise', index: 2 }, 3)).toEqual({ kind: 'completing' });
  expect(nextPhase({ kind: 'completing' }, 3)).toEqual({ kind: 'celebrate' });
  expect(nextPhase({ kind: 'celebrate' }, 3)).toEqual({ kind: 'celebrate' });
});
```

Implementace:

```ts
export type LessonPhase = { kind: 'exercise'; index: number } | { kind: 'completing' } | { kind: 'celebrate' };
export function nextPhase(p: LessonPhase, count: number): LessonPhase {
  if (p.kind === 'exercise') return p.index + 1 < count ? { kind: 'exercise', index: p.index + 1 } : { kind: 'completing' };
  return { kind: 'celebrate' };
}
```

- [ ] **Step 2: `silhouettes.ts`**
  - Pro každé `SilhouetteId` dvě pózy ve viewBoxu 120×120 (zem na y=108).
  - Kostra: hlava (kruh r=7), trup neck→hip, paže neck→elbow→hand, nohy hip→knee→foot.
  - Přesné souřadnice pro všech 15 silhouet:

```ts
type P = [number, number];
const pose = (head: P, neck: P, hip: P, elbowL: P, handL: P, elbowR: P, handR: P, kneeL: P, footL: P, kneeR: P, footR: P): Pose =>
  ({ head, joints: { neck, hip, elbowL, handL, elbowR, handR, kneeL, footL, kneeR, footR } });

export const SILHOUETTES: Record<SilhouetteId, [Pose, Pose]> = {
  plank:        [pose([22,78],[30,84],[70,90],[30,96],[32,108],[34,96],[36,108],[88,96],[104,106],[88,97],[106,106]),
                 pose([22,77],[30,83],[70,89],[30,96],[32,108],[34,96],[36,108],[88,95],[104,106],[88,96],[106,106])],
  sidePlank:    [pose([24,70],[32,76],[68,88],[30,92],[28,108],[44,64],[52,50],[86,98],[104,106],[86,97],[104,104]),
                 pose([24,66],[32,72],[68,84],[30,90],[28,108],[46,58],[56,42],[86,96],[104,106],[86,95],[104,104])],
  pushup:       [pose([22,70],[30,76],[72,86],[30,92],[30,108],[32,92],[32,108],[90,94],[106,104],[90,95],[106,104]),
                 pose([22,88],[30,92],[72,96],[20,100],[30,108],[22,100],[32,108],[90,100],[106,104],[90,100],[106,104])],
  squat:        [pose([60,18],[60,28],[60,62],[52,44],[50,60],[68,44],[70,60],[56,84],[54,108],[64,84],[66,108]),
                 pose([56,40],[58,50],[66,78],[46,54],[34,52],[50,56],[36,54],[46,86],[54,108],[50,88],[62,108])],
  lunge:        [pose([60,18],[60,28],[60,62],[54,44],[54,62],[66,44],[66,62],[46,84],[40,108],[74,84],[80,108]),
                 pose([60,32],[60,42],[60,76],[54,58],[54,76],[66,58],[66,76],[42,82],[40,108],[74,100],[92,108])],
  hollow:       [pose([28,88],[36,92],[70,100],[24,86],[12,82],[26,88],[14,84],[88,96],[106,90],[88,97],[106,91]),
                 pose([28,84],[36,89],[70,100],[22,82],[10,76],[24,84],[12,78],[88,94],[106,86],[88,95],[106,87])],
  superman:     [pose([28,92],[36,96],[70,100],[24,92],[12,88],[26,93],[14,89],[88,98],[106,94],[88,99],[106,95]),
                 pose([28,86],[36,92],[70,100],[22,86],[10,80],[24,87],[12,81],[88,96],[106,88],[88,97],[106,89])],
  handstandWall:[pose([60,98],[60,90],[60,54],[52,98],[52,108],[68,98],[68,108],[62,34],[64,14],[64,34],[66,14]),
                 pose([60,96],[60,88],[60,52],[52,98],[52,108],[68,98],[68,108],[58,32],[56,12],[62,32],[60,12])],
  lsit:         [pose([58,40],[58,50],[58,84],[48,68],[46,86],[68,68],[70,86],[76,84],[96,84],[76,85],[96,85]),
                 pose([58,36],[58,46],[58,80],[48,64],[46,86],[68,64],[70,86],[76,78],[96,76],[76,79],[96,77])],
  dip:          [pose([60,20],[60,30],[60,62],[48,46],[44,62],[72,46],[76,62],[56,84],[56,104],[64,84],[64,104]),
                 pose([60,34],[60,44],[60,76],[44,48],[44,62],[76,48],[76,62],[56,96],[52,108],[64,96],[68,108])],
  pullup:       [pose([60,40],[60,50],[60,82],[44,30],[46,12],[76,30],[74,12],[56,96],[56,108],[64,96],[64,108]),
                 pose([60,18],[60,28],[60,60],[42,24],[46,12],[78,24],[74,12],[56,76],[56,92],[64,76],[64,92])],
  hang:         [pose([60,26],[60,34],[60,68],[48,20],[46,10],[72,20],[74,10],[57,86],[57,104],[63,86],[63,104]),
                 pose([60,22],[60,30],[60,64],[48,18],[46,10],[72,18],[74,10],[57,82],[57,100],[63,82],[63,100])],
  bridge:       [pose([24,100],[32,102],[66,98],[36,106],[48,108],[38,106],[50,108],[84,88],[92,108],[84,89],[94,108]),
                 pose([24,100],[32,100],[66,80],[36,106],[48,108],[38,106],[50,108],[84,78],[92,108],[84,79],[94,108])],
  crow:         [pose([44,74],[50,78],[70,70],[50,92],[50,108],[58,92],[58,108],[60,86],[80,88],[64,86],[82,88]),
                 pose([42,78],[48,82],[70,66],[50,94],[50,108],[58,94],[58,108],[58,84],[80,80],[62,84],[82,80])],
  jump:         [pose([56,40],[58,50],[66,78],[46,54],[34,52],[50,56],[36,54],[46,86],[54,108],[50,88],[62,108]),
                 pose([60,8],[60,18],[60,50],[52,4],[48,-6],[68,4],[72,-6],[56,72],[56,92],[64,72],[64,92])],
};
```

(Souřadnice jsou výchozí náčrt. Při vizuální kontrole v Step 7 se smí doladit, ale tvar struktury zůstane. `jump` s y < 0 se ořízne viewBoxem, proto viewBox `0 -10 120 130`.)

- [ ] **Step 3: `ExerciseSilhouette.tsx`**
  - Každý kloub je sdílená hodnota interpolovaná `t` 0 ↔ 1 přes `withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true)`.
  - Kreslí se `AnimatedLine` pro segmenty a `AnimatedCircle` pro hlavu přes `useAnimatedProps` (x1/y1/x2/y2 lerp).
  - Barva `text`, `strokeWidth 5`, `strokeLinecap round`. Zem je linka `rule`.
  - Omezený pohyb zobrazí statickou pózu A.

- [ ] **Step 4: `HoldTimer.tsx`**
  - Kruh průměru 220: stopa `rule` 6 px, progres `accent` 6 px (AnimatedCircle `strokeDashoffset`).
  - Uprostřed `Stat size=XL` zbývající sekundy.
  - Stavy `ready` → `running` → `paused` → `done`.
  - Odpočet přes `setInterval(250 ms)` proti `Date.now()` (čas se neztrácí při zaseknutí JS). Sdílená hodnota progresu `withTiming` na zbývající zlomek.
  - Poslední 3 s: číslo pulzuje scale 1 → 1.06 (timing) a `haptics.tick()` každou sekundu.
  - V 0: `haptics.holdDone()`, pak po 400 ms `onDone()`.
  - Ovládání přes `BigActionBar` z rodiče (prop `controlsRef`) — jednodušeji: `HoldTimer` vrací i stav a akce přes `useHoldTimer(seconds, onDone)` hook v `components/lesson/useHoldTimer.ts`, rodič kreslí BigActionBar. Použít hook variantu.
  - Při odchodu na pozadí (AppState) se časovač pauzne.

- [ ] **Step 5: `ExerciseCard.tsx`**
  - Svislý layout zarovnaný vlevo: silueta (šířka 100 %, výška 200, `surface` karta `radius.l`), pod ní název v `display`.
  - Pro reps `Stat size=L value={amount} unit={copy.lesson.reps}`, pro hold se místo toho zobrazí `HoldTimer`.
  - Popis techniky v `body` `muted`, max. šířka 62ch.
  - Vstup nové karty: opacity + translateX 24 → 0 přes `motion.reveal`. Odchod `motion.uiExit`.

- [ ] **Step 6: `app/lesson/[id].tsx`**

```tsx
export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = useLesson(id);
  const [phase, setPhase] = useState<LessonPhase>({ kind: 'exercise', index: 0 });
  const [result, setResult] = useState<LessonResult | null>(null);
  const attemptId = useRef(`${id}-${Date.now()}`).current;   // jeden pokus = jedno id (idempotence)
  const completing = useRef(false);

  const advance = useCallback(async () => {
    if (lesson.status !== 'ready') return;
    const next = nextPhase(phase, lesson.data.exercises.length);
    if (next.kind !== 'completing') { setPhase(next); return; }
    if (completing.current) return;                          // Review Focus 3: dvojí tap
    completing.current = true;
    setPhase(next);
    try {
      setResult(await services.lessons.completeLesson(id, attemptId, now()));
      setPhase({ kind: 'celebrate' });
    } catch (e) {
      completing.current = false;
      setPhase({ kind: 'exercise', index: lesson.data.exercises.length - 1 });
      Alert.alert(copy.common.loadError('výsledek lekce'), copy.common.retry);
    }
  }, [phase, lesson, id, attemptId]);
  // …render: close ✕ (Alert s quitTitle/quitBody, destruktivní quitConfirm → router.back()),
  // LessonProgress, ExerciseCard, BigActionBar (reps: primary "Hotovo" → advance;
  // hold: primary Start/Pauza/Pokračovat z useHoldTimer, onDone → advance),
  // phase 'celebrate' → <LessonCompleteScene result lesson onContinue /> (Task 13)
}
```

- Hardwarové zpět na Androidu (`BackHandler`) během cviků otevře stejný dialog ukončení.
- Během `completing` se BigActionBar vymění za neaktivní stav (spinner není potřeba, mock je okamžitý). Fáze 2 zde dostane loading.

- [ ] **Step 7: Ověření.**
  - Test `lessonFlow` PASS, typecheck, lint.
  - Web: projít lekci `bc-1-1` (hold, hold, reps), screenshot karty reps i hold v obou režimech.
  - Doladit souřadnice silhouet, které vypadají zlomeně.
  - Commit `feat: lekce se cviky, výdrž s odpočtem`.

---

### Task 13: Oslava dokončení: nacvaknutí kotouče

**Files:**
- Create: `components/lesson/LessonCompleteScene.tsx`, `components/lesson/Barbell.tsx`, `components/lesson/XpPop.tsx`
- Modify: `app/lesson/[id].tsx`

**Interfaces:**
- Consumes: `LessonResult` (`completedPlates`, `xp`, `stageBefore`, `stageAfter`, `unlockedLessonId`), `Mascot`, `haptics.snap`, `motion.snap`, `motion.pop`
- Produces: `onContinue()` v obrazovce lekce:

```ts
router.dismissTo({ pathname: '/(tabs)', params: result.unlockedLessonId ? { unlocked: result.unlockedLessonId } : {} })
```

  Pokud `dismissTo` v SDK 57 neexistuje, ověřit v docs a použít ekvivalent (`router.dismissAll()` + `router.setParams`). Stage-up (`stageAfter > stageBefore`) povede v plánu B na `/stage-up`. Zde se jen předá `stageUp` flag do `happy` → `celebrate` nálady.

- [ ] **Step 1: `Barbell.tsx`.** Činka z boku, SVG, šířka = šířka obrazovky − 2 × `space.l`, výška 180:
  - Osa: `Rect` přes celou šířku, výška 8, y = 86, `plateRim`, s tenkým světlejším pruhem nahoře (1 px `plateHighlight`).
  - Objímka vpravo: `Rect` 14×28 na konci naložených kotoučů, `muted`.
  - Kotouč z boku je zaoblený obdélník. Šířka podle kg (5→10, 10→12, 15→14, 20→16, 25→18), výška `plateSize(kg) × 1.9` (5 kg ≈ 106, 25 kg ≈ 152), barva `plate{kg}`, `rx 3`, s 1px `plateHighlight` na levé hraně.
  - Kotouče jsou nasazené zprava od středu v pořadí `completedPlates` bez posledního. Poslední je „přilétající“ a kreslí se samostatně v animované vrstvě.
  - Levá strana je zrcadlová, aby osa byla vyvážená. Nový kotouč přiletí na obě strany současně, levý o 60 ms později.

- [ ] **Step 2: Sekvence v `LessonCompleteScene.tsx`**

```ts
// t=0      scéna fade-in (motion.reveal), opice (size M) vlevo dole v mood 'idle'
// t=250ms  kotouč startuje: translateY z −420, translateX z +140, rotate z 18°
//          → withSpring(0, motion.snap, (fin) => fin && scheduleOnRN(onImpact))
//          souběžně rotate → 0 přes withTiming 420 ms (bez přestřelu v rotaci)
// onImpact haptics.snap(); osa se rozkmitne: withSequence(withTiming(3,{duration:50}), withSpring(0, {damping:6, stiffness:400}))
//          objímka dojede 16 px zleva k novému kotouči (withTiming 120 ms): zacvaknutí
// t+120ms  XpPop: číslo +XP scale 0.6 → 1 přes withSpring(motion.pop), count-up 0 → total za 500 ms (JS rAF)
//          pod ním rozpis v label stylu: "LEKCE 20 · PRVNÍ DNES +10 · STREAK +2"
//          opice mood 'happy' (boss nebo stage-up: 'celebrate')
// t+700ms  titulek copy.complete.title ('Kotouč na ose.') v display, fade-in
// t+900ms  BigActionBar s 'Pokračovat'. Tlačítko je od začátku v DOM, ale disabled do t+900ms
//          (chrání před tapem skrz animaci)
```

- Omezený pohyb: kotouč se objeví na místě (fade 200 ms), `haptics.snap()`, XP bez count-up.
- Opakování lekce (`baseKind === 'replay'`): kotouč na osu přiletí stejně (je to odměna), ale `completedPlates` se nemění. Titulek „Opakování dělá mistra.“ (přidat do copy).
- Efekt `lessonEffect` z kosmetiky: plán B.

- [ ] **Step 3: `XpPop.tsx`**
  - `Stat size="XL" value={`+${shown}`} unit="XP"`, barva hodnoty `accentText`.
  - Tohle je jedno z mála míst, kde je akcent velký. Je to subjekt obrazovky.

- [ ] **Step 4: Napojení** v `app/lesson/[id].tsx`. Phase `celebrate` vykreslí scénu, `onContinue` naviguje podle Interfaces. Guard proti dvojímu tapu na Pokračovat (`useRef`).

- [ ] **Step 5: Ověření celé smyčky.**
  - Nový profil → onboarding → mapa → `bc-1-1` → oslava → Pokračovat → unlock sekvence na mapě.
  - Na webu screenshoty klíčových snímků (před dopadem, po dopadu s XP, mapa po odemčení) v dark i light.
  - Test dvojitého tapu na „Hotovo“ u posledního cviku: XP v TopBaru se zvýší jen jednou.
  - Commit `feat: oslava dokončení s nacvaknutím kotouče`.

---

### Task 14: Závěrečné ověření a self-critique

**Files:**
- Modify: podle nálezů
- Create: `docs/superpowers/plans/2026-09-29-opice-faze1-core-loop.review.md` (nálezy a screenshoty)

- [ ] **Step 1:** Spustit `npm test && npm run typecheck && npm run lint && npx expo-doctor`. Vše zelené, výstup vložit do review souboru.
- [ ] **Step 2:** Ověřit hranice: `grep -rE "@/(store|data|services/mock)" app components` nesmí nic najít.
- [ ] **Step 3:** Screenshoty (web, šířka 390) obou režimů: onboarding 1–5, mapa (nová / 3 lekce / po odemčení), lekce reps, lekce hold, oslava.
- [ ] **Step 4:** Self-critique proti „Never“ ze skillu `aesthetic` a proti §6. Každý nález buď opravit, nebo zapsat, proč zůstává:
  - více než jeden akcent
  - dvojité oddělovače
  - plné ikony
  - `#000` / `#FFF` v UI (povoleno jen uvnitř SVG gradientu jako průhledná tmavá)
  - centrovaný hero se dvěma tlačítky
  - pružina na UI ovládání
  - dotykové plochy pod 44
  - kontrast
- [ ] **Step 5:** Commit `chore: ověření core loopu`. Předat uživateli k vyzkoušení v Expo Go (`npx expo start`, QR kód).

---

## Self-review

- **Pokrytí spec (kroky 1–2):**

| Spec | Task |
|---|---|
| §3 architektura | 1, 7 |
| §3.3 typy | 2 |
| §3.4 contracts | 7 |
| §4 xp, streak, map, stage | 3–6 |
| §5 obsah | 2 |
| §6 design | 8, 11 |
| §7.1 onboarding | 10 |
| §7.2 mapa | 11 |
| §7.3 lekce + oslava | 12–13 |
| §8 maskot stage 1 | 9 |
| §9 chyby | 7 (migrate), 8 (ErrorState), 12 (quit, AppState) |
| §10 testy | 3–7, 11, 12 |

  Liga, sezóna (kromě `getActive` a theme), progres, šatník, notifikace, dev menu, README, stage-up a stage 2/3 jsou vědomě v plánu B.
- **Review Focus:** 1 → Task 3/6 testy, 2 → Task 6, 3 → Task 6 + 12, 4 → Task 7, 5 → Task 6 + 10.
- **Konzistence typů:**
  - `completeLesson(id, attemptId, now)` je jednotné v Task 7, 12 i v úpravě spec.
  - `LessonResult.completedPlates` používá Task 13.
  - `NodeState` se exportuje z `logic/map` a přes contracts.
- **Placeholdery:** `notImplemented` ve službách plánu B je záměrný a s explicitním textem. UI ho nevolá.
