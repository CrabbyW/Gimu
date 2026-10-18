// Opička průvodce (elite fáze 1, spec §2.4): jedna krátká bublina na obrazovku, jen při prvním průchodu.
import type { UserProfile } from '@/types';

export type GuideId = 'mapTour' | 'mapStart' | 'lessonHold' | 'celebrationFirst';
export type GuideScreen = 'map' | 'lesson' | 'celebration';

// Mapa: prohlídka `mapTour` nahradila bublinu `mapStart` (stará zůstává v typu kvůli uloženým profilům).
const BY_SCREEN: Record<GuideScreen, GuideId> = { map: 'mapTour', lesson: 'lessonHold', celebration: 'celebrationFirst' };

/** Bublina pro obrazovku, nebo null. First run poznáme podle `guideSeen` (nové profily ho mají, staré ne). */
export function nextGuide(screen: GuideScreen, profile: UserProfile | null): GuideId | null {
  if (!profile || !profile.guideSeen) return null;
  const id = BY_SCREEN[screen];
  if (profile.guideSeen.includes(id)) return null;
  // Kdo už viděl starou bublinu mapy (`mapStart`), mapu zná: prohlídku mu nevnucujeme.
  if (id === 'mapTour' && profile.guideSeen.includes('mapStart')) return null;
  return id;
}
