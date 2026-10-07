import type { Milestone, MilestoneUnit, OnboardingInput, PathId, UserProfile, WeightEntry, WeightGoal } from '@/types';
import { addDays, weekStart } from './dates';
import { mulberry32 } from './random';

export function parseWeight(raw: string): number | null {
  const s = raw.trim().replace(',', '.');
  if (!/^\d{2,3}(\.\d)?$/.test(s)) return null;
  return Number(s);
}

const inRange = (kg: number | null): kg is number => kg !== null && kg >= 30 && kg <= 250;

export function validateWeightGoal(
  kind: 'lose' | 'gain',
  current: number | null,
  target: number | null,
): 'ok' | 'invalid' | 'loseDirection' | 'gainDirection' {
  if (!inRange(current) || !inRange(target)) return 'invalid';
  if (kind === 'lose' && target >= current) return 'loseDirection';
  if (kind === 'gain' && target <= current) return 'gainDirection';
  return 'ok';
}

export type WeightKind = 'lose' | 'gain' | 'none';
export type WeightError = Exclude<ReturnType<typeof validateWeightGoal>, 'ok'>;

/** Chyby polí váhy. Prázdné pole je chybou jen s `requireFilled` (pokus o pokračování),
 *  při opuštění pole se nevyplněné druhé pole ještě nehlásí. Chyba směru patří k cílové váze. */
export function weightFieldErrors(
  kind: 'lose' | 'gain',
  currentRaw: string,
  targetRaw: string,
  requireFilled: boolean,
): { current: WeightError | null; target: WeightError | null } {
  const field = (raw: string): WeightError | null => {
    if (raw.trim() === '') return requireFilled ? 'invalid' : null;
    return inRange(parseWeight(raw)) ? null : 'invalid';
  };
  const current = field(currentRaw);
  const target = field(targetRaw);
  if (current !== null || target !== null || currentRaw.trim() === '' || targetRaw.trim() === '') return { current, target };
  const goal = validateWeightGoal(kind, parseWeight(currentRaw), parseWeight(targetRaw));
  return { current: null, target: goal === 'ok' ? null : goal };
}

export const DREAM_MAX_LENGTH = 140;
const DREAM_MIN_LENGTH = 3;
export const isDreamValid = (dream: string): boolean => dream.trim().length >= DREAM_MIN_LENGTH;

/** R41: karta vize se ukládá jako věta „Titulek. Řádek“, ne jen titulek — Progres ji zobrazuje celou. */
export const composeDreamSentence = (title: string, line: string): string => `${title}. ${line}`;

// Spec §7.1: vybírají se 2 až 3 milníky.
export const MILESTONES_MIN = 2;
export const MILESTONES_MAX = 3;

/** Přepne výběr milníku. Nad limit se nepřidá nic a `rejected` řekne UI, ať dá zpětnou vazbu. */
export function toggleMilestone(list: Milestone[], milestone: Milestone): { milestones: Milestone[]; rejected: boolean } {
  if (list.some((m) => m.id === milestone.id)) return { milestones: list.filter((m) => m.id !== milestone.id), rejected: false };
  if (list.length >= MILESTONES_MAX) return { milestones: list, rejected: true };
  return { milestones: [...list, milestone], rejected: false };
}

/** Cíl vlastního milníku: celé kladné číslo do 9999. */
export function parseMilestoneTarget(raw: string): number | null {
  const s = raw.trim();
  if (!/^\d{1,4}$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 ? n : null;
}

/** Vlastní milník. `createdAtMs` dělá id unikátní; jednotka „splněno“ má cíl vždy 1. */
export function customMilestone(label: string, target: number, unit: MilestoneUnit, createdAtMs: number): Milestone {
  return { id: `custom-${createdAtMs}`, label: label.trim(), target: unit === 'done' ? 1 : target, unit, current: 0, custom: true };
}

export interface OnboardingDraftValues {
  path: PathId | null;
  dreamBody: string;
  milestones: Milestone[];
  weightKind: WeightKind;
  currentKg: string;
  targetKg: string;
}

/** Vstup pro `completeOnboarding` z konceptu, nebo null, když některý krok neprošel validací. */
export function buildOnboardingInput(d: OnboardingDraftValues): OnboardingInput | null {
  if (d.path === null || !isDreamValid(d.dreamBody)) return null;
  if (d.milestones.length < MILESTONES_MIN || d.milestones.length > MILESTONES_MAX) return null;
  let weightGoal: WeightGoal = { kind: 'none' };
  if (d.weightKind !== 'none') {
    const startKg = parseWeight(d.currentKg);
    const targetKg = parseWeight(d.targetKg);
    if (startKg === null || targetKg === null || validateWeightGoal(d.weightKind, startKg, targetKg) !== 'ok') return null;
    weightGoal = { kind: d.weightKind, startKg, targetKg };
  }
  return { path: d.path, dreamBody: d.dreamBody.trim(), milestones: d.milestones, weightGoal };
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
  // Krátký onboarding (elite fáze 1) posílá setupDone: false → profil dostane i prázdné guideSeen (first run).
  const firstRun = input.setupDone === false ? { setupDone: false, guideSeen: [] } : {};
  return {
    ...firstRun,
    path: input.path, dreamBody: input.dreamBody.trim(), milestones: input.milestones,
    weightGoal: input.weightGoal, weights: mockWeightHistory(input.weightGoal, now, now.getTime() % 100_000),
    activity: [], equipped: {}, owned: [], seasonGoals: {}, leagueTier: 'wood', createdAt: now.toISOString(),
    leagueWeek: weekStart(now), lastLeagueResult: null, badges: [], seasonClaims: {},
  };
}

/** Výchozí cíle krátkého onboardingu (elite fáze 1): vize = první věta cesty, milníky = prvních MILESTONES_MIN předvoleb.
 *  Uživatel je doplní až po první oslavě („Finish setup“). */
export function defaultDraftGoals(presets: readonly Milestone[], dreamSentences: readonly string[]): { dreamBody: string; milestones: Milestone[] } {
  return { dreamBody: dreamSentences[0] ?? '', milestones: presets.slice(0, MILESTONES_MIN) };
}

/** Potřebuje profil dokončit nastavení? Jen profily z krátkého onboardingu (`setupDone === false`); staré nikdy. */
export const needsSetup = (profile: UserProfile): boolean => profile.setupDone === false;
