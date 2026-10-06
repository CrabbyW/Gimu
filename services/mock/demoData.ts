// Demo profil pro prezentaci a launch video: JEDINÝ soubor s mock daty průchodu.
// Výměna za reálná data = smazat tento soubor a akci v dev menu; nic jiného na něm nezávisí.
import { SEASONS } from '@/data/seasons';
import { STAGE_THRESHOLDS, XP_RULES } from '@/data/xp';
import { addDays, toISODate, weekStart } from '@/logic/dates';
import { mockWeightHistory } from '@/logic/onboarding';
import { lessonXp } from '@/logic/xp';
import type { ActivityEvent, UserProfile } from '@/types';

const DEMO_DAYS = 12;
/** Prvních 7 lekcí cesty Body control, po jedné denně za posledních 7 dní. */
const DONE_LESSONS = ['bc-1-1', 'bc-1-2', 'bc-1-3', 'bc-1-4', 'bc-1-5', 'bc-1-6', 'bc-1-7'];
/** Demo končí těsně pod stage 2, aby další lekce (8) spustila oslavu růstu opice. */
export const DEMO_TARGET_XP = STAGE_THRESHOLDS[1] - 40;

/** Profil „dva týdny poctivého tréninku“: streak, rozpracované milníky, cíl váhy, cíl sezóny. Dnešek je volný. */
export function buildDemoProfile(now: Date): UserProfile {
  const today = toISODate(now);
  const activity: ActivityEvent[] = [];
  let xp = 0;
  for (let k = DEMO_DAYS; k >= 1; k--) {
    const day = addDays(today, -k);
    const streakDays = DEMO_DAYS - k; // dny v řadě před tímto dnem
    const lessonId = k <= DONE_LESSONS.length ? DONE_LESSONS[DONE_LESSONS.length - k]! : 'bc-1-1';
    const isReplay = k > DONE_LESSONS.length;
    const gain = lessonXp({ isBoss: false, isReplay, isFirstToday: true, streakDays }, XP_RULES).total;
    activity.push({ id: `demo-${k}`, at: `${day}T17:30:00.000Z`, day, lessonId, xp: gain });
    xp += gain;
  }
  // Doladění na cílové XP jedním opakováním v nejstarší den (bez bonusu za den, aby se nezměnil streak).
  const missing = DEMO_TARGET_XP - xp;
  if (missing > 0) {
    const day = addDays(today, -DEMO_DAYS);
    activity.unshift({ id: 'demo-extra', at: `${day}T19:00:00.000Z`, day, lessonId: 'bc-1-2', xp: missing });
  }
  const created = new Date(`${addDays(today, -DEMO_DAYS)}T08:00:00`);
  const weightGoal = { kind: 'lose' as const, startKg: 82, targetKg: 78 };
  const season = SEASONS.find((s) => s.startDate <= today && today <= s.endDate);
  return {
    path: 'bodyControl', dreamBody: 'Free handstand',
    milestones: [
      { id: 'lsit-10', label: 'L-sit 10 s', target: 10, unit: 'seconds', current: 10, custom: false },
      { id: 'plank-60', label: '60 s plank', target: 60, unit: 'seconds', current: 45, custom: false },
      { id: 'crow-15', label: 'Crow 15 s', target: 15, unit: 'seconds', current: 6, custom: false },
    ],
    weightGoal, weights: mockWeightHistory(weightGoal, now, 4242),
    activity, equipped: { outfit: 'outfit-hoodie-chalk' }, owned: [],
    seasonGoals: season ? { [season.id]: { kind: 'activeDays', days: 60 } } : {},
    leagueTier: 'stone', createdAt: created.toISOString(), leagueWeek: weekStart(now), lastLeagueResult: null,
    badges: [], seasonClaims: {},
  };
}
