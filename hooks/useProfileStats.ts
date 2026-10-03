import { useMemo } from 'react';
import { STAGE_THRESHOLDS } from '@/data/xp';
import { now } from '@/lib/clock';
import { toISODate } from '@/logic/dates';
import { stageForXp } from '@/logic/mascot';
import { mascotMood, todayStatus } from '@/logic/mascotMood';
import { activeDays, currentStreak, isStreakBroken, longestStreak } from '@/logic/streak';
import { totalXp } from '@/logic/xp';
import type { MascotStage, Mood, UserProfile } from '@/types';

export interface ProfileStats {
  totalXp: number;
  streak: number;
  stage: MascotStage;
  streakBroken: boolean;
  /** Nejdelší série za celou historii (StreakBarbell: přerušený stav, smutná karta). */
  longestStreak: number;
  /** Dnes už je hotová lekce (řádek „Dnes hotovo / čeká“). */
  todayDone: boolean;
  /** Žádný aktivní den v historii: nový uživatel (prázdná činka, karta první lekce). */
  isNew: boolean;
  /** Klidová nálada opičky odvozená z aktivity (`logic/mascotMood`). */
  mood: Mood;
}

/** Odvozené metriky pro TopBar a mapu. `STAGE_THRESHOLDS` je z data/, hooky ho smí importovat. */
export function useProfileStats(profile: UserProfile | null | undefined): ProfileStats | null {
  // Mimo useMemo: mění se s reálným časem (půlnoc, dev offset), memo klíčované
  // jen na [profile] by to jinak ignorovalo a vracelo zastaralé streak/streakBroken.
  const today = toISODate(now());
  return useMemo(() => {
    if (!profile) return null;
    const days = activeDays(profile.activity);
    const xp = totalXp(profile.activity);
    return {
      totalXp: xp,
      streak: currentStreak(days, today),
      streakBroken: isStreakBroken(days, today),
      stage: stageForXp(xp, STAGE_THRESHOLDS),
      longestStreak: longestStreak(days),
      todayDone: todayStatus(days, today) === 'done',
      isNew: days.length === 0,
      mood: mascotMood(days, today),
    };
  }, [profile, today]);
}
