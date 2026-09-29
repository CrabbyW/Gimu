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
