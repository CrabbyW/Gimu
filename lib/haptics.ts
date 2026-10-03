import * as Haptics from 'expo-haptics';
import { useSettings } from '@/store/settings';

// Haptika jen v klíčových momentech (motion spec §2: co v mapě není, haptiku nemá; `error` nikde).
// Na webu a zařízeních bez motoru API odmítne promise — to se tiše spolkne, haptika je jen doplněk.
// Uživatelský přepínač `hapticsEnabled` je nezávislý na zvuku (§6.2).
const safe = (p: Promise<void>) => { p.catch(() => undefined); };
const enabled = () => useSettings.getState().hapticsEnabled;

export type HapticKind = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'selection' | 'success' | 'warning';

const IMPACT = {
  light: Haptics.ImpactFeedbackStyle.Light, medium: Haptics.ImpactFeedbackStyle.Medium, heavy: Haptics.ImpactFeedbackStyle.Heavy,
  rigid: Haptics.ImpactFeedbackStyle.Rigid, soft: Haptics.ImpactFeedbackStyle.Soft,
} as const;

/** Jeden haptický úder (respektuje přepínač). */
export function fire(kind: HapticKind): void {
  if (!enabled()) return;
  if (kind === 'selection') safe(Haptics.selectionAsync());
  else if (kind === 'success') safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  else if (kind === 'warning') safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  else safe(Haptics.impactAsync(IMPACT[kind]));
}

export type Step = readonly [atMs: number, kind: HapticKind];
export type PatternId = 'lesson-complete' | 'milestone' | 'gong' | 'league-rise' | 'unlock' | 'section-unlock';

/** Aproximace AHAP vzorů (`assets/haptics/*.ahap`) řadou transientů pro Expo Go. t=0 = dopad kotouče (heavy). */
export const APPROX: Record<PatternId, readonly Step[]> = {
  'lesson-complete': [[0, 'heavy'], [80, 'rigid'], [160, 'soft'], [320, 'soft'], [480, 'light'], [620, 'light'], [760, 'medium'], [1250, 'success']],
  milestone: [[0, 'heavy'], [80, 'rigid'], [200, 'soft'], [360, 'soft'], [520, 'light'], [680, 'medium'], [840, 'medium'], [1260, 'heavy'], [1380, 'light'], [1460, 'success']],
  'section-unlock': [[0, 'heavy'], [80, 'rigid'], [200, 'soft'], [360, 'soft'], [520, 'light'], [680, 'medium'], [840, 'medium'], [1460, 'success']],
  gong: [[0, 'heavy'], [600, 'heavy'], [640, 'heavy'], [800, 'medium'], [1050, 'soft'], [1400, 'soft'], [1900, 'soft']],
  'league-rise': [[0, 'light'], [110, 'light'], [220, 'rigid']],
  unlock: [[0, 'rigid'], [90, 'soft']],
};

/** Plánovač kroků: vrátí funkci, která zbylé kroky zruší. Výchozí je JS časovač; scéna oslavy může dodat
 *  plánovač z UI vlákna (withDelay + scheduleOnRN), aby haptika seděla na snímek s animací (§4.4). */
export type Scheduler = (steps: readonly Step[], fireStep: (kind: HapticKind) => void) => () => void;

export const timerScheduler: Scheduler = (steps, fireStep) => {
  const ids = steps.map(([at, kind]) => setTimeout(() => fireStep(kind), at));
  return () => ids.forEach(clearTimeout);
};

/** Budoucí nativní Core Haptics modul (dev build) přehraje skutečný AHAP; v Expo Go zůstává null. */
type NativeHaptics = { playAhap(id: PatternId): () => void };
let native: NativeHaptics | null = null;
export const registerNativeHaptics = (m: NativeHaptics | null) => { native = m; };

let active: (() => void) | null = null;

/** Zastaví právě hraný vzor (idempotentní). */
export function stopPattern(): void {
  if (active) { const stop = active; active = null; stop(); }
}

/** Přehraje vzor. Drží jediný aktivní vzor: nové volání zruší předchozí (dvojí dopad, rychlý návrat do scény). */
export function play(id: PatternId, schedule: Scheduler = timerScheduler): () => void {
  stopPattern();
  if (!enabled()) return stopPattern;
  active = native ? native.playAhap(id) : schedule(APPROX[id], fire);
  return stopPattern;
}

/** Původní pojmenované momenty (zachované API pro stávající volající). */
export const haptics = {
  /** Dopad kotouče na osu (úder). */
  impact() { fire('heavy'); },
  /** Odemčení uzlu na mapě: rigid a dosednutí soft +90 ms. */
  unlock() { play('unlock'); },
  /** Konec výdrže. */
  holdDone() { fire('heavy'); },
  /** Výběr v nabídce / tab. */
  tick() { fire('selection'); },
  /** Odměna po dopadu kotouče, stage-up a narození opice. */
  success() { fire('success'); },
  /** Zamčený uzel, validační chyba. */
  warning() { fire('warning'); },
};
