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
