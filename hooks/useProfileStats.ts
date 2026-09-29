import { useMemo } from 'react';
import { STAGE_THRESHOLDS } from '@/data/xp';
import { now } from '@/lib/clock';
import { toISODate } from '@/logic/dates';
import { stageForXp } from '@/logic/mascot';
import { activeDays, currentStreak, isStreakBroken } from '@/logic/streak';
import { totalXp } from '@/logic/xp';
import type { MascotStage, UserProfile } from '@/types';

/** Odvozené metriky pro TopBar. `STAGE_THRESHOLDS` je z data/, hooky ho smí importovat. */
export function useProfileStats(
  profile: UserProfile | null | undefined,
): { totalXp: number; streak: number; stage: MascotStage; streakBroken: boolean } | null {
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
    };
  }, [profile, today]);
}
