import type { ActivityEvent } from './activity';
import type { ISODate } from './common';
import type { CosmeticSlot } from './cosmetic';
import type { LeagueTierId, LeagueWeekResult } from './league';
import type { PathId } from './lesson';
import type { SeasonGoal } from './season';

export type MilestoneUnit = 'reps' | 'seconds' | 'kg' | 'done';
export interface Milestone { id: string; label: string; target: number; unit: MilestoneUnit; current: number; custom: boolean }
export type WeightGoal = { kind: 'none' } | { kind: 'lose' | 'gain'; startKg: number; targetKg: number };
export interface WeightEntry { weekStart: ISODate; kg: number }

/** Objem tréninku: sekundy výdrže a opakování. */
export interface Volume { holdS: number; reps: number }
/** Dluh z přeskočených cviků (logic/adaptive.ts). `share` = navýšení na lekci, zafixované při přeskočení. */
export interface TrainingDebt extends Volume { share: Volume }

/** Vstupní test (elite fáze 5): max kliků v kuse a nejdelší plank. Škáluje dávky cviků (`logic/fitnessTest.ts`). */
export interface FitnessTest {
  pushups: number;
  /** Kliky na kolenou (lehčí varianta): počítají se za polovinu. */
  kneePushups?: boolean;
  plankS: number;
  testedAt: string;
  /** Výsledek zjednodušené kontroly připravenosti (PAR-Q+). `consult` = doporučeno poradit se s lékařem. */
  readiness?: 'clear' | 'consult';
}

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
  /** Pondělí týdne, ve kterém uživatel právě soutěží. */
  leagueWeek: ISODate;
  /** Pro banner v Lize po vyhodnocení týdne. */
  lastLeagueResult: LeagueWeekResult | null;
  badges: string[];
  seasonClaims: Record<string, { at: string; cosmeticIds: string[]; badgeIds: string[] }>;
  /** Chybí u profilů před R44 = žádný dluh. */
  trainingDebt?: TrainingDebt;
  /** Krátký onboarding (elite fáze 1): false = cíle čekají na doplnění („Finish setup“). Chybí u starších profilů. */
  setupDone?: boolean;
  /** Bubliny průvodce, které uživatel viděl. Pole existuje jen u profilů z krátkého onboardingu (= first run). */
  guideSeen?: string[];
  /** Demo profil z dev menu: každý cvik jde přeskočit (přeskočení se počítá jako odcvičené, aby šla vidět oslava). */
  demo?: boolean;
  /** Elite fáze 5: chybí = dávky bez škálování (výchozí). */
  fitnessTest?: FitnessTest;
}

export interface OnboardingInput {
  path: PathId;
  dreamBody: string;
  milestones: Milestone[];
  weightGoal: WeightGoal;
  /** Krátký onboarding: false = zbytek cílů se doplní po první oslavě. */
  setupDone?: boolean;
}
