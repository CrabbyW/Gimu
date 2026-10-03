import type { LessonResult } from '@/logic/completion';
import type { GoalsPatch } from '@/logic/goals';
import type { NodeState } from '@/logic/map';
import type { DayState, RecapBeforeAfter, SeasonProgress, SeasonRecap } from '@/logic/season';
import type {
  Cosmetic, CosmeticSlot, Exercise, LeagueEntry, LeagueTierId, LeagueWeekResult, Lesson, OnboardingInput, PathId, PathMeta,
  Season, SeasonGoal, UserProfile, ISODate, 
} from '@/types';

import type { BuyCheck } from '@/logic/cosmetics';
export type { BuyCheck };

export type { DayState, LessonResult, NodeState, RecapBeforeAfter, SeasonProgress, SeasonRecap };
/** `xp`: základní XP za dokončení teď (lekce/boss, u dokončené opakování), bez bonusů za den a streak. */
export interface MapNode { lesson: Lesson; state: NodeState; exerciseCount: number; xp: number }
export interface LessonPathView { path: PathMeta; sections: { index: number; title: string; nodes: MapNode[] }[]; currentLessonId: string | null }
/** `exercises` už mají `amount` navýšené z dluhu; `extras[i]` = o kolik (0 = beze změny), `baseAmounts[i]` = původní objem. */
export interface LessonDetail { lesson: Lesson; exercises: Exercise[]; state: NodeState; extras: number[]; baseAmounts: number[] }

export interface MilestoneUpdateResult { completed: boolean; unlockedCosmeticIds: string[] }
export interface UserService {
  getProfile(): Promise<UserProfile | null>;
  completeOnboarding(input: OnboardingInput): Promise<UserProfile>;
  logWeight(kg: number, now: Date): Promise<void>;
  updateMilestone(id: string, current: number): Promise<MilestoneUpdateResult>;
  /** Nastavení → Cíle: milníky, cíl váhy, vize těla, cesta. Neplatná změna vyhodí chybu s kódem `GoalsError`. */
  updateGoals(patch: GoalsPatch): Promise<UserProfile>;
  /** Dev menu: přidá XP jako událost `dev-xp` (ne lekce, ruling 17). */
  grantDevXp(amount: number, now: Date): Promise<void>;
  reset(): Promise<void>;
  /** Dev menu: nahradí profil demo profilem (`services/mock/demoData.ts`). */
  loadDemo(now: Date): Promise<void>;
}
export interface LessonService {
  getPath(pathId: PathId, now: Date): Promise<LessonPathView>;
  getLesson(id: string): Promise<LessonDetail>;
  /** `done[i]` = cvik i odcvičený (bez něj vše). Lekce platí od poloviny odcvičených, jinak odmítne. */
  completeLesson(id: string, attemptId: string, now: Date, done?: readonly boolean[]): Promise<LessonResult>;
}
export interface LeagueWeekView {
  tier: LeagueTierId; entries: LeagueEntry[]; promoteCount: number; demoteCount: number;
  endsAt: Date; weekStart: ISODate; myRank: number; lastResult: LeagueWeekResult | null;
}
export interface LeagueService {
  getCurrentWeek(now: Date): Promise<LeagueWeekView>;
  dismissLastResult(): Promise<void>;
}
export interface SeasonStatus { season: Season; phase: 'active' | 'ended'; goal: SeasonGoal | null; claimed: boolean }
export interface SeasonService {
  getActive(now: Date): Promise<Season | null>;
  /** Aktivní sezóna, jinak poslední skončená (recap po konci, ruling 15). */
  getLatest(now: Date): Promise<SeasonStatus | null>;
  setGoal(seasonId: string, goal: SeasonGoal): Promise<void>;
  getProgress(seasonId: string, now: Date): Promise<SeasonProgress>;
  getRecap(seasonId: string, now: Date): Promise<SeasonRecap>;
  claimReward(seasonId: string, now: Date): Promise<string[]>;
}
export interface WardrobeItem { cosmetic: Cosmetic; unlocked: boolean; equipped: boolean; canBuy: BuyCheck }
export interface WardrobeView { items: WardrobeItem[]; bananas: number; equipped: Partial<Record<CosmeticSlot, string>> }
export interface CosmeticsService {
  getCatalog(): Promise<Cosmetic[]>;
  getWardrobe(): Promise<WardrobeView>;
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
