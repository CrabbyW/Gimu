import { useMemo } from 'react';
import { BADGES } from '@/data/badges';
import { LESSONS } from '@/data/lessons';
import { badgeCondition, badgeProgress, type BadgeProgress } from '@/logic/badges';
import type { Lesson, UserProfile } from '@/types';

export interface BadgeView extends BadgeProgress { condition: string }

const LESSONS_BY_ID: ReadonlyMap<string, Lesson> = new Map(LESSONS.map((l) => [l.id, l]));

/** Odznaky pro Profil: stav z `logic/badges` + česká podmínka z katalogu. Počet „N / 12“ z délky katalogu. */
export function useBadgeProgress(profile: UserProfile | null | undefined): { items: BadgeView[]; earned: number; total: number } {
  return useMemo(() => {
    if (!profile) return { items: [], earned: 0, total: BADGES.length };
    const progress = badgeProgress(BADGES, profile.activity, LESSONS_BY_ID);
    const items = progress.map((p, i) => ({ ...p, condition: badgeCondition(BADGES[i]!.rule) }));
    return { items, earned: items.filter((b) => b.earned).length, total: BADGES.length };
  }, [profile]);
}
