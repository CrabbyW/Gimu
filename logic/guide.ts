// Opička průvodce (elite fáze 1, spec §2.4): jedna krátká bublina na obrazovku, jen při prvním průchodu.
import type { UserProfile } from '@/types';

export type GuideId = 'mapStart' | 'lessonHold' | 'celebrationFirst';
export type GuideScreen = 'map' | 'lesson' | 'celebration';

const BY_SCREEN: Record<GuideScreen, GuideId> = { map: 'mapStart', lesson: 'lessonHold', celebration: 'celebrationFirst' };

/** Bublina pro obrazovku, nebo null. First run poznáme podle `guideSeen` (nové profily ho mají, staré ne). */
export function nextGuide(screen: GuideScreen, profile: UserProfile | null): GuideId | null {
  if (!profile || !profile.guideSeen) return null;
  const id = BY_SCREEN[screen];
  return profile.guideSeen.includes(id) ? null : id;
}
