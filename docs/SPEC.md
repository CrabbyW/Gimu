# Opice — fáze 1: design spec

Datum: 2026-09-29 · Stav: čeká na review · Pracovní název appky: **Opice** (slug `opice`, jde změnit v `app.json`)

## 1. Cíl a rozsah

"Duolingo pro kalisteniku": krátké lekce na mapě, maskot opice, který roste s uživatelem, týdenní ligy a sezónní výzvy. Odlišení od Thenx / Madbarz / Calimove je hra a emoce. Animace a pocit z používání mají stejnou prioritu jako funkce.

**Fáze 1 = funkční core loop jako základ produkční appky.**

Hotovo znamená:
- `npx expo start` → appka běží v Expo Go na iOS i Androidu.
- Projde se celá smyčka: onboarding → mapa → lekce → nacvaknutí kotouče → odemčení dalšího uzlu → XP → liga → progres → sezóna → šatník.
- `npx tsc --noEmit`, `npx expo lint` a unit testy `logic/` jsou zelené.
- Výměna mock služeb za API klienta se dotkne jen `services/index.ts` a nových implementací. UI se nemění.

**Mimo rozsah:** backend, účty, skutečné ligy, serverové push notifikace, Rive runtime, IAP, analytika, lokalizace (UI je česky, texty jsou v jednom modulu kvůli fázi 4).

## 2. Stack

| Oblast | Volba |
|---|---|
| Runtime | Expo SDK 57 (managed), React Native 0.86, React 19.2, TypeScript 6 `strict` + `noUncheckedIndexedAccess` |
| Navigace | expo-router (typed routes) |
| Animace | react-native-reanimated 4 (jen API, které běží v Expo Go), react-native-gesture-handler |
| Grafika | react-native-svg. Žádné chart knihovny |
| Stav | zustand + `persist` s AsyncStorage, verzované schéma s `migrate` |
| Nativní | expo-haptics, expo-notifications (jen lokální), expo-font + `@expo-google-fonts/{bebas-neue,inter,jetbrains-mono}` |
| Ikony | lucide-react-native, jen obrysové, stroke 1.5 |
| Testy | jest-expo, testuje se `logic/` |

Všechny balíčky se instalují přes `npx expo install`. Před kódem, který sahá na Expo API, se ověřují docs pro v57.

## 3. Architektura

### 3.1 Struktura složek

```
app/                         expo-router, jen obrazovky a layouty
  _layout.tsx                fonty, ThemeProvider, GestureHandlerRoot, hydratace store, gate na onboarding
  index.tsx                  redirect: onboarding | (tabs)
  onboarding/_layout.tsx     stack bez tabů
  onboarding/path.tsx · dream.tsx · milestones.tsx · weight.tsx · birth.tsx
  (tabs)/_layout.tsx         tab bar: Trénink · Liga · Progres · Sezóna · Profil
  (tabs)/index.tsx           mapa lekcí
  (tabs)/league.tsx · progress.tsx · season.tsx · profile.tsx
  lesson/[id].tsx            celoobrazovkový modal lekce + oslava
  stage-up.tsx               celoobrazovková oslava nové stage
  season-goal.tsx            nastavení osobního cíle sezóny
  season-recap.tsx           recap ve stylu Wrapped
  wardrobe.tsx · settings.tsx · dev.tsx
components/
  ui/        Text, Button, BigActionBar, Card, Stat (velké číslo + jednotka), DotGrid,
             ProgressBar, TopBar, Screen, Toggle, SegmentedControl
  map/       Plate, PlateNode, BarbellBoss, PathLine, LessonMap
  lesson/    ExerciseCard, ExerciseSilhouette, HoldTimer, LessonProgress,
             LessonCompleteScene (činka + letící kotouč), XpPop
  mascot/    index.tsx (re-export) · SvgMascot.tsx · RiveMascot.tsx · types.ts ·
             anchors.ts · parts/ · cosmetics/
  league/    LeagueRow, ZoneDivider, Countdown, TierBadge
  progress/  DreamBodyCard, MilestoneRow, WeightChart
  season/    SeasonHeader, SeasonGoalCard, RecapSlide
  cosmetics/ CosmeticTile, SourceBadge
services/
  contracts.ts               rozhraní všech služeb
  index.ts                   registry — JEDINÉ místo, kde se volí implementace
  mock/                      MockUserService, MockLessonService, MockLeagueService,
                             MockSeasonService, MockCosmeticsService, LocalNotificationService
store/
  db.ts                      persistovaný zustand store = lokální "databáze" mock služeb
  settings.ts                persistované preference (téma, notifikace, dev time offset)
logic/                       čisté funkce, žádný import z RN / store / services
  xp.ts · streak.ts · league.ts · mascot.ts · season.ts · map.ts · dates.ts · random.ts
  __tests__/
data/                        editovatelný obsah
  exercises.ts · paths.ts · lessons/{bodyControl,power,strength}.ts · milestones.ts
  cosmetics.ts · xp.ts · leagues.ts · leagueUsers.ts · seasons.ts · copy.ts
types/                       doménové typy (user, lesson, league, season, cosmetic, activity)
theme/
  tokens.ts                  základní tokeny (spacing, radius, typografie, motion)
  palettes.ts                light + dark palety
  seasons.ts                 sezónní overrides
  ThemeProvider.tsx · useTheme.ts
hooks/                       useProfile, useLessonPath, useLeague, useSeason, useCosmetics, useNow
lib/                         haptics.ts, notifications.ts, clock.ts
```

### 3.2 Tok dat

```
Komponenta → hook (hooks/) → service (services/index.ts) → mock impl → store/db.ts (AsyncStorage)
                                               ↑ fáze 2: HTTP klient; store se stane cache
Mock impl → logic/ (čisté výpočty) + data/ (obsah)
```

- Komponenty nikdy neimportují `store/`, `data/` ani `services/mock/`. Hlídá to ESLint pravidlo `no-restricted-imports`.
- Hooky se k datům přihlašují reaktivně. Mock služby po zápisu změní store a hooky se překreslí. Ve fázi 2 to převezme cache vrstva (TODO: zvážit TanStack Query) a signatury hooků zůstanou.
- **Čas:** veškerá logika bere `now: Date` jako parametr. `lib/clock.ts` vrací `Date.now() + devTimeOffsetMs`. Díky tomu funguje dev menu (skok na konec sezóny, simulace ztráty streaku) i testy.

### 3.3 Doménové typy (`types/`)

```ts
type PathId = 'power' | 'bodyControl' | 'strength';
type ISODate = string;                  // 'YYYY-MM-DD', místní datum
type PlateKg = 5 | 10 | 15 | 20 | 25;
type CosmeticSlot = 'outfit' | 'accessory' | 'mapBackground' | 'lessonEffect' | 'profileFrame';
type MascotStage = 1 | 2 | 3;
type Mood = 'idle' | 'happy' | 'celebrate' | 'sad';

interface Exercise { id: string; name: string; type: 'reps' | 'hold'; amount: number; description: string; silhouette: SilhouetteId }
interface Lesson   { id: string; pathId: PathId; section: number; order: number; plateKg: PlateKg; exerciseIds: string[]; isBoss: boolean }

interface Milestone { id: string; label: string; target: number; unit: 'reps' | 'seconds' | 'kg' | 'done'; current: number; custom: boolean }
type WeightGoal = { kind: 'none' } | { kind: 'lose' | 'gain'; startKg: number; targetKg: number };
interface WeightEntry { weekStart: ISODate; kg: number }

interface ActivityEvent { id: string; at: string /* ISO datetime */; lessonId: string; xp: number; repairsDate?: ISODate }

interface UserProfile {
  path: PathId; dreamBody: string; milestones: Milestone[]; weightGoal: WeightGoal; weights: WeightEntry[];
  activity: ActivityEvent[];                  // zdroj pravdy pro XP, streak, ligu, recap
  equipped: Partial<Record<CosmeticSlot, string>>; owned: string[];
  seasonGoals: Record<string /* seasonId */, SeasonGoal>;
  leagueTier: LeagueTierId; createdAt: string;
}

type SeasonGoal =
  | { kind: 'activeDays'; days: number }                          // "60 dní bez vynechání"
  | { kind: 'lessons'; count: number }
  | { kind: 'milestone'; label: string; target: number; unit: 'reps' | 'seconds'; current: number } // "15 shybů"
  | { kind: 'weight'; deltaKg: number };                          // "-4 kg"

interface Season { id: string; name: string; startDate: ISODate; endDate: ISODate; themeId: SeasonThemeId; rewardCosmeticIds: string[]; badgeId: string }
interface Cosmetic { id: string; slot: CosmeticSlot; name: string; source: 'season' | 'milestone' | 'shop'; seasonId?: string; milestoneRule?: MilestoneRule; priceBananas?: number; variantIndex: number /* pro Rive */ }
interface LeagueEntry { userId: string; name: string; xpThisWeek: number; stage: MascotStage; cosmetics: Partial<Record<CosmeticSlot, string>>; isMe: boolean }
```

Oproti původnímu návrhu se `xp` a `streak` neukládají jako čísla. Počítají se z deníku `activity`, takže data zůstávají konzistentní a ve fázi 2 jdou snadno synchronizovat.

### 3.4 Rozhraní služeb (`services/contracts.ts`)

```ts
interface UserService {
  getProfile(): Promise<UserProfile | null>;               // null = onboarding neproběhl
  completeOnboarding(input: OnboardingInput): Promise<UserProfile>;
  logWeight(kg: number, now: Date): Promise<void>;
  updateMilestone(id: string, current: number): Promise<void>;
  reset(): Promise<void>;
}
interface LessonService {
  getPath(pathId: PathId, now: Date): Promise<LessonPathView>; // sekce + uzly se stavem locked|current|done
  getLesson(id: string): Promise<LessonDetail>;                // lekce + rozbalené cviky
  completeLesson(id: string, attemptId: string, now: Date): Promise<LessonResult>; // attemptId = idempotence proti dvojímu tapu
  // LessonResult: { xpGained, xpBreakdown, totalXp, stageBefore, stageAfter, unlockedLessonId | null, streak }
}
interface LeagueService { getCurrentWeek(now: Date): Promise<LeagueWeekView> }    // entries seřazené, tier, zóny, endsAt
interface SeasonService {
  getActive(now: Date): Promise<Season | null>;
  setGoal(seasonId: string, goal: SeasonGoal): Promise<void>;
  getProgress(seasonId: string, now: Date): Promise<SeasonProgress>;
  getRecap(seasonId: string, now: Date): Promise<SeasonRecap>;
  claimReward(seasonId: string, now: Date): Promise<string[]>;
}
interface CosmeticsService {
  getCatalog(): Promise<Cosmetic[]>;
  equip(slot: CosmeticSlot, id: string | null): Promise<void>;
  acquireFromShop(id: string): Promise<void>;                  // TODO(fáze 3): IAP
}
interface NotificationService {
  getPermission(): Promise<'granted' | 'denied' | 'undetermined'>;
  requestPermission(): Promise<boolean>;
  setDailyReminder(enabled: boolean, hour: number): Promise<void>; // TODO(fáze 2): serverové push
  sendTest(message: string): Promise<void>;
}
```

`services/index.ts` exportuje `services: { user, lessons, league, season, cosmetics, notifications }`. Všechny metody jsou asynchronní už teď, aby se jejich podpis ve fázi 2 nemusel měnit.

## 4. Herní logika (`logic/`, pokrytá testy)

Všechny konstanty jsou v `data/xp.ts` a `data/leagues.ts`.

**XP (`xp.ts`)** se počítá jen z aktivity, nikdy z výkonu:

| Událost | XP |
|---|---|
| Dokončená lekce | 20 |
| Boss lekce | 40 |
| První lekce dne | +10 |
| Streak bonus | +2 za každý den aktuálního streaku, max +14 |

- Opakování už dokončené lekce dává 10 XP. Uzel se tím neposouvá, ale počítá se do aktivity a streaku.
- Výstupem je `xpBreakdown`, UI ho ukazuje v oslavě.

**Streak (`streak.ts`)**
- Streak = počet po sobě jdoucích místních dní s alespoň jednou aktivitou, končících dnes nebo včera.
- Pokud chybí dnes i včera, streak je 0 a opice je ve stavu `sad`, dokud uživatel nedokončí lekci.
- Vrací i `longestStreak` (pro recap) a `activeDays` (pro tečkovou mřížku).

**Mapa (`map.ts`)**
- Uzel je `done`, když pro jeho lekci existuje aktivita.
- `current` je první nedokončený uzel. Všechny ostatní jsou `locked`.
- Boss se odemkne až po 8 lekcích.

**Stage opice (`mascot.ts`)**
- Prahy celkového XP: stage 2 od 500, stage 3 od 2000.
- `stageForXp`, `stageProgress`; přechod stage hlásí `LessonResult.stageBefore` / `stageAfter`.

**Liga (`league.ts`)**
- Úrovně: **Dřevo → Kámen → Železo → Bronz → Stříbro → Zlato → Diamant**.
- Skupina má 16 lidí: 15 mock soupeřů + uživatel.
- Top 5 postupuje, spodní 3 sestupují. V Dřevu se nesestupuje, v Diamantu se nepostupuje.
- Týden trvá od pondělí 00:00 do neděle 23:59:59 místního času.
- Mock soupeři mají deterministický profil aktivity (seed z `userId` + týden). XP se jim počítá lineárně podle uplynulé části týdne s denním šumem, takže tabulka se během týdne hýbe a po restartu vypadá stejně.
- Profily soupeřů jsou kalibrované tak, aby 2–3 lekce denně stačily na postupovou zónu. Liga tím nebude trestat začátečníky.
- `resolveWeek(entries)` vrátí promote / stay / demote.
- Mock vyhodnotí proběhlý týden při prvním otevření v novém týdnu a posune `leagueTier`.

**Sezóna (`season.ts`)**
- Progres cíle podle typu:
  - `activeDays` = aktivní dny + opravené dny
  - `lessons` = počet dokončených lekcí
  - `milestone` = ručně zadaná hodnota
  - `weight` = rozdíl oproti první váze v sezóně
- **Comeback:**
  - Zameškaný den sezóny lze opravit do 3 dnů zpětně.
  - Oprava = dokončení extra lekce: druhé a každé další lekce v aktuálním dni opraví nejstarší neopravený zameškaný den v okně.
  - `ActivityEvent.repairsDate` si pamatuje, který den byl opraven.
  - Když je cíl matematicky nedosažitelný, UI ukáže „Dohnat to jde“ s počtem dní v okně, nikdy „prohráno“. Po skončení sezóny se odměna udělí, pokud je splněno alespoň 100 % cíle. Kromě toho vždy dorazí odznak účasti, aby nikdo neodešel s prázdnou.
- `buildRecap` vrací:
  - váhu nebo milestone před a po
  - počet lekcí
  - nejdelší streak
  - stage opice na začátku a na konci
  - získanou odměnu

## 5. Obsah (`data/`)

- **Cviky:** sdílená knihovna asi 20 kalistenických cviků, česky, s krátkým popisem techniky, typ opakování nebo výdrž.
- **Cesty:**
  - Každá cesta má 1 sekci: 8 lekcí + boss, 3–5 cviků na lekci.
  - Kotouče postupně 5, 5, 10, 10, 15, 15, 20, 20 kg a boss je naložená osa.
  - Body control je vyladěná. Power a Strength mají stejnou strukturu a jednodušší obsah.
- **Milestones:** předvolby pro každou cestu, například:
  - Power: 10 shybů, 20 kliků
  - Body control: 60 s plank, první handstand u zdi, L-sit 10 s
  - Strength: 5 dipů, pistol squat
  - obecné: −3 kg
- **Winter Arc:** 2026-09-28 až 2026-12-26 (90 dní). Odměny: šála „Winter Arc“ (outfit) + odznak.
- **Kosmetika:** 2–3 položky na slot napříč původy (sezónní, za milestone, obchod). Obchod platí fiktivními „banány“: mock, nic se neúčtuje, zůstatek se odvozuje z XP.
- **Soupeři v lize:** 15 českých přezdívek, každý s vlastní stage a kosmetikou.
- **`copy.ts`:** všechny UI texty na jednom místě (příprava na lokalizaci ve fázi 4).

## 6. Design systém

Detailní zdroj: `docs/superpowers/specs/2026-10-05-nothing-dot-redesign-design.md` (redesign „Nothing Dot“, 2026-10).
Nahrazuje směr Chalk & Iron / Teplá litina (R42–R44). Reference jsou v `images/1–5.png`.

### 6.1 Směr: Nothing Dot, dark + light
- Monochromní tečkový jazyk Nothing OS a dlaždice-widgety. **Žádný akcent:** „aktivní“ (primární CTA, rozsvícená tečka, progres) = `text`.
- Barvu v UI nese **jen opička**, která je subjektem obrazovky. `seasonGold` je jediná materiálová výjimka: sezónní odznak, zdroj sezónní kosmetiky a plocha stage-up.
- Tmavý i světlý režim jsou plnohodnotné, přepínač Systém / Světlý / Tmavý je v Nastavení. Ve světlém režimu tečky nezáří; aktivní je plná `text`.

### 6.2 Palety (`theme/palettes.ts`, zdroj pravdy)
- **Klíče:**
  - `base`, `tile`, `tilePressed`, `edge` (vlasová hrana dlaždice);
  - `text`, `muted`, `faint`, `onText`;
  - tečky `dotOff`, `dotDim`, `glow` (jen dark), `goldDotOff`, `goldDotDim`;
  - `danger` (jen chybové stavy).
- **Starší klíče** mají monochromní hodnoty, takže starší komponenty fungují bez přepisu:
  - `surface`, `raised`, `rule`, `scrim*`, `plate*`;
  - `accent*` = `text`, `onAccent` = `onText`.
- **Žádný čistý #000 ani #FFF.** Kontrast textu ≥ 4.5:1 v obou režimech; testy v `theme/__tests__/contrast.test.ts`.

### 6.3 Sezónní override (`theme/seasons.ts`)
UI zůstává monochromní; sezóna mění jen kosmetiku opičky a sezónní odznak.

### 6.4 Typografie
- **Doto 700** (dot-matrix) jen ≥ 28 pt, varianty `hero` 64, `display` 40, `displayXL` 110, `dotStat` 28, řádek 1.3 em, bez záporného prostrkání.
- **Inter** 400/600: text, názvy dlaždic.
- **JetBrains Mono** 500: utility štítky VERZÁLKAMI s rozpalem 0.18 em, údaje (`telemetry`). Akce v hranatých závorkách `[ZAČÍT LEKCI]` (`PillButton`; čtečka dostane větu bez závorek).
- Uvnitř položek copy nezlomitelné mezery (`a rámy`, „streak +14“); hlídá `data/__tests__/typography.test.ts`.

### 6.5 Kotouče a tečková grafika (`components/dots/`, Skia)
- **`DotPlate`:** soustředné prstence teček; počet prstenců podle kg (2.5 → 2 … 25 → 7, neznámá hmotnost = nejbližší nižší, min 2). Uprostřed kg (mono na uzlu, Doto od průměru 144).
  - Zamčený: jen vnější prstenec `dotDim` a zámek.
  - Aktuální: všechny prstence `text`, záře a obíhající kometa.
  - Dokončený: plný kotouč a fajfka.
- **Další komponenty:** `DotRing` (progres a odpočet), `DotRow` (řada, sken zleva nebo zdola), `DotMatrix` (aktivita), `DotField` (pozadí reagující na dotek), `DotBurst` (rozpad).
- **Geometrie:** čistá a testovaná v `components/dots/geometry.ts`.
- **`SkiaGuard`:** každá Skia komponenta je obalená. Bez CanvasKit kreslí prázdný fallback; na webu kreslí jen zaostřená obrazovka, protože Chrome drží jen ~16 WebGL kontextů. Na jedné obrazovce je nejvýš 12 pláten.
- **Web:** vstup `index.web.js` načte `public/canvaskit.wasm` dřív než appku.

### 6.6 Tvary a spacing
- **Dlaždice `Tile`:** radius 28, padding 20, pozadí `tile` a vlasová hrana `edge`. Je to jediné oddělení, žádný stín. Vybraná dlaždice má hranu `text` 2 pt a štítek VYBRÁNO.
- **Pilulky:**
  - CTA výška 56; primární výplň `text`, sekundární `tile` s hranou;
  - plovoucí tab bar 64, 16 od okrajů, kulatá podložka aktivního tabu.
- Spacing 4 · 8 · 16 · 24 · 40 · 64 · 104 · 168; dotykové plochy ≥ 44 pt.
- Ikony Lucide outline 1.5 px.

### 6.7 Motion (`lib/motion.ts`, jediný zdroj hodnot)
- **Ambient:**
  - kotouče se točí (40 s, aktuální 24 s), kometa, dech aktuálního uzlu;
  - živá tečka stavového řádku bliká 1.2 s.
- **Nástup obrazovky:** jeden sled hlavička → hero → dlaždice po 60 ms, 480 ms ease-out `(0.22, 1, 0.36, 1)`, přes `Reveal` (ne layout `entering`). Tečky se rozsvěcují skenem nebo spirálou 600 ms.
- **Interakce:**
  - vlna teček pod prstem (`useDotTouch`);
  - roztočení kotouče prstem se setrvačností a hmatovým tikem po 30° (`usePlateSpin`);
  - naklopení dlaždice k prstu max 6° (`useTilePress`);
  - posuvná podložka tabu 260 ms.
- **Pružiny:** žádný spring ani bounce na klikatelném. Pružina jen pro setrvačnost kotouče, opičku a nacvaknutí v oslavě.
- **Reduce Motion vždy:** ambient stojí, vlna je vypnutá, nástupy jsou prolnutí 200 ms, oslavy rovnou ukážou finální stav.

### 6.8 Vztah ke skillu `aesthetic`
Konstanta skillu (monochrom, whitespace, typografie nese obsah, ornament nese informaci) platí. „Jeden akcent“ splňuje **opička**, ne barva UI. Tečky vždy kódují hodnotu: prstence = kg, rozsvícené = pokrok, řada = sekvence.

## 7. Obrazovky a chování

### 7.1 Onboarding (jen při prvním spuštění)

Stack bez tabů, nahoře tečkový ukazatel kroků 1–5, dole BigActionBar s „Pokračovat“.

1. **Cesta:** 3 velké karty. Každá má vlastní geometrický glyf ze skládaných kruhů:
   - Power: kruh s výsečí
   - Body control: dva vyvážené kruhy
   - Strength: plný těžký kruh
2. **Dream body** (změna: rozhodnutí uživatele 2026-09-30):
   - Výběr z 6 karet vize podle zvolené cesty (`data/dreams.ts`, texty v `copy.onboarding.dream.options`). Karta je `SelectTile` (dlaždice, výběr = hrana `text` a štítek VYBRÁNO) s titulkem Inter, jedním řádkem popisu a tečkovým glyfem.
   - Sedmá karta „Vlastní…“ odkryje textové pole (max 140 znaků).
   - Vybraná je právě jedna karta. `dreamBody` ukládá větu vybrané karty ve tvaru „Titulek. Řádek“ (rozhodnutí R41, zobrazuje se nahoře v Progresu), nebo vlastní text; bez změny schématu.
   - Při změně cesty se předvolená vize vymaže, vlastní text zůstává.
3. **Milestones** (změna: rozhodnutí uživatele 2026-09-30):
   - Aspoň 6 předvoleb na cestu plus obecné (`data/milestones.ts`), realistické cíle kalisteniky se správnou jednotkou.
   - Vybírá se 2–3 z předvoleb podle zvolené cesty, případně „+ vlastní“ (název, cíl, jednotka).
   - Tlačítko „Pokračovat“ je aktivní až při 2 vybraných.
4. **Váha:** segment Hubnutí / Nabírání / Neřeším. U prvních dvou numerická pole pro aktuální a cílovou váhu (validace 30–250 kg, cíl musí být ve směru volby).
5. **Zrození opice:**
   - Tmavá plocha, uprostřed puká kruh.
   - Opice stage 1 vyskočí na pružině, mrkne a vystřídá nálady idle → happy (haptika).
   - Titulek „Tohle je tvoje opice.“, pod ním mono štítek s cestou a datem narození.
   - CTA „Jdeme trénovat“ → `completeOnboarding` → mapa.

### 7.2 Mapa (tab Trénink)

- **TopBar:** streak (plamen v obrysu + velké číslo), XP, TierBadge ligy. Hlavička v sezóně přebírá sezónní neutrály.
- **Cesta:**
  - Vertikální ScrollView, uzly se vlní po sinusoidě (amplituda asi 28 % šířky).
  - Uzly spojuje přerušovaná SVG čára.
  - Nad sekcí je štítek `SEKCE 01 · ZÁKLADY ROVNOVÁHY`, na konci boss (naložená osa).
- **Opice** (velikost S) sedí vedle aktuálního uzlu na opačné straně vlny a dýchá (idle).
- **Chování:**
  - Po otevření se mapa odscrolluje na aktuální uzel.
  - Tap na uzel otevře popover s názvem, počtem cviků, XP a tlačítkem „Začít“.
  - Zamčený uzel: popover „Nejdřív dokonči předchozí“ + jemné zatřesení.
- **Návrat z dokončené lekce:** přes route param `?unlocked=<id>` se spustí sekvence:
  1. dojede scroll
  2. dokončený uzel dostane fajfku
  3. dokreslí se úsek čáry
  4. další uzel se rozsvítí ze zamčeného (jen vnější prstenec) do plného tečkového kotouče (pružina, haptika Light)
  5. opice na něj přeskočí

### 7.3 Lekce (`lesson/[id]`)

- **Nahoře:** řada teček podle počtu cviků (`DotRow`, hotové rozsvícené) a mono „02/05“ a „✕“ s potvrzením odchodu.
- **ExerciseCard:**
  - animovaná SVG silueta (smyčka dvou póz)
  - název Inter, velké Doto číslo `12` + jednotka `OPAKOVÁNÍ` nebo `30` + `SEKUND`
  - popis techniky
- **Opakování:** BigActionBar „Hotovo“.
- **Výdrž:**
  - Kruhový odpočet (prstenec se vyprazdňuje) se „Start“ a „Pauza“.
  - Poslední 3 s pulzují.
  - Na nule haptika Medium a automatický přechod.
- **Oslava po posledním cviku** (nejdůležitější moment appky):
  1. 0 ms: celoplošné pole teček (`DotField`) se rozsvítí vlnou od středu.
  2. 200 ms: tečky vzlétnou a po spirále se za 700 ms slétnou do velkého `DotPlate` s kg lekce.
  3. 900 ms: kotouč nacvakne (1.08 → 1), haptika Success a zvuk cvaku; kotouč se dál točí s kometou, kg v Doto.
  4. 1000 ms: opice celebrate se šálem, XP se napočítá s rozpisem („lekce 20 · první dnes +10“, nezlomitelné uvnitř položek), řada série přibude o tečku.
  5. 1600 ms: CTA `[POKRAČOVAT]` vyjede zdola. Tap kamkoli přeskočí na konečný stav.
  6. Pod CTA „Zítra · {další lekce} · {min}“.
  7. Reduce Motion: konečný stav jedním prolnutím 200 ms.
  8. Pokud došlo ke stage-up, CTA vede na `stage-up`, jinak na mapu s `?unlocked`.
  9. Aktivní efekt ze slotu `lessonEffect` se přehraje nad scénou (například jiskry nebo křída).

### 7.4 Stage-up

- Celoobrazovková plocha `seasonGold`; starý prstenec stage se rozpadne na tečky, které přeletí do nového.
- Stará opice se zmenší do kruhu, kruh praskne a vyskočí nová stage v náladě celebrate.
- Pod ní `STAGE 02 · TEENAGER`.
- CTA „Pokračovat“.

### 7.5 Liga

- **Hlavička:** TierBadge (kruh s názvem úrovně), odpočet `3D 14H 22M` do konce týdne.
- **Seznam 16 řádků:** pořadí (tabulární), mini opice s kosmetikou (32 pt), jméno, XP za týden.
- **Zóny:**
  - Pod 5. místem oddělovač `▲ POSTUP`.
  - Nad 14. místem `▼ SESTUP` (v Dřevu se neukazuje).
  - Vlastní řádek = dlaždice s hranou `text` 2 pt.
- **Pod seznamem** vysvětlení: „XP za lekce a pravidelnost, ne za výkon.“

### 7.6 Progres

- **Nahoře:** Dream body jako citát v Inter 20 pt.
- **Pod ním:** `DotMatrix` posledních 5 týdnů aktivity (rozsvícená = aktivní, dnešek s prstencem).
- **Milestones:** řádky s ProgressBarem. Tap otevře zadání aktuální hodnoty. Při splnění nálada celebrate a případná milestone kosmetika.
- **Graf váhy** (jen pro cíl `lose` / `gain`):
  - čistě SVG: týdenní body, linie, přerušovaná cílová linie s popiskem
  - osy s tabulárními čísly
  - mock data za 8 týdnů se vygenerují při onboardingu (plynulý trend ke cíli se šumem)
  - tlačítko „Zapsat váhu tento týden“ (nahradí záznam, pokud už pro týden existuje)

### 7.7 Sezóna

- **Hlavička v sezónním stylu:** `WINTER ARC`, datumy, velké `57 DNÍ` do konce.
- **Pokud cíl chybí:** výzva „Lock in“ → `season-goal` s výběrem ze 4 typů a hodnotou.
- **Pokud cíl je:**
  - velký Stat progresu (`34 / 60 dní`)
  - DotGrid všech dnů sezóny (aktivní, opravené, zameškané v obrysu, dnes s prstencem, budoucí zhasnuté)
  - karta Comeback se zbývajícím oknem
  - karta odměny s náhledem šály a odznaku
- **Po konci sezóny:** CTA „Tvůj recap“.
- **Recap:** 5 celoobrazovkových slidů (tap a swipe), každý jeden velký údaj:
  1. před a po
  2. počet lekcí
  3. nejdelší streak
  4. růst opice (stage začátek → konec)
  5. odměna
- Poslední slide má „Sdílet“ (placeholder, TODO fáze 2/4).

### 7.8 Profil a Šatník

- **Profil:** opice velikosti L v rámečku `profileFrame`, cesta, celkové XP, stage, odznaky. Odkazy na Šatník a Nastavení.
- **Šatník:**
  - nahoře živý náhled opice, reaguje hned na výběr
  - taby slotů
  - mřížka položek
- **SourceBadge podle původu:**

| Původ | Vzhled |
|---|---|
| Sezónní | Zlatý štítek `#C6A15B` s názvem sezóny, text „Už nikdy nevyjde“ |
| Za milestone | Obrysový štítek s názvem milestone |
| Obchod | Cena v banánech, bez rámečku |

  Zasloužené položky mají plný štítek a ikonu medaile. Koupené jsou vizuálně tišší. Jde o prestiž, proto je `seasonGold` materiálová výjimka monochromu, jen jako barva štítku.
- **Nezískané položky:** zamčené se siluetou a podmínkou získání.

### 7.9 Nastavení a notifikace

- Téma (Systém / Světlý / Tmavý).
- Přepínač denní připomínky + hodina.
- Tlačítko „Poslat testovací notifikaci“: „Opice čeká. Streak 12 dní je v ohrožení 🐒“ (číslo se doplní ze skutečného streaku).
- Odkaz na Dev menu.

### 7.10 Dev menu

- Reset appky.
- +500 XP (zapíše syntetickou aktivitu `dev-xp`, aby zůstala konzistence).
- Přepnutí stage opice (override jen pro zobrazení, uložený v settings).
- Skok na konec sezóny (nastaví `devTimeOffsetMs`).
- Simulace ztráty streaku (posune čas o 2 dny).
- Reset časového posunu.

## 8. Maskot

- **Rozhraní:** `<Mascot stage cosmetics mood size />`. `size` je `number | 'S' | 'M' | 'L' | 'XL'`.
- Celá appka mluví s opicí výhradně přes `components/mascot/index.tsx`, který re-exportuje `SvgMascot`.

**SvgMascot:**
- Geometrická opice ze 3 barev + barva linek z tématu: srst, obličej a uši, detail. Funguje v light i dark.
- **Stages:**
  1. velká hlava, malé tělo
  2. vyvážené proporce
  3. široká ramena, výrazné paže
- Každá stage definuje kotvy `head`, `neck`, `body`, `handL`, `handR` v `anchors.ts` (souřadnice v jednotném viewBoxu 200×200 + měřítko).

**Nálady:**

| Nálada | Animace |
|---|---|
| idle | Dýchání (scaleY těla 1 → 1.02, 2.4 s), mrknutí každé 3–6 s |
| happy | Poskočení + úsměv |
| celebrate | Ruce nahoru + opakované poskoky |
| sad | Svěšené uši, pohled dolů, pomalejší dech |

**Kosmetika:** vrstvy v `cosmetics/`. Každá položka je komponenta vykreslená na kotvě svého slotu s transformací podle stage. `mapBackground`, `lessonEffect` a `profileFrame` nejsou vrstvy opice, spotřebovávají je mapa, oslava a profil.

**RiveMascot.tsx:**
- Komentovaný stub se stejnými props a mapováním:
  - `stage` → number input `stage`
  - mood → triggery `happy` / `celebrate` / `sad` (idle = výchozí stav)
  - kosmetika → number input pro každý slot podle `Cosmetic.variantIndex`
- Import `rive-react-native` je zakomentovaný, protože neběží v Expo Go.
- README dostane sekci „Přechod na Rive“.

## 9. Chyby a okrajové stavy

- **Hydratace store:** splash obrazovka drží, dokud se nenačtou fonty a store.
- **Poškozená nebo stará data:** `migrate` podle verze. Když selže, reset s logem a návratem na onboarding.
- **Hooky** vrací `{ data, status: 'loading' | 'ready' | 'error', error }`. Obrazovky mají jednotný error stav: „Nepodařilo se načíst X. Zkusit znovu.“
- **Notifikace bez oprávnění:** přepínač vysvětlí stav a nabídne otevření nastavení systému.
- **Lekce přerušená odchodem:** progres se neukládá. Po potvrzení odchodu se lekce zahodí.
- **Změna dne během lekce:** aktivita se připíše ke dni dokončení.

## 10. Testování a ověření

- **Unit testy (jest-expo) pro `logic/`:**
  - rozpis XP
  - streak přes hranici dne a měsíce, včetně mezery
  - stavy uzlů mapy
  - stage prahy
  - determinismus a zóny ligy, `resolveWeek`
  - comeback okno a opravy, progres všech typů cílů sezóny
  - recap
- **Před každým „hotovo“:** `tsc --noEmit`, `expo lint`, `jest`.
- **Vizuálně:** screenshot přes Expo web (pokud to prostředí dovolí) a kontrola proti seznamu „Never“ ze skillu `aesthetic`. Finální ověření v Expo Go na telefonu, to udělá uživatel.

## 11. Napojení na roadmapu (jen místa, žádná implementace)

- `services/index.ts`: výměna na HTTP klienty (fáze 2).
- `TODO(fáze 2)`: auth, sync deníku `activity`, serverové ligy, push, sdílení recapu.
- `TODO(fáze 3)`: `RiveMascot`, animace cviků (`ExerciseSilhouette` má vlastní rozhraní), IAP v `acquireFromShop`, další sekce (data už jsou na sekce připravená).
- `TODO(fáze 4)`: `data/copy.ts` → i18n, analytika přes jednotný `lib/analytics.ts` (zatím no-op).

## 12. Pořadí implementace

1. Scaffolding, theme, typy, contracts, logic + testy.
2. Onboarding, mapa, lekce + oslava. Použije se `SvgMascot` ve stage 1 s náladami idle a happy, protože zrození a oslava opici potřebují. Po tomto kroku zastavit a nechat vyladit.
3. Maskot dokončit: stages 2–3, celebrate a sad, kotvy, kosmetika, Rive stub.
4. Liga, Progres, Sezóna + recap, Šatník, notifikace.
5. Dev menu.
6. README.

Po každém kroku krátké shrnutí: co je hotové a co jsem rozhodl sám.
